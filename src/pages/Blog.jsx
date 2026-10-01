import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IMG } from '../data';
import { formatDate, useApi } from '../backend';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import { BlogCard } from '../components/Blog';
import CTA from '../components/CTA';
import { Icon, useReveal } from '../components/ui';

export default function BlogPage() {
  const { data: all, error, loading, reload } = useApi('/posts');
  const [cat, setCat] = useState('All');
  const categories = ['All', ...new Set((all || []).map((p) => p.category))];
  const posts = !all ? [] : cat === 'All' ? all : all.filter((p) => p.category === cat);
  const [featured, ...rest] = posts;
  useReveal(all ? `blog-${cat}` : null);

  return (
    <Page title="Blog">
      <PageHeader
        eyebrow="Blog"
        title="Skin advice from our dermatologists"
        text="Simple, trustworthy guides on skin, hair and treatments — written by the doctors who treat you."
        image={IMG.dq2}
        image2={IMG.dropper}
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
            <div className="filters reveal" role="tablist" aria-label="Filter articles by topic">
              {categories.map((c) => (
                <button key={c} role="tab" aria-selected={cat === c} className={cat === c ? 'is-on' : ''} onClick={() => setCat(c)}>
                  {c}
                </button>
              ))}
            </div>
          )}

          {featured && (
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

          <div className="treatments" key={cat}>
            {rest.map((p, i) => (
              <BlogCard key={p.slug} post={p} i={i} />
            ))}
          </div>
        </div>
      </section>

      <CTA title="Have a skin concern? Talk to a dermatologist" />
    </Page>
  );
}
