# tora vyl drak

The Kahu Vyl encyclopedia. A living archive of Tora Vyl Drak: its people, places, language, and lore.

Lives at [somohapian.com](https://somohapian.com).

## Adding entries

All wiki entries are markdown files. Click into the relevant folder under `src/content/`, click "Add file → Create new file" in GitHub, paste the entry, commit. The site rebuilds itself in about 30 seconds.

## The entry skeleton

Every entry follows the same shape, in this order:

1. **lede**: one paragraph that says what the thing is.
2. **body sections**: the substance, in the archive's voice. No em dashes, ever.
3. **in-world citations** (major entries): superscript `<sup class="cite">` marks pointing at a closing `sources of the record` list. Cite only attested sources: the mil-tok, the cruz redaction, warden-memo extracts, zou-esh field records, nem-giv liturgy, the deep records.
4. **contested traditions** (only if folk memory disagrees with the record): `contested_traditions` frontmatter array. The archive states the record, reports the tradition, and declines to adjudicate past the evidence.
5. **open canon**: `open_canon` frontmatter array. Questions the record has not settled. Sweep these against current canon in every tranche; delete answered ones.
6. **see also / mentioned by**: generated. Never hand-edit; run the four scripts.

Optional frontmatter across all collections: `recorded` ("in the record since"), rendered in the infobox. Pages in an in-world first-person voice (the mil-tok) carry the primary-source banner (`entry-primary-source`) and are not the archive speaking.

## Local development

```
npm install
npm run dev
```

## Build

```
npm run build
```

Static output goes to `dist/`.

---

© Jay Metcalf. All rights reserved.
