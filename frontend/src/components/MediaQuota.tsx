import { DEMO_MODE } from "../config/app";
import { HardDrive } from "lucide-react";
import { Link } from "react-router-dom";
import { fmtBytes, quotaBytes, usedBytes } from "../lib/media";
import type { Portfolio } from "../types/portfolio";

export function MediaQuota({ p, compact }: { p: Portfolio; compact?: boolean }) {
  const used = DEMO_MODE ? usedBytes(p) : new TextEncoder().encode(JSON.stringify({ portfolio: p, revision: Number.MAX_SAFE_INTEGER })).length;
  const quota = DEMO_MODE ? quotaBytes(p) : 8 * 1024 ** 2;
  const pct = Math.min(100, (used / quota) * 100);
  return (
    <div className={compact ? "flex items-center gap-3 text-sm" : "rounded-2xl border border-slate-200 bg-white p-4"}>
      <HardDrive size={18} className="text-brand-700" />
      <div className="min-w-40 flex-1">
        <div className="flex justify-between text-xs text-slate-600"><span>{DEMO_MODE ? "Arquivos próprios:" : "Rascunho estimado:"} <b>{fmtBytes(used)}</b> de {DEMO_MODE ? fmtBytes(quota) : "8 MiB no envio completo"}</span>{!compact && <span>{pct.toFixed(0)}%</span>}</div>
        <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${pct > 85 ? "bg-amber-500" : "bg-brand-600"}`} style={{ width: `${pct}%` }} /></div>
        {!compact && <p className="mt-1.5 text-[11px] text-slate-500">{DEMO_MODE ? "Vídeos por link (YouTube, Vimeo) não contam. Um arquivo usado em várias páginas e hotsites conta uma vez." : "O limite atual inclui imagens e textos do rascunho. Para vídeos, use links. Espaço adicional ainda não está disponível no piloto."}</p>}
      </div>
      {DEMO_MODE && <Link to="/app/configuracoes" className="shrink-0 text-xs font-semibold text-brand-700">Mais espaço</Link>}
    </div>
  );
}
