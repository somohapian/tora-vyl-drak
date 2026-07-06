#!/usr/bin/env node
// Build a small client-side search index over all entries.
// Output: public/search-index.json. Each record holds the minimum needed
// to filter and render results: title, kahu-tok, summary, url, collection.

import fs from 'node:fs';
import path from 'node:path';

const CONTENT = path.resolve('src/content');
const COLLECTIONS = ['people', 'places', 'events', 'eras', 'concepts', 'organizations', 'objects', 'language'];

function strip(s) {
  if (!s) return '';
  return s.trim().replace(/^['"]|['"]$/g, '');
}

// Extract a scalar frontmatter value, resolving YAML block scalars (>- , | etc.)
// by folding the indented continuation lines. Mirrors see-also.mjs.
function fmValue(fm, keys) {
  const re = new RegExp(`^(?:${keys.join('|')}):[ \\t]*(.*)$`, 'm');
  const m = fm.match(re);
  if (!m) return '';
  let v = m[1].trim();
  if (v === '' || /^[>|][+-]?$/.test(v)) {
    const rest = fm.slice(m.index + m[0].length).split('\n').slice(1);
    const lines = [];
    for (const line of rest) {
      if (/^\s{2,}\S/.test(line)) lines.push(line.trim());
      else if (line.trim() === '') continue;
      else break;
    }
    v = lines.join(' ');
  }
  return strip(v);
}

const index = [];
for (const col of COLLECTIONS) {
  const dir = path.join(CONTENT, col);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const slug = f.replace(/\.md$/, '');
    const full = path.join(dir, f);
    const text = fs.readFileSync(full, 'utf8');
    const m = text.match(/^---\n([\s\S]*?)\n---/);
    if (!m) continue;
    const fm = m[1];
    index.push({
      title: fmValue(fm, ['name', 'word']) || slug,
      kahu_tok: fmValue(fm, ['kahu_tok']),
      summary: fmValue(fm, ['summary']) || fmValue(fm, ['definition']),
      url: `/${col}/${slug}`,
      collection: col,
    });
  }
}

const outPath = path.resolve('public/search-index.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(index), 'utf8');
console.log(`wrote search index with ${index.length} records`);
