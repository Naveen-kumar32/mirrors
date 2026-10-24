import { Link, useSearchParams } from 'react-router-dom';
import { IMG } from '../data';
import { formatDate, usePosts } from '../backend';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import { BlogCard } from '../components/Blog';
import BlogSidebar from '../components/BlogSidebar';
import CTA from '../components/CTA';
import { Icon, useReveal } from '../components/ui';

const PER_PAGE = 6;

export default function BlogPage() {
  const { data: all, error, loading, reload } = usePosts();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const tag = params.get('tag') || '';
  const q = (params.get('q') || '').trim();
  const filtering = Boolean(category || tag || q);

  const matches = (all || []).filter(
    (p) =>
      (!category || p.category === category) &&
      (!tag || (p.tags || []).some((t) => t.toLowerCase() === tag.toLowerCase())) &&
      (!q || [p.title, p.excerpt, p.category, ...(p.tags || [])].join(' ').toLowerCase().includes(q.toLowerCase()))
  );

  // The newest article is shown large on the first page when nothing is filtered
  const featured = !filtering ? matches[0] : null;
  const list = featured ? matches.slice(1) : matches;
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number(params.get('page')) || 1));
  const items = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useReveal(all ? `blog-${category}-${tag}-${q}-${page}` : null);

  const goTo = (n) => {
    const next = new URLSearchParams(params);
    if (n > 1) next.set('page', n);
    else next.delete('page');
    setParams(next);
    document.querySelector('.blog-layout')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filterLabel = category ? `in “${category}”` : tag ? `tagged #${tag}` : q ? `matching “${q}”` : '';

  return (
    <Page title="Blog">
      <PageHeader
        eyebrow="Blog"
        title="Skin advice from our dermatologist"
        text="Simple, trustworthy guides on skin, hair and treatments — from the clinic that treats you."
        image={IMG.dq2}
        image2={IMG.dq5}
      />

      <section className="section section--sand">
        <div className="container">
          {loading && !all && <p className="state">Loading articles…</p>}
          {error && (
            <div className="state">
              <p>{error.message}</p>
              <button className="btn btn--ghost" onClick={reload}>
                Try again
              </button>
            </div>
          )}
          {all && !all.length && <p className="state">New articles are coming soon.</p>}

          {all?.length > 0 && (
            <div className="blog-layout">
              <div className="blog-main">
                {filtering && (
                  <div className="blog-filterbar">
                    <span>
                      {matches.length} article{matches.length === 1 ? '' : 's'} {filterLabel}
                    </span>
                    <Link to="/blog" className="blog-filterbar__clear">
                      Clear filter <Icon name="close" size={14} />
                    </Link>
                  </div>
                )}

                {featured && page === 1 && (
                  <Link to={`/blog/${featured.slug}`} className="post-feature reveal" key={featured.slug}>
                    <span className="post-feature__img">
                      <img src={featured.cover} alt="" />
                    </span>
                    <span className="post-feature__body">
                      <span className="post-card__meta">
                        <span className="post-card__cat">{featured.category}</span>
                        {formatDate(featured.publishedAt)} · {featured.readTime}
                      </span>
                      <span className="post-feature__title">{featured.title}</span>
                      <span className="treatment__text">{featured.excerpt}</span>
                      <span className="treatment__link">
                        Read article <Icon name="arrow" size={16} />
                      </span>
                    </span>
                  </Link>
                )}

                {matches.length === 0 ? (
                  <div className="blog-empty">
                    <p>No articles found {filterLabel}.</p>
                    <Link to="/blog" className="btn btn--ghost">
                      See all articles
                    </Link>
                  </div>
                ) : (
                  <div className="blog-grid" key={`${category}-${tag}-${q}-${page}`}>
                    {items.map((p, i) => (
                      <BlogCard key={p.slug} post={p} i={i} />
                    ))}
                  </div>
                )}

                {pages > 1 && (
                  <nav className="blog-pager" aria-label="Article pages">
                    <button className="btn btn--ghost" onClick={() => goTo(page - 1)} disabled={page === 1}>
                      ← Previous
                    </button>
                    <span>
                      Page {page} of {pages}
                    </span>
                    <button className="btn btn--ghost" onClick={() => goTo(page + 1)} disabled={page === pages}>
                      Next →
                    </button>
                  </nav>
                )}
              </div>

              <aside className="blog-layout__side" aria-label="Browse articles">
                <BlogSidebar posts={all} category={category} tag={tag} q={q} />
              </aside>
            </div>
          )}
        </div>
      </section>

      <CTA title="Have a skin concern? Talk to a dermatologist" />
    </Page>
  );
}
