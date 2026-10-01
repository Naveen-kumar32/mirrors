import { Icon } from './ui';

/*
 * Renders the simple text format staff write articles in:
 *   ## A heading
 *   - a bullet point
 *   blank line = new paragraph
 * Everything is rendered as plain text (no HTML), so it is safe.
 */
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
      let list = [];
      const flush = () => {
        if (para.length) out.push({ type: 'p', text: para.join(' ') });
        if (list.length) out.push({ type: 'ul', items: list });
        para = [];
        list = [];
      };
      for (const line of lines) {
        if (/^#{1,3}\s+/.test(line)) {
          flush();
          out.push({ type: 'h', text: line.replace(/^#{1,3}\s+/, '') });
        } else if (/^[-*•]\s+/.test(line)) {
          if (para.length) flush();
          list.push(line.replace(/^[-*•]\s+/, ''));
        } else {
          if (list.length) flush();
          para.push(line);
        }
      }
      flush();
      return out;
    });
}

export default function ArticleBody({ text, reveal = true }) {
  const cls = reveal ? 'reveal' : undefined;
  return parseBody(text).map((b, i) => {
    if (b.type === 'h') return <h2 key={i} className={cls}>{b.text}</h2>;
    if (b.type === 'ul')
      return (
        <ul key={i} className={`detail__list article__list ${cls || ''}`}>
          {b.items.map((t, k) => (
            <li key={k}>
              <Icon name="check" size={16} /> {t}
            </li>
          ))}
        </ul>
      );
    return <p key={i} className={cls}>{b.text}</p>;
  });
}
