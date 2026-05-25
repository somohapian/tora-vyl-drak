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
    const nameMatch = fm.match(/^(name|word):\s*(.+)$/m);
    const summaryMatch = fm.match(/^(summary|definition):\s*([\s\S]*?)(?=\n[a-z_]+:|\n---|$)/m);
    const kahuTokMatch = fm.match(/^kahu_tok:\s*(.+)$/m);
    index.push({
      title: nameMatch ? strip(nameMatch[2]) : slug,
      kahu_tok: kahuTokMatch ? strip(kahuTokMatch[1]) : '',
      summary: summaryMatch ? strip(summaryMatch[2]) : '',
      url: `/${col}/${slug}`,
      collection: col,
    });
  }
}

const outPath = path.resolve('public/search-index.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(index), 'utf8');
console.log(`wrote search index with ${index.length} records`);
