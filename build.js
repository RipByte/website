#!/usr/bin/env node
// build.js  —  node build.js
//
// Scans blogs/*.md, generates a styled blogs/*.html for each,
// then rebuilds blogs/index.json sorted newest-first.
//
// Frontmatter (optional, must be at very top of .md file):
//   ---
//   title: My Post Title
//   date:  2026-03-22
//   tags:  Security:red, Linux:green, Python:blue
//   ---
//
// Without frontmatter the title is derived from the filename and the
// date from the file's last-modified time.
//
// Existing hand-written .html files that have no matching .md source
// are also picked up and added to index.json automatically.

'use strict';

const fs   = require('fs');
const path = require('path');

const BLOGS_DIR  = path.join(__dirname, 'blogs');
const INDEX_FILE = path.join(BLOGS_DIR, 'index.json');

// ─── Frontmatter ────────────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const FM = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
  const m  = raw.match(FM);
  if (!m) return { meta: {}, body: raw };

  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+)\s*:\s*(.+)/);
    if (kv) meta[kv[1].trim()] = kv[2].trim();
  }
  return { meta, body: raw.slice(m[0].length) };
}

// ─── Minimal Markdown → HTML ─────────────────────────────────────────────────

function escHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMarkdown(s) {
  return s
    // strip image syntax entirely (images not supported)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => `<a href="${escHtml(href)}">${escHtml(text)}</a>`)
    .replace(/`([^`]+)`/g,              (_, c)           => `<code class="inline-code">${escHtml(c)}</code>`)
    .replace(/\*\*([^*]+)\*\*/g,        (_, t)           => `<strong>${escHtml(t)}</strong>`)
    .replace(/\*([^*]+)\*/g,            (_, t)           => `<em>${escHtml(t)}</em>`)
    .replace(/~~([^~]+)~~/g,            (_, t)           => `<del>${escHtml(t)}</del>`);
}

function mdToHtml(md) {
  const lines  = md.split(/\r?\n/);
  const out    = [];
  let i        = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── fenced code block
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const code = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++; // closing ```
      out.push(`<pre class="code-block"><code class="lang-${escHtml(lang)}">${escHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    // ── headings
    const hm = line.match(/^(#{1,6})\s+(.+)/);
    if (hm) {
      const lvl = hm[1].length;
      out.push(`<h${lvl}>${inlineMarkdown(hm[2])}</h${lvl}>`);
      i++; continue;
    }

    // ── blockquote
    if (/^>\s?/.test(line)) {
      const qlines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        qlines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<blockquote class="post-quote">${inlineMarkdown(qlines.join(' '))}</blockquote>`);
      continue;
    }

    // ── unordered list
    if (/^[-*+]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(`  <li>${inlineMarkdown(lines[i].replace(/^[-*+]\s/, ''))}</li>`);
        i++;
      }
      out.push(`<ul class="post-list">\n${items.join('\n')}\n</ul>`);
      continue;
    }

    // ── ordered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(`  <li>${inlineMarkdown(lines[i].replace(/^\d+\.\s/, ''))}</li>`);
        i++;
      }
      out.push(`<ol class="post-list">\n${items.join('\n')}\n</ol>`);
      continue;
    }

    // ── GFM table  (line starts and ends with |, or contains | with a separator row next)
    if (/^\|/.test(line) && i + 1 < lines.length && /^[\s|:-]+$/.test(lines[i + 1])) {
      const headers = line.split('|').slice(1, -1).map(c => c.trim());
      i += 2; // skip header + separator
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        rows.push(lines[i].split('|').slice(1, -1).map(c => c.trim()));
        i++;
      }
      const thead = `<thead><tr>${headers.map(h => `<th>${inlineMarkdown(h)}</th>`).join('')}</tr></thead>`;
      const tbody = rows.length
        ? `<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inlineMarkdown(c)}</td>`).join('')}</tr>`).join('')}</tbody>`
        : '';
      out.push(`<div class="table-wrap"><table class="post-table">${thead}${tbody}</table></div>`);
      continue;
    }

    // ── horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line)) {
      out.push('<hr>');
      i++; continue;
    }

    // ── blank line separates paragraphs
    if (line.trim() === '') {
      i++; continue;
    }

    // ── paragraph (gather consecutive non-special lines)
    const plines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,6}\s|```|[-*+]\s|\d+\.\s|>\s?|[-*_]{3,}\s*$|\|)/.test(lines[i])
    ) {
      plines.push(lines[i]);
      i++;
    }
    if (plines.length) {
      out.push(`<p>${inlineMarkdown(plines.join(' '))}</p>`);
    }
  }

  return out.join('\n\n');
}

// ─── Tag color palette ──────────────────────────────────────────────────────

const TAG_COLORS = {
  red:    { bg: 'rgba(255,60,60,0.14)',   border: 'rgba(255,60,60,0.35)',   text: '#ff8080' },
  blue:   { bg: 'rgba(60,130,255,0.14)',  border: 'rgba(60,130,255,0.35)',  text: '#7ab4ff' },
  green:  { bg: 'rgba(60,210,100,0.14)',  border: 'rgba(60,210,100,0.35)',  text: '#6fda88' },
  yellow: { bg: 'rgba(255,210,50,0.14)',  border: 'rgba(255,210,50,0.35)',  text: '#ffd84a' },
  purple: { bg: 'rgba(160,80,255,0.14)',  border: 'rgba(160,80,255,0.35)',  text: '#c490ff' },
  orange: { bg: 'rgba(255,140,40,0.14)',  border: 'rgba(255,140,40,0.35)',  text: '#ffaa55' },
  cyan:   { bg: 'rgba(40,210,220,0.14)',  border: 'rgba(40,210,220,0.35)',  text: '#4dd8e0' },
  pink:   { bg: 'rgba(255,80,180,0.14)',  border: 'rgba(255,80,180,0.35)',  text: '#ff80cc' },
};
const TAG_DEFAULT = { bg: 'rgba(255,80,80,0.14)', border: 'rgba(255,80,80,0.30)', text: '#ff9090' };

// Parse "TagName:color" → { name, color } or "TagName" → { name, color: 'red' }
function parseTag(raw) {
  const idx = raw.lastIndexOf(':');
  if (idx > 0) {
    const name  = raw.slice(0, idx).trim();
    const color = raw.slice(idx + 1).trim().toLowerCase();
    return { name, color: TAG_COLORS[color] ? color : 'red' };
  }
  return { name: raw.trim(), color: 'red' };
}

function tagToHtml(tag) {
  const c = TAG_COLORS[tag.color] || TAG_DEFAULT;
  return `<span class="post-tag" style="background:${c.bg};border-color:${c.border};color:${c.text}">${escHtml(tag.name)}</span>`;
}

// ─── HTML template ───────────────────────────────────────────────────────────

function buildHtml(title, date, tags, bodyHtml) {
  const tagHtml = tags.length
    ? `<div class="post-tags">${tags.map(tagToHtml).join('')}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="date" content="${escHtml(date)}">
  <meta name="post-tags" content="${escHtml(tags.map(t => t.name + ':' + t.color).join(','))}">
  <title>${escHtml(title)}</title>
  <style>
    :root {
      --bg:     #070708;
      --panel:  rgba(18, 12, 14, 0.75);
      --line:   rgba(255, 100, 100, 0.2);
      --text:   #f0eaea;
      --muted:  #cabbbb;
      --accent: #ff5050;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      padding: 36px 18px;
      font-family: Arial, sans-serif;
      color: var(--text);
      background: radial-gradient(circle at 20% 12%, rgba(255,60,60,0.22), transparent 45%), var(--bg);
    }
    main {
      max-width: 760px;
      margin: 0 auto;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 32px;
      backdrop-filter: blur(10px);
    }
    h1 { color: #ff9090; margin-bottom: 8px; font-size: 28px; }
    h2 { color: #ff7070; margin: 28px 0 10px; font-size: 20px; }
    h3 { color: #ff8080; margin: 20px 0 8px;  font-size: 16px; }
    h4, h5, h6 { color: #ff9090; margin: 14px 0 6px; font-size: 14px; }
    .meta { color: var(--muted); font-size: 14px; margin-bottom: 8px; }
    .post-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 22px; }
    .post-tag {
      font-size: 11px; padding: 2px 9px; border-radius: 99px;
      border: 1px solid;
    }
    p { color: #e8dede; line-height: 1.7; margin-bottom: 14px; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    strong { color: #f8e0e0; }
    em     { color: #e8d0d0; font-style: italic; }
    .code-block {
      background: rgba(0,0,0,0.5);
      border: 1px solid rgba(255,80,80,0.15);
      border-radius: 8px; padding: 16px;
      overflow-x: auto; margin-bottom: 16px;
    }
    .code-block code {
      font-family: 'Courier New', monospace;
      font-size: 13px; color: #f0e0e0; white-space: pre;
    }
    .inline-code {
      font-family: 'Courier New', monospace; font-size: 13px;
      background: rgba(255,80,80,0.1); color: #ffaaaa;
      padding: 1px 5px; border-radius: 4px;
    }
    .post-list { color: #e8dede; line-height: 1.7; margin-bottom: 14px; padding-left: 22px; }
    .post-list li { margin-bottom: 4px; }
    .post-quote {
      border-left: 3px solid var(--accent);
      padding: 10px 16px; margin-bottom: 14px;
      background: rgba(255,80,80,0.06);
      border-radius: 0 8px 8px 0;
      color: var(--muted); font-style: italic;
    }
    hr { border: none; border-top: 1px solid var(--line); margin: 24px 0; }
    .table-wrap { overflow-x: auto; margin-bottom: 16px; }
    .post-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .post-table th, .post-table td {
      padding: 8px 14px;
      border: 1px solid rgba(255,80,80,0.18);
      color: #e8dede;
      text-align: left;
    }
    .post-table th {
      background: rgba(255,80,80,0.1);
      color: #ff9090;
      font-weight: 600;
    }
    .post-table tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
    .back-link { display: inline-block; margin-top: 32px; font-size: 14px; }
  </style>
</head>
<body>
  <main>
    <h1>${escHtml(title)}</h1>
    <p class="meta">Published: ${escHtml(date)}</p>
    ${tagHtml}

    ${bodyHtml}

    <a class="back-link" href="../index.html">&#8592; Back to portfolio</a>
  </main>
</body>
</html>`;
}

// ─── Slug / title helpers ────────────────────────────────────────────────────

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function titleFromFilename(filename) {
  return filename
    .replace(/\.md$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function mtimeDate(filePath) {
  try {
    return fs.statSync(filePath).mtime.toISOString().split('T')[0];
  } catch (_) {
    return new Date().toISOString().split('T')[0];
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

const mdFiles = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));

if (!mdFiles.length) {
  console.log('No .md files found in blogs/ — nothing to generate.');
} else {
  for (const mdFile of mdFiles) {
    const mdPath   = path.join(BLOGS_DIR, mdFile);
    const raw      = fs.readFileSync(mdPath, 'utf8');
    const { meta, body } = parseFrontmatter(raw);

    const title    = meta.title || titleFromFilename(mdFile);
    const date     = meta.date  || mtimeDate(mdPath);
    const tags     = meta.tags  ? meta.tags.split(',').map(t => t.trim()).filter(Boolean).map(parseTag) : [];
    const htmlFile = meta.file  || `${slugify(mdFile.replace(/\.md$/, ''))}.html`;
    const htmlPath = path.join(BLOGS_DIR, htmlFile);

    const bodyHtml = mdToHtml(body);
    const fullHtml = buildHtml(title, date, tags, bodyHtml);

    fs.writeFileSync(htmlPath, fullHtml, 'utf8');
    console.log(`  [built]  ${mdFile}  →  ${htmlFile}`);
  }
}

// ─── Rebuild index.json from all .html files ─────────────────────────────────

const htmlFiles = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.html'));
const posts     = [];

for (const htmlFile of htmlFiles) {
  const htmlPath = path.join(BLOGS_DIR, htmlFile);
  const html     = fs.readFileSync(htmlPath, 'utf8');

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title      = titleMatch ? titleMatch[1].trim() : htmlFile.replace(/\.html$/, '');

  const metaMatch  = html.match(/<meta[^>]+name=["']date["'][^>]+content=["']([^"']+)["']/i)
                  || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']date["']/i);
  const dateInline = html.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  const date       = metaMatch   ? metaMatch[1].trim()
                   : dateInline  ? dateInline[1]
                   : mtimeDate(htmlPath);

  const tagsMatch = html.match(/<meta[^>]+name=["']post-tags["'][^>]+content=["']([^"']*)["']/i);
  const tags      = tagsMatch && tagsMatch[1]
    ? tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean).map(parseTag)
    : [];

  posts.push({ title, file: htmlFile, date, tags });
}

posts.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
fs.writeFileSync(INDEX_FILE, JSON.stringify({ posts }, null, 2), 'utf8');
console.log(`\nDone — index.json updated with ${posts.length} post(s).`);
