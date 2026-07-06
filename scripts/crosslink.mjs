#!/usr/bin/env node
// One-shot cross-link pass over src/content/**/*.md.
// Builds entity index from frontmatter, replaces FIRST mention in each
// entry body with an anchor. Self-links suppressed. kahu/peli-shen/zou-esh
// disambiguation: when wrapped in <span class="kt">…</span>, link to the
// /language/ variant; otherwise to /concepts/ or /organizations/.

import fs from 'node:fs';
import path from 'node:path';

const CONTENT = path.resolve(process.argv[2] || 'src/content');
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
      if (!m) {
        console.warn(`! no frontmatter: ${full}`);
        continue;
      }
      const fm = m[1];
      const body = m[2];
      const nameMatch = fm.match(/^(name|word):\s*(.+)$/m);
      const name = nameMatch ? nameMatch[2].trim().replace(/^['"]|['"]$/g, '') : slug;
      out.push({ collection: col, slug, name, fm, body, full });
    }
  }
  return out;
}

// Build canonical alias list per entry. Aliases must be unique strings —
// shorter aliases match more aggressively. Order longer-first when scanning.
function buildIndex(entries) {
  const idx = [];
  for (const e of entries) {
    const aliases = new Set();
    aliases.add(e.name.toLowerCase());
    // slug-with-spaces fallback
    const slugSpaced = e.slug.replace(/-/g, ' ');
    if (slugSpaced.toLowerCase() !== e.name.toLowerCase()) {
      aliases.add(slugSpaced.toLowerCase());
    }
    idx.push({
      collection: e.collection,
      slug: e.slug,
      href: `/${e.collection}/${e.slug}`,
      name: e.name,
      aliases: [...aliases],
    });
  }
  return idx;
}

