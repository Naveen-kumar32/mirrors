import { Link } from 'react-router-dom';
import { formatDate, useApi } from '../backend';
import { Eyebrow, Icon, useReveal } from './ui';

export function BlogCard({ post, i = 0 }) {
  return (
    <Link to={`/blog/${post.slug}`} className="treatment post-card reveal" style={{ '--d': `${(i % 3) * 120}ms` }}>
      <span className="treatment__img">
        <img src={post.cover} alt="" loading="lazy" />
      </span>
      <span className="treatment__body">
        <span className="post-card__meta">
          <span className="post-card__cat">{post.category}</span>
          {formatDate(post.publishedAt)}
        </span>
        <span className="treatment__title">{post.title}</span>
        <span className="treatment__text">{post.excerpt}</span>
        <span className="treatment__link">
          Read article <Icon name="arrow" size={16} />
        </span>
      </span>
    </Link>
  );
}

/* "From our blog" strip with the latest articles, used on the home page */
export default function BlogPreview({ count = 3 }) {
  const { data } = useApi('/posts');
  useReveal(data ? 'blog-preview' : null);
  if (!data?.length) return null;

  return (
    <section className="section">
      <div className="container">
        <header className="section__head">
          <Eyebrow>From our blog</Eyebrow>
          <h2 className="title reveal">
            Skin <em>advice</em> from our doctors
          </h2>
        </header>
        <div className="treatments">
          {data.slice(0, count).map((p, i) => (
            <BlogCard key={p.slug} post={p} i={i} />
          ))}
        </div>
        <p className="section__more reveal">
          <Link to="/blog" className="text-link">
            Read all articles <Icon name="arrow" size={16} />
          </Link>
        </p>
      </div>
    </section>
  );
}
