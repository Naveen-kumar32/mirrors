import { Icon } from './ui';

/*
 * Page numbers with dots for skipped ranges, always showing the first and last page:
 *   ‹ Previous  1 2 3 4 5 … 30  Next ›
 *   ‹ Previous  1 … 14 15 16 … 30  Next ›
 *   ‹ Previous  1 … 26 27 28 29 30  Next ›
 */
export function pageList(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, '…', pages];
  if (page >= pages - 3) return [1, '…', pages - 4, pages - 3, pages - 2, pages - 1, pages];
  return [1, '…', page - 1, page, page + 1, '…', pages];
}

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <nav className="pager" aria-label="Pages">
      <button className="pager__step" onClick={() => onChange(page - 1)} disabled={page === 1}>
        <Icon name="arrow" size={16} className="flip" /> Previous
      </button>
      <ol className="pager__nums">
        {pageList(page, pages).map((p, i) =>
          p === '…' ? (
            <li key={`dots-${i}`} className="pager__dots" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                className={p === page ? 'is-on' : ''}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            </li>
          )
        )}
      </ol>
      <button className="pager__step" onClick={() => onChange(page + 1)} disabled={page === pages}>
        Next <Icon name="arrow" size={16} />
      </button>
    </nav>
  );
}
