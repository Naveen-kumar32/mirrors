import { useState } from 'react';
import { Icon } from './ui';

/* "Share this article" buttons — each network opens in a new tab */
export default function ShareBar({ title, url, compact = false }) {
  const [note, setNote] = useState('');
  const u = encodeURIComponent(url);
  const links = [
    { key: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: 'x', label: 'X', href: `https://twitter.com/intent/tweet?url=${u}&text=${encodeURIComponent(title)}` },
    { key: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { key: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
  ];

  const copy = async (message) => {
    try {
      await navigator.clipboard.writeText(url);
      setNote(message);
    } catch {
      setNote('Copy this link: ' + url);
    }
    setTimeout(() => setNote(''), 4000);
  };

  // Instagram has no "share a link" page: copy the link, then open Instagram to paste it
  const instagram = () => {
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    copy('Link copied — paste it into your Instagram story or message.');
  };

  return (
    <div className={`share${compact ? ' share--compact' : ''}`}>
      <span className="share__label">
        <Icon name="share" size={16} /> Share this article
      </span>
      <div className="share__btns">
        {links.map((l) => (
          <a
            key={l.key}
            className={`share__btn share__btn--${l.key}`}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${l.label} (opens in a new tab)`}
            title={`Share on ${l.label}`}
          >
            <Icon name={l.key} size={17} />
          </a>
        ))}
        <button
          type="button"
          className="share__btn share__btn--instagram"
          onClick={instagram}
          aria-label="Share on Instagram: copies the link and opens Instagram in a new tab"
          title="Share on Instagram"
        >
          <Icon name="instagram" size={17} />
        </button>
        <button
          type="button"
          className="share__btn share__btn--link"
          onClick={() => copy('Link copied to clipboard.')}
          aria-label="Copy link"
          title="Copy link"
        >
          <Icon name="link" size={17} />
        </button>
      </div>
      <p className="share__note" role="status" aria-live="polite">
        {note}
      </p>
    </div>
  );
}
