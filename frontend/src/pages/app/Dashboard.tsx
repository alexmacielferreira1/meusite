import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { DEMO_MODE } from "../../config/app";
import type { Analytics } from "../../types/portfolio";
import { ArrowRight, Eye, MoreHorizontal, MousePointerClick, Play, Plus, Sparkles, Star } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CompletionCard } from "../../components/Completeness";
import { PageHeader } from "../../components/layout/AppShell";
import { ResumeImport } from "../../components/ResumeImport";
import { applyImport } from "../../lib/resumeParse";
import { useStore } from "../../lib/store";
import { coverStyle } from "../../lib/utils";

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(1, ...data);
  const w = 280, h = 56;
  const pts = data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * w},${h - (v / max) * (h - 6) - 3}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full" preserveAspectRatio="none" role="img" aria-label="Visitas nos últimos 14 dias">
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill="rgba(91,61,245,.12)" stroke="none" />
      <polyline points={pts} fill="none" stroke="#5b3df5" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function Dashboard() {
  const { portfolio: p, update } = useStore();
  const nav = useNavigate();
  const pr = p.profile;
  const [liveAnalytics, setLiveAnalytics] = useState<Analytics>();
  useEffect(() => { if (!DEMO_MODE) api.analytics().then(setLiveAnalytics).catch(() => {}); }, []);
  const analytics = liveAnalytics ?? p.analytics;
  const visits = analytics.visits.reduce((a, b) => a + b, 0);

  // O atalho "Perfil N%" do topo leva às pendências deste painel.
  const { hash } = useLocation();
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView?.({ behavior: "smooth" }); }, [hash]);
  const strip = p.works.slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <PageHeader title={`Olá, ${pr.name.split(" ")[0]}!`} subtitle="Gerencie seus trabalhos, organize seu portfólio e publique sua vitrine profissional."
        action={<button onClick={() => nav("/app/trabalhos?novo=1")} className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-600 px-5 font-semibold text-white shadow-sm hover:bg-brand-700"><Plus size={20} /> Novo trabalho</button>} />

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_420px]">
        <div className="min-w-0 space-y-6" data-testid="dashboard-main-column">
        {/* banner */}
        <section className="relative overflow-hidden rounded-3xl bg-plum-900 p-6 text-white sm:p-7">
          <svg className="pointer-events-none absolute -bottom-10 right-40 h-72 w-96 opacity-40" viewBox="0 0 400 300" aria-hidden>
            {Array.from({ length: 14 }).map((_, i) => <path key={i} d={`M0 ${300 - i * 6} C 150 ${260 - i * 10}, 250 ${120 - i * 6}, 400 ${40 - i * 4}`} stroke="#8f72ff" strokeWidth="1" fill="none" />)}
          </svg>
          <div className="relative grid items-center gap-5 md:grid-cols-[1fr_120px]">
            <div>
              <h2 className="font-display text-3xl font-bold leading-[1.1] sm:text-4xl">Seu trabalho merece uma boa vitrine.</h2>
              <p className="mt-5 max-w-md text-white/75">Reúna seus projetos, conte sua trajetória e compartilhe sua visão como criadora e profissional da comunicação.</p>
              <Link to="/app/secoes" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-semibold hover:bg-brand-500">Organizar meu portfólio <ArrowRight size={18} /></Link>
            </div>
            <div className="hidden max-h-56 gap-3 overflow-hidden md:flex">
              <div className="flex flex-col justify-around">{Array.from({ length: 10 }).map((_, i) => <span key={i} className="h-2.5 w-2 rounded-sm bg-white/20" />)}</div>
              <div className="flex flex-1 flex-col gap-3">
                {strip.map((w) => <div key={w.id} className="aspect-[4/3] rounded-xl" style={coverStyle(w.cover)} />)}
              </div>
            </div>
          </div>
        </section>

        {/* trabalhos recentes */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-plum-900">Trabalhos recentes</h2>
            <Link to="/app/trabalhos" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700">Ver todos os trabalhos <ArrowRight size={16} /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {p.works.slice(0, 3).map((w, i) => (
              <Link to="/app/trabalhos" key={w.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-md">
                <div className="relative aspect-[16/10]" style={coverStyle(w.cover)}>
                  {w.kind === "video" && <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white"><Play size={11} fill="currentColor" /> vídeo</span>}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-slate-900">{w.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{w.category} · {w.role}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400"><span>{["Há 3 dias", "Há 1 semana", "Há 2 semanas"][i]}</span><MoreHorizontal size={16} /></div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        </div>
        <aside className="min-w-0 space-y-6">
        {/* checklist */}
        <section className="rounded-3xl border border-slate-200 bg-white p-7">
          <h2 className="font-display text-2xl font-bold text-plum-900">Prepare sua vitrine</h2>
          <p className="mt-1 text-slate-500">Comece pelo currículo: lemos e preenchemos o perfil para você. Depois complete o que faltar, no seu ritmo.</p>
          <ResumeImport compact onApply={(data, picks) => update((current) => applyImport(current, data, picks))} />
          <CompletionCard portfolio={p} extra={p.site.published ? [] : [{ id: "publicar", label: "Publique seu site e compartilhe o link", to: "/app/publicacao" }]} />
        </section>

        {/* assistente */}
        <section className="relative overflow-hidden rounded-3xl bg-brand-50 p-7">
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-plum-900"><Sparkles className="text-brand-600" /> Assistente IA</h2>
          <p className="mt-3 text-slate-600">Conte com a IA para aprimorar textos do seu portfólio, como bio, descrições de trabalhos e destaques da sua trajetória.</p>
          <Link to="/app/assistente" className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-brand-600 bg-white py-3 font-semibold text-brand-700 hover:bg-brand-50"><Sparkles size={18} /> Melhorar minha bio</Link>
        </section>

        </aside>
        {/* números */}
        <section className="grid gap-4 sm:grid-cols-3 xl:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="flex items-center gap-2 text-sm text-slate-500"><Eye size={16} /> Visitas · 14 dias</p>
            <p className="mt-1 font-display text-3xl font-bold text-plum-900">{visits}</p>
            <Sparkline data={analytics.visits} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="flex items-center gap-2 text-sm text-slate-500"><MousePointerClick size={16} /> Cliques em contato</p>
            <p className="mt-1 font-display text-3xl font-bold text-plum-900">{analytics.contactClicks}</p>
            <p className="mt-2 text-sm text-slate-500">WhatsApp, e-mail e formulário.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="flex items-center gap-2 text-sm text-slate-500"><Star size={16} /> Trabalho mais visto</p>
            <p className="mt-2 font-semibold text-slate-900">{analytics.topWork || "Ainda sem dados"}</p>
            <p className="mt-2 text-sm text-slate-500">{p.works.length} trabalhos no portfólio</p>
          </div>
        </section>
      </div>
    </div>
  );
}

