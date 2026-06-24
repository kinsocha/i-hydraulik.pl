import { defineCollection, z } from "astro:content";

const poradnik = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().max(220),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default("i Hydraulik"),
    category: z.string(),
    readingTime: z.number().min(1),
    hero: z.string(),
    heroAlt: z.string(),
    heroTitle: z.string(),
    heroLead: z.string(),
    keywords: z.string().max(200).optional(),
    faq: z
      .array(
        z.object({
          q: z.string(),
          a: z.string(),
        })
      )
      .optional(),
  }),
});

export const collections = { poradnik };
