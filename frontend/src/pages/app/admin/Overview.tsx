import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type AdminOverview } from "../../../lib/api";
import { money } from "./format";

const PLAN_LABEL = { gratuito: "Gratuito", teste: "Teste", pro: "Pro" } as const;

function Stat({ label, value, hint, to }: { label: string; value: string | number; hint?: string; to?: string }) {
  const body = <><span className="block text-sm text-slate-500">{label}</span>
    <b className="mt-1 block font-display text-3xl text-plum-900">{value}</b>
    {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}</>;
  const style = "block rounded-2xl border border-slate-200 bg-white p-5";
  return to ? <Link to={to} className={`${style} hover:border-brand-300`}>{body}</Link> : <div className={style}>{body}</div>;
}

/** Painel com os números do sistema: contas, sites, pagamentos, IA e erros abertos. */
export default function Overview() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api.adminOverview().then(setData).catch((e: Error) => setError(e.message)); }, []);
  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-sm text-slate-500">Carregando números…</p>;
  const { accounts, sites, payments } = data;
  const peak = Math.max(1, ...data.signups.map((d) => d.count));
  const origins = data.origins ?? [];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Contas" value={accounts.total} hint={`${accounts.new_7d} novas em 7 dias · ${accounts.new_30d} em 30`} to="/app/admin/usuarios" />
        <Stat label="Ativas em 7 dias" value={accounts.active_7d} hint={`${accounts.testers} de teste · ${accounts.suspended} suspensas`} />
        <Stat label="Recebido no mês" value={money(payments.month_cents)} hint={`${money(payments.total_cents)} no total · ${payments.count} pagamentos`} to="/app/admin/pagamentos" />
        <Stat label="Erros abertos" value={data.errors_open} hint={data.errors_open ? "Veja e marque como resolvido" : "Nada pendente"} to="/app/admin/erros" />
        <Stat label="Sites publicados" value={sites.published} />
        <Stat label="Hotsites ativos" value={sites.hotsites} />
        <Stat label="Visitas em 30 dias" value={sites.visits_30d} hint="Sites publicados de todas as contas" />
        <Stat label="Créditos de IA em contas" value={data.ai_credits} hint="Saldo somado das contas" to="/app/admin/ia" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-plum-900">Cadastros nos últimos 30 dias</h2>
          <div className="mt-5 flex h-40 items-end gap-1" role="img" aria-label={`Cadastros por dia: ${data.signups.reduce((n, d) => n + d.count, 0)} em 30 dias`}>
            {data.signups.map((d) => (
              <div key={d.day} title={`${d.day.split("-").reverse().join("/")}: ${d.count}`} className="flex h-full flex-1 items-end">
                <span className={`block w-full rounded-t ${d.count ? "bg-brand-500" : "bg-slate-100"}`} style={{ height: `${Math.max(4, (d.count / peak) * 100)}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500"><span>{data.signups[0].day.split("-").reverse().join("/")}</span><span>hoje</span></div>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-plum-900">Contas por plano</h2>
          <ul className="mt-4 space-y-3">{(Object.keys(PLAN_LABEL) as (keyof typeof PLAN_LABEL)[]).map((plan) => (
            <li key={plan} className="flex items-center justify-between text-sm"><span>{PLAN_LABEL[plan]}</span><b>{data.plans[plan]}</b></li>))}</ul>
        </section>
      </div>

      <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-plum-900">Cadastros por origem</h2>
        <p className="mt-1 text-sm text-slate-500">Pelas etiquetas do link (utm_source, utm_medium, utm_campaign, utm_content). Publicado = conta com o portfólio no ar.</p>
        {origins.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2 pr-3">Origem</th><th className="py-2 pr-3">Campanha</th><th className="py-2 pr-3">Anúncio</th><th className="py-2 pr-3 text-right">Cadastros</th><th className="py-2 pr-3 text-right">Publicados</th><th className="py-2 text-right">% publicados</th></tr></thead>
          <tbody>{origins.map((o) => (
            <tr key={[o.source, o.medium, o.campaign, o.content].join("|")} className="border-t border-slate-100">
              <td className="py-2 pr-3">{o.source ? [o.source, o.medium].filter(Boolean).join(" · ") : "Direto (sem etiqueta)"}</td>
              <td className="py-2 pr-3">{o.campaign ?? "—"}</td>
              <td className="py-2 pr-3">{o.content ?? "—"}</td>
              <td className="py-2 pr-3 text-right font-semibold">{o.signups}</td>
              <td className="py-2 pr-3 text-right">{o.published}</td>
              <td className="py-2 text-right">{Math.round((o.published / o.signups) * 100)}%</td>
            </tr>))}</tbody>
        </table></div> : <p className="mt-4 text-sm text-slate-500">Nenhum cadastro ainda.</p>}
      </section>
    </div>
  );
}
