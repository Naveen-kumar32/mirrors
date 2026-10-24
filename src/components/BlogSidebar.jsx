import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDate } from '../backend';
import { Icon } from './ui';

// /blog with filters, e.g. blogLink({ category: 'Skincare' }) → "/blog?category=Skincare"
export const blogLink = (params = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return q ? `/blog?${q}` : '/blog';
};

const sameTag = (a, b) => a.toLowerCase() === b.toLowerCase();

// [[name, count], …] most used first
function counts(values) {
  const map = new Map();
  values.forEach((v) => {
    const key = [...map.keys()].find((k) => sameTag(k, v)) ?? v;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/* Blog sidebar: search, categories, tags and recent articles. Every link goes to /blog
   with a filter, so it works the same on the blog list and on an article page. */
export default function BlogSidebar({ posts = [], category = '', tag = '', q = '', search = true, recent = true }) {
  const navigate = useNavigate();
  const [text, setText] = useState(q);
  useEffect(() => setText(q), [q]);

  const cats = counts(posts.map((p) => p.category));
  const tags = counts(posts.flatMap((p) => p.tags || [])).slice(0, 24);
  const latest = posts.slice(0, 4);

  return (
    <div className="blog-side">
      {search && (
        <form
          className="blog-side__card blog-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(blogLink({ q: text.trim() }));
          }}
        >
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search articles…"
            aria-label="Search articles"
          />
          <button type="submit" aria-label="Search">
            <Icon name="search" size={18} />
          </button>
        </form>
      )}

      <div className="blog-side__card">
        <h3 className="blog-side__title">Categories</h3>
        <ul className="blog-cats">
          <li>
            <Link to="/blog" className={!category && !tag && !q ? 'is-on' : ''}>
              All articles <span>{posts.length}</span>
            </Link>
          </li>
          {cats.map(([c, n]) => (
            <li key={c}>
              <Link to={blogLink({ category: c })} className={category === c ? 'is-on' : ''} aria-current={category === c ? 'page' : undefined}>
                {c} <span>{n}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {tags.length > 0 && (
        <div className="blog-side__card">
          <h3 className="blog-side__title">Tags</h3>
          <div className="blog-tags">
            {tags.map(([t]) => (
              <Link key={t} to={blogLink({ tag: t })} className={`blog-tag${tag && sameTag(tag, t) ? ' is-on' : ''}`}>
                #{t}
              </Link>
            ))}
          </div>
        </div>
      )}

      {recent && latest.length > 0 && (
        <div className="blog-side__card">
          <h3 className="blog-side__title">Recent articles</h3>
          <ul className="blog-recent">
            {latest.map((p) => (
              <li key={p.slug}>
                <Link to={`/blog/${p.slug}`}>
                  <img src={p.cover} alt="" loading="lazy" />
                  <span>
                    <strong>{p.title}</strong>
                    <small>{formatDate(p.publishedAt)}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
