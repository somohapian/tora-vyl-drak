#!/usr/bin/env node
// Build a static preview map for hover-card popovers.
// Output: public/previews.json — { "collection/slug": "first paragraph plain text" }.
// The hover-card client (public/hover-card.js) fetches this once when the
// pointer first lingers on an internal wiki-link.

import fs from 'node:fs';
import path from 'node:path';

const CONTENT = path.resolve('src/content');
const COLLECTIONS = ['people', 'places', 'events', 'eras', 'concepts', 'organizations', 'objects', 'language'];

// 1-2 sentences, capped — covers the common case without growing the JSON unboundedly.
const MAX_CHARS = 320;

function stripHtml(s) {
  // Drop tags; the bodies contain <a class="wiki-link">, <span class="kt">,
  // <span class="proper">. Inner text is what we want.
  return s.replace(/<[^>]+>/g, '');
}

function firstParagraph(body) {
  // Trim leading blank lines, then split on blank-line separators.
  const trimmed = body.replace(/^\s+/, '');
  const blocks = trimmed.split(/\n\s*\n/);
  for (const b of blocks) {
    const t = b.trim();
    // Skip headings, lists, blockquotes, raw html blocks etc — we want prose.
    if (!t) continue;
    if (/^#/.test(t)) continue;
    if (/^[-*+]\s/.test(t)) continue;
    if (/^>/.test(t)) continue;
    return t;
  }
  return '';
}

function toPreview(body) {
  const para = firstParagraph(body);
  if (!para) return '';
  // Collapse interior newlines (markdown soft-wrap) before stripping tags so
  // sentence boundaries stay clean.
  const flat = para.replace(/\s+/g, ' ').trim();
  const plain = stripHtml(flat).replace(/\s+/g, ' ').trim();
  if (plain.length <= MAX_CHARS) return plain;
  // Truncate at the last sentence boundary that fits, falling back to a hard cut + ellipsis.
  const slice = plain.slice(0, MAX_CHARS);
  const lastStop = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '));
  if (lastStop > MAX_CHARS * 0.5) return slice.slice(0, lastStop + 1);
  return slice.replace(/\s+\S*$/, '') + '…';
}

const previews = {};
let count = 0;
for (const col of COLLECTIONS) {
  const dir = path.join(CONTENT, col);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const slug = f.replace(/\.md$/, '');
    const full = path.join(dir, f);
    const text = fs.readFileSync(full, 'utf8');
    const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) {
      console.warn(`! no frontmatter: ${full}`);
      continue;
    }
    const body = m[2];
    const preview = toPreview(body);
    previews[`${col}/${slug}`] = preview;
    count++;
  }
}

const outPath = path.resolve('public/previews.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(previews), 'utf8');
console.log(`wrote preview map with ${count} entries`);
