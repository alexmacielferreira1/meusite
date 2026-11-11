import { Check, Maximize2, Shuffle, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/layout/AppShell";
import { TemplatePreview } from "../../components/TemplatePreview";
import { Badge } from "../../components/ui";
import { ROLES } from "../../data/roles";
import { CATALOG_DESIGNS } from "../../data/catalogDesigns";
import { demoFor } from "../../data/demoContent";
import { STYLE_LABELS, TEMPLATES, switchTemplate } from "../../data/templates";
import { snapshot } from "../../lib/library";
import { useStore } from "../../lib/store";
import { cn } from "../../lib/utils";
import type { RoleId, TemplateDef } from "../../types/portfolio";

export default function Templates() {
  const { portfolio: p, update } = useStore();
  const nav = useNavigate();
  const [role, setRole] = useState<RoleId | "">("");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(12);
  const [keepOverrides, setKeepOverrides] = useState(false);
  const [big, setBig] = useState<TemplateDef | null>(null);
  const [sample, setSample] = useState(true);
  const previewOf = (id: string) => sample ? demoFor(id) : p;
  const catalogIds = Object.keys(CATALOG_DESIGNS);
  const number = (id: string) => catalogIds.indexOf(id) + 1 || Infinity;
  const searchKey = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
  const term = searchKey(query);
  const list = TEMPLATES.filter((template) => (!role || template.roles.includes(role)) && searchKey(template.name).includes(term))
    .sort((a, b) => number(a.id) - number(b.id));


  function apply(t: TemplateDef, keepSections: boolean) {
    update((x) => switchTemplate(snapshot(x, `Antes de trocar para ${t.name}`), t.id, { keepSections, keepOverrides }));
    setBig(null);
    nav("/app/secoes");
  }

  const Card = ({ t }: { t: TemplateDef }) => {
    const current = p.site.templateId === t.id;
    const mixed = t.variants && Object.keys(t.variants).length > 0;
    return (
      <article className={cn("overflow-hidden rounded-3xl border bg-white transition", current ? "border-brand-500 ring-4 ring-brand-100" : "border-slate-200 hover:shadow-lg")}>
        <button onClick={() => setBig(t)} className="group relative block w-full" aria-label={`Ver ${t.name} em tamanho grande`}>
          <TemplatePreview portfolio={previewOf(t.id)} templateId={t.id} width="fill" height={270} />
          <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100"><Maximize2 size={16} /></span>
        </button>
        <div className="border-t border-slate-100 p-5">
          <div className="flex items-center gap-2">
            {CATALOG_DESIGNS[t.id] && <Badge tone="brand">{String(number(t.id)).padStart(2, "0")}</Badge>}
            <h3 className="font-display text-lg font-bold text-plum-900">{t.name}</h3>
            {t.plan === "essencial" && <Badge tone="brand">Essencial</Badge>}
            {mixed && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"><Shuffle size={11} /> Misto</span>}
            {current && <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-700"><Check size={16} /> Em uso</span>}
          </div>
          <p className="mt-1.5 text-sm text-slate-500">{t.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="h-4 w-4 rounded-full border border-slate-200" style={{ background: t.theme.accent }} />
            <span className="text-xs text-slate-500">{t.theme.mode === "dark" ? "Escuro" : "Claro"} · {STYLE_LABELS[t.style]}{mixed ? ` + ${Object.values(t.variants!).filter((v, i, a) => a.indexOf(v) === i).map((v) => STYLE_LABELS[v!]).join(", ")}` : ""}</span>
          </div>
          {!current && <button onClick={() => apply(t, false)} className="mt-4 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Usar este modelo</button>}
        </div>
      </article>
    );
  };

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <PageHeader title="Modelos" subtitle="Escolha pelo visual. Veja cada modelo com conteúdo de exemplo ou com o seu. Depois ajuste cores, fontes e seções." />
      <div role="group" aria-label="Conteúdo das prévias" className="mb-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 text-sm">
        {([[true, "Exemplo do modelo"], [false, "Meu conteúdo"]] as const).map(([value, label]) => (
          <button key={label} aria-pressed={sample === value} onClick={() => setSample(value)}
            className={cn("rounded-lg px-4 py-1.5", sample === value ? "bg-brand-600 font-semibold text-white" : "text-slate-600 hover:bg-slate-50")}>{label}</button>
        ))}
      </div>
      <input type="search" aria-label="Buscar modelos" placeholder="Buscar por nome do modelo" value={query}
        onChange={(event) => { setQuery(event.target.value); setLimit(12); }}
        className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm sm:max-w-sm" />
      <div className="mb-7 flex flex-wrap gap-2">
        <button onClick={() => { setRole(""); setLimit(12); }} className={cn("rounded-xl border px-4 py-2 text-sm", !role ? "border-brand-100 bg-brand-100 font-semibold text-brand-700" : "border-slate-200 bg-white")}>Todos ({TEMPLATES.length})</button>
        {ROLES.map((r) => (
          <button key={r.id} onClick={() => { setRole(r.id); setLimit(12); }} className={cn("rounded-xl border px-4 py-2 text-sm", role === r.id ? "border-brand-100 bg-brand-100 font-semibold text-brand-700" : "border-slate-200 bg-white hover:bg-slate-50")}>{r.emoji} {r.short}</button>
        ))}
      </div>

      <label className="mb-5 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={keepOverrides} onChange={(e) => setKeepOverrides(e.target.checked)} />
        Manter personalizações por seção ao trocar o modelo
      </label>
      {role && <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Sugeridos para {ROLES.find((r) => r.id === role)?.short.toLowerCase()}</h2>}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{list.slice(0, limit).map((t) => <Card key={t.id} t={t} />)}</div>
      {!list.length && <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Nenhum modelo encontrado com estes filtros.</p>}
      {list.length > limit && <button className="mt-5 rounded-xl border bg-white px-4 py-2" onClick={() => setLimit(limit + 12)}>Mostrar mais modelos</button>}

      {big && (
        <div className="fixed inset-0 z-50 flex flex-col bg-plum-900/80 p-4 sm:p-8" onClick={() => setBig(null)}>
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-3xl bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-3">
              <h3 className="font-display text-xl font-bold text-plum-900">{big.name}</h3>
              <span className="text-sm text-slate-500">{sample ? "com conteúdo de exemplo" : "com o seu conteúdo"}{p.site.perTemplate?.[big.id] ? " · seus ajustes neste modelo serão restaurados" : ""}</span>
              <div className="ml-auto flex gap-2">
                <button onClick={() => apply(big, true)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">Usar mantendo minhas seções</button>
                <button onClick={() => apply(big, false)} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Usar este modelo</button>
                <button onClick={() => setBig(null)} aria-label="Fechar" className="rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
              {CATALOG_DESIGNS[big.id] && <details className="border-b px-5 py-3">
                <summary className="cursor-pointer text-sm font-semibold text-brand-700">Ver prancha de referência deste modelo</summary>
                <p className="mt-2 text-sm text-slate-600">Referência visual original. A prévia funcional abaixo usa {sample ? "conteúdo de exemplo" : "seu acervo"} e os componentes atuais.</p>
                <img className="mt-3 max-h-[450px] rounded-lg object-contain" src={`/referencias-modelos/${big.id}.webp`} alt={`Prancha de referência de ${big.name}`} />
              </details>}
              <div className="w-full"><TemplatePreview portfolio={previewOf(big.id)} templateId={big.id} width="fill" height="auto" /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
