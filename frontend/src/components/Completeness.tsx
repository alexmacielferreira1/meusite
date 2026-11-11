import { CheckCircle2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { completeness, type Pending } from "../lib/completeness";
import type { Portfolio } from "../types/portfolio";

/** Barra da nota: roxa enquanto completa, verde em 100%. */
function Bar({ score, className = "h-2" }: { score: number; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-full bg-slate-100 ${className}`} role="progressbar" aria-label="Preenchimento do perfil" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-500 ${score === 100 ? "bg-emerald-500" : "bg-brand-600"}`} style={{ width: `${score}%` }} />
    </div>
  );
}

/**
 * Nota de preenchimento e pendências, sem pressa: mostra as próximas três e o resto só se a pessoa pedir.
 * extra: itens fora da nota (ex.: publicar o site), no fim da lista.
 */
export function CompletionCard({ portfolio, extra = [] }: { portfolio: Portfolio; extra?: Pending[] }) {
  const { score, pending } = completeness(portfolio);
  const [all, setAll] = useState(false);
  const items = [...pending, ...extra];
  const shown = all ? items : items.slice(0, 3);
  return (
    <div id="pendencias" className="mt-6 scroll-mt-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold text-plum-900">Preenchimento do perfil</p>
        <p className="font-display text-2xl font-bold text-plum-900">{score}%</p>
      </div>
      <Bar score={score} className="mt-2 h-2.5" />
      {items.length ? <>
        <p className="mt-3 text-sm text-slate-500">Complete aos poucos: cada item resolvido aumenta sua nota.</p>
        <ul aria-label="Pendências" className="mt-2 divide-y divide-slate-100">
          {shown.map((item) => (
            <li key={item.id}>
              <Link to={item.to} className="flex items-center gap-3 py-3 text-sm">
                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300" />
                <span className="flex-1 text-slate-800">{item.label}</span>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>
            </li>
          ))}
        </ul>
        {items.length > 3 && <button type="button" onClick={() => setAll(!all)} className="mt-1 text-sm font-semibold text-brand-700">
          {all ? "Mostrar menos" : `Ver todas as pendências (${items.length})`}</button>}
      </> : <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 size={18} /> Tudo preenchido. Sua vitrine está completa.</p>}
    </div>
  );
}

/** Indicador discreto no topo do painel: a nota atual, com atalho para as pendências. */
export function CompletionPill({ portfolio }: { portfolio: Portfolio }) {
  const { score } = completeness(portfolio);
  return (
    <Link to="/app#pendencias" title="Ver o que falta preencher" className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-plum-900 hover:border-brand-300 sm:inline-flex">
      Perfil {score}%
      <span aria-hidden="true"><Bar score={score} className="h-1.5 w-14" /></span>
    </Link>
  );
}
