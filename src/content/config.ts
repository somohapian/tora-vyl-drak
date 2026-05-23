import { defineCollection, z } from 'astro:content';

const people = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    kahu_tok: z.string().optional(),
    role: z.string().optional(),
    era: z.string().optional(),
    born: z.string().optional(),
    died: z.string().optional(),
    status: z.enum(['living', 'historical', 'legendary', 'unknown']).optional(),
    summary: z.string(),
    open_canon: z.array(z.string()).optional(),
  }),
});

const places = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    kahu_tok: z.string().optional(),
    region: z.string().optional(),
    elevation: z.string().optional(),
    status: z.enum(['active', 'historical', 'destroyed', 'legendary']).optional(),
    summary: z.string(),
    open_canon: z.array(z.string()).optional(),
  }),
});

const events = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    kahu_tok: z.string().optional(),
    year: z.string().optional(),
    era: z.string().optional(),
    summary: z.string(),
    open_canon: z.array(z.string()).optional(),
  }),
});

const eras = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    kahu_tok: z.string().optional(),
    year_start: z.string().optional(),
    year_end: z.string().optional(),
    summary: z.string(),
    open_canon: z.array(z.string()).optional(),
  }),
});

const concepts = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    kahu_tok: z.string().optional(),
    category: z.string().optional(),
    summary: z.string(),
    open_canon: z.array(z.string()).optional(),
  }),
});

const organizations = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    kahu_tok: z.string().optional(),
    founded: z.string().optional(),
    status: z.enum(['active', 'historical', 'dissolved']).optional(),
    summary: z.string(),
    open_canon: z.array(z.string()).optional(),
  }),
});

const objects = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    kahu_tok: z.string().optional(),
    category: z.string().optional(),
    summary: z.string(),
    open_canon: z.array(z.string()).optional(),
  }),
});

const language = defineCollection({
  type: 'content',
  schema: z.object({
    word: z.string(),
    pronunciation: z.string().optional(),
    part_of_speech: z.string().optional(),
    definition: z.string(),
    etymology: z.string().optional(),
    source: z.string().optional(),
    entered: z.string().optional(),
    related: z.array(z.string()).optional(),
    open_canon: z.array(z.string()).optional(),
  }),
});

export const collections = {
  people,
  places,
  events,
  eras,
  concepts,
  organizations,
  objects,
  language,
};
