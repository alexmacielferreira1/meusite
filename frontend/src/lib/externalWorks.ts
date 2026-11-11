import { headers, mapWorks, type Visibility } from "./workSpreadsheet";
import { readXlsx, tooWide } from "./xlsxRead";
import type { Work, WorkKind } from "../types/portfolio";

export interface ExternalTable { columns: string[]; rows: string[][]; formulas?: Set<number> }

function csv(text: string, delimiter: string) {
  const records: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' && quoted && text[i + 1] === '"') { field += '"'; i++; }
    else if (c === '"') quoted = !quoted;
    else if (!quoted && c === delimiter) { row.push(field); field = ""; }
    else if (!quoted && (c === "\n" || c === "\r")) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      if (field || row.length) records.push([...row, field]);
      row = []; field = "";
    } else field += c;
  }
  if (quoted) throw new Error("Há aspas sem fechamento no CSV.");
  if (field || row.length) records.push([...row, field]);
  return records;
}

export async function readExternal(file: File, sheetName?: string): Promise<{ table: ExternalTable; sheets: string[] }> {
  if (file.size > 2 * 1024 * 1024) throw new Error("O arquivo deve ter até 2 MB.");
  let rows: string[][], sheets: string[] = [];
  const formulas = new Set<number>();
  if (/\.xlsx$/i.test(file.name)) {
    const book = await readXlsx(file);
    sheets = book.map((sheet) => sheet.name);
    const sheet = sheetName ? book.find((item) => item.name === sheetName) : book[0];
    if (!sheet || sheet.rows.length > 251 || tooWide(sheet)) throw new Error("Use uma aba com até 250 linhas de trabalhos e 100 colunas.");
    rows = sheet.rows;
    sheet.formulas.forEach((row) => formulas.add(row));
  } else if (/\.json$/i.test(file.name)) {
    const data: unknown = JSON.parse(await file.text());
    if (!Array.isArray(data) || !data.length || data.length > 250 || !data.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
      throw new Error("O JSON deve conter uma lista de até 250 trabalhos.");
    }
    const columns = [...new Set(data.flatMap((item) => Object.keys(item)))];
    if (columns.length > 100) throw new Error("O arquivo tem mais de 100 campos.");
    rows = [columns, ...data.map((item) => columns.map((key) => {
      const value = Object.prototype.hasOwnProperty.call(item, key) ? item[key] : "";
      return Array.isArray(value) ? value.filter((entry) => typeof entry === "string").join("; ")
        : typeof value === "string" || typeof value === "number" ? String(value) : "";
    }))];
  } else if (/\.csv$/i.test(file.name)) {
    const text = (await file.text()).replace(/^\uFEFF/, "");
    const first = text.split(/\r?\n/, 1)[0];
    rows = csv(text, first.includes(";") && !first.includes(",") ? ";" : ",");
  } else throw new Error("Use XLSX, CSV ou o JSON do portfólio.");
  if (rows.length < 2 || rows.length > 251 || !rows[0].length || rows[0].length > 100) throw new Error("A origem deve ter cabeçalho e até 250 linhas de trabalhos.");
  return { table: { columns: rows[0], rows: rows.slice(1), formulas }, sheets };
}

const aliases: Record<string, string[]> = {
  Título: ["title", "titulo", "nome"], Função: ["funcao", "role", "atividade", "activities", "atuacao"],
  Categoria: ["category"], Cliente: ["client"], Softwares: ["software", "tools", "tecnologias"],
  Descrição: ["description", "sinopse", "synopsis", "descricao"], Link: ["link", "url", "youtube", "vimeo", "site", "mediaurl"],
  Capa: ["cover", "thumbnail", "imagem"], Galeria: ["gallery", "imagens"], GitHub: ["github", "repository", "repositoryurl", "code"],
  Proporção: ["aspect", "proporcao"], Formato: ["kind", "tipo", "formato"], Ano: ["year"],
};
const normalized = (name: string) => name.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function guessMapping(columns: string[]) {
  const names = columns.map(normalized);
  return headers.map((header) => names.findIndex((name) => name === normalized(header) || aliases[header]?.includes(name)));
}

export function previewExternal(table: ExternalTable, mapping: number[], kind: WorkKind, fallbackRole: string, existing: Work[], fallback: Visibility = "private") {
  const rows = table.rows.map((row) => {
    if (!row.some((value) => value.trim())) return [];
    const values = mapping.map((column) => row[column] ?? "");
    const format = values[1].trim();
    if (!format || /^\d+:\d+$/.test(format)) values[1] = kind;
    if (format === "16:9" || format === "9:16") values[18] ||= format;
    values[3] = values[3].trim().replace(/[,;]+$/, "").trim() || fallbackRole.trim();
    if (values[1] === "video" && /^[\w-]{11}$/.test(values[8].trim())) values[8] = `https://www.youtube.com/watch?v=${values[8].trim()}`;
    for (const index of [12, 13, 15]) if (!values[index].includes(";")) values[index] = values[index].replace(/,/g, ";");
    if (!values[10].includes("\n")) values[10] = values[10].replace(/; /g, "\n");
    return values;
  });
  return mapWorks(rows, existing, table.formulas, fallback);
}
