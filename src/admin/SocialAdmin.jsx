import { useEffect, useState } from 'react';
import { api, useApi } from '../backend';
import { Icon } from '../components/ui';
import { RefreshButton, useAuth } from './AdminApp';
const PLATFORM_LABELS = { youtube: 'YouTube', instagram: 'Instagram', facebook: 'Facebook' };
const PER_PAGE = 3;

/* ── Shared: row showing a post that's on the website ── */
function PostRow({ item, onChange }) {
  const { onAuthError } = useAuth();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [desc, setDesc] = useState(item.description);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggle = async () => {
    try {
      await api(`/admin/social/${item.id}`, { method: 'PATCH', body: { visible: !item.visible } });
      onChange();
    } catch (err) { onAuthError(err); }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(`/admin/social/${item.id}`, { method: 'PATCH', body: { title, description: desc } });
      setEditing(false);
      onChange();
    } catch (err) { onAuthError(err); setError(err.message); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!confirm('Delete this post from the website?')) return;
    try {
      await api(`/admin/social/${item.id}`, { method: 'DELETE' });
      onChange();
    } catch (err) { onAuthError(err); }
  };

  return (
    <div className={`srow${item.visible ? '' : ' srow--hidden'}`}>
      <div className="srow__icon" data-platform={item.platform}>
        <Icon name={item.platform} size={20} />
      </div>
      <div className="srow__info">
        {editing ? (
          <form onSubmit={save} className="srow__edit">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" maxLength={120} className="srow__input" />
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} maxLength={300} placeholder="Description" className="srow__textarea" />
            {error && <p className="bf__fail">{error}</p>}
            <div className="srow__edit-actions">
              <button className="abtn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
              <button type="button" className="abtn abtn--ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="srow__url">
              {item.url.length > 60 ? item.url.slice(0, 60) + '…' : item.url}
            </a>
            {item.title && <strong className="srow__title">{item.title}</strong>}
            {item.description && <p className="srow__desc">{item.description}</p>}
          </>
        )}
      </div>
      <div className="srow__actions">
        <button type="button" className={`abtn abtn--sm${item.visible ? ' abtn--ghost' : ''}`} onClick={toggle}>
          {item.visible ? 'Visible' : 'Hidden'}
        </button>
        {!editing && (
          <button type="button" className="abtn abtn--sm abtn--ghost" onClick={() => setEditing(true)}>Edit</button>
        )}
        <button type="button" className="abtn abtn--sm abtn--danger" onClick={remove}>
          <Icon name="close" size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Paginated posts list for one platform ── */
function PostsList({ items, loading, onChange }) {
  const [page, setPage] = useState(1);
  const total = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const safe = Math.min(page, total);
  const visible = items.slice((safe - 1) * PER_PAGE, safe * PER_PAGE);

  useEffect(() => setPage(1), [items.length]);

  return (
    <div className="slist-admin">
      <h2 className="sform__heading">{items.length} post{items.length !== 1 ? 's' : ''} on website</h2>
      {loading && <p className="slist__empty">Loading…</p>}
      {!loading && items.length === 0 && <p className="slist__empty">No posts yet.</p>}
      {visible.map((item) => <PostRow key={item.id} item={item} onChange={onChange} />)}
      {!loading && total > 1 && (
        <div className="slist-pager">
          <button className="abtn abtn--sm abtn--ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safe === 1}>← Prev</button>
          <span className="slist-pager__info">{safe} / {total}</span>
          <button className="abtn abtn--sm" onClick={() => setPage((p) => Math.min(total, p + 1))} disabled={safe === total}>Next →</button>
        </div>
      )}
    </div>
  );
}

/* ── Add post form ── */
function AddPostForm({ platform, onAdded }) {
  const { onAuthError } = useAuth();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const placeholders = {
    youtube: 'https://youtube.com/watch?v=...',
    instagram: 'https://instagram.com/p/...',
    facebook: 'https://facebook.com/...',
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/admin/social', { method: 'POST', body: { url, title, description: desc } });
      setUrl(''); setTitle(''); setDesc('');
      onAdded();
    } catch (err) { onAuthError(err); setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <form className="sform" onSubmit={submit}>
      <h2 className="sform__heading">Add {PLATFORM_LABELS[platform]} post</h2>
      <label className="bf__field">
        <span className="bf__label">URL</span>
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={placeholders[platform]} required />
      </label>
      <label className="bf__field">
        <span className="bf__label">Title (optional)</span>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </label>
      <label className="bf__field">
        <span className="bf__label">Description (optional)</span>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} maxLength={300} />
      </label>
      {error && <p className="bf__fail">{error}</p>}
      <button className="abtn" disabled={busy}>{busy ? 'Adding…' : 'Add post'}</button>
    </form>
  );
}

