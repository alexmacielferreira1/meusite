import { portfolioPath } from "../../config/publicPaths";
import { Brush, Briefcase, ChevronDown, Library as LibraryIcon, Eye, Home, LayoutGrid, LayoutTemplate, LogOut, Menu, Radio, Settings, ShieldCheck, Sparkles, Upload, User } from "lucide-react";
import { useState, type ReactNode } from "react";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { DEMO_MODE } from "../../config/app";
import { api } from "../../lib/api";
import { CompletionPill } from "../Completeness";
import { useStore } from "../../lib/store";
import { cn, initials } from "../../lib/utils";

import { Logo } from "./Logo";

const items = [
  { to: "/app", label: "Visão geral", icon: Home, end: true },
  { to: "/app/perfil", label: "Meu perfil", icon: User },
  { to: "/app/trabalhos", label: "Trabalhos", icon: Briefcase },
  { to: "/app/modelos", label: "Modelos", icon: LayoutTemplate },
  { to: "/app/secoes", label: "Seções do site", icon: LayoutGrid },
  { to: "/app/estudio", label: "Estúdio de Arte", icon: Brush },
  { to: "/app/biblioteca", label: "Biblioteca", icon: LibraryIcon },
  { to: "/app/assistente", label: "Assistente IA", icon: Sparkles },
  { to: "/app/oportunidades", label: "Oportunidades", icon: Briefcase },
  { to: "/app/publicacao", label: "Publicação", icon: Radio },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
];

export function BrandMark({ to = "/app" }: { to?: string }) {
  return <div><Logo to={to} /><span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">Estúdio de portfólios</span></div>;
}

/** Cabeçalho padrão das páginas do painel (título grande + subtítulo + ação). */
export function PageHeader({ title, subtitle, icon, action }: { title: string; subtitle?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-3 font-display text-3xl font-bold tracking-tight text-plum-900 sm:text-4xl">{icon}{title}</h1>
        {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function AppShell() {
  const { portfolio, user, setUser, update, storageFull, ready, error, flush } = useStore();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  if (!ready) return <p className="p-8">Carregando conta…</p>;
  if (!DEMO_MODE && !user) return error ? <p className="p-8" role="alert">{error}</p> : <Navigate to="/entrar" replace />;
  const p = portfolio.profile;
  const menuItems = user?.admin && !DEMO_MODE ? [...items, { to: "/app/admin", label: "Administração", icon: ShieldCheck, end: false }] : items;
  const current = menuItems.find((i) => (i.end ? loc.pathname === i.to : loc.pathname.startsWith(i.to)));

  const side = (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="px-6 py-6"><BrandMark /></div>
      <nav className="flex-1 space-y-1 px-3">
        {menuItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
            className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] transition", isActive ? "bg-brand-100 font-semibold text-brand-700" : "text-slate-700 hover:bg-slate-50")}>
            <Icon size={19} />{label}
          </NavLink>
        ))}
      </nav>
      {portfolio.plan === "gratis" && (
        <div className="mx-3 mb-3 rounded-xl bg-brand-50 p-3.5">
          <p className="text-xs text-brand-700">Plano Grátis · {portfolio.aiCredits} créditos de IA</p>
          <button onClick={() => nav("/app/configuracoes")} className="mt-2 w-full rounded-lg bg-brand-600 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">Conhecer o Essencial</button>
        </div>
      )}
      <div className="relative border-t border-slate-200 px-4 py-4">
        <button onClick={() => setMenu(!menu)} className="flex w-full items-center gap-3 text-left">
          {p.photo ? <span className="h-9 w-9 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${p.photo})` }} />
            : <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">{initials(p.name)}</span>}
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-900">{p.name}</span><span className="block truncate text-xs text-slate-500">{user?.email ?? "modo demonstração"}</span></span>
          <ChevronDown size={16} className="text-slate-500" />
        </button>
        {menu && (
          <div className="absolute bottom-16 left-3 right-3 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50" onClick={() => { setMenu(false); nav("/app/configuracoes"); }}><Settings size={15} /> Configurações</button>
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={async () => { try { await flush(); await api.logout(); await setUser(null); nav("/"); } catch (err) { setLogoutError(err instanceof Error ? err.message : "Não foi possível sair."); } }}><LogOut size={15} /> Sair</button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-[var(--folios-surface)]">
      <div className="hidden lg:block">{side}</div>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)}><div onClick={(e) => e.stopPropagation()} className="h-full w-64">{side}</div></div>}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button className="rounded p-1.5 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Menu"><Menu size={18} /></button>
            <p className="truncate text-[15px] text-slate-500">Meu portfólio <span className="mx-2">/</span><b className="font-semibold text-plum-900">{current?.label ?? "Editor"}</b></p>
            {DEMO_MODE && <span className="hidden rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 xl:inline">Demonstração · dados neste navegador</span>}
          </div>
          <div className="flex items-center gap-2">
            <CompletionPill portfolio={portfolio} />
            <a href={DEMO_MODE ? portfolioPath(portfolio.site.slug) : "/preview"} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50"><Eye size={17} /> Prévia</a>
            <button onClick={() => { if (DEMO_MODE) update((x) => { x.site.published = true; return x; }); nav("/app/publicacao"); }} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"><Upload size={17} /> Publicar</button>
          </div>
        </header>
        {(error || logoutError) && <div role="alert" className="bg-red-50 px-6 py-2 text-sm text-red-700">{error || logoutError}</div>}
        {storageFull && <div className="bg-red-50 px-6 py-2 text-sm text-red-700">O navegador ficou sem espaço para a demonstração — a última mudança não foi salva. Apague versões de arte no Estúdio ou use imagens menores.</div>}
        <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin"><Outlet /></main>
      </div>
    </div>
  );
}
