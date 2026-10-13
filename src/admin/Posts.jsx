import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TipLink from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { TEAM, img } from '../data';
import { api, formatDate, useApi } from '../backend';
import ArticleBody, { parseBody } from '../components/ArticleBody';
import { Eyebrow, Icon } from '../components/ui';
import { RefreshButton, useAuth } from './AdminApp';

/* Blog covers are cropped to one shape (16:10, max 1600×1000) so every post looks the same on the website */
const COVER_W = 1600;
const COVER_H = 1000;
async function cropCover(file) {
  const bmp = await createImageBitmap(file);
  const target = COVER_W / COVER_H;
  let sw = bmp.width;
  let sh = bmp.height;
  if (sw / sh > target) sw = sh * target;
  else sh = sw / target;
  const sx = (bmp.width - sw) / 2;
  const sy = (bmp.height - sh) / 2;
  const scale = Math.min(1, COVER_W / sw);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  canvas.getContext('2d').drawImage(bmp, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' });
}

const DEFAULT_CATEGORIES = ['Skin conditions', 'Skincare', 'Hair & scalp', 'Treatments', 'Clinic news'];

const COLOR_PRESETS = [
  { label: 'Navy',    value: '#13335e' },
  { label: 'Teal',    value: '#2a9db0' },
  { label: 'Green',   value: '#23784a' },
  { label: 'Gold',    value: '#9a6700' },
  { label: 'Red',     value: '#b0413e' },
  { label: 'Slate',   value: '#64748b' },
  { label: 'Black',   value: '#000000' },
];
const HIGHLIGHT_PRESETS = [
  { label: 'Yellow', value: '#fef9c3' },
  { label: 'Green',  value: '#dcfce7' },
  { label: 'Blue',   value: '#dbeafe' },
  { label: 'Pink',   value: '#fce7f3' },
  { label: 'Red',    value: '#fee2e2' },
];

/* ---------- WYSIWYG editor helpers ---------- */
function looksLikeHtml(text) {
  return typeof text === 'string' && /^\s*<[a-z]/i.test(text);
}

function inlineToHtml(text) {
  return String(text || '')
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/~~([\s\S]+?)~~/g, '<s>$1</s>')
    .replace(/==([\s\S]+?)==/g, '<mark>$1</mark>')
    .replace(/\[color:([^\]]+)\]([\s\S]*?)\[\/color\]/g, '<span style="color:$1">$2</span>')
    .replace(/\[size:large\]([\s\S]*?)\[\/size\]/g, '<span style="font-size:1.15em">$1</span>')
    .replace(/\[size:small\]([\s\S]*?)\[\/size\]/g, '<span style="font-size:0.85em">$1</span>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2">$1</a>')
    .replace(/<u>([\s\S]*?)<\/u>/g, '<u>$1</u>');
}

function markdownToHtml(md) {
  if (!md?.trim()) return '<p><br></p>';
  const blocks = parseBody(md);
  const html = blocks.map((b) => {
    if (b.type === 'hr') return '<hr>';
    if (b.type === 'h') return `<h2>${inlineToHtml(b.text)}</h2>`;
    if (b.type === 'h3') return `<h3>${inlineToHtml(b.text)}</h3>`;
    if (b.type === 'quote') return `<blockquote>${inlineToHtml(b.text)}</blockquote>`;
    if (b.type === 'ul') return `<ul>${b.items.map((t) => `<li>${inlineToHtml(t)}</li>`).join('')}</ul>`;
    if (b.type === 'ol') return `<ol>${b.items.map((t) => `<li>${inlineToHtml(t)}</li>`).join('')}</ol>`;
    return `<p>${inlineToHtml(b.text)}</p>`;
  }).join('\n');
  return html || '<p><br></p>';
}

/* ── Toolbar helpers ──────────────────────────────────────────────── */
function TBtn({ onClick, active, title, children, disabled }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`atb__btn${active ? ' is-active' : ''}`}
      title={title}
      disabled={disabled}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

/* Toggle a text mark at cursor while preserving other active marks.
   Standard toggleMark can overwrite the stored-mark set; this preserves it. */
