import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n';

/** Proyectos de un idioma (src/content/proyectos/<lang>/), ordenados. */
export async function proyectosDe(lang: Lang): Promise<CollectionEntry<'proyectos'>[]> {
  const todos = await getCollection('proyectos', (p) => p.id.startsWith(`${lang}/`));
  return todos.sort((a, b) => a.data.orden - b.data.orden);
}

/** Rutas estáticas de los casos de estudio de un idioma. */
export async function rutasDeCasos(lang: Lang) {
  const casos = (await proyectosDe(lang)).filter((p) => p.data.caso);
  return casos.map((p, i) => ({
    params: { slug: p.data.slug },
    props: { proyecto: p, siguiente: casos[(i + 1) % casos.length] },
  }));
}
