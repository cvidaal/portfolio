/** Parte un texto de es.ts en trozos; los que van entre *asteriscos* se pintan en cursiva. */
export function cursiva(texto: string): { texto: string; em: boolean }[] {
  return texto.split('*').map((t, i) => ({ texto: t, em: i % 2 === 1 })).filter((s) => s.texto !== '');
}
