import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/proyectos' }),
  schema: ({ image }) =>
    z.object({
      slug: z.string(),
      orden: z.number(),
      titulo: z.string(),
      etiqueta: z.string(),
      tipo: z.enum(['producto', 'cliente', 'practicas']),
      titular: z.string(),
      hechos: z.array(z.string()),
      stack: z.array(z.string()),
      imagen: image().optional(),
      enlaces: z.array(z.object({ label: z.string(), href: z.string() })),
      caso: z.boolean(),
      estado: z.string().optional(),
    }),
});

export const collections = { proyectos };
