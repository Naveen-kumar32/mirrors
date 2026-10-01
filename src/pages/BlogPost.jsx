import { Link, useParams } from 'react-router-dom';
import { TEAM, img } from '../data';
import { formatDate, useApi } from '../backend';
import { useChat } from '../chat/ChatProvider';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import ArticleBody from '../components/ArticleBody';
import { BlogCard } from '../components/Blog';
import CTA from '../components/CTA';
import { Eyebrow, Icon, useReveal } from '../components/ui';
import NotFound from './NotFound';

export default function BlogPostPage() {
  const { slug } = useParams();
  const chat = useChat();
  const { data: post, error, reload } = useApi(`/posts/${encodeURIComponent(slug)}`);
  const { data: all } = useApi('/posts');
  useReveal(post ? `post-${post.slug}-${all ? 'all' : ''}` : null);

  if (error?.status === 404) return <NotFound />;
  if (error)
    return (
      <Page title="Blog">
        <section className="section">
          <div className="container state">
            <p>{error.message}</p>
            <button className="btn btn--ghost" onClick={reload}>
              Try again
            </button>
          </div>
        </section>
      </Page>
    );
  if (!post || post.slug !== slug)
    return (
      <Page title="Blog">
        <section className="section">
          <p className="container state">Loading article…</p>
        </section>
      </Page>
    );

  const author = TEAM.find((t) => t.name === post.author);
  const related = (all || [])
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => (b.category === post.category) - (a.category === post.category))
    .slice(0, 3);

  return (
    <Page title={post.title}>
      <PageHeader
        eyebrow={post.category}
        title={post.title}
        text={`${formatDate(post.publishedAt)} · ${post.readTime} · By ${post.author}`}
        image={post.cover}
        crumbs={[{ to: '/blog', label: 'Blog' }]}
      />

      <section className="section">
        <div className="container article">
          <article className="article__body">
            <p className="article__lead reveal">{post.excerpt}</p>
            <ArticleBody text={post.body} />
            <p className="article__note reveal">
              This article is general information, not medical advice. Please see a dermatologist about your own skin.
            </p>
          </article>

          <aside className="article__side">
            <div className="article__card reveal">
              {author && <img src={img(author.image, 480)} alt={`Portrait of ${author.name}`} />}
              <p className="article__by">Written by</p>
              <strong>{post.author}</strong>
              {author && (
                <>
                  <span>{author.role}</span>
                  <Link to="/doctors" className="text-link">
                    View profile <Icon name="arrow" size={16} />
                  </Link>
                </>
              )}
            </div>
            <div className="article__card article__card--navy reveal">
              <strong>Need advice for your skin?</strong>
              <span>Book a consultation with one of our dermatologists.</span>
              <button className="btn btn--white" onClick={() => chat.openBooking()}>
                Book appointment <Icon name="arrow" size={18} />
              </button>
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section section--sand">
          <div className="container">
            <header className="section__head">
              <Eyebrow>Keep reading</Eyebrow>
              <h2 className="title reveal">
                More <em>articles</em>
              </h2>
            </header>
            <div className="treatments">
              {related.map((p, i) => (
                <BlogCard key={p.slug} post={p} i={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CTA />
    </Page>
  );
}
