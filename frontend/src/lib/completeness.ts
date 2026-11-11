import type { Portfolio, TimelineItem, Work } from "../types/portfolio";

export type WorkCheckId = "capas" | "descricoes" | "anos";
/** Tamanho mínimo para a descrição contar como preenchida. */
export const MIN_DESCRIPTION = 40;
/** O que conta em cada trabalho visível: a mesma regra serve à nota e à guia de pendências. */
export const WORK_CHECKS: { id: WorkCheckId; points: number; tab: string; ok: (work: Work) => boolean; pending: (n: number) => string }[] = [
  { id: "capas", points: 10, tab: "Sem capa", ok: (work) => !!work.cover && !work.cover.startsWith("grad:"), pending: (n) => `${n} trabalho(s) sem capa` },
  { id: "descricoes", points: 8, tab: "Sem descrição", ok: (work) => work.description.trim().length >= MIN_DESCRIPTION, pending: (n) => `${n} trabalho(s) sem descrição` },
  { id: "anos", points: 8, tab: "Sem ano", ok: (work) => !!work.year.trim(), pending: (n) => `${n} trabalho(s) sem ano` },
];

/** Trabalhos que contam na nota (privados ficam de fora) e ainda falham na verificação. */
export function worksPending(works: Work[], id: WorkCheckId): Work[] {
  const check = WORK_CHECKS.find((c) => c.id === id)!;
  return works.filter((work) => work.visibility !== "private" && !check.ok(work));
}

/** Pendência para completar o perfil: o que falta, em tom de ajuda, e onde resolver. */
export interface Pending { id: string; label: string; to: string }
export interface Completeness { score: number; pending: Pending[] }

/**
 * Nota de preenchimento (0 a 100) e lista de pendências, no estilo de uma declaração conferida item a item.
 * Perfil vale 60 pontos e trabalhos 40. Listas (experiências, trabalhos) contam pela fração completa,
 * então cada correção faz a nota subir um pouco.
 */
export function completeness(p: Portfolio): Completeness {
  const pr = p.profile;
  const pending: Pending[] = [];
  let score = 0;
  const item = (points: number, ok: boolean, id: string, label: string, to: string) => {
    if (ok) score += points;
    else pending.push({ id, label, to });
  };
  const timeline = (points: number, list: TimelineItem[], kind: "experiencia" | "formacao") => {
    const to = `/app/perfil#${kind}`;
    if (!list.length) {
      pending.push({ id: kind, label: kind === "experiencia" ? "Adicione sua experiência profissional" : "Adicione sua formação", to });
      return;
    }
    const complete = list.filter((entry) => entry.title.trim() && entry.org.trim() && entry.period.trim());
    score += (points * complete.length) / list.length;
    for (const entry of list) {
      const missing = [!entry.title.trim() && (kind === "experiencia" ? "o cargo" : "o curso"),
        !entry.org.trim() && (kind === "experiencia" ? "a empresa" : "a instituição"), !entry.period.trim() && "o período"].filter(Boolean);
      if (missing.length) {
        const name = [entry.title, entry.org].filter((part) => part.trim()).join(" · ") || (kind === "experiencia" ? "uma experiência" : "uma formação");
        pending.push({ id: `${kind}-${entry.id}`, label: `Falta ${missing.length > 1 ? `${missing.slice(0, -1).join(", ")} e ${missing[missing.length - 1]}` : missing[0]} em “${name}”`, to });
      }
    }
  };

  item(8, !!pr.photo, "foto", "Adicione uma foto sua", "/app/perfil");
  item(8, !!(pr.name.trim() && pr.headline.trim()), "titulo", "Escreva seu título profissional (ex.: Editor de vídeo)", "/app/perfil");
  item(4, !!pr.city.trim(), "cidade", "Informe sua cidade", "/app/perfil");
  item(10, pr.bio.trim().length >= 80, "bio", pr.bio.trim() ? "Sua bio está curta: conte um pouco mais sobre você" : "Escreva uma bio com algumas frases sobre você", "/app/perfil");
  item(8, !!(pr.email.trim() || pr.whatsapp.trim()), "contato", "Adicione um e-mail ou WhatsApp para contato", "/app/perfil");
  timeline(14, p.experience, "experiencia");
  timeline(8, p.education, "formacao");

  const works = p.works.filter((work) => work.visibility !== "private");
  const count = (test: (work: (typeof works)[number]) => boolean) => works.filter(test).length;
  const share = (points: number, done: number, id: string, label: (missing: number) => string) => {
    if (!works.length) return;
    score += (points * done) / works.length;
    if (done < works.length) pending.push({ id, label: label(works.length - done), to: `/app/trabalhos?pendencias=${id}` });
  };
  score += (14 * Math.min(works.length, 3)) / 3;
  if (works.length < 3) pending.push({ id: "trabalhos", to: "/app/trabalhos",
    label: works.length ? `Adicione mais ${3 - works.length} trabalho(s): o ideal é ter pelo menos 3` : "Adicione seus trabalhos (o ideal é ter pelo menos 3)" });
  for (const check of WORK_CHECKS) share(check.points, count(check.ok), check.id, check.pending);

  return { score: Math.min(100, Math.round(score)), pending };
}
