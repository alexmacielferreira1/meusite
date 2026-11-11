import type { Work, WorkKind } from "../types/portfolio";
import { toEmbed, uid } from "./utils";
import { readXlsx, type SheetData } from "./xlsxRead";

export const WORK_KINDS: Record<WorkKind, string> = { video: "Vídeo", image: "Imagem / arte", article: "Matéria", audio: "Áudio", script: "Roteiro" };
export const headers = ["ID", "Formato", "Título", "Função", "Cliente", "Ano", "Categoria", "Descrição", "Link", "Capa", "Galeria", "Veículo", "Softwares", "Tags", "Contribuição", "Entregas", "Visibilidade", "GitHub", "Proporção"] as const;
export const workLink = (value: string) => /^https?:\/\/[^\s]+$/i.test(value);
export const splitLinks = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

export function videoCover(url?: string) {
  const match = toEmbed(url)?.match(/^https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/);
  return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : undefined;
}

export function newWork(kind: WorkKind = "video"): Work {
  return { id: uid(), kind, title: "", role: "", client: "", year: String(new Date().getFullYear()),
    category: "", description: "", mediaUrl: "", cover: "grad:265", software: [], tags: [] };
}

/** Um trabalho como linha da planilha, na ordem de `headers`. */
export function workToRow(w: Work): string[] {
  return [
    w.id, WORK_KINDS[w.kind], w.title, w.role, w.client, w.year, w.category, w.description, w.mediaUrl ?? "",
    workLink(w.cover) ? w.cover : "", w.gallery?.join("\n") ?? "", w.outlet ?? "", w.software.join("; "),
    w.tags.join("; "), w.contribution ?? "", w.deliverables?.join("; ") ?? "", w.visibility ?? "public", w.repositoryUrl ?? "", w.aspect ?? "",
  ];
}

export async function downloadWorks(works: Work[] = []) {
  const { Workbook } = await import("exceljs");
  const book = new Workbook();
  const sheet = book.addWorksheet("Trabalhos");
  sheet.addRow([...headers]);
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((column, i) => { column.width = i === 7 || i === 10 ? 44 : 22; });
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  const guide = book.addWorksheet("Como preencher");
  guide.addRows([
    ["Uma linha por trabalho. Use os cabeçalhos existentes e deixe ID em branco para adicionar."],
    ["Para atualizar um trabalho, exporte o acervo e preserve o ID dele."],
    ["Formatos aceitos: Vídeo, Imagem / arte, Matéria, Áudio e Roteiro."],
    ["Título e função são obrigatórios. Use links http ou https."],
    ["Galeria: até 12 links de imagens, um por linha. Softwares, tags e entregas: separe por ponto e vírgula."],
    ["Visibilidade: public, link ou private. Em branco, vale a opção escolhida na tela de importação (padrão: público)."],
    ["Capa vazia preserva a capa atual. IDs e dados deste arquivo são da sua conta."],
  ]);
  guide.getColumn(1).width = 110;
  for (const w of works) sheet.addRow(workToRow(w));
  const buffer = await book.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = works.length ? "acervo-trabalhos.xlsx" : "modelo-trabalhos.xlsx";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type Visibility = NonNullable<Work["visibility"]>;

export async function readWorks(file: File, existing: Work[], fallback: Visibility = "private") {
  if (!file.name.toLowerCase().endsWith(".xlsx") || file.size > 2 * 1024 * 1024) throw new Error("Use um arquivo .xlsx de até 2 MB.");
  const sheets = await readXlsx(file);
  const matches = (sheet: SheetData) => headers.slice(0, 17).every((header, i) => (sheet.rows[0]?.[i] ?? "").trim() === header);
  const sheet = sheets.find((item) => item.name === "Trabalhos" && matches(item)) ?? sheets.find(matches);
  if (!sheet) throw new Error("Use a planilha-modelo e mantenha seus cabeçalhos.");
  if (sheet.rows.length > 251) throw new Error("A planilha pode conter até 250 trabalhos.");
  return mapWorks(sheet.rows.slice(1), existing, sheet.formulas, fallback);
}

/** `fallback`: visibilidade de trabalhos novos quando a coluna vem em branco. */
export function mapWorks(rows: string[][], existing: Work[], formulas = new Set<number>(), fallback: Visibility = "private") {
  const ids = new Set<string>();
  const current = new Map(existing.map((work) => [work.id, work]));
  const errors: string[] = [];
  const works: Work[] = [];
  let updates = 0;
  rows.forEach((values, index) => {
    const number = index + 2;
    const cells = headers.map((_, i) => values[i]?.trim() ?? "");
    const [id, format, title, role, client, year, category, description, mediaUrl, cover, images, outlet, software, tags, contribution, deliverables, visibility, repositoryUrl, aspect] = cells;
    if (!cells.some(Boolean)) return;
    const kind = (Object.keys(WORK_KINDS) as WorkKind[]).find((key) => [key, WORK_KINDS[key].toLowerCase()].includes(format.toLowerCase()));
    const gallery = splitLinks(images);
    const prior = id ? current.get(id) : undefined;
    const error = formulas.has(number) ? "use texto ou links, sem fórmulas"
      : !kind || !title || !role ? "informe formato, título e função"
      : id && (!prior || ids.has(id)) ? "ID desconhecido ou duplicado"
      : (mediaUrl && !workLink(mediaUrl)) || (cover && !workLink(cover)) || gallery.length > 12 || gallery.some((item) => !workLink(item)) ? "revise os links e limite a galeria a 12 imagens"
      : repositoryUrl && !/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/i.test(repositoryUrl) ? "link do GitHub inválido"
      : aspect && aspect !== "16:9" && aspect !== "9:16" ? "proporção deve ser 16:9 ou 9:16"
      : visibility && !["public", "link", "private"].includes(visibility) ? "visibilidade inválida"
      : cells.some((cell) => cell.length > 8000) || deliverables.split(";").length > 100 ? "texto ou lista de entregas acima do limite" : "";
    if (error || !kind) { errors.push(`Linha ${number}: ${error}`); return; }
    if (prior) { ids.add(id); updates++; }
    const list = (value: string) => value.split(";").map((part) => part.trim()).filter(Boolean);
    works.push({ ...(prior ?? newWork(kind)), kind, title, role, client, year, category, description, mediaUrl,
      cover: cover || prior?.cover || gallery[0] || videoCover(mediaUrl) || "grad:265", gallery, outlet,
      repositoryUrl: repositoryUrl || prior?.repositoryUrl, aspect: aspect === "16:9" || aspect === "9:16" ? aspect : prior?.aspect, software: list(software), tags: list(tags),
      contribution, deliverables: list(deliverables), visibility: (visibility || prior?.visibility || fallback) as Work["visibility"] });
  });
  if (!works.length && !errors.length) errors.push("A planilha não tem trabalhos preenchidos.");
  if (existing.length + works.length - updates > 250) errors.push("O acervo comporta até 250 trabalhos.");
  return { works, updates, errors };
}
