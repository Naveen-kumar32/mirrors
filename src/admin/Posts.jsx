import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { TEAM } from '../data';
import { api, formatDate, useApi } from '../backend';
import ArticleBody from '../components/ArticleBody';
import { Icon } from '../components/ui';
import { useAuth } from './AdminApp';

/* Blog covers are cropped to one shape (16:10, max 1600×1000) so every post looks the same on the website */
const COVER_W = 1600;
const COVER_H = 1000;
async function cropCover(file) {
  const bmp = await createImageBitmap(file);
  const target = COVER_W / COVER_H;
  let sw = bmp.width;
  let sh = bmp.height;
  if (sw / sh > target) sw = sh * target;
  else sh = sw / target;
  const sx = (bmp.width - sw) / 2;
  const sy = (bmp.height - sh) / 2;
  const scale = Math.min(1, COVER_W / sw);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  canvas.getContext('2d').drawImage(bmp, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' });
}

const DEFAULT_CATEGORIES = ['Skin conditions', 'Skincare', 'Hair & scalp', 'Treatments', 'Clinic news'];

/* ---------- All posts ---------- */
export function PostsList() {
  const { user, onAuthError } = useAuth();
  const { data, error, loading, reload } = useApi('/admin/posts');
  const { state } = useLocation();
  const [flash, setFlash] = useState(state?.flash || '');

  useEffect(() => {
    if (error) onAuthError(error);
  }, [error, onAuthError]);

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.title}”? This cannot be undone.`)) return;
    try {
      await api(`/admin/posts/${p.id}`, { method: 'DELETE' });
      setFlash('Post deleted.');
      reload();
    } catch (err) {
      onAuthError(err);
      window.alert(err.message);
    }
  };

  const canEdit = (p) => user.role === 'admin' || p.createdBy === user.id;

  return (
    <section className="apage">
      <header className="apage__head">
        <div>
          <h1>Blog posts</h1>
          <p>Published posts appear on the website’s Blog page straight away.</p>
        </div>
        <Link to="/admin/posts/new" className="btn btn--navy">
          <Icon name="plus" size={18} /> Write a post
        </Link>
      </header>

      {flash && (
        <p className="aflash" role="status">
          {flash}
          <button onClick={() => setFlash('')} aria-label="Dismiss">
            ×
          </button>
        </p>
      )}
      {loading && !data && <p className="state">Loading…</p>}
      {error && <p className="bf__fail">{error.message}</p>}
      {data && !data.length && <p className="state">No posts yet. Write the first one!</p>}

      <ul className="alist">
        {data?.map((p) => (
          <li key={p.id} className="alist__row">
            <img src={p.cover} alt="" className="alist__thumb" />
            <div className="alist__main">
              <strong>{p.title}</strong>
              <span>
                <span className={`badge badge--${p.status}`}>{p.status === 'draft' ? 'Draft' : 'Published'}</span>
                {p.category} · {p.author} · {formatDate(p.publishedAt || p.updatedAt)}
              </span>
            </div>
            <div className="alist__actions">
              {p.status === 'published' && (
                <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="abtn">
                  View
                </a>
              )}
              {canEdit(p) && (
                <>
                  <Link to={`/admin/posts/${p.id}`} className="abtn">
                    Edit
                  </Link>
                  <button className="abtn abtn--danger" onClick={() => remove(p)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Write / edit a post ---------- */
const EMPTY = { title: '', excerpt: '', category: '', author: '', body: '' };

export function PostEditor() {
  const { id } = useParams();
  const { user, onAuthError } = useAuth();
  const navigate = useNavigate();
  const existing = useApi(id ? `/admin/posts/${id}` : null);
  const all = useApi('/admin/posts');
  const [f, setF] = useState({ ...EMPTY, author: user.name });
  const [cover, setCover] = useState(null); // File
  const [coverUrl, setCoverUrl] = useState('');
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = existing.data;
    if (!p) return;
    setF({ title: p.title, excerpt: p.excerpt, category: p.category, author: p.author, body: p.body });
    setCoverUrl(p.cover);
  }, [existing.data]);

  useEffect(() => {
    if (existing.error) onAuthError(existing.error);
  }, [existing.error, onAuthError]);

  // Show the chosen image before it is uploaded
  useEffect(() => {
    if (!cover) return;
    const url = URL.createObjectURL(cover);
    setCoverUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);

  const categories = useMemo(
    () => [...new Set([...DEFAULT_CATEGORIES, ...(all.data || []).map((p) => p.category)])],
    [all.data]
  );

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const pickCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError('Cover must be a JPG, PNG or WebP image.');
    if (file.size > 20 * 1024 * 1024) return setError('That image is too large — please choose one under 20 MB.');
    setError('');
    setCover(file);
  };

  const save = async (status) => {
    if (!id && !cover) return setError('Please add a cover image.');
    setBusy(true);
    setError('');
    const form = new FormData();
    Object.entries(f).forEach(([k, v]) => form.append(k, v));
    form.append('status', status);
    if (cover) form.append('cover', await cropCover(cover));
    try {
      await api(id ? `/admin/posts/${id}` : '/admin/posts', { method: id ? 'PUT' : 'POST', form });
      navigate('/admin/posts', {
        state: { flash: status === 'draft' ? 'Draft saved.' : 'Post published — it is now live on the website.' },
      });
    } catch (err) {
      onAuthError(err);
      setError(err.message);
      setBusy(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (id && existing.loading && !existing.data) return <p className="state">Loading…</p>;
  if (id && existing.error) return <p className="bf__fail apage">{existing.error.message}</p>;

  const isDraft = !id || existing.data?.status === 'draft';

  return (
    <section className="apage">
      <header className="apage__head">
        <div>
          <Link to="/admin/posts" className="aback">
            ← All posts
          </Link>
          <h1>{id ? 'Edit post' : 'Write a post'}</h1>
        </div>
      </header>

      <form className="aform" onSubmit={(e) => (e.preventDefault(), save('published'))}>
        {error && <p className="bf__fail">{error}</p>}

        <label className="bf__field">
          <span className="bf__label">Title</span>
          <input value={f.title} onChange={set('title')} maxLength={160} required placeholder="e.g. How to care for your skin in summer" />
        </label>
        <label className="bf__field">
          <span className="bf__label">Short summary</span>
          <textarea rows={2} value={f.excerpt} onChange={set('excerpt')} maxLength={300} required placeholder="One or two sentences shown on the blog cards." />
        </label>
        <div className="bf__row">
          <label className="bf__field">
            <span className="bf__label">Category</span>
            <input list="post-categories" value={f.category} onChange={set('category')} maxLength={40} required placeholder="Choose or type a category" />
            <datalist id="post-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="bf__field">
            <span className="bf__label">Author</span>
            <input list="post-authors" value={f.author} onChange={set('author')} maxLength={80} required />
            <datalist id="post-authors">
              {TEAM.map((t) => (
                <option key={t.name} value={t.name} />
              ))}
            </datalist>
          </label>
        </div>

        <div className="bf__field">
          <span className="bf__label">Cover image {id && <em>(choose a new one to replace it)</em>}</span>
          <label className="acover">
            {coverUrl ? <img src={coverUrl} alt="Cover preview" /> : <span>Click to choose an image (JPG, PNG or WebP, up to 5 MB)</span>}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickCover} />
          </label>
        </div>

        <div className="bf__field">
          <span className="abody__head">
            <span className="bf__label">Article</span>
            <span className="abody__tabs">
              <button type="button" className={!preview ? 'is-on' : ''} onClick={() => setPreview(false)}>
                Write
              </button>
              <button type="button" className={preview ? 'is-on' : ''} onClick={() => setPreview(true)}>
                Preview
              </button>
            </span>
          </span>
          {preview ? (
            <div className="abody__preview article__body">
              {f.body.trim() ? <ArticleBody text={f.body} reveal={false} /> : <p className="state">Nothing to preview yet.</p>}
            </div>
          ) : (
            <textarea
              className="abody__text"
              rows={16}
              value={f.body}
              onChange={set('body')}
              required
              placeholder={'Write your article here.\n\nLeave an empty line between paragraphs.\n\n## A heading\n\n- A bullet point\n- Another bullet point'}
            />
          )}
          <span className="abody__help">
            Tips: leave an empty line between paragraphs · start a line with <code>## </code> for a heading · start a line with{' '}
            <code>- </code> for a bullet point
          </span>
        </div>

        <div className="aform__actions">
          <button type="submit" className="btn btn--navy" disabled={busy}>
            {busy ? 'Saving…' : id && !isDraft ? 'Save changes' : 'Publish'}
          </button>
          <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => save('draft')}>
            {isDraft ? 'Save as draft' : 'Unpublish (move to drafts)'}
          </button>
        </div>
      </form>
    </section>
  );
}