// Strict matching: word boundaries around the alias.
// We match on the rendered text only — NOT inside HTML attributes or tags.
// Approach: split the body into "text" and "tag" segments; only mutate text
// segments. This avoids breaking existing <span> structure.
function tokenize(body) {
  const parts = [];
  let i = 0;
  while (i < body.length) {
    if (body[i] === '<') {
      // capture tag
      const end = body.indexOf('>', i);
      if (end === -1) {
        parts.push({ kind: 'text', value: body.slice(i) });
        break;
      }
      parts.push({ kind: 'tag', value: body.slice(i, end + 1) });
      i = end + 1;
    } else {
      const next = body.indexOf('<', i);
      if (next === -1) {
        parts.push({ kind: 'text', value: body.slice(i) });
        break;
      }
      parts.push({ kind: 'text', value: body.slice(i, next) });
      i = next;
    }
  }
  return parts;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Disambiguate kahu/peli-shen/zou-esh based on surrounding <span class="kt">…</span>
// wrapper. The tokenizer-based approach loses surrounding context, so we
// special-case: if the alias would match INSIDE a <span class="kt"> wrapper,
// route to the /language/ variant.
const DISAMBIG = new Map([
  ['kahu',      { kt: '/language/kahu',      default: '/concepts/kahu' }],
  ['peli-shen', { kt: '/language/peli-shen', default: '/concepts/peli-shen' }],
  ['zou-esh',   { kt: '/language/zou-esh',   default: '/organizations/zou-esh' }],
]);

function linkEntry(entry, index) {
  const selfKey = `${entry.collection}/${entry.slug}`;
  // Candidates: every alias from every other entry.
  // Sort by alias length DESC so multi-word aliases match first
  // ("the hearth" before "hearth").
  const candidates = [];
  for (const e of index) {
    if (`${e.collection}/${e.slug}` === selfKey) continue;
    for (const a of e.aliases) {
      candidates.push({ alias: a, href: e.href, collection: e.collection, slug: e.slug });
    }
  }
  candidates.sort((x, y) => y.alias.length - x.alias.length);

  // Track which aliases we've already linked once in this entry.
  // (Wiki convention: first mention only.)
  const linkedAliases = new Set();
  // Also track which TARGET ENTRIES we've linked to once.
  // Aliases sharing a target should not multi-link.
  const linkedTargets = new Set();

  const parts = tokenize(entry.body);
  const result = [];

  // First pass: handle the disambiguated triple INSIDE <span class="kt"> wrappers.
  // The wrapper text becomes <a href="/language/X"><span class="kt">X</span></a>.
  // We mutate the *pair* of (tag, text, closing-tag) when we see it.
  // Easier to do a regex over the whole body for those three specific cases,
  // then run the general pass on the result.

  let body = entry.body;

  // True when the offset sits inside an <a>…</a> pair. Guards both passes
  // against emitting nested anchors (the peli-shen dual-link bug).
  const insideAnchor = (s, offset) => {
    const before = s.slice(0, offset);
    const opens = (before.match(/<a[\s>]/gi) || []).length;
    const closes = (before.match(/<\/a>/gi) || []).length;
    return opens > closes;
  };

  // Pass A: kt-wrapped disambig → language link.
  // Wrap the first kt-wrapped occurrence that is NOT already inside an anchor.
  for (const [word, route] of DISAMBIG) {
    const targetKey = `language/${word}`;
    if (`${entry.collection}/${entry.slug}` === targetKey || linkedTargets.has(route.kt)) continue;
    const ktRe = new RegExp(`<span class="kt">(${escapeRegex(word)})</span>`, 'gi');
    let m;
    while ((m = ktRe.exec(body)) !== null) {
      if (insideAnchor(body, m.index)) continue;
      body =
        body.slice(0, m.index) +
        `<a class="wiki-link" href="${route.kt}"><span class="kt">${m[1]}</span></a>` +
        body.slice(m.index + m[0].length);
      linkedTargets.add(route.kt);
      linkedAliases.add(word + ':kt');
      break;
    }
  }

  // Re-tokenize with the updated body. Track anchor nesting so text that
  // already sits inside an <a>…</a> is never linkified again (nested anchors
  // are invalid HTML and render the outer href as literal text).
  const parts2 = tokenize(body);
  let anchorDepth = 0;
  for (const part of parts2) {
    if (part.kind === 'tag') {
      if (/^<a[\s>]/i.test(part.value)) anchorDepth++;
      else if (/^<\/a>/i.test(part.value)) anchorDepth = Math.max(0, anchorDepth - 1);
      result.push(part.value);
      continue;
    }
    if (anchorDepth > 0) {
      result.push(part.value);
      continue;
    }
    let text = part.value;
    // Walk every candidate alias.
    for (const cand of candidates) {
      if (linkedTargets.has(cand.href)) continue;
      if (linkedAliases.has(cand.alias)) continue;
      // Word-boundary match. Escape the alias. Hyphenated words: use lookarounds
      // that exclude word chars AND hyphens on each side, so "long" doesn't
      // match inside "long-climb" and "the hearth" doesn't match across tags.
      const re = new RegExp(
        `(?<![\\w-])(${escapeRegex(cand.alias)})(?![\\w-])`,
        'i'
      );
      const m = text.match(re);
      if (!m) continue;
      // Replace just the first match.
      const before = text.slice(0, m.index);
      const after = text.slice(m.index + m[0].length);
      const inner = m[1];
      text = `${before}<a class="wiki-link" href="${cand.href}">${inner}</a>${after}`;
      linkedAliases.add(cand.alias);
      linkedTargets.add(cand.href);
    }
    result.push(text);
  }

  const newBody = result.join('');
  return newBody;
}

const entries = readEntries();
const index = buildIndex(entries);

let changedCount = 0;
const stats = [];
for (const e of entries) {
  const newBody = linkEntry(e, index);
  if (newBody !== e.body) {
    const out = `---\n${e.fm}\n---\n${newBody}`;
    fs.writeFileSync(e.full, out, 'utf8');
    // count the new wiki-links
    const n = (newBody.match(/class="wiki-link"/g) || []).length;
    stats.push({ slug: `${e.collection}/${e.slug}`, links: n });
    changedCount++;
  } else {
    stats.push({ slug: `${e.collection}/${e.slug}`, links: 0 });
  }
}

console.log(`updated ${changedCount} / ${entries.length} entries`);
for (const s of stats) {
  console.log(`  ${s.links.toString().padStart(2)}  ${s.slug}`);
}
