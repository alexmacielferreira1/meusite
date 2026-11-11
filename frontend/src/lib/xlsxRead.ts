/**
 * Lê as abas de um .xlsx como texto. Usa o ExcelJS e, se ele falhar, um leitor próprio
 * que aceita arquivos gravados por outras ferramentas (prefixos como "x:" no XML).
 */
export interface SheetData { name: string; rows: string[][]; formulas: Set<number> }

const MAX_COLUMNS = 100;

/** Remove linhas vazias do fim e colunas vazias à direita. */
export function trimRows(rows: string[][]) {
  const filled = (row: string[]) => row.some((cell) => cell.trim());
  let end = rows.length;
  while (end > 0 && !filled(rows[end - 1])) end--;
  const kept = rows.slice(0, end);
  const width = Math.max(0, ...kept.map((row) => {
    let last = row.length;
    while (last > 0 && !row[last - 1].trim()) last--;
    return last;
  }));
  return kept.map((row) => Array.from({ length: width }, (_, i) => row[i] ?? ""));
}

async function withExcelJs(buffer: ArrayBuffer): Promise<SheetData[]> {
  const { Workbook } = await import("exceljs");
  const book = new Workbook();
  await book.xlsx.load(buffer);
  return book.worksheets.map((sheet) => {
    const formulas = new Set<number>();
    const columns = Math.min(sheet.columnCount, MAX_COLUMNS + 1);
    const rows = Array.from({ length: sheet.rowCount }, (_, i) => Array.from({ length: columns }, (_, j) => {
      const cell = sheet.getRow(i + 1).getCell(j + 1);
      if (cell.formula) formulas.add(i + 1);
      return cell.text;
    }));
    return { name: sheet.name, rows: trimRows(rows), formulas };
  });
}

const children = (node: Element, name: string) => Array.from(node.children).filter((child) => child.localName === name);
const descendants = (node: Document | Element, name: string) => Array.from(node.getElementsByTagName("*")).filter((child) => child.localName === name);
const attr = (node: Element, name: string) => node.getAttribute(name)
  ?? Array.from(node.attributes).find((item) => item.localName === name)?.value ?? "";

/** Converte "AB12" no índice da coluna (base 0). */
export function columnIndex(ref: string) {
  const letters = /^[A-Z]+/i.exec(ref)?.[0].toUpperCase() ?? "";
  return letters.split("").reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function resolve(base: string, target: string) {
  if (target.startsWith("/")) return target.slice(1);
  const parts = base.split("/").slice(0, -1);
  for (const piece of target.split("/")) {
    if (piece === "..") parts.pop();
    else if (piece && piece !== ".") parts.push(piece);
  }
  return parts.join("/");
}

export async function withXmlReader(buffer: ArrayBuffer): Promise<SheetData[]> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(buffer);
  const xml = async (path: string) => {
    const file = zip.file(path);
    return file ? new DOMParser().parseFromString(await file.async("string"), "application/xml") : null;
  };
  const relations = async (path: string) => {
    const doc = await xml(path);
    return doc ? descendants(doc, "Relationship") : [];
  };
  const main = (await relations("_rels/.rels")).find((rel) => attr(rel, "Type").endsWith("/officeDocument"));
  const workbookPath = main ? resolve("", attr(main, "Target")) : "xl/workbook.xml";
  const workbook = await xml(workbookPath);
  if (!workbook) throw new Error("Planilha sem pasta de trabalho.");
  const relsPath = workbookPath.replace(/[^/]+$/, (file) => `_rels/${file}.rels`);
  const rels = new Map((await relations(relsPath))
    .map((rel) => [attr(rel, "Id"), { type: attr(rel, "Type"), target: resolve(workbookPath, attr(rel, "Target")) }]));
  const sharedPath = [...rels.values()].find((rel) => rel.type.endsWith("/sharedStrings"))?.target;
  const shared = sharedPath ? await xml(sharedPath) : null;
  const strings = shared ? descendants(shared, "si").map((item) => descendants(item, "t").map((t) => String(t.textContent)).join("")) : [];
  const sheets: SheetData[] = [];
  for (const sheet of descendants(workbook, "sheet")) {
    const target = rels.get(attr(sheet, "id"))?.target;
    const doc = target ? await xml(target) : null;
    if (!doc) continue;
    const rows: string[][] = [];
    const formulas = new Set<number>();
    let next = 1;
    for (const row of descendants(doc, "row")) {
      const number = Number(attr(row, "r")) || next;
      next = number + 1;
      if (number > 5000) break;
      const values: string[] = [];
      let column = 0;
      for (const cell of children(row, "c")) {
        const ref = attr(cell, "r");
        column = ref ? columnIndex(ref) : column;
        if (column > MAX_COLUMNS) break;
        const type = attr(cell, "t");
        const value = children(cell, "v")[0]?.textContent ?? "";
        if (children(cell, "f").length) formulas.add(number);
        values[column] = type === "s" ? strings[Number(value)] ?? ""
          : type === "inlineStr" ? descendants(cell, "t").map((t) => String(t.textContent)).join("")
          : type === "b" ? (value === "1" ? "VERDADEIRO" : "FALSO") : value;
        column++;
      }
      rows[number - 1] = Array.from(values, (value) => value ?? "");
    }
    sheets.push({ name: attr(sheet, "name"), rows: trimRows(Array.from(rows, (row) => row ?? [])), formulas });
  }
  if (!sheets.length) throw new Error("Planilha sem abas.");
  return sheets;
}

export async function readXlsx(file: File): Promise<SheetData[]> {
  const buffer = await file.arrayBuffer();
  try { return await withExcelJs(buffer); }
  catch {
    try { return await withXmlReader(buffer); }
    catch { throw new Error("Não foi possível abrir esta planilha. Salve de novo no Excel ou no Google Planilhas como .xlsx e tente outra vez."); }
  }
}

export function tooWide(sheet: SheetData) {
  return (sheet.rows[0]?.length ?? 0) > MAX_COLUMNS;
}
