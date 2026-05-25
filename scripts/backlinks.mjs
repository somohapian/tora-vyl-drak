#!/usr/bin/env node
// Build the inverse-mention index ("what links here"). For each entry,
// records every OTHER entry whose body either (a) anchor-links to it or
// (b) names it in plain prose with word-boundary alias matching.
//
// Output: src/data/backlinks.json — { "collection/slug": [{ collection,
// slug, name, kahuTok, summary }, …] } sorted by collection then slug.
//
// The "named-entity" half catches mentions that crosslink.mjs did NOT
// linkify (it only linkifies the first occurrence per entry); that way
// every prose mention of e.g. "mara" contributes a backlink even when the
// link itself sits earlier in the same entry.

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

// Split body into text-vs-tag segments so mention scanning ignores HTML
// (anchor attributes, span wrappers etc.). Mirrors crosslink.mjs.
function tokenize(body) {
  const parts = [];
  let i = 0;
  while (i < body.length) {
    if (body[i] === '<') {
      const end = body.indexOf('>', i);
      if (end === -1) { parts.push({ kind: 'text', value: body.slice(i) }); break; }
      parts.push({ kind: 'tag', value: body.slice(i, end + 1) });
      i = end + 1;
    } else {
      const next = body.indexOf('<', i);
      if (next === -1) { parts.push({ kind: 'text', value: body.slice(i) }); break; }
      parts.push({ kind: 'text', value: body.slice(i, next) });
      i = next;
    }
  }
  return parts;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function textOnly(body) {
  return tokenize(body)
    .filter((p) => p.kind === 'text')
    .map((p) => p.value)
    .join(' ');
}

const entries = readEntries();
const byKey = new Map(entries.map((e) => [key(e.collection, e.slug), e]));

// Aliases per entry: lowercase name + slug-with-spaces fallback.
const aliasIndex = entries.map((e) => {
  const aliases = new Set([e.name.toLowerCase()]);
  const slugSpaced = e.slug.replace(/-/g, ' ');
  if (slugSpaced.toLowerCase() !== e.name.toLowerCase()) {
    aliases.add(slugSpaced.toLowerCase());
  }
  return { key: key(e.collection, e.slug), aliases: [...aliases] };
});

// target_key -> Set<source_key>
const mentions = new Map();
function record(target, source) {
  if (target === source) return;
  if (!byKey.has(target)) return;
  if (!mentions.has(target)) mentions.set(target, new Set());
  mentions.get(target).add(source);
}

const hrefRe = /href="\/([^"/]+)\/([^"/]+)"/g;
for (const src of entries) {
  const srcKey = key(src.collection, src.slug);

  // 1) anchor-link mentions
  let m;
  hrefRe.lastIndex = 0;
  while ((m = hrefRe.exec(src.body)) !== null) {
    record(`${m[1]}/${m[2]}`, srcKey);
  }

  // 2) plain-prose mentions, scanning text segments only
  const text = textOnly(src.body);
  for (const target of aliasIndex) {
    if (target.key === srcKey) continue;
    if (mentions.get(target.key)?.has(srcKey)) continue; // already counted via anchor
    for (const a of target.aliases) {
      const re = new RegExp(`(?<![\\w-])${escapeRegex(a)}(?![\\w-])`, 'i');
      if (re.test(text)) {
        record(target.key, srcKey);
        break;
      }
    }
  }
}

const manifest = {};
for (const e of entries) {
  const k = key(e.collection, e.slug);
  const sources = mentions.get(k) || new Set();
  const list = [...sources]
    .map((sk) => byKey.get(sk))
    .filter(Boolean)
    .map((s) => ({
      collection: s.collection,
      slug: s.slug,
      name: s.name,
      kahuTok: s.kahuTok,
      summary: s.summary,
    }))
    .sort((a, b) => {
      if (a.collection !== b.collection) return a.collection.localeCompare(b.collection);
      return a.slug.localeCompare(b.slug);
    });
  manifest[k] = list;
}

const outPath = path.resolve('src/data/backlinks.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf8');

const withBacklinks = entries.filter((e) => manifest[key(e.collection, e.slug)].length > 0).length;
const pct = Math.round((withBacklinks / entries.length) * 100);
console.log(`wrote backlinks for ${entries.length} entries; ${withBacklinks} (${pct}%) have at least one`);
