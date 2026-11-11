import type { Work } from "../types/portfolio";

/**
 * Como aplicar uma planilha ao acervo. Nenhum modo apaga trabalho:
 * - novos: só entram os que ainda não existem;
 * - completar: nos existentes, preenche apenas campos vazios;
 * - atualizar: nos existentes, troca pelos valores da planilha (célula vazia não apaga);
 * - substituir: como atualizar, e quem não está na planilha fica privado (sai do site, continua no acervo).
 */
export type ImportMode = "novos" | "completar" | "atualizar" | "substituir";
export type ImportAction = "novo" | "atualiza" | "igual" | "ignorado" | "privado";
export interface ImportRow { work: Work; action: ImportAction; fields: string[] }

export const IMPORT_MODES: { id: ImportMode; label: string; hint: string }[] = [
  { id: "novos", label: "Só adicionar os novos", hint: "Quem já está no acervo fica como está." },
  { id: "completar", label: "Completar o que falta", hint: "Nos trabalhos que já existem, preenche só os campos vazios." },
  { id: "atualizar", label: "Atualizar com a planilha", hint: "Troca pelos valores da planilha. Célula vazia não apaga nada." },
  { id: "substituir", label: "Trocar tudo pela planilha", hint: "Atualiza e deixa privados os que não estão na planilha. Nada é apagado." },
];

const FIELDS: [keyof Work, string][] = [
  ["kind", "Formato"], ["title", "Título"], ["role", "Função"], ["client", "Cliente"], ["year", "Ano"], ["category", "Categoria"],
  ["description", "Descrição"], ["mediaUrl", "Link"], ["cover", "Capa"], ["gallery", "Galeria"], ["outlet", "Veículo"],
  ["software", "Softwares"], ["tags", "Tags"], ["contribution", "Contribuição"], ["deliverables", "Entregas"],
  ["visibility", "Visibilidade"], ["repositoryUrl", "GitHub"], ["aspect", "Proporção"],
];

const empty = (key: keyof Work, value: unknown) =>
  value === undefined || (Array.isArray(value) ? !value.length : !String(value).trim() || (key === "cover" && String(value).startsWith("grad:")));
/** `b` nunca é vazio aqui (valores vazios da planilha são ignorados antes). */
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? "") === JSON.stringify(b);
const titleKey = (title: string) => title.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Mescla `incoming` em `prior`; `onlyEmpty` preenche só o que está vazio. Devolve o trabalho e os campos alterados.
 * Casado pelo título, a visibilidade fica a de antes: sem ID, ela vem do padrão da tela, não da pessoa.
 */
function merge(prior: Work, incoming: Work, onlyEmpty: boolean, byTitle: boolean) {
  const next: Work = { ...prior };
  const fields: string[] = [];
  for (const [key, label] of FIELDS) {
    const value = incoming[key];
    if (key === "visibility" && (byTitle || (prior.visibility ?? "public") === value)) continue;
    if (empty(key, value) || same(prior[key], value) || (onlyEmpty && !empty(key, prior[key]))) continue;
    (next as unknown as Record<string, unknown>)[key] = value;
    fields.push(label);
  }
  return { next, fields };
}

/**
 * Análise da importação: o que acontece com cada trabalho e o acervo resultante.
 * Trabalhos da planilha casam pelo ID; sem ID conhecido, pelo título (sem diferenciar maiúsculas).
 */
export function planImport(existing: Work[], incoming: Work[], mode: ImportMode) {
  const byId = new Map(existing.map((work) => [work.id, work]));
  const byTitle = new Map<string, Work>();
  for (const work of existing) if (!byTitle.has(titleKey(work.title))) byTitle.set(titleKey(work.title), work);
  const matched = new Set<string>();
  const rows: ImportRow[] = [];
  const changed = new Map<string, Work>();
  const added: Work[] = [];

  for (const work of incoming) {
    let prior = byId.get(work.id);
    const viaTitle = !prior;
    if (!prior) { const twin = byTitle.get(titleKey(work.title)); if (twin && !matched.has(twin.id)) prior = twin; }
    if (!prior || matched.has(prior.id)) { added.push(work); rows.push({ work, action: "novo", fields: [] }); continue; }
    matched.add(prior.id);
    if (mode === "novos") { rows.push({ work: prior, action: "ignorado", fields: [] }); continue; }
    const { next, fields } = merge(prior, work, mode === "completar", viaTitle);
    rows.push({ work: next, action: fields.length ? "atualiza" : "igual", fields });
    if (fields.length) changed.set(prior.id, next);
  }
  if (mode === "substituir") {
    for (const work of existing) {
      if (matched.has(work.id) || work.visibility === "private") continue;
      const next: Work = { ...work, visibility: "private" };
      changed.set(work.id, next);
      rows.push({ work: next, action: "privado", fields: ["Visibilidade"] });
    }
  }
  const works = [...added, ...existing.map((work) => changed.get(work.id) ?? work)];
  const count = (action: ImportAction) => rows.filter((row) => row.action === action).length;
  const counts = { novo: count("novo"), atualiza: count("atualiza"), igual: count("igual"), ignorado: count("ignorado"), privado: count("privado") };
  return { works, rows, counts, error: works.length > 250 ? "O acervo comporta até 250 trabalhos." : "" };
}
