// the tok-kahu: dictionary data layer over the mil-tok word data.
// combines bixel's lexicon rows (mil-tok-data.mjs) with the words the record
// added after her: accretions, kept sounds, order usage, and eponyms.
// wiki entries are canon over everything here; enrichment notes cite the
// archive's own documents and introduce nothing unregistered.

import { groups } from './mil-tok-data.mjs';

export function slugFor(w) {
  if (w === '!') return 'importance-mark';
  return w
    .toLowerCase()
    .replace(/!/g, '')
    .replace(/…/g, ' to ')
    .replace(/[.,’']/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// words the record holds that are not rows of bixel's mil-tok page:
// accretions, kept sounds, order usage, eponyms, and bound roots documented
// by the archive. glosses come from the wiki entries (canon).
export const supplemental = [
  { w: 'drak', gloss: 'last', provenance: 'bixel 1000', domain: 'the sacred register' },
  { w: 'hart', gloss: 'heart', provenance: 'bixel 1000', domain: 'mind and heart' },
  { w: 'silth', gloss: 'the root for weaving, fiber, and the shaping of living textile; a bound root, appearing in compounds', provenance: 'bixel 1000', domain: 'craft and the living tapestry' },
  { w: 'kia-vyl', gloss: 'live! (as a command or exhortation)', provenance: 'bixel 1000', domain: 'the sacred register' },
  { w: 'zou-esh', gloss: 'the scholar-warrior order of the kahu; one of its members. a go-beyond', provenance: 'bixel 1000', domain: 'movement and travel' },
  { w: 'peli-shen', gloss: 'the radiotrophic fungus that has rendered the lowlands lethal. literally danger-life', provenance: 'bixel 1000 compound', domain: 'land and the world below' },
  { w: 'toska', gloss: 'deep sorrow; grief; anguished longing', provenance: 'kept whole from russian', domain: 'mind and heart',
    note: 'the one entry where the maker declined to translate: glossed by bixel herself as the word i could not build a bridge to, so i carried it across.' },
  { w: 'micasu', gloss: 'welcome; by the present sense, what is mine is already yours', provenance: 'organic accretion, from spanish', domain: 'set phrases and greetings',
    note: 'five words of spanish worn to one: mi casa es su casa, the southern caravan’s greeting across the founding fences.' },
  { w: 'kaelith', gloss: 'the bonded cat; the serval-cougar-descended companion species', provenance: 'kept sound, the cat-farmers’ own word', domain: 'plants and animals',
    note: 'absorbed whole when its people were absorbed; the strange vowel and ending kept on purpose. the cats’ name belongs to the people who kept them.' },
  { w: 'mara', gloss: 'a shield; that which defends', provenance: 'eponym, after the age of bloom', domain: 'craft and the living tapestry',
    note: 'taken from the name of the zou-esh who died defending the gate, long after her death. absent from bixel’s editions of the mil-tok.' },
  { w: 'kau-esh', gloss: 'the little kahu: those on the order’s path who have not arrived, and those who left it', provenance: 'order usage', domain: 'the order’s vocabulary' },
  { w: 'zou-nu', gloss: 'new-goer: a first-year at mara-skol', provenance: 'order usage', domain: 'the order’s vocabulary' },
  { w: 'zou-tora', gloss: 'the hope-journey: the summer field season, when the order goes beyond the gate', provenance: 'order usage', domain: 'the order’s vocabulary' },
  { w: 'ol-hart', gloss: 'old-heart: the vital things of the world before, brought home', provenance: 'order usage', domain: 'the order’s vocabulary' },
  { w: 'klosh-zou', gloss: 'the closing mission: a zou-esh’s seventy-fifth', provenance: 'order usage, the age of bloom', domain: 'the order’s vocabulary',
    note: 'from klosh-taim, the closing of the day. order slang by origin, liturgy by now.' },
  { w: 'zou-lao', gloss: 'the old goers: the order’s post-field half', provenance: 'order usage, the age of bloom', domain: 'the order’s vocabulary',
    note: 'coined inside mara-skol during the bloom, on lao, elder, from the mandarin stratum. not retired, the kahu would say. homed.' },
  { w: 'air-ropa', gloss: 'the air-clothes: the filtering cloth mask of the zou-esh kit', provenance: 'order usage', domain: 'the order’s vocabulary' },
  { w: 'hand-ropa', gloss: 'the hand-clothes: the adhering gloves of the zou-esh kit', provenance: 'order usage', domain: 'the order’s vocabulary' },
  { w: 'kaelith-klin', gloss: 'the cat’s pre-mission inoculation, administered by the cat-kahu and purged after return', provenance: 'order usage', domain: 'the order’s vocabulary' },
  { w: 'warden', gloss: 'the biological supercomputer that models the kahu’s world; the name of the remembering', provenance: 'contested; the name predates or stands outside kahu-tok', domain: 'craft and the living tapestry',
    note: 'one tradition holds the name was chosen from a dead tongue so no living root would make the machine kin; another that it is a bastard-tongue survival. both agree the name is not kahu-tok, and the kahu have never minded.' },
  { w: 'tonal tense', slug: 'tonal-tense', gloss: 'the marking of time in speech by tone: level for now, rising for the future, falling for the past. the worn-down ghosts of bixel’s particles', provenance: 'the grammar of the language', domain: 'grammar and the small words' },
  { w: 'tok-kahu', gloss: 'the family of words: this dictionary, the archive’s working record of the whole language', provenance: 'the archive, 4625', domain: 'speech, story, and knowledge',
    note: 'the mirror of kahu-tok: the community’s speech, turned to face the speech’s community. bixel’s mil-tok is a primary document and stays whole; the tok-kahu is the archive speaking, one word at a time.' },
];

// dictionary-only etymology notes for mil-tok rows, in the archive's voice.
// sources: the mil-tok itself, the cruz redaction, and the wiki's entries.
export const etymNotes = {
  'kai': 'cut deliberately by bixel from kia-vyl, live: the we who say live. the tellers prefer the story that it fell out on its own, like a seed; the cruz redaction preserves the carpenter’s receipt.',
  'chai': 'the one word the russians and the chinese already shared when they met on the ice: the kahu like to say it is the oldest word in the language, since it belonged to two peoples before the language existed.',
  'dos-des': 'trade counting from the nu-tera markets, where the southern caravan kept the stalls: a spanish ten riding the everyday units. markets do what markets do.',
  'endura': 'endurance, from the spanish stratum, chosen by the age’s own people to name the age: the era that would not name itself golden and would not name itself dark.',
  'banya': 'second russian layer: the word arrived with the yamantau descendants, whom hot-kasa thawed, and the room they were warmed in became a pillar of civic life.',
  'sin-kahu': 'sin- is the spanish without, bound as a prefix; the language’s severest states are built with it, because the founders knew what lacking is.',
  'net-fer': 'the hard russian no bound to fairness. children’s speech first, then everyone’s: no language resists a child’s word for injustice for long.',
  'bayu': 'the lullaby word, from the russian cradle-song refrain, kept by bixel for the children. the mil-tok lists it in the sacred register without explaining why, which is the explanation.',
  'jefe-tri': 'chief-of-three: named with the spanish chief because the weapon, unlike the people, is permitted a boss.',
  'tapi-konsil': 'the woven council: a restoration gesture you can hear. the second government reached backward past the seizure for its name.',
  'vyl': 'the deep i in its vowel is the last surviving sound of bixel’s mother tongue, kept in one word like a pressed flower.',
};

// concept-side wiki entries for words whose full article lives outside the
// language collection.
export const conceptEntries = {
  'kau-esh': '/concepts/kau-esh',
  'zou-tora': '/concepts/zou-tora',
  'warden': '/concepts/warden',
};

// build the merged dictionary: one record per slug, senses merged across
// bixel's groups and the supplemental record.
export function buildDictionary() {
  const map = new Map();
  const push = (slug, word, sense, provenance) => {
    if (!map.has(slug)) map.set(slug, { slug, word, senses: [], provenance });
    const rec = map.get(slug);
    // avoid duplicate identical senses (a few rows repeat across groups)
    if (!rec.senses.some((s) => s.gloss === sense.gloss)) rec.senses.push(sense);
  };

  for (const g of groups) {
    for (const row of g.words) {
      const slug = slugFor(row.w);
      push(slug, row.w, { gloss: row.d, note: row.note, domain: g.title, letter: g.letter }, 'the mil-tok, bixel 1000');
    }
  }

  for (const s of supplemental) {
    const slug = s.slug ?? slugFor(s.w);
    if (map.has(slug)) {
      // a supplemental record for an existing row adds a sense and richer provenance
      const rec = map.get(slug);
      if (!rec.senses.some((x) => x.gloss === s.gloss)) {
        rec.senses.push({ gloss: s.gloss, note: s.note, domain: s.domain });
      }
    } else {
      map.set(slug, {
        slug,
        word: s.w,
        senses: [{ gloss: s.gloss, note: s.note, domain: s.domain }],
        provenance: s.provenance,
      });
    }
  }

  for (const [slug, rec] of map) {
    if (etymNotes[slug]) rec.etym = etymNotes[slug];
  }

  return [...map.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

// every compound in the dictionary that contains the given root as a
// hyphen-separated element (cheap morphology; kahu-tok compounds keep their seams).
export function compoundsOf(slug, dict) {
  return dict.filter((r) => r.slug !== slug && r.slug.split('-').includes(slug));
}
