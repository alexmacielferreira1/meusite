import { useState } from "react";
import { IMPORT_MODES, planImport, type ImportAction, type ImportMode } from "../lib/importPlan";
import { cn } from "../lib/utils";
import { WORK_KINDS } from "../lib/workSpreadsheet";
import type { Work } from "../types/portfolio";

const BADGE: Record<ImportAction, [string, string]> = {
  novo: ["Novo", "bg-emerald-50 text-emerald-800"], atualiza: ["Atualiza", "bg-brand-50 text-brand-700"], igual: ["Sem mudança", "bg-slate-100 text-slate-600"],
  ignorado: ["Já existe, fica igual", "bg-slate-100 text-slate-600"], privado: ["Fica privado", "bg-amber-50 text-amber-800"],
};

/**
 * Análise da planilha antes de aplicar: a pessoa escolhe o modo, vê o que muda em cada trabalho e confirma.
 * Nada é apagado; quem sai da planilha no modo "trocar tudo" vira privado.
 */
export function ImportReview({ existing, incoming, busy, onConfirm, onCancel }: {
  existing: Work[]; incoming: Work[]; busy: boolean; onConfirm: (works: Work[], summary: string) => void; onCancel: () => void;
}) {
  const [mode, setMode] = useState<ImportMode>("atualizar");
  const [all, setAll] = useState(false);
  const plan = planImport(existing, incoming, mode);
  const { counts } = plan;
  const summary = [counts.novo && `${counts.novo} novo(s)`, counts.atualiza && `${counts.atualiza} atualizado(s)`, counts.privado && `${counts.privado} ficam privados`,
    counts.igual && `${counts.igual} sem mudança`, counts.ignorado && `${counts.ignorado} já existentes ficam iguais`].filter(Boolean).join(" · ");
  const rows = all ? plan.rows : plan.rows.filter((row) => row.action === "novo" || row.action === "atualiza" || row.action === "privado");
  const nothing = !counts.novo && !counts.atualiza && !counts.privado;

  return (
    <div className="mt-3 text-sm">
      <fieldset>
        <legend className="font-semibold text-plum-900">Como aplicar esta planilha?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {IMPORT_MODES.map((option) => (
            <label key={option.id} className={cn("flex cursor-pointer gap-2 rounded-xl border p-3", mode === option.id ? "border-brand-500 bg-brand-50" : "border-slate-200")}>
              <input type="radio" name="modo-importacao" value={option.id} checked={mode === option.id} onChange={() => setMode(option.id)} className="mt-1" />
              <span><span className="block font-semibold">{option.label}</span><span className="block text-xs text-slate-500">{option.hint}</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      <p role="status" className="mt-3 font-medium text-plum-900">Análise: {summary || "nada a aplicar"}.</p>
      <label className="mt-1 flex items-center gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Mostrar também os que não mudam
      </label>
      {rows.length > 0 && <div className="mt-2 max-h-72 overflow-auto rounded-xl border border-slate-100">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-white"><tr>{["Trabalho", "Formato", "O que acontece", "Campos"].map((c) => <th key={c} className="p-2 text-xs uppercase text-slate-500">{c}</th>)}</tr></thead>
          <tbody>{rows.map((row, i) => <tr key={`${row.work.id}-${i}`} className="border-t border-slate-100">
            <td className="p-2">{row.work.title}</td>
            <td className="p-2">{WORK_KINDS[row.work.kind]}</td>
            <td className="p-2"><span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", BADGE[row.action][1])}>{BADGE[row.action][0]}</span></td>
            <td className="p-2 text-xs text-slate-600">{row.fields.join(", ")}</td>
          </tr>)}</tbody>
        </table>
      </div>}
      {plan.error && <p className="mt-2 text-red-700">{plan.error}</p>}
      <div className="mt-3 flex items-center gap-3">
        <button type="button" className="rounded-lg bg-brand-600 px-3 py-2 font-semibold text-white disabled:opacity-50" disabled={busy || nothing || !!plan.error}
          onClick={() => onConfirm(plan.works, summary)}>Confirmar importação</button>
        <button type="button" className="text-slate-600" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