function useMark(editor, markName) {
  const isActive = editor.isActive(markName);
  const toggle = () => {
    const { state, view } = editor;
    const markType = state.schema.marks[markName];
    if (!markType) return;
    const { empty, $head } = state.selection;
    if (!empty) {
      editor.chain().toggleMark(markName).run();
      return;
    }
    const base = state.storedMarks ?? $head.marks();
    const removing = !!markType.isInSet(base);
    const next = removing ? markType.removeFromSet(base) : markType.create().addToSet(base);
    view.dispatch(state.tr.setStoredMarks(next));
  };
  return { isActive, toggle };
}

function ColorRow({ editor }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('text'); // 'text' | 'highlight'
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const currentColor = editor?.getAttributes('textStyle')?.color || null;
  const currentBg    = editor?.getAttributes('highlight')?.color || null;

  return (
    <div className="atb__color-wrap" ref={ref}>
      <button
        type="button"
        className="atb__btn atb__color-btn"
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        title="Text colour / Highlight"
      >
        <span className="atb__color-a" style={{ borderBottomColor: currentColor || '#13335e' }}>A</span>
        <span className="atb__color-caret">▾</span>
      </button>
      {open && (
        <div className="atb__color-panel">
          <div className="atb__color-tabs">
            <button type="button" className={tab === 'text' ? 'is-on' : ''} onMouseDown={(e) => { e.preventDefault(); setTab('text'); }}>Text</button>
            <button type="button" className={tab === 'highlight' ? 'is-on' : ''} onMouseDown={(e) => { e.preventDefault(); setTab('highlight'); }}>Highlight</button>
          </div>
          {tab === 'text' ? (
            <div className="atb__swatches">
              {COLOR_PRESETS.map((c) => (
                <button key={c.value} type="button"
                  className={`atb__swatch${currentColor === c.value ? ' is-on' : ''}`}
                  style={{ background: c.value }} title={c.label}
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c.value).run(); setOpen(false); }}
                />
              ))}
              <button type="button" className="atb__swatch atb__swatch--clear" title="Remove colour"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setOpen(false); }}>
                ✕
              </button>
            </div>
          ) : (
            <div className="atb__swatches">
              {HIGHLIGHT_PRESETS.map((c) => (
                <button key={c.value} type="button"
                  className={`atb__swatch${currentBg === c.value ? ' is-on' : ''}`}
                  style={{ background: c.value }} title={c.label}
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setHighlight({ color: c.value }).run(); setOpen(false); }}
                />
              ))}
              <button type="button" className="atb__swatch atb__swatch--clear" title="Remove highlight"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); setOpen(false); }}>
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


