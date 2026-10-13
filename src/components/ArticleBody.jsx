import { useMemo } from 'react';
import { Icon } from './ui';

/*
 * Renders the rich text format staff write articles in:
 *   ## Heading (H2) · ### Subheading (H3)
 *   - Bullet point · 1. Numbered item
 *   > Callout / clinical quote · --- Horizontal divider
 *   Inline: **bold**, *italic*, <u>underline</u> (or ++underline++), ~~strike~~,
 *           ==highlight==, [color:#13335e]text[/color], [size:large]text[/size], [label](url)
 * Everything is rendered into safe React elements (no raw HTML injection).
 */
const COLOR_MAP = {
  navy: '#13335e',
  teal: '#2a9db0',
  green: '#23784a',
  gold: '#9a6700',
  red: '#b0413e',
  muted: '#64748b',
};

function resolveColor(raw = '') {
  const c = raw.trim().toLowerCase();
  if (COLOR_MAP[c]) return COLOR_MAP[c];
  if (/^#[0-9a-f]{3,6}$/i.test(c)) return c;
  return '#13335e';
}

const INLINE_RE =
  /(\[color:([^\]]+)\]([\s\S]*?)\[\/color\]|\[size:(large|small)\]([\s\S]*?)\[\/size\]|<u>([\s\S]*?)<\/u>|\+\+([\s\S]+?)\+\+|==([\s\S]+?)==|~~([\s\S]+?)~~|\*\*([\s\S]+?)\*\*|\*([^*\n]+)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\))/;

export function renderInline(text = '', keyPrefix = 'in') {
  if (!text) return null;
  const parts = [];
  let rest = String(text);
  let idx = 0;

  while (rest.length > 0) {
    const m = INLINE_RE.exec(rest);
    if (!m) {
      parts.push(rest);
      break;
    }
    if (m.index > 0) {
      parts.push(rest.slice(0, m.index));
    }
    const k = `${keyPrefix}-${idx++}`;
    if (m[2] !== undefined) {
      // [color:...]...[/color]
      parts.push(
        <span key={k} style={{ color: resolveColor(m[2]) }}>
          {renderInline(m[3], k)}
        </span>
      );
    } else if (m[4] !== undefined) {
      // [size:large|small]...[/size]
      parts.push(
        <span key={k} className={m[4] === 'large' ? 'article__size-lg' : 'article__size-sm'}>
          {renderInline(m[5], k)}
        </span>
      );
    } else if (m[6] !== undefined || m[7] !== undefined) {
      // <u>...</u> or ++...++
      parts.push(<u key={k}>{renderInline(m[6] ?? m[7], k)}</u>);
    } else if (m[8] !== undefined) {
      // ==highlight==
      parts.push(
        <mark key={k} className="article__mark">
          {renderInline(m[8], k)}
        </mark>
      );
    } else if (m[9] !== undefined) {
      // ~~strike~~
      parts.push(<s key={k}>{renderInline(m[9], k)}</s>);
    } else if (m[10] !== undefined) {
      // **bold**
      parts.push(<strong key={k}>{renderInline(m[10], k)}</strong>);
    } else if (m[11] !== undefined) {
      // *italic*
      parts.push(<em key={k}>{renderInline(m[11], k)}</em>);
    } else if (m[12] !== undefined && m[13] !== undefined) {
      // [label](url)
      const isExt = /^https?:\/\//i.test(m[13]);
      parts.push(
        <a key={k} href={m[13]} target={isExt ? '_blank' : undefined} rel={isExt ? 'noreferrer' : undefined} className="text-link">
          {renderInline(m[12], k)}
        </a>
      );
    }
    rest = rest.slice(m.index + m[0].length);
  }

  return parts;
}

