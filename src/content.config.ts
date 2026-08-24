import { defineCollection } from "astro:content";
import { z } from "astro/zod"
import { glob } from "astro/loaders";

const projects = defineCollection({
	loader: glob({ pattern: "**/*.mdx", base: "./src/content/projects" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			year: z.string(),
			tags: z.array(z.string()),
			description: z.string(),
			timeline: z.string(),
			liveUrl: z.string().url().optional(),
			hero: image(),
			shots: z.array(image()).default([]),
		}),
});

export const collections = { projects };