/* ── YouTube channel browser ── */
function YouTubeChannel({ onAdded }) {
  const { onAuthError } = useAuth();
  const [handle, setHandle] = useState('liarsfc');
  const [inputVal, setInputVal] = useState('liarsfc');
  const [videos, setVideos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(null);
  const [nextToken, setNextToken] = useState(null);
  const [longNextToken, setLongNextToken] = useState(null);
  const [pageStack, setPageStack] = useState([]);
  const [rssOnly, setRssOnly] = useState(false);
  const [total, setTotal] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

  const load = async (h, pageToken, longToken, isBack, filter) => {
    const clean = (h || handle).trim().replace(/^@/, '');
    const f = filter ?? typeFilter;
    if (!clean) return;
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams({ handle: clean, filter: f });
      if (pageToken) q.set('pageToken', pageToken);
      if (longToken) q.set('longPageToken', longToken);
      const data = await api(`/admin/social/youtube-feed?${q}`);
      setVideos(data.videos || []);
      setNextToken(data.nextPageToken || null);
      setLongNextToken(data.longNextPageToken || null);
      setRssOnly(!!data.rssOnly);
      setTotal(data.totalResults || null);
      if (!isBack && (pageToken || longToken)) {
        setPageStack((s) => [...s, { token: pageToken, longToken }]);
      }
    } catch (err) { onAuthError(err); setError(err.message || 'Could not load channel videos.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load('liarsfc', null, null, false, 'all'); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const search = () => {
    const clean = inputVal.trim().replace(/^@/, '');
    setHandle(clean);
    setPageStack([]);
    setNextToken(null); setLongNextToken(null);
    load(clean, null, null, false, typeFilter);
  };

  const switchFilter = (f) => {
    setTypeFilter(f);
    setPageStack([]);
    setNextToken(null); setLongNextToken(null);
    load(handle, null, null, false, f);
  };

  const goNext = () => load(handle, nextToken, longNextToken, false, typeFilter);
  const goBack = () => {
    const stack = [...pageStack];
    stack.pop();
    const prev = stack[stack.length - 1] || { token: null, longToken: null };
    setPageStack(stack);
    load(handle, prev.token, prev.longToken, true, typeFilter);
  };

  const addVideo = async (video) => {
    setAdding(video.videoId);
    try {
      const result = await api('/admin/social', { method: 'POST', body: { url: video.url, title: video.title } });
      setVideos((prev) => prev.map((v) => v.videoId === video.videoId ? { ...v, added: true, postId: result.id } : v));
      onAdded();
    } catch (err) { onAuthError(err); setError(err.message); }
    finally { setAdding(null); }
  };

  const removeVideo = async (video) => {
    if (!video.postId) return;
    setAdding(video.videoId);
    try {
      await api(`/admin/social/${video.postId}`, { method: 'DELETE' });
      setVideos((prev) => prev.map((v) => v.videoId === video.videoId ? { ...v, added: false, postId: null } : v));
      onAdded();
    } catch (err) { onAuthError(err); setError(err.message); }
    finally { setAdding(null); }
  };

  const fmt = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return ''; }
  };

  const hasPrev = pageStack.length > 0;

  return (
    <div className="ytchannel">
      <div className="ytchannel__head">
        <div className="ytchannel__title">
          <Icon name="youtube" size={18} />
          <span>Channel Videos{total ? ` — ${total} total` : ''}</span>
          {rssOnly && <span className="ytchannel__rss-note">(last 15 only — add YOUTUBE_API_KEY to .env for full list)</span>}
        </div>
        <div className="ytchannel__search">
          <input value={inputVal} onChange={(e) => setInputVal(e.target.value)} placeholder="Channel handle" className="ytchannel__input" onKeyDown={(e) => e.key === 'Enter' && search()} />
          <button className="abtn abtn--sm" onClick={search} disabled={loading}>{loading ? 'Loading…' : 'Load'}</button>
        </div>
      </div>

      {!rssOnly && (
        <div className="ytchannel__tabs">
          {[['all','All'], ['video','Videos'], ['short','Shorts']].map(([val, label]) => (
            <button key={val} className={`ytchannel__tab${typeFilter === val ? ' is-active' : ''}`} onClick={() => switchFilter(val)}>{label}</button>
          ))}
          <span className="ytchannel__note">Community Posts can't be fetched via YouTube's API</span>
        </div>
      )}

      {error && <p className="bf__fail" style={{ margin: '12px 16px 0' }}>{error}</p>}
      {loading && <div className="ytchannel__empty">Loading videos…</div>}
      {!loading && videos && videos.length === 0 && <div className="ytchannel__empty">No videos found for @{handle}.</div>}

      {!loading && videos && videos.length > 0 && (
        <>
          <div className="ytchannel__grid">
            {videos.map((v) => (
              <div key={v.videoId} className={`ytvid${v.added ? ' ytvid--added' : ''}`}>
                <a href={v.url} target="_blank" rel="noopener noreferrer" className="ytvid__thumb">
                  <img src={v.thumbnail} alt={v.title} loading="lazy" />
                  <span className="ytvid__play"><Icon name="youtube" size={22} /></span>
                </a>
                <div className="ytvid__body">
                  <p className="ytvid__title">{v.title}</p>
                  {v.published && <span className="ytvid__date">{fmt(v.published)}</span>}
                </div>
                <div className="ytvid__foot">
                  {v.added ? (
                    <div className="ytvid__added-row">
                      <span className="ytvid__badge">✓ On website</span>
                      <button className="abtn abtn--sm abtn--danger" onClick={() => removeVideo(v)} disabled={adding === v.videoId}>
                        {adding === v.videoId ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  ) : (
                    <button className="abtn abtn--sm" onClick={() => addVideo(v)} disabled={adding === v.videoId}>
                      {adding === v.videoId ? 'Adding…' : 'Add to website'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {(hasPrev || nextToken) && (
            <div className="ytchannel__pager">
              <button className="abtn abtn--ghost" onClick={goBack} disabled={!hasPrev || loading}>← Previous</button>
              <button className="abtn" onClick={goNext} disabled={!nextToken || loading}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Platform sections ── */
function YouTubeSection({ items, loading, reload }) {
  return (
    <div className="splat-section">
      <div className="ssplit">
        <AddPostForm platform="youtube" onAdded={reload} />
        <PostsList items={items} loading={loading} onChange={reload} />
      </div>
      <div className="sprofile-row">
        <h2 className="sform__heading" style={{ marginBottom: 12 }}>Browse & add from channel</h2>
        <YouTubeChannel onAdded={reload} />
      </div>
    </div>
  );
}

/* ── Instagram / Facebook account browser (Meta Graph API) ── */
function MetaFeed({ platform, onAdded }) {
  const { onAuthError } = useAuth();
  const label = PLATFORM_LABELS[platform];
  const [posts, setPosts] = useState(null);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [next, setNext] = useState(null);
  const [stack, setStack] = useState([]); // cursors of the pages before this one

  const load = async (after, back) => {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams({ platform });
      if (after) q.set('after', after);
      const data = await api(`/admin/social/meta-feed?${q}`);
      setConfigured(data.configured);
      setPosts(data.posts || []);
      setNext(data.next);
      if (!back && after) setStack((s) => [...s, after]);
    } catch (err) { onAuthError(err); setError(err.message || `Could not load ${label} posts.`); }
    finally { setLoading(false); }
  };

  useEffect(() => { setStack([]); load(null); }, [platform]); // eslint-disable-line react-hooks/exhaustive-deps

  const goBack = () => {
    const s = stack.slice(0, -1);
    setStack(s);
    load(s[s.length - 1] || null, true);
  };

  const add = async (post) => {
    setBusyId(post.mediaId);
    const [first = '', ...rest] = post.caption.split('\n').filter((l) => l.trim());
    try {
      const result = await api('/admin/social', {
        method: 'POST',
        body: { url: post.url, title: first.slice(0, 120), description: rest.join(' ').slice(0, 300), image: post.image },
      });
      setPosts((prev) => prev.map((p) => (p.mediaId === post.mediaId ? { ...p, added: true, postId: result.id } : p)));
      onAdded();
    } catch (err) { onAuthError(err); setError(err.message); }
    finally { setBusyId(null); }
  };

  const remove = async (post) => {
    setBusyId(post.mediaId);
    try {
      await api(`/admin/social/${post.postId}`, { method: 'DELETE' });
      setPosts((prev) => prev.map((p) => (p.mediaId === post.mediaId ? { ...p, added: false, postId: null } : p)));
      onAdded();
    } catch (err) { onAuthError(err); setError(err.message); }
    finally { setBusyId(null); }
  };

  const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

  return (
    <div className="ytchannel">
      <div className="ytchannel__head">
        <div className="ytchannel__title">
          <Icon name={platform} size={18} />
          <span>Recent {label} posts</span>
        </div>
        <button className="abtn abtn--sm abtn--ghost" onClick={() => { setStack([]); load(null); }} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {!configured && (
        <div className="ytchannel__empty">
          {label} account isn't connected. You can still paste post links in the form above.
        </div>
      )}
      {error && <p className="bf__fail" style={{ margin: '12px 16px 0' }}>{error}</p>}
      {configured && loading && <div className="ytchannel__empty">Loading posts…</div>}
      {configured && !loading && posts && posts.length === 0 && (
        <div className="ytchannel__empty">No posts found on the {label} {platform === 'facebook' ? 'Page' : 'account'} yet.</div>
      )}

      {configured && !loading && posts && posts.length > 0 && (
        <>
          <div className="ytchannel__grid">
            {posts.map((p) => (
              <div key={p.mediaId} className={`ytvid${p.added ? ' ytvid--added' : ''}`}>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="ytvid__thumb ytvid__thumb--square">
                  {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span className="ytvid__noimg"><Icon name={platform} size={32} /></span>}
                </a>
                <div className="ytvid__body">
                  <p className="ytvid__title">{p.caption || <em>No caption</em>}</p>
                  {p.published && <span className="ytvid__date">{fmt(p.published)}</span>}
                </div>
                <div className="ytvid__foot">
                  {p.added ? (
                    <div className="ytvid__added-row">
                      <span className="ytvid__badge">✓ On website</span>
                      <button className="abtn abtn--sm abtn--danger" onClick={() => remove(p)} disabled={busyId === p.mediaId}>
                        {busyId === p.mediaId ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  ) : (
                    <button className="abtn abtn--sm" onClick={() => add(p)} disabled={busyId === p.mediaId}>
                      {busyId === p.mediaId ? 'Adding…' : 'Add to website'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {(stack.length > 0 || next) && (
            <div className="ytchannel__pager">
              <button className="abtn abtn--ghost" onClick={goBack} disabled={!stack.length || loading}>← Previous</button>
              <button className="abtn" onClick={() => load(next)} disabled={!next || loading}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MetaSection({ platform, items, loading, reload }) {
  return (
    <div className="splat-section">
      <div className="ssplit">
        <AddPostForm platform={platform} onAdded={reload} />
        <PostsList items={items} loading={loading} onChange={reload} />
      </div>
      <div className="sprofile-row">
        <h2 className="sform__heading" style={{ marginBottom: 12 }}>Browse & add from {PLATFORM_LABELS[platform]}</h2>
        <MetaFeed platform={platform} onAdded={reload} />
      </div>
    </div>
  );
}

/* ── Page ── */
const PLATFORMS = [
  { key: 'youtube',   label: 'YouTube',   icon: 'youtube' },
  { key: 'instagram', label: 'Instagram', icon: 'instagram' },
  { key: 'facebook',  label: 'Facebook',  icon: 'facebook' },
];

export default function SocialAdmin() {
  const { data, loading, reload } = useApi('/admin/social');
  const all = data?.items || [];
  const [platform, setPlatform] = useState('youtube');

  const forPlatform = (p) => all.filter((i) => i.platform === p);

  return (
    <div className="apage">
      <div className="apage__head">
        <div>
          <h1 className="apage__title">Social Media</h1>
          <p className="apage__sub">Manage posts shown on the website.</p>
        </div>
        <RefreshButton onRefresh={reload} loading={loading} />
      </div>

      {/* Platform selector */}
      <div className="splat-tabs">
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            className={`splat-tab${platform === p.key ? ' is-active' : ''}`}
            onClick={() => setPlatform(p.key)}
          >
            <Icon name={p.icon} size={18} />
            <span>{p.label}</span>
            <span className="splat-tab__count">{forPlatform(p.key).length}</span>
          </button>
        ))}
      </div>

      {platform === 'youtube'   && <YouTubeSection   items={forPlatform('youtube')}   loading={loading} reload={reload} />}
      {platform === 'instagram' && <MetaSection platform="instagram" items={forPlatform('instagram')} loading={loading} reload={reload} />}
      {platform === 'facebook'  && <MetaSection platform="facebook"  items={forPlatform('facebook')}  loading={loading} reload={reload} />}
    </div>
  );
}
