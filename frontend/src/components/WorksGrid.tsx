import { Plus, Trash2 } from "lucide-react";
import { useState, type ClipboardEvent } from "react";
import { DEMO_MODE } from "../config/app";
import { WORK_KINDS, headers, mapWorks, workToRow } from "../lib/workSpreadsheet";
import { useStore } from "../lib/store";
import type { Work } from "../types/portfolio";

/** Colunas visíveis na grade (índices em `headers`). As demais são preservadas sem aparecer. */
const COLUMNS: { index: number; width: string; hint?: string }[] = [
  { index: 1, width: "w-32" }, { index: 2, width: "w-56" }, { index: 3, width: "w-40" }, { index: 4, width: "w-40" },
  { index: 5, width: "w-20" }, { index: 6, width: "w-36" }, { index: 8, width: "w-56", hint: "YouTube, Vimeo, Spotify ou link da matéria" },
  { index: 7, width: "w-72" }, { index: 12, width: "w-48", hint: "Separe por ponto e vírgula" }, { index: 13, width: "w-48", hint: "Separe por ponto e vírgula" },
  { index: 16, width: "w-32" },
];
const VISIBILITY: Record<string, string> = { public: "Público", link: "Só com link", private: "Privado" };
const KEY_FIELDS = [2, 3, 4, 7, 8];

const blankRow = () => {
  const row = headers.map(() => "");
  row[1] = WORK_KINDS.video; row[5] = String(new Date().getFullYear()); row[16] = "public";
  return row;
};

/** Lê o que foi copiado do Excel ou do Google Planilhas (colunas separadas por tabulação). */
export function parseClipboard(text: string) {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && !cell) quoted = true;
    else if (c === "\t") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      rows.push([...row, cell]); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) rows.push([...row, cell]);
  return rows.map((values) => values.map((value) => value.trim()));
}

const kindValue = (value: string) => {
  const key = (Object.keys(WORK_KINDS) as (keyof typeof WORK_KINDS)[]).find((kind) => [kind, WORK_KINDS[kind].toLowerCase()].includes(value.trim().toLowerCase())
    || (value.trim().length >= 3 && WORK_KINDS[kind].toLowerCase().startsWith(value.trim().toLowerCase())));
  return key ? WORK_KINDS[key] : value;
};
const visibilityValue = (value: string) => Object.entries(VISIBILITY).find(([key, label]) => [key, label.toLowerCase()].includes(value.trim().toLowerCase()))?.[0] ?? value;