export function parseBody(text = '') {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      const out = [];
      let para = [];
      let ulist = [];
      let olist = [];
      let quote = [];
      const flush = () => {
        if (para.length) out.push({ type: 'p', text: para.join(' ') });
        if (ulist.length) out.push({ type: 'ul', items: ulist });
        if (olist.length) out.push({ type: 'ol', items: olist });
        if (quote.length) out.push({ type: 'quote', text: quote.join(' ') });
        para = [];
        ulist = [];
        olist = [];
        quote = [];
      };
      for (const line of lines) {
        if (/^---+$/.test(line)) {
          flush();
          out.push({ type: 'hr' });
        } else if (/^###\s+/.test(line)) {
          flush();
          out.push({ type: 'h3', text: line.replace(/^###\s+/, '') });
        } else if (/^#{1,2}\s+/.test(line)) {
          flush();
          out.push({ type: 'h', text: line.replace(/^#{1,2}\s+/, '') });
        } else if (/^>\s+/.test(line)) {
          if (para.length || ulist.length || olist.length) flush();
          quote.push(line.replace(/^>\s+/, ''));
        } else if (/^[-*•]\s+/.test(line)) {
          if (para.length || olist.length || quote.length) flush();
          ulist.push(line.replace(/^[-*•]\s+/, ''));
        } else if (/^\d+\.\s+/.test(line)) {
          if (para.length || ulist.length || quote.length) flush();
          olist.push(line.replace(/^\d+\.\s+/, ''));
        } else {
          if (ulist.length || olist.length || quote.length) flush();
          para.push(line);
        }
      }
      flush();
      return out;
    });
}

/* ---------- Safe HTML renderer (for posts edited with the WYSIWYG editor) ---------- */
function looksLikeHtml(text) {
  return typeof text === 'string' && /^\s*<[a-z]/i.test(text);
}

function walkNode(node, key) {
  if (node.nodeType === 3) return node.textContent || null;
  if (node.nodeType !== 1) return null;

  const tag = node.tagName.toLowerCase();
  const c = Array.from(node.childNodes).map((child, i) => walkNode(child, `${key}.${i}`));

  if (tag === 'strong' || tag === 'b') return <strong key={key}>{c}</strong>;
  if (tag === 'em' || tag === 'i') return <em key={key}>{c}</em>;
  if (tag === 'u') return <u key={key}>{c}</u>;
  if (tag === 's' || tag === 'del' || tag === 'strike') return <s key={key}>{c}</s>;
  if (tag === 'mark') return <mark key={key} className="article__mark">{c}</mark>;
  if (tag === 'h1' || tag === 'h2') return <h2 key={key}>{c}</h2>;
  if (tag === 'h3' || tag === 'h4') return <h3 key={key} className="article__h3">{c}</h3>;
  if (tag === 'p' || tag === 'div') return <p key={key}>{c}</p>;
  if (tag === 'blockquote') return <blockquote key={key} className="article__quote">{c}</blockquote>;
  if (tag === 'ul') return <ul key={key} className="detail__list article__list">{c}</ul>;
  if (tag === 'ol') return <ol key={key} className="article__olist">{c}</ol>;
  if (tag === 'li') return <li key={key}>{c}</li>;
  if (tag === 'hr') return <hr key={key} className="article__hr" />;
  if (tag === 'br') return <br key={key} />;

  if (tag === 'a') {
    const href = node.getAttribute('href') || '';
    if (/^(https?:\/\/|\/|#)/.test(href)) {
      const isExt = /^https?:\/\//i.test(href);
      return <a key={key} href={href} className="text-link" target={isExt ? '_blank' : undefined} rel={isExt ? 'noreferrer' : undefined}>{c}</a>;
    }
    return <>{c}</>;
  }

  // Tables (TipTap output)
  if (tag === 'table') return <table key={key} className="article__table">{c}</table>;
  if (tag === 'thead') return <thead key={key}>{c}</thead>;
  if (tag === 'tbody') return <tbody key={key}>{c}</tbody>;
  if (tag === 'tr')    return <tr key={key}>{c}</tr>;
  if (tag === 'th')    return <th key={key}>{c}</th>;
  if (tag === 'td')    return <td key={key}>{c}</td>;

  // Subscript / Superscript
  if (tag === 'sub') return <sub key={key}>{c}</sub>;
  if (tag === 'sup') return <sup key={key}>{c}</sup>;

  if (tag === 'span' || tag === 'font') {
    const style = node.getAttribute('style') || '';
    const colorAttr = node.getAttribute('color'); // legacy <font color>
    const s = {};
    const cm = style.match(/\bcolor:\s*([^;]+)/i);
    const bm = style.match(/background-color:\s*([^;]+)/i);
    const fm = style.match(/font-size:\s*([^;]+)/i);
    if (cm) s.color = cm[1].trim();
    if (colorAttr && !cm) s.color = colorAttr;
    if (bm) s.backgroundColor = bm[1].trim();
    if (fm) s.fontSize = fm[1].trim();
    const cls = node.getAttribute('class') || '';
    if (Object.keys(s).length > 0) return <span key={key} style={s}>{c}</span>;
    if (cls) return <span key={key} className={cls}>{c}</span>;
    return <>{c}</>;
  }

  return <>{c}</>;
}

function SafeHtml({ html }) {
  const nodes = useMemo(() => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return Array.from(div.childNodes);
  }, [html]);
  return <>{nodes.map((n, i) => walkNode(n, `n${i}`))}</>;
}

export default function ArticleBody({ text, reveal = true }) {
  if (looksLikeHtml(text)) return <SafeHtml html={text} />;
  const cls = reveal ? 'reveal' : undefined;
  return parseBody(text).map((b, i) => {
    if (b.type === 'hr') return <hr key={i} className={`article__hr ${cls || ''}`} />;
    if (b.type === 'h') return <h2 key={i} className={cls}>{renderInline(b.text, `h2-${i}`)}</h2>;
    if (b.type === 'h3') return <h3 key={i} className={`article__h3 ${cls || ''}`}>{renderInline(b.text, `h3-${i}`)}</h3>;
    if (b.type === 'quote')
      return (
        <blockquote key={i} className={`article__quote ${cls || ''}`}>
          {renderInline(b.text, `q-${i}`)}
        </blockquote>
      );
    if (b.type === 'ul')
      return (
        <ul key={i} className={`detail__list article__list ${cls || ''}`}>
          {b.items.map((t, k) => (
            <li key={k}>
              <Icon name="check" size={16} /> <span>{renderInline(t, `ul-${i}-${k}`)}</span>
            </li>
          ))}
        </ul>
      );
    if (b.type === 'ol')
      return (
        <ol key={i} className={`article__olist ${cls || ''}`}>
          {b.items.map((t, k) => (
            <li key={k}>{renderInline(t, `ol-${i}-${k}`)}</li>
          ))}
        </ol>
      );
    return <p key={i} className={cls}>{renderInline(b.text, `p-${i}`)}</p>;
  });
}
