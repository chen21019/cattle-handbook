import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        audience: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        diagram_required: z.boolean().optional(),
        search_priority: z.enum(['low', 'normal', 'high']).optional(),
        last_verified: z.string().optional()
      })
    })
  })
};