export function WorksGrid({ onClose }: { onClose: () => void }) {
  const { portfolio: p, update, flush } = useStore();
  const [rows, setRows] = useState<string[][]>(() => p.works.length ? p.works.map(workToRow) : [blankRow(), blankRow(), blankRow()]);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const setCell = (row: number, column: number, value: string) =>
    setRows((current) => current.map((values, i) => i === row ? values.map((cell, j) => j === column ? value : cell) : values));

  function paste(event: ClipboardEvent<HTMLElement>, row: number, position: number) {
    const text = event.clipboardData.getData("text/plain");
    if (!/[\t\n]/.test(text.replace(/\r?\n$/, ""))) return;
    event.preventDefault();
    const block = parseClipboard(text.replace(/\r?\n$/, ""));
    setRows((current) => {
      const next = current.map((values) => [...values]);
      block.forEach((values, r) => {
        while (next.length <= row + r) next.push(blankRow());
        values.forEach((value, c) => {
          const column = COLUMNS[position + c]?.index;
          if (column === undefined) return;
          next[row + r][column] = column === 1 ? kindValue(value) : column === 16 ? visibilityValue(value) : value;
        });
      });
      return next.slice(0, 250);
    });
    setMessage(`${block.length} linha(s) coladas. Confira e salve.`);
  }

  async function save() {
    // Linha sem título, função, cliente, link nem descrição conta como vazia.
    const prepared = rows.map((values) => KEY_FIELDS.some((index) => values[index].trim()) ? values : []);
    const result = mapWorks(prepared, p.works);
    const realErrors = result.errors.filter((error) => error !== "A planilha não tem trabalhos preenchidos.");
    if (realErrors.length) {
      setErrors(realErrors.map((error) => error.replace(/^Linha (\d+)/, (_, n) => `Linha ${Number(n) - 1}`)));
      return;
    }
    const kept = new Set(result.works.map((work) => work.id));
    const removed = p.works.filter((work) => !kept.has(work.id));
    if (removed.length && !window.confirm(`${removed.length} trabalho(s) saíram da tabela e serão excluídos do acervo. Continuar?`)) return;
    setErrors([]); setBusy(true);
    const works: Work[] = result.works;
    update((current) => ({ ...current, works }));
    try { await flush(); setMessage(DEMO_MODE ? "Tabela salva no acervo de demonstração." : "Tabela salva no acervo."); }
    catch { setMessage("Tabela aplicada ao rascunho. O servidor ainda não salvou a alteração."); }
    finally { setBusy(false); }
  }

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4" aria-label="Editar trabalhos em tabela">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Editar em tabela</h2>
          <p className="text-sm text-slate-600">Digite direto nas células ou copie linhas do Excel ou do Google Planilhas e cole na primeira célula. A ordem das colunas é a da tabela.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={() => void save()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Salvar tabela</button>
          <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Fechar</button>
        </div>
      </div>
      {!!errors.length && <ul className="mt-3 text-sm text-red-700">{errors.slice(0, 10).map((error) => <li key={error}>{error}</li>)}</ul>}
      {message && <p role="status" className="mt-3 text-sm text-plum-900">{message}</p>}
      <div className="mt-3 max-h-[60vh] overflow-auto rounded-lg border">
        <table className="text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr><th className="w-10 p-2">#</th>{COLUMNS.map(({ index, hint }) => <th key={index} title={hint} className="p-2 font-semibold">{headers[index]}{index === 2 || index === 3 ? " *" : ""}</th>)}<th className="p-2" /></tr>
          </thead>
          <tbody>
            {rows.map((values, row) => (
              <tr key={row} className="border-t align-top">
                <td className="p-2 text-slate-400">{row + 1}</td>
                {COLUMNS.map(({ index, width }, position) => {
                  const label = `${headers[index]} da linha ${row + 1}`;
                  const common = { "aria-label": label, onPaste: (event: ClipboardEvent<HTMLElement>) => paste(event, row, position), className: `${width} rounded border border-transparent bg-transparent px-2 py-1 hover:border-slate-200 focus:border-brand-400 focus:bg-white focus:outline-none` };
                  return <td key={index} className="p-1">
                    {index === 1 ? <select {...common} value={values[1]} onChange={(event) => setCell(row, 1, event.target.value)}>
                      {Object.values(WORK_KINDS).map((kind) => <option key={kind}>{kind}</option>)}
                      {!Object.values(WORK_KINDS).includes(values[1]) && <option>{values[1]}</option>}
                    </select>
                      : index === 16 ? <select {...common} value={values[16]} onChange={(event) => setCell(row, 16, event.target.value)}>
                        {Object.entries(VISIBILITY).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
                        {!VISIBILITY[values[16]] && <option value={values[16]}>{values[16]}</option>}
                      </select>
                        : <input {...common} value={values[index]} onChange={(event) => setCell(row, index, event.target.value)} />}
                  </td>;
                })}
                <td className="p-1"><button type="button" aria-label={`Remover linha ${row + 1}`} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  onClick={() => setRows((current) => current.filter((_, i) => i !== row))}><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <button type="button" disabled={rows.length >= 250} onClick={() => setRows((current) => [...current, blankRow()])} className="inline-flex items-center gap-1 font-semibold text-brand-700"><Plus size={16} /> Adicionar linha</button>
        <button type="button" disabled={rows.length >= 250} onClick={() => setRows((current) => [...current, ...Array.from({ length: 5 }, blankRow)].slice(0, 250))} className="font-semibold text-brand-700">+5 linhas</button>
        <span className="text-slate-500">* obrigatório. Capa, galeria e demais campos continuam no editor de cada trabalho.</span>
      </div>
    </section>
  );
}
