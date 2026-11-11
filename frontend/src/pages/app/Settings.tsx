import { DEMO_MODE } from "../../config/app";
import { Check, Download, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/layout/AppShell";
import { useStore } from "../../lib/store";
import { cn } from "../../lib/utils";
import { CREDIT_PACKS, PLANS } from "../public/Landing";
import { MediaQuota } from "../../components/MediaQuota";
import { MEDIA_EXTRA } from "../../lib/media";
import type { PlanId } from "../../types/portfolio";

export default function Settings() {
  const { portfolio: p, update, resetDemo, user } = useStore();
  const nav = useNavigate();
  return (
    <div className="mx-auto max-w-6xl p-5 sm:p-8">
      <PageHeader title="Configurações" subtitle="Plano, conta e dados." />

      {!DEMO_MODE && <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-xl font-bold text-plum-900">Plano piloto</h2>
        <p className="mt-2 text-sm text-slate-600">Acesso gratuito durante o piloto. Planos pagos e contratação ainda não estão disponíveis. {p.aiCredits} créditos de IA disponíveis nesta conta.</p>
      </div>}
      {!DEMO_MODE && <section className="mt-5"><MediaQuota p={p} /></section>}
      {DEMO_MODE && <>
      <h2 className="font-display text-xl font-bold text-plum-900">Plano</h2>
      <p className="mt-1 text-sm text-slate-500">Na demonstração as compras são simuladas. A cobrança real (Pix e cartão) fica na Central de SaaS, com custo, prazo e condições mostrados antes de confirmar.</p>
      <div className="mt-4 grid gap-5 md:grid-cols-3">
        {PLANS.map((pl) => {
          const isPlan = pl.id === "gratis" || pl.id === "essencial";
          const current = p.plan === pl.id;
          return (
            <div key={pl.id} className={cn("flex flex-col rounded-3xl border bg-white p-6", current ? "border-brand-500 ring-2 ring-brand-100" : "border-slate-200")}>
              <div className="flex items-center justify-between gap-2"><h3 className="text-lg font-bold">{pl.name}</h3>{current && <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">Atual</span>}{!isPlan && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Avulso</span>}</div>
              <p className="mt-2"><span className="font-display text-3xl font-bold text-plum-900">{pl.price}</span> <span className="text-sm text-slate-500">{pl.period}</span></p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">{pl.items.map((i) => <li key={i} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-brand-600" />{i}</li>)}</ul>
              {isPlan ? (
                <button disabled={current} onClick={() => update((x) => { x.plan = pl.id as PlanId; x.aiCredits = pl.id === "gratis" ? 10 : 50; return x; })}
                  className={cn("mt-6 rounded-xl py-2.5 text-sm font-semibold", current ? "bg-slate-100 text-slate-400" : "bg-brand-600 text-white hover:bg-brand-700")}>{current ? "Seu plano" : `Mudar para ${pl.name}`}</button>
              ) : (
                <button disabled className="mt-6 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-400" title="Tela de hotsite: próxima etapa do roadmap">Criar hotsite · em breve</button>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white p-5">
        <p className="mr-auto text-sm"><b className="text-plum-900">Créditos de IA:</b> {p.aiCredits} disponíveis · o custo de cada ação aparece antes de gerar; se falhar, nada é cobrado.</p>
        {CREDIT_PACKS.map((c) => (
          <button key={c.credits} onClick={() => update((x) => { x.aiCredits += c.credits; return x; })} className="rounded-xl border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100">+{c.credits} créditos · {c.price}</button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="min-w-64 flex-1"><MediaQuota p={p} compact /></div>
        {MEDIA_EXTRA.map((m) => (
          <button key={m.gb} onClick={() => update((x) => { x.mediaExtraGb = (x.mediaExtraGb ?? 0) + m.gb; return x; })} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">+{m.gb} GB · {m.price}</button>
        ))}
        {(p.mediaExtraGb ?? 0) > 0 && <span className="text-xs text-slate-500">Extra contratado: {p.mediaExtraGb} GB</span>}
      </div>
      <p className="mt-2 text-xs text-slate-500">No checkout ficam separados: assinatura · créditos de IA · mídia extra · hotsites.</p>

      </>}
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold text-plum-900">Conta</h2>
          <p className="mt-3 text-sm text-slate-600">E-mail: <b>{user?.email ?? "modo demonstração (sem login)"}</b></p>
          <p className="mt-1 text-sm text-slate-600">Créditos de IA: <b>{p.aiCredits}</b></p>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold text-plum-900">Dados</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => { const b = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "meu-portfolio.json"; a.click(); }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"><Download size={16} /> Exportar meus dados</button>
            {DEMO_MODE && <button onClick={() => { resetDemo(); nav("/app"); }} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><RotateCcw size={16} /> Restaurar demonstração</button>}
            <button onClick={() => nav("/app/comecar")} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Refazer o onboarding</button>
          </div>
        </section>
      </div>
    </div>
  );
}