/* ── Toolbar ──────────────────────────────────────────────────────── */
function EditorToolbar({ editor }) {
  const [showTablePanel, setShowTablePanel] = useState(false);
  const [tRows, setTRows] = useState(3);
  const [tCols, setTCols] = useState(3);
  const tableWrapRef = useRef(null);

  // Close table panel when clicking outside the wrapper (button + panel)
  useEffect(() => {
    if (!showTablePanel) return;
    const close = (e) => {
      if (tableWrapRef.current && !tableWrapRef.current.contains(e.target)) {
        setShowTablePanel(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showTablePanel]);

  if (!editor) return <div className="atoolbar atoolbar--loading" />;

  const c = () => editor.chain().focus();
  const inTable = editor.isActive('table');

  const bold      = useMark(editor, 'bold');
  const italic    = useMark(editor, 'italic');
  const underline = useMark(editor, 'underline');
  const strike    = useMark(editor, 'strike');
  const sub       = useMark(editor, 'subscript');
  const sup       = useMark(editor, 'superscript');

  const handleLink = () => {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Enter URL (https://… or /page/…):', prev);
    if (url === null) return;
    if (!url.trim()) { c().unsetLink().run(); return; }
    c().setLink({ href: url.trim(), target: '_blank' }).run();
  };

  return (
    <div className="atoolbar" role="toolbar" aria-label="Article editor toolbar">

      {/* Block style */}
      <div className="atb__group">
        <select
          className="atb__select"
          value={
            editor.isActive('heading', { level: 2 }) ? 'h2' :
            editor.isActive('heading', { level: 3 }) ? 'h3' :
            editor.isActive('blockquote') ? 'bq' : 'p'
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'h2') c().setHeading({ level: 2 }).run();
            else if (v === 'h3') c().setHeading({ level: 3 }).run();
            else if (v === 'bq') c().setBlockquote().run();
            else c().setParagraph().run();
          }}
        >
          <option value="p">Normal</option>
          <option value="h2">Heading</option>
          <option value="h3">Subheading</option>
          <option value="bq">Quote</option>
        </select>
      </div>

      <span className="atb__sep" />

      {/* Inline marks */}
      <div className="atb__group">
        <TBtn onClick={bold.toggle}      active={bold.isActive}      title="Bold (Ctrl+B)"><strong>B</strong></TBtn>
        <TBtn onClick={italic.toggle}    active={italic.isActive}    title="Italic (Ctrl+I)"><em>I</em></TBtn>
        <TBtn onClick={underline.toggle} active={underline.isActive} title="Underline (Ctrl+U)"><u>U</u></TBtn>
        <TBtn onClick={strike.toggle}    active={strike.isActive}    title="Strikethrough"><s>S</s></TBtn>
        <TBtn onClick={sub.toggle}       active={sub.isActive}       title="Subscript">x<sub>2</sub></TBtn>
        <TBtn onClick={sup.toggle}       active={sup.isActive}       title="Superscript">x<sup>2</sup></TBtn>
        <TBtn
          title='Pull quote — centres text with curly quotes'
          onClick={() => {
            const { from, to, empty } = editor.state.selection;
            if (empty) {
              editor.chain().focus().insertContent('“”').setTextSelection(from + 1).run();
            } else {
              const text = editor.state.doc.textBetween(from, to, ' ');
              editor.chain().focus().deleteSelection().insertContent(`“${text}”`).run();
            }
          }}
        >
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 15, letterSpacing: '-0.05em', lineHeight: 1 }}>&ldquo;&rdquo;</span>
        </TBtn>
      </div>

      <span className="atb__sep" />

      {/* Colour */}
      <div className="atb__group">
        <ColorRow editor={editor} />
      </div>

      <span className="atb__sep" />

      {/* Alignment */}
      <div className="atb__group">
        <TBtn onClick={() => c().setTextAlign('left').run()}    active={editor.isActive({ textAlign: 'left' })}    title="Align left">
          <svg width="14" height="14" viewBox="0 0 14 14"><line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.5"/><line x1="1" y1="7" x2="9" y2="7" stroke="currentColor" strokeWidth="1.5"/><line x1="1" y1="11" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>
        </TBtn>
        <TBtn onClick={() => c().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center">
          <svg width="14" height="14" viewBox="0 0 14 14"><line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.5"/><line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>
        </TBtn>
        <TBtn onClick={() => c().setTextAlign('right').run()}  active={editor.isActive({ textAlign: 'right' })}  title="Align right">
          <svg width="14" height="14" viewBox="0 0 14 14"><line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.5"/><line x1="5" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5"/><line x1="3" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>
        </TBtn>
      </div>

      <span className="atb__sep" />

      {/* Lists */}
      <div className="atb__group">
        <TBtn onClick={() => c().toggleBulletList().run()}  active={editor.isActive('bulletList')}  title="Bullet list">
          <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="2" cy="4" r="1.2" fill="currentColor"/><line x1="5" y1="4" x2="13" y2="4" stroke="currentColor" strokeWidth="1.5"/><circle cx="2" cy="8" r="1.2" fill="currentColor"/><line x1="5" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5"/><circle cx="2" cy="12" r="1.2" fill="currentColor"/><line x1="5" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="1.5"/></svg>
        </TBtn>
        <TBtn onClick={() => c().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
          <svg width="14" height="14" viewBox="0 0 14 14"><text x="0" y="5" fontSize="5" fill="currentColor">1.</text><line x1="5" y1="4" x2="13" y2="4" stroke="currentColor" strokeWidth="1.5"/><text x="0" y="9" fontSize="5" fill="currentColor">2.</text><line x1="5" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5"/><text x="0" y="13" fontSize="5" fill="currentColor">3.</text><line x1="5" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="1.5"/></svg>
        </TBtn>
        <TBtn onClick={() => c().liftListItem('listItem').run()}  title="Decrease indent" disabled={!editor.can().liftListItem('listItem')}>
          <svg width="14" height="14" viewBox="0 0 14 14"><polyline points="6,4 2,7 6,10" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="5" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5"/></svg>
        </TBtn>
        <TBtn onClick={() => c().sinkListItem('listItem').run()}  title="Increase indent" disabled={!editor.can().sinkListItem('listItem')}>
          <svg width="14" height="14" viewBox="0 0 14 14"><polyline points="8,4 12,7 8,10" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="1" y1="7" x2="9" y2="7" stroke="currentColor" strokeWidth="1.5"/></svg>
        </TBtn>
      </div>

      <span className="atb__sep" />

      {/* Blocks */}
      <div className="atb__group">
        <TBtn onClick={() => c().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="2" width="3" height="10" rx="1" fill="currentColor" opacity=".35"/><text x="5" y="8" fontSize="6" fill="currentColor" fontStyle="italic">"</text></svg>
        </TBtn>
        <TBtn onClick={() => c().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
          <svg width="14" height="14" viewBox="0 0 14 14"><polyline points="4,4 1,7 4,10" stroke="currentColor" strokeWidth="1.5" fill="none"/><polyline points="10,4 13,7 10,10" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
        </TBtn>
        <TBtn onClick={handleLink} active={editor.isActive('link')} title="Insert / edit link">
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M5.5 8.5a3.5 3.5 0 0 0 5 0l1.5-1.5a3.5 3.5 0 0 0-5-5L6 3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/><path d="M8.5 5.5a3.5 3.5 0 0 0-5 0L2 7a3.5 3.5 0 0 0 5 5L8 11" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/></svg>
        </TBtn>
        <TBtn onClick={() => c().setHorizontalRule().run()} title="Horizontal rule">—</TBtn>
      </div>

      <span className="atb__sep" />

      {/* Table */}
      <div className="atb__group atb__table-wrap" ref={tableWrapRef} style={{ position: 'relative' }}>
        <TBtn onClick={() => setShowTablePanel((o) => !o)} active={showTablePanel} title="Insert table">
          <svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" fill="none"/><line x1="1" y1="5" x2="13" y2="5" stroke="currentColor" strokeWidth="1.3"/><line x1="1" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="1.3"/><line x1="5" y1="1" x2="5" y2="13" stroke="currentColor" strokeWidth="1.3"/><line x1="9" y1="1" x2="9" y2="13" stroke="currentColor" strokeWidth="1.3"/></svg>
        </TBtn>
        {showTablePanel && (
          <div className="table-size-panel">
            <p className="table-size-panel__title">Insert table</p>
            <div className="table-size-panel__fields">
              <label>
                <span>Rows</span>
                <input type="number" min="1" max="20" value={tRows}
                  onChange={(e) => setTRows(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                />
              </label>
              <label>
                <span>Columns</span>
                <input type="number" min="1" max="10" value={tCols}
                  onChange={(e) => setTCols(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                />
              </label>
            </div>
            <button
              type="button"
              className="table-size-panel__btn"
              onMouseDown={(e) => {
                e.preventDefault();
                c().insertTable({ rows: tRows, cols: tCols, withHeaderRow: true }).run();
                setShowTablePanel(false);
              }}
            >
              Insert {tRows} × {tCols} table
            </button>
          </div>
        )}
      </div>

      {/* Table context ops — only shown when cursor is inside a table */}
      {inTable && (
        <>
          <span className="atb__sep" />
          <div className="atb__group atb__group--table-ops">
            <TBtn onClick={() => c().addRowAfter().run()}      title="Add row below">+row↓</TBtn>
            <TBtn onClick={() => c().addColumnAfter().run()}   title="Add column right">+col→</TBtn>
            <TBtn onClick={() => c().deleteRow().run()}        title="Delete row">-row</TBtn>
            <TBtn onClick={() => c().deleteColumn().run()}     title="Delete col">-col</TBtn>
            <TBtn onClick={() => c().deleteTable().run()}      title="Delete table" disabled={false}>🗑</TBtn>
          </div>
        </>
      )}

    </div>
  );
}

/* ── TipTap WYSIWYG editor ────────────────────────────────────────── */
const RichBodyEditor = forwardRef(function RichBodyEditor({ initialValue, onChange }, outerRef) {
  const populated = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      TipLink.configure({ openOnClick: false }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Subscript,
      Superscript,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '',
    editorProps: {
      attributes: { class: 'rich-prose', spellcheck: 'true' },
    },
    onUpdate({ editor: e }) {
      onChange(e.getHTML());
    },
  });

  // Populate with initial content once (handles async API load)
  useEffect(() => {
    if (!editor || !initialValue?.trim() || populated.current) return;
    populated.current = true;
    const html = looksLikeHtml(initialValue) ? initialValue : markdownToHtml(initialValue);
    editor.commands.setContent(html || '', false);
  }, [editor, initialValue]);

  useImperativeHandle(outerRef, () => ({
    setHTML(html) {
      if (!editor) return;
      populated.current = true;
      editor.commands.setContent(html || '', false);
    },
  }), [editor]);

  return (
    <div className="rich-editor-outer">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="rich-editor-content" />
    </div>
  );
});

function estimateReadTime(body = '') {
  const words = String(body || '').trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

/* ---------- Full Whole-Blog Preview Modal ---------- */
function FullBlogPreviewModal({ post, coverUrl, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const author = TEAM.find((t) => t.name === post.author) || TEAM[0];
  const pubDate = formatDate(post.publishedAt || new Date().toISOString());
  const readTime = post.readTime || estimateReadTime(post.body);
  const heroCover = coverUrl || post.cover || '';

  return createPortal(
    <div className="bprev-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bprev" role="dialog" aria-modal="true" aria-label="Full blog post preview">
        <header className="bprev__bar">
          <div className="bprev__bar-left">
            <span className="badge badge--published">Live Full-Page Preview</span>
            <strong>{post.title || 'Untitled blog post'}</strong>
          </div>
          <button type="button" className="btn btn--navy btn--sm" onClick={onClose}>
            ← Back to editor
          </button>
        </header>

        <div className="bprev__scroll">
          {/* Exact replica of the public BlogPostPage hero + layout */}
          <section className="page-head page-head--has-image">
            <div className="container page-head__grid">
              <div>
                <nav className="crumbs" aria-label="Breadcrumb">
                  <span>Home</span>
                  <span aria-hidden="true">/</span>
                  <span>Blog</span>
                  <span aria-hidden="true">/</span>
                  <span aria-current="page">{post.title || 'Untitled post'}</span>
                </nav>
                <Eyebrow>{post.category || 'Category'}</Eyebrow>
                <h1 className="page-head__title">{post.title || 'Your blog title will appear here'}</h1>
                <p className="page-head__lead">
                  {pubDate} · {readTime} · By {post.author || author?.name}
                </p>
              </div>
              <figure className="page-head__media page-head__media--cover">
                {heroCover ? (
                  <img src={heroCover} alt={post.title || 'Blog cover'} />
                ) : (
                  <div className="bprev__nocover">Cover image preview</div>
                )}
              </figure>
            </div>
          </section>

          <section className="section">
            <div className="container article">
              <article className="article__body">
                <p className="article__lead">{post.excerpt || 'Your short summary / lead paragraph will appear here.'}</p>
                {post.body?.trim() ? (
                  <ArticleBody text={post.body} reveal={false} />
                ) : (
                  <p className="state">Start writing your article to see the body content here.</p>
                )}
                <p className="article__note">
                  This article is general information, not medical advice. Please see a dermatologist about your own skin.
                </p>
              </article>

              <aside className="article__side">
                <div className="article__card">
                  {author && <img src={img(author.image, 480)} alt={`Portrait of ${author.name}`} />}
                  <p className="article__by">Written by</p>
                  <strong>{post.author || author?.name}</strong>
                  {author && <span>{author.role}</span>}
                </div>
                <div className="article__card article__card--navy">
                  <strong>Need advice for your skin?</strong>
                  <span>Book a consultation with our dermatologist.</span>
                  <button type="button" className="btn btn--white" onClick={onClose}>
                    Book appointment <Icon name="arrow" size={18} />
                  </button>
                </div>
              </aside>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------- All posts ---------- */
export function PostsList() {
  const { user, onAuthError } = useAuth();
  const { data, error, loading, refreshing, reload } = useApi('/admin/posts');
  const { state } = useLocation();
  const [flash, setFlash] = useState(state?.flash || '');
  const [previewPost, setPreviewPost] = useState(null);

  useEffect(() => {
    if (error) onAuthError(error);
  }, [error, onAuthError]);

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.title}”? This cannot be undone.`)) return;
    try {
      await api(`/admin/posts/${p.id}`, { method: 'DELETE' });
      setFlash('Post deleted.');
      reload();
    } catch (err) {
      onAuthError(err);
      window.alert(err.message);
    }
  };

  const canEdit = (p) => user.role === 'admin' || p.createdBy === user.id;

  return (
    <section className="apage">
      <div className="apage__topbar no-print">
        <RefreshButton onRefresh={reload} refreshing={refreshing} />
      </div>
      <header className="apage__head">
        <div>
          <h1>Blog posts</h1>
          <p>Published posts appear on the website’s Blog page straight away.</p>
        </div>
        <div className="apage__actions">
          <Link to="/admin/posts/new" className="btn btn--navy">
            <Icon name="plus" size={18} /> Write a post
          </Link>
        </div>
      </header>

      {flash && (
        <p className="aflash" role="status">
          {flash}
          <button onClick={() => setFlash('')} aria-label="Dismiss">
            ×
          </button>
        </p>
      )}
      {loading && !data && <p className="state">Loading…</p>}
      {error && <p className="bf__fail">{error.message}</p>}
      {data && !data.length && <p className="state">No posts yet. Write the first one!</p>}

      <ul className="alist">
        {data?.map((p) => (
          <li key={p.id} className="alist__row">
            <img src={p.cover} alt="" className="alist__thumb" />
            <div className="alist__main">
              <strong>{p.title}</strong>
              <span>
                <span className={`badge badge--${p.status}`}>{p.status === 'draft' ? 'Draft' : 'Published'}</span>
                {p.category} · {p.author} · {formatDate(p.publishedAt || p.updatedAt)}
              </span>
            </div>
            <div className="alist__actions">
              <button
                type="button"
                className="abtn"
                onClick={async () => {
                  try {
                    const full = await api(`/admin/posts/${p.id}`);
                    setPreviewPost(full);
                  } catch (err) {
                    window.alert(err.message);
                  }
                }}
              >
                Preview blog
              </button>
              {p.status === 'published' && (
                <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="abtn">
                  Live page
                </a>
              )}
              {canEdit(p) && (
                <>
                  <Link to={`/admin/posts/${p.id}`} className="abtn abtn--primary">
                    Edit
                  </Link>
                  <button className="abtn abtn--danger" onClick={() => remove(p)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      {previewPost && (
        <FullBlogPreviewModal
          post={previewPost}
          coverUrl={previewPost.cover}
          onClose={() => setPreviewPost(null)}
        />
      )}
    </section>
  );
}

/* ---------- Write / edit a post ---------- */
const EMPTY = { title: '', excerpt: '', category: '', author: '', body: '' };

export function PostEditor() {
  const { id } = useParams();
  const { user, onAuthError } = useAuth();
  const navigate = useNavigate();
  const existing = useApi(id ? `/admin/posts/${id}` : null);
  const all = useApi('/admin/posts');
  const [f, setF] = useState({ ...EMPTY, author: user.name });
  const [cover, setCover] = useState(null); // File
  const [coverUrl, setCoverUrl] = useState('');
  const [fullPreview, setFullPreview] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const bodyEditorRef = useRef(null);

  useEffect(() => {
    const p = existing.data;
    if (!p) return;
    setF({ title: p.title, excerpt: p.excerpt, category: p.category, author: p.author, body: p.body });
    setCoverUrl(p.cover);
    if (bodyEditorRef.current) {
      const html = looksLikeHtml(p.body) ? p.body : markdownToHtml(p.body);
      bodyEditorRef.current.setHTML(html || '');
    }
  }, [existing.data]);

  useEffect(() => {
    if (existing.error) onAuthError(existing.error);
  }, [existing.error, onAuthError]);

  // Show the chosen image before it is uploaded
  useEffect(() => {
    if (!cover) return;
    const url = URL.createObjectURL(cover);
    setCoverUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);

  const categories = useMemo(
    () => [...new Set([...DEFAULT_CATEGORIES, ...(all.data || []).map((p) => p.category)])],
    [all.data]
  );

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const pickCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError('Cover must be a JPG, PNG or WebP image.');
    if (file.size > 20 * 1024 * 1024) return setError('That image is too large — please choose one under 20 MB.');
    setError('');
    setCover(file);
  };

  const save = async (status) => {
    if (!id && !cover) return setError('Please add a cover image.');
    setBusy(true);
    setError('');
    const form = new FormData();
    Object.entries(f).forEach(([k, v]) => form.append(k, v));
    form.append('status', status);
    if (cover) form.append('cover', await cropCover(cover));
    try {
      await api(id ? `/admin/posts/${id}` : '/admin/posts', { method: id ? 'PUT' : 'POST', form });
      navigate('/admin/posts', {
        state: { flash: status === 'draft' ? 'Draft saved.' : 'Post published — it is now live on the website.' },
      });
    } catch (err) {
      onAuthError(err);
      setError(err.message);
      setBusy(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (id && existing.loading && !existing.data) return <p className="state">Loading…</p>;
  if (id && existing.error) return <p className="bf__fail apage">{existing.error.message}</p>;

  const isDraft = !id || existing.data?.status === 'draft';

  return (
    <section className="apage">
      {id && (
        <div className="apage__topbar no-print">
          <RefreshButton onRefresh={existing.reload} refreshing={existing.refreshing} />
        </div>
      )}
      <header className="apage__head">
        <div>
          <Link to="/admin/posts" className="aback">
            ← All posts
          </Link>
          <h1>{id ? 'Edit post' : 'Write a post'}</h1>
        </div>
        <div className="apage__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setFullPreview(true)}
            title="Preview the entire blog page including cover, title, sidebar and article"
          >
            👁 Preview full blog
          </button>
        </div>
      </header>

      <form className="aform" onSubmit={(e) => (e.preventDefault(), save('published'))}>
        {error && <p className="bf__fail">{error}</p>}

        <label className="bf__field">
          <span className="bf__label">Title</span>
          <input value={f.title} onChange={set('title')} maxLength={160} required placeholder="e.g. How to care for your skin in summer" />
        </label>
        <label className="bf__field">
          <span className="bf__label">Short summary</span>
          <textarea rows={2} value={f.excerpt} onChange={set('excerpt')} maxLength={300} required placeholder="One or two sentences shown on the blog cards." />
        </label>
        <div className="bf__row">
          <label className="bf__field">
            <span className="bf__label">Category</span>
            <input list="post-categories" value={f.category} onChange={set('category')} maxLength={40} required placeholder="Choose or type a category" />
            <datalist id="post-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="bf__field">
            <span className="bf__label">Author</span>
            <input list="post-authors" value={f.author} onChange={set('author')} maxLength={80} required />
            <datalist id="post-authors">
              {TEAM.map((t) => (
                <option key={t.name} value={t.name} />
              ))}
            </datalist>
          </label>
        </div>

        <div className="bf__field">
          <span className="bf__label">Cover image {id && <em>(choose a new one to replace it)</em>}</span>
          <label className="acover">
            {coverUrl ? <img src={coverUrl} alt="Cover preview" /> : <span>Click to choose an image (JPG, PNG or WebP, up to 5 MB)</span>}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickCover} />
          </label>
        </div>

        <div className="bf__field">
          <span className="bf__label">Article body</span>
          <RichBodyEditor
            ref={bodyEditorRef}
            initialValue={f.body}
            onChange={(html) => setF((x) => ({ ...x, body: html }))}
          />
          <span className="abody__help">
            The editor shows exactly how your article will look on the blog. Use the toolbar to format text, insert tables, links and more.
          </span>
        </div>

        <div className="aform__actions">
          <button type="submit" className="btn btn--navy" disabled={busy}>
            {busy ? 'Saving…' : id && !isDraft ? 'Save changes' : 'Publish'}
          </button>
          <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => save('draft')}>
            {isDraft ? 'Save as draft' : 'Unpublish (move to drafts)'}
          </button>
        </div>
      </form>

      {fullPreview && (
        <FullBlogPreviewModal
          post={f}
          coverUrl={coverUrl}
          onClose={() => setFullPreview(false)}
        />
      )}
    </section>
  );
}
