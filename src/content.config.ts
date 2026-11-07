import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/proyectos',
    // id = ruta con el idioma ('es/acelerik-booking'); sin esto el loader usaría `slug` y chocarían es/en.
    generateId: ({ entry }) => entry.replace(/\.mdx?$/, '') }),
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
      imagenCaso: image().optional(),
      enlaces: z.array(z.object({ label: z.string(), href: z.string() })),
      caso: z.boolean(),
      estado: z.string().optional(),
      rol: z.string().optional(),
      // Índice del caso. `pendiente`: la sección depende de texto de Carlos y no se publica sin él.
      secciones: z
        .array(z.object({ id: z.string(), label: z.string(), pendiente: z.boolean().optional() }))
        .optional(),
    }),
});

export const collections = { proyectos };
