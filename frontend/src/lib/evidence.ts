import type { Work } from "../types/portfolio";

const common = new Set("para pelo pela como uma uns umas seu sua seus suas tem que dos das com nas nos and for the por mais sobre precisa buscar vaga cliente experiencia trabalho projeto conhecimento conhecimentos habilidade habilidades em com desejavel obrigatorio requisito requisitos".split(" "));
function terms(text: string) {
  return [...new Set(text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().match(/[a-z0-9+#]{3,}/g) ?? [])]
    .filter((term) => !common.has(term));
}

export function matchEvidence(brief: string, works: Work[]) {
  const requirements = terms(brief);
  return works.filter((work) => work.visibility !== "private").map((work) => {
    const facts = new Set(terms([work.title, work.role, work.category, work.description, work.contribution,
      ...work.software, ...work.tags, ...(work.deliverables ?? [])].filter(Boolean).join(" ")));
    return { work, matches: requirements.filter((term) => facts.has(term)) };
  }).sort((a, b) => b.matches.length - a.matches.length);
}

export function markerSeconds(time: string): number | null {
  if (!/^(?:\d{1,3}:)?\d{1,2}:\d{2}$/.test(time)) return null;
  const parts = time.split(":").map(Number);
  if (parts.slice(1).some((part) => part >= 60)) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

export function evidenceMap(brief: string, works: Work[], selected: string[]) {
  const normalized = new Set<string>();
  return brief.split(/\r?\n|;\s*|(?<=[.!?])\s+(?=[A-ZÀ-Ú])/).map((line) =>
    line.trim().replace(/^(?:[-*•]\s+|\d+[.)]\s+)/, "")).filter((line) => {
      const key = terms(line).join(" ");
      if (!key || normalized.has(key)) return false;
      normalized.add(key);
      return true;
    }).slice(0, 20).map((requirement) => {
      const expected = terms(requirement);
      const candidates = matchEvidence(requirement, works).map(({ work, matches }) => {
        const markers = (work.markers ?? []).filter((marker) =>
          markerSeconds(marker.time) !== null && terms(marker.label).some((term) => expected.includes(term)));
        const found = new Set([...matches, ...markers.flatMap((marker) => terms(marker.label).filter((term) => expected.includes(term)))]);
        return { work, markers, matches: expected.filter((term) => found.has(term)), included: selected.includes(work.id) };
      }).filter(({ matches }) => matches.length)
        .sort((a, b) => Number(b.included) - Number(a.included) || b.matches.length - a.matches.length);
      const missing = expected.filter((term) => !candidates.some((candidate) => candidate.matches.includes(term)));
      return { requirement, candidates, missing };
    });
}

export function suggestEvidence(brief: string, works: Work[]) {
  const map = evidenceMap(brief, works, []);
  const uncovered = new Set(map.flatMap(({ candidates }, index) =>
    [...new Set(candidates.flatMap(({ matches }) => matches))].map((term) => `${index}:${term}`)));
  const scores = new Map<string, string[]>();
  map.forEach(({ candidates }, index) => candidates.forEach(({ work, matches }) =>
    scores.set(work.id, [...(scores.get(work.id) ?? []), ...matches.map((term) => `${index}:${term}`)])));
  const selected: string[] = [];
  // Escolhe o trabalho que cobre mais termos ainda descobertos; para quando nenhum cobre mais nada.
  const pick = () => [...scores].map(([id, items]) => ({ id, items: items.filter((item) => uncovered.has(item)) }))
    .sort((a, b) => b.items.length - a.items.length)[0];
  for (let best = pick(); selected.length < 3 && best?.items.length; best = pick()) {
    selected.push(best.id);
    scores.delete(best.id);
    best.items.forEach((item) => uncovered.delete(item));
  }
  return selected;
}
