import { useEffect, useState } from 'react';
import { api, useApi } from '../backend';
import Pagination from '../components/Pagination';
import { Icon } from '../components/ui';
import { useAuth } from './AdminApp';

const MAX_FILES = 10;
const MAX_SIDE = 1600; // photos are shrunk to at most 1600px before upload

/* Resize in the browser so phone photos (often 5–10 MB) upload quickly and load fast */
async function shrink(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' });
}

function Uploader({ onDone }) {
  const { onAuthError } = useAuth();
  const [items, setItems] = useState([]); // { file, url, name }
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [rights, setRights] = useState(false); // ownership + consent confirmed

  useEffect(() => () => items.forEach((i) => URL.revokeObjectURL(i.url)), [items]);

  const pick = (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    const ok = files.filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
    const room = MAX_FILES - items.length;
    setError(
      ok.length < files.length
        ? 'Some files were skipped — please use JPG, PNG or WebP photos.'
        : ok.length > room
          ? `You can upload up to ${MAX_FILES} photos at a time.`
          : ''
    );
    setItems((cur) => [...cur, ...ok.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file), name: '' }))]);
  };

  const upload = async () => {
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      for (const it of items) {
        form.append('photos', await shrink(it.file));
        form.append('names', it.name.trim());
      }
      await api('/admin/gallery', { method: 'POST', form });
      const n = items.length;
      setItems([]);
      setRights(false);
      onDone(`${n} photo${n > 1 ? 's' : ''} added to the gallery.`);
    } catch (err) {
      onAuthError(err);
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <div className="aupload">
      <label className="aupload__drop">
        <Icon name="plus" size={26} />
        <strong>Choose photos</strong>
        <span>Up to {MAX_FILES} at a time · JPG, PNG or WebP · large photos are resized automatically</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={pick} disabled={items.length >= MAX_FILES} />
      </label>
      {error && <p className="bf__fail">{error}</p>}

      {items.length > 0 && (
        <>
          <ul className="aupload__list">
            {items.map((it, i) => (
              <li key={it.url}>
                <img src={it.url} alt="" />
                <label className="agal__name">
                  <span>Photo name</span>
                  <input
                    value={it.name}
                    placeholder="e.g. Reception area"
                    maxLength={120}
                    onChange={(e) => setItems((cur) => cur.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))}
                  />
                </label>
                <button type="button" aria-label="Remove" onClick={() => setItems((cur) => cur.filter((_, k) => k !== i))}>
                  <Icon name="close" size={14} />
                </button>
              </li>
            ))}
          </ul>
          <label className="acheck">
            <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} />
            The clinic owns these photos (or has permission to use them), and anyone recognisable in them — especially
            patients — has given written consent to appear on the website.
          </label>
          <div className="aupload__bar">
            <span className="amuted">
              {items.filter((i) => !i.name.trim()).length
                ? 'Tip: give each photo a name — it is shown under the photo on the website.'
                : 'All photos are named.'}
            </span>
            <button className="btn btn--navy" onClick={upload} disabled={busy || !rights}>
              {busy ? 'Uploading…' : `Upload ${items.length} photo${items.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function GalleryAdmin() {
  const { onAuthError } = useAuth();
  const [page, setPage] = useState(1);
  const [flash, setFlash] = useState('');
  const { data, error, reload } = useApi(`/gallery?page=${page}`);

  const act = async (fn, message) => {
    try {
      await fn();
      if (message) setFlash(message);
      reload();
    } catch (err) {
      onAuthError(err);
      window.alert(err.message);
    }
  };

  const rename = (p, name) => act(() => api(`/admin/gallery/${p.id}`, { method: 'PATCH', body: { name } }), 'Photo name saved.');
  const remove = (p) =>
    window.confirm('Delete this photo from the gallery? This cannot be undone.') &&
    act(() => api(`/admin/gallery/${p.id}`, { method: 'DELETE' }), 'Photo deleted.');

  return (
    <section className="apage">
      <header className="apage__head">
        <div>
          <h1>Gallery</h1>
          <p>
            Photos you upload appear on the website’s Gallery page straight away, newest first, 10 per page. The photo
            name is shown under each photo.
          </p>
        </div>
        <a href="/gallery" target="_blank" rel="noreferrer" className="btn btn--ghost">
          View gallery
        </a>
      </header>

      {flash && (
        <p className="aflash" role="status">
          {flash}
          <button onClick={() => setFlash('')} aria-label="Dismiss">
            ×
          </button>
        </p>
      )}

      <Uploader
        onDone={(m) => {
          setFlash(m);
          setPage(1);
          reload();
        }}
      />

      <h2 className="agal__title">Photos in the gallery {data?.total ? `(${data.total})` : ''}</h2>

      {error && <p className="bf__fail">{error.message}</p>}
      {data && !data.total && <p className="state">No photos here yet.</p>}

      <ul className="agal">
        {data?.items.map((p) => (
          <li key={p.id}>
            <img src={p.image} alt={p.name} loading="lazy" />
            <label className="agal__name">
              <span>Photo name</span>
              <input
                key={`${p.id}-${p.name}`}
                defaultValue={p.name}
                placeholder="Add a name"
                maxLength={120}
                onBlur={(e) => e.target.value.trim() !== p.name && rename(p, e.target.value.trim())}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              />
            </label>
            <button className="abtn abtn--danger agal__del" onClick={() => remove(p)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      {data && <Pagination page={data.page} pages={data.pages} onChange={(n) => (setPage(n), window.scrollTo({ top: 0 }))} />}
    </section>
  );
}
