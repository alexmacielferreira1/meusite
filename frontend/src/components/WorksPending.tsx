import { CheckCircle2, Upload } from "lucide-react";
import { useState } from "react";
import { MIN_DESCRIPTION, WORK_CHECKS, worksPending, type WorkCheckId } from "../lib/completeness";
import { useStore } from "../lib/store";
import { cn, coverStyle, imageToDataURL } from "../lib/utils";
import type { Work } from "../types/portfolio";
import { Input, Textarea } from "./ui";

const YEAR = /^(19|20)\d{2}$/;

/** Uma linha da pendência: o trabalho e só o campo que falta. Ao salvar, ele deixa a lista. */
function PendingRow({ work, check, onEdit, onSaved }: { work: Work; check: WorkCheckId; onEdit: (w: Work) => void; onSaved: (title: string) => void }) {
  const { update } = useStore();
  const [value, setValue] = useState(check === "descricoes" ? work.description : check === "anos" ? work.year : "");
  const [error, setError] = useState("");
  const field = check === "anos" ? "ano" : check === "descricoes" ? "descrição" : "capa";

  function save(next = value) {
    const text = next.trim();
    if (check === "anos" && !YEAR.test(text)) return setError("Informe o ano com 4 dígitos, ex.: 2024.");
    if (check === "descricoes" && text.length < MIN_DESCRIPTION) return setError(`Escreva pelo menos ${MIN_DESCRIPTION} caracteres.`);
    if (check === "capas" && !/^(https?:\/\/\S+|data:image\/)/i.test(text)) return setError("Cole o link de uma imagem (https://…) ou envie um arquivo.");
    const patch: Partial<Work> = check === "anos" ? { year: text } : check === "descricoes" ? { description: text } : { cover: text };
    update((p) => { p.works = p.works.map((w) => w.id === work.id ? { ...w, ...patch } : w); return p; });
    onSaved(work.title);
  }

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="w-1/3 p-3">
        <p className="font-semibold text-slate-900">{work.title || "Sem título"}</p>
        <p className="text-xs text-slate-500">{[work.client, work.role].filter(Boolean).join(" · ")}</p>
        <button type="button" onClick={() => onEdit(work)} className="mt-1 text-xs font-semibold text-brand-700">Abrir ficha completa</button>
      </td>
      <td className="p-3">
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1">
            {check === "anos" && <Input aria-label={`Ano de ${work.title}`} inputMode="numeric" maxLength={4} placeholder="2024" className="w-28"
              value={value} onChange={(e) => { setValue(e.target.value.replace(/\D/g, "")); setError(""); }} />}
            {check === "descricoes" && <>
              <Textarea aria-label={`Descrição de ${work.title}`} rows={3} placeholder="O que foi o projeto e o que você fez nele"
                value={value} onChange={(e) => { setValue(e.target.value); setError(""); }} />
              <p className={cn("mt-1 text-xs", value.trim().length >= MIN_DESCRIPTION ? "text-emerald-700" : "text-slate-500")}>{value.trim().length}/{MIN_DESCRIPTION} caracteres no mínimo</p>
            </>}
            {check === "capas" && <div className="flex items-center gap-2">
              <Input aria-label={`Link da capa de ${work.title}`} placeholder="https://…/imagem.jpg" value={value} onChange={(e) => { setValue(e.target.value); setError(""); }} />
              <label className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm hover:bg-slate-50">
                <Upload size={14} /> Arquivo
                <input type="file" accept="image/jpeg,image/png,image/webp" aria-label={`Arquivo da capa de ${work.title}`} className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0]; e.target.value = "";
                  if (!file) return;
                  try { save(await imageToDataURL(file)); } catch { setError("Não foi possível abrir essa imagem."); }
                }} />
              </label>
              <span aria-hidden="true" className="h-10 w-16 shrink-0 rounded-lg" style={coverStyle(work.cover)} />
            </div>}
            {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
          </div>
          <button type="submit" className="h-10 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">Salvar {field}</button>
        </form>
      </td>
    </tr>
  );
}

/** Guia de pendências dos trabalhos: só o que falta, com o campo exato para preencher. */
export function WorksPending({ works, check, onCheck, onEdit, onDone }: {
  works: Work[]; check: WorkCheckId; onCheck: (id: WorkCheckId) => void; onEdit: (w: Work) => void; onDone: () => void;
}) {
  const [saved, setSaved] = useState("");
  const rows = worksPending(works, check);
  return (
    <section aria-label="Pendências dos trabalhos" className="rounded-2xl border border-slate-200 bg-white p-5">
      <div role="tablist" aria-label="Tipo de pendência" className="flex flex-wrap gap-2">
        {WORK_CHECKS.map((c) => {
          const n = worksPending(works, c.id).length;
          return <button key={c.id} role="tab" type="button" aria-selected={check === c.id} onClick={() => { onCheck(c.id); setSaved(""); }}
            className={cn("rounded-xl border px-4 py-2 text-sm", check === c.id ? "border-brand-100 bg-brand-100 font-semibold text-brand-700" : "border-slate-200 text-slate-700 hover:bg-slate-50")}>
            {c.tab} ({n})</button>;
        })}
      </div>
      {saved && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-800">“{saved}” salvo. Ele saiu das pendências e já está em Todos os trabalhos.</p>}
      {rows.length ? <>
        <p className="mt-4 text-sm text-slate-600">Preencha e salve linha por linha. Cada trabalho resolvido sai desta lista.</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="text-xs uppercase text-slate-500"><th className="p-3">Trabalho</th><th className="p-3">{WORK_CHECKS.find((c) => c.id === check)!.tab.replace("Sem ", "Preencher ")}</th></tr></thead>
            <tbody>{rows.map((work) => <PendingRow key={work.id} work={work} check={check} onEdit={onEdit} onSaved={setSaved} />)}</tbody>
          </table>
        </div>
      </> : <div className="mt-6 flex flex-col items-start gap-3">
        <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 size={18} /> Nenhuma pendência deste tipo.</p>
        <button type="button" onClick={onDone} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Ver todos os trabalhos</button>
      </div>}
    </section>
  );
}
