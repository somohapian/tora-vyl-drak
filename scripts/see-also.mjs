#!/usr/bin/env node
// Generate see-also relationships for every entry. For each entry, finds
// the 3-5 most-strongly-related siblings based on bidirectional cross-link
// graph weight (out-links + in-links). Writes a single manifest at
// src/data/see-also.json that EntryLayout reads to render the block.

import fs from 'node:fs';
import path from 'node:path';

const CONTENT = path.resolve('src/content');
const COLLECTIONS = ['people', 'places', 'events', 'eras', 'concepts', 'organizations', 'objects', 'language'];

function readEntries() {
  const out = [];
  for (const col of COLLECTIONS) {
    const dir = path.join(CONTENT, col);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.md')) continue;
      const slug = f.replace(/\.md$/, '');
      const full = path.join(dir, f);
      const text = fs.readFileSync(full, 'utf8');
      const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!m) continue;
      const fm = m[1];
      const body = m[2];
      const nameMatch = fm.match(/^(name|word):\s*(.+)$/m);
      const summaryMatch = fm.match(/^summary:\s*([\s\S]*?)(?=\n[a-z_]+:|\n---|$)/m);
      const definitionMatch = fm.match(/^definition:\s*([\s\S]*?)(?=\n[a-z_]+:|\n---|$)/m);
      const kahuTokMatch = fm.match(/^kahu_tok:\s*(.+)$/m);
      const name = nameMatch ? nameMatch[2].trim().replace(/^['"]|['"]$/g, '') : slug;
      const summary = (summaryMatch ? summaryMatch[1] : (definitionMatch ? definitionMatch[1] : '')).trim().replace(/^['"]|['"]$/g, '');
      const kahuTok = kahuTokMatch ? kahuTokMatch[1].trim().replace(/^['"]|['"]$/g, '') : '';
      out.push({ collection: col, slug, name, summary, kahuTok, body });
    }
  }
  return out;
}

function key(col, slug) { return `${col}/${slug}`; }

const entries = readEntries();
const byKey = new Map(entries.map((e) => [key(e.collection, e.slug), e]));

// Build out-link graph by scanning anchors in each body.
const outLinks = new Map(); // key -> Set<key>
for (const e of entries) {
  const k = key(e.collection, e.slug);
  const set = new Set();
  const re = /href="\/([^"/]+)\/([^"/]+)"/g;
  let m;
  while ((m = re.exec(e.body)) !== null) {
    const targetKey = `${m[1]}/${m[2]}`;
    if (byKey.has(targetKey) && targetKey !== k) {
      set.add(targetKey);
    }
  }
  outLinks.set(k, set);
}

// Build in-link graph (reverse).
const inLinks = new Map();
for (const [src, targets] of outLinks) {
  for (const t of targets) {
    if (!inLinks.has(t)) inLinks.set(t, new Set());
    inLinks.get(t).add(src);
  }
}

// For each entry, compute candidate score:
//   2 points if entry A links to B AND B links to A (mutual)
//   1 point if only one direction
//   tiebreaker 1: same collection > different
//   tiebreaker 2: alphabetical slug
function relatedFor(k) {
  const self = byKey.get(k);
  const outs = outLinks.get(k) || new Set();
  const ins = inLinks.get(k) || new Set();
  const candidateKeys = new Set([...outs, ...ins]);
  candidateKeys.delete(k);
  const scored = [];
  for (const ck of candidateKeys) {
    const ce = byKey.get(ck);
    if (!ce) continue;
    let score = 0;
    if (outs.has(ck)) score += 1;
    if (ins.has(ck)) score += 1;
    scored.push({
      key: ck,
      score,
      sameCollection: ce.collection === self.collection,
      slug: ce.slug,
      collection: ce.collection,
      name: ce.name,
      kahuTok: ce.kahuTok,
      summary: ce.summary,
    });
  }
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.sameCollection !== b.sameCollection) return a.sameCollection ? -1 : 1;
    return a.slug.localeCompare(b.slug);
  });
  return scored.slice(0, 5).map((s) => ({
    collection: s.collection,
    slug: s.slug,
    name: s.name,
    kahuTok: s.kahuTok,
    summary: s.summary,
  }));
}

const manifest = {};
for (const e of entries) {
  const k = key(e.collection, e.slug);
  const rel = relatedFor(k);
  manifest[k] = rel;
}

const outPath = path.resolve('src/data/see-also.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf8');

let empties = 0;
for (const e of entries) {
  const k = key(e.collection, e.slug);
  if (manifest[k].length === 0) empties++;
}
console.log(`wrote ${entries.length} entries, ${empties} with no see-also`);
