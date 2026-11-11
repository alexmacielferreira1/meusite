/** Resumo em frases inteiras, até `max` caracteres (bio no topo dos modelos). */
export function summary(text: string, max = 260): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const sentences = clean.match(/[^.!?]+[.!?]+["”)]?\s*/g) ?? [];
  let out = "";
  for (const sentence of sentences) {
    if ((out + sentence).trim().length > max) break;
    out += sentence;
  }
  if (out.trim()) return out.trim();
  const cut = clean.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:–—-]+$/, "") + "…";
}

/** Primeira frase da bio, com limite de tamanho. */
export const firstSentence = (text: string) => summary(text, 200);
