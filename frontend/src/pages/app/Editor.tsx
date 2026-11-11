import { AudioLines, Briefcase, GraduationCap, GripVertical, Info, LayoutPanelTop, Mail, MessageSquareQuote, Monitor, Newspaper, Play, Plus, Route, Smartphone, Tag, Trash2, Users } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/layout/AppShell";
import { NameDialog, Textarea, Toggle } from "../../components/ui";
import { saveModel, savePattern, saveSection, snapshot } from "../../lib/library";
import { SECTION_LABELS } from "../../data/roles";
import { ACCENTS, STYLE_LABELS, TEMPLATES, resetTemplate, switchTemplate, templateById } from "../../data/templates";
import { useStore } from "../../lib/store";
import { ModelBlocks } from "../../components/ModelBlocks";
import { PresentationControls } from "../../components/PresentationControls";
import { PhotoLookCard } from "../../components/PhotoLookCard";
import { lookOf } from "../../data/templateLooks";
import { DEFAULT_LOOK, LOOK_LABELS } from "../../lib/photoLook";
import { hasFixedStructure } from "../../site/models";
import { cn, uid } from "../../lib/utils";
import type { SectionType, Theme } from "../../types/portfolio";

const ICON: Record<SectionType, typeof Info> = {
  hero: LayoutPanelTop, about: Info, reel: Play, works: Briefcase, clients: Users, experience: Route, education: GraduationCap,
  clipping: Newspaper, services: Tag, testimonials: MessageSquareQuote, audio: AudioLines, contact: Mail,
};

export default function Editor() {
  const { portfolio: p, update } = useStore();
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [keepOverrides, setKeepOverrides] = useState(false);
  const [naming, setNaming] = useState<null | { kind: "modelo" | "padrao" | "secao"; sectionId?: string }>(null);
  const [trying, setTrying] = useState(false);
  const [saved, setSaved] = useState("");
  const flash = (m: string) => { setSaved(m); setTimeout(() => setSaved(""), 2500); };
  const drag = useRef<number | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  // envia o rascunho para o iframe da prévia a cada mudança; em "Testar", vai uma cópia com o acabamento ligado (não salva)
  const shown = trying ? { ...p, site: { ...p.site, photoLook: { ...DEFAULT_LOOK, ...p.site.photoLook, enabled: true } } } : p;
  const push = () => frame.current?.contentWindow?.postMessage({ type: "meusite:preview", portfolio: shown }, window.location.origin);
  useEffect(push, [p, trying]);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => { if (e.source === frame.current?.contentWindow && e.origin === window.location.origin && e.data?.type === "meusite:preview-ready") push(); };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  });

  const sections = p.site.sections;
  const missing = (Object.keys(SECTION_LABELS) as SectionType[]).filter((t) => !sections.some((s) => s.type === t));
  const reorder = (from: number, to: number) => update((x) => { const [m] = x.site.sections.splice(from, 1); x.site.sections.splice(to, 0, m); return x; });
  const setTheme = (patch: Partial<Theme>) => update((x) => { x.site.theme = { ...x.site.theme, ...patch }; return x; });
  const theme = p.site.theme;
  const fixed = hasFixedStructure(p.site.templateId);
  const card = "rounded-3xl border border-slate-200 bg-white p-6";
  const pill = (on: boolean) => cn("rounded-xl border py-2 text-sm", on ? "border-brand-600 bg-brand-50 font-medium text-brand-700" : "border-slate-200 hover:bg-slate-50");

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <PageHeader title="Seções do site" subtitle="Escolha o que aparece, em qual ordem e com qual cara."
        action={<div className="flex flex-wrap items-center gap-2">
          {saved && <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">{saved}</span>}
          <button onClick={() => setNaming({ kind: "padrao" })} className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium hover:bg-slate-50">Salvar padrão visual</button>
          <button onClick={() => setNaming({ kind: "modelo" })} className="h-10 rounded-xl border border-brand-500 bg-white px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50">Salvar como meu modelo</button>
          <Link to="/app/biblioteca" className="h-10 rounded-xl px-3 text-sm font-medium leading-10 text-slate-600 hover:bg-slate-100">Usar da biblioteca →</Link>
        </div>} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,460px)_1fr]">
        <div className="space-y-6">


          <section className={card}>
            <h2 className="font-display text-2xl font-bold text-plum-900">Aparência</h2>
            <div className="mt-5 space-y-5">
              <div>
                <p className="mb-1 text-sm font-medium text-slate-700">Modelo</p>
                <p className="mb-2 text-xs text-slate-500">Ao voltar para um modelo, seus ajustes nele são restaurados.</p>
                <label className="mb-2 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={keepOverrides} onChange={(e) => setKeepOverrides(e.target.checked)} />
                  Manter personalizações por seção ao trocar
                </label>
                <select aria-label="Modelo do site inteiro" value={p.site.templateId} className="w-full rounded-xl border bg-white p-2"
                  onChange={(e) => { const id = e.target.value; update((x) => switchTemplate(snapshot(x, "Antes de trocar o modelo"), id, { keepSections: true, keepOverrides })); }}>
                  {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <Link to="/app/modelos" className="mr-4 mt-2 inline-block text-xs font-semibold text-brand-700">Ver todos os modelos em tamanho grande →</Link>
                <button className="mt-2 text-xs text-slate-500 underline" onClick={() => update((x) => resetTemplate(snapshot(x, "Antes de restaurar o padrão")))}>Restaurar o padrão deste modelo (o conteúdo não é apagado)</button>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Cor de destaque</p>
                <div className="flex flex-wrap items-center gap-2">
                  {ACCENTS.map((c) => <button key={c} aria-label={`Cor ${c}`} onClick={() => setTheme({ accent: c })} className={cn("h-8 w-8 rounded-full border-2", theme.accent === c ? "border-plum-900" : "border-white shadow")} style={{ background: c }} />)}
                  <input type="color" aria-label="Escolher outra cor" value={theme.accent} onChange={(e) => setTheme({ accent: e.target.value })} className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0" />
                </div>
              </div>
              <div className={cn("grid gap-4", !fixed && "grid-cols-2")}>
                {!fixed && <div><p className="mb-2 text-sm font-medium text-slate-700">Fundo</p>
                  <div className="grid grid-cols-2 gap-2">{(["dark", "light"] as const).map((m) => <button key={m} onClick={() => setTheme({ mode: m })} className={pill(theme.mode === m)}>{m === "dark" ? "Escuro" : "Claro"}</button>)}</div></div>}
                <div><p className="mb-2 text-sm font-medium text-slate-700">Cantos</p>
                  <div className="grid grid-cols-3 gap-2">{([["none", "Reto"], ["md", "Suave"], ["lg", "Redondo"]] as const).map(([r, l]) => <button key={r} onClick={() => setTheme({ radius: r })} className={pill(theme.radius === r)}>{l}</button>)}</div></div>
              </div>
              <div><p className="mb-2 text-sm font-medium text-slate-700">Tipografia</p>
                <div className="grid grid-cols-3 gap-2">{([["sans", "Moderna", "font-sans"], ["display", "Marcante", "font-display"], ["serif", "Editorial", "font-serif"]] as const).map(([f, l, c]) => <button key={f} onClick={() => setTheme({ font: f })} className={cn(pill(theme.font === f), c)}>{l}</button>)}</div></div>
              <PresentationControls value={p.site.presentation} onChange={(presentation) => update((x) => { x.site.presentation = presentation; return x; })} />
              <PhotoLookCard value={p.site.photoLook} lookName={LOOK_LABELS[lookOf(p.site.templateId)]} trying={trying}
                onTry={setTrying} onChange={(photoLook) => update((x) => { x.site.photoLook = photoLook; return x; })} />
              <details className="rounded-2xl border border-slate-200 p-4" open={!!p.site.customCss}>
                <summary className="cursor-pointer text-sm font-medium text-slate-700">CSS personalizado <span className="font-normal text-slate-400">— para designers</span></summary>
                <p className="mt-2 text-xs text-slate-500">Afeta só o seu site. Se algo quebrar, é só desligar.</p>
                <Textarea rows={5} className="mt-2 font-mono text-xs" value={p.site.customCss ?? ""} placeholder={"h1 { letter-spacing: -0.03em; }\n#trabalhos { padding-top: 8rem; }"}
                  onChange={(e) => update((x) => { x.site.customCss = e.target.value; return x; })} />
                <label className="mt-2 flex items-center gap-2 text-sm"><Toggle label="Ativar CSS" checked={!!p.site.customCssEnabled} onChange={(v) => update((x) => { x.site.customCssEnabled = v; return x; })} /> Ativar no site</label>
              </details>
            </div>
          </section>
          {fixed ? <ModelBlocks /> : <section className={card}>
            <h2 className="font-display text-2xl font-bold text-plum-900">Organizar seções</h2>
            <p className="mt-1 text-sm text-slate-500">Arraste para reordenar. Clique numa seção para trocar o estilo só dela.</p>
            <ul className="mt-5 space-y-2.5">
              {sections.map((s, i) => {
                const I = ICON[s.type];
                const tpl = templateById(p.site.templateId);
                const base = tpl.variants?.[s.type] ?? tpl.style;
                return (
                  <Fragment key={s.id}>
                  <li draggable
                    onDragStart={() => { drag.current = i; }} onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { if (drag.current !== null && drag.current !== i) reorder(drag.current, i); drag.current = null; }}
                    onClick={() => setSelected(s.id)}
                    className={cn("group flex cursor-grab items-center gap-3 rounded-2xl border px-3 py-3 transition active:cursor-grabbing",
                      selected === s.id ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white hover:border-slate-300")}>
                    <GripVertical size={18} className="text-slate-400" />
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-700"><I size={20} /></span>
                    <span className={cn("flex-1 font-semibold", s.enabled ? "text-slate-900" : "text-slate-400")}>{SECTION_LABELS[s.type]}</span>
                    {s.type !== "hero" && (
                      <button aria-label="Remover seção" onClick={(e) => { e.stopPropagation(); update((x) => { x.site.sections.splice(i, 1); return x; }); }}
                        className="rounded-lg p-1.5 text-slate-300 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"><Trash2 size={16} /></button>
                    )}
                    {s.variant && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-700">{STYLE_LABELS[s.variant]}</span>}
                    <span onClick={(e) => e.stopPropagation()}><Toggle label={`Mostrar ${SECTION_LABELS[s.type]}`} checked={s.enabled} onChange={(v) => update((x) => { x.site.sections[i].enabled = v; return x; })} /></span>
                  </li>
                  {selected === s.id && (
                    <li className="-mt-1 rounded-2xl border border-brand-200 bg-white p-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={!!(s.variantModelId || s.variant)} onChange={(e) => {
                          const checked = e.target.checked;
                          update((x) => {
                            const section = x.site.sections[i];
                            if (checked) section.variantModelId = p.site.templateId;
                            else { delete section.variantModelId; delete section.variant; }
                            return x;
                          });
                        }} />
                        Personalizar somente esta seção
                      </label>
                      {(s.variantModelId || s.variant) && <div className="mt-2 flex flex-wrap gap-2">
                        <select aria-label="Modelo desta seção" value={s.variantModelId ?? ""} className="rounded-lg border px-2 py-1 text-sm"
                          onChange={(e) => { const id = e.target.value; update((x) => {
                            x.site.sections[i].variantModelId = id; delete x.site.sections[i].variant; return x;
                          }); }}>
                          {!s.variantModelId && <option value="">Estilo anterior ({STYLE_LABELS[s.variant ?? base]})</option>}
                          {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <button className="text-xs font-semibold text-brand-700" onClick={() => update((x) => {
                          delete x.site.sections[i].variantModelId; delete x.site.sections[i].variant; return x;
                        })}>Voltar ao padrão</button>
                        {s.variantModelId && s.variantModelId !== p.site.templateId && <button className="text-xs font-semibold text-brand-700"
                          onClick={() => update((x) => switchTemplate(snapshot(x, "Antes de aplicar em todo o site"), s.variantModelId!, { keepSections: true }))}>
                          Aplicar modelo a todo o site
                        </button>}
                      </div>}
                      <div className="mt-3 flex flex-wrap gap-4">
                        <button onClick={() => setNaming({ kind: "secao", sectionId: s.id })} className="text-xs font-semibold text-brand-700">Salvar esta seção na biblioteca →</button>
                        <input aria-label="Título da seção" placeholder={SECTION_LABELS[s.type]} value={s.title ?? ""} maxLength={100}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          onChange={(e) => update((x) => { x.site.sections[i].title = e.target.value; return x; })} />
                        {(s.type === "hero" || s.type === "reel") && <Link to={`/app/estudio?trabalho=${(p.works.find((w) => w.featured) ?? p.works[0])?.id ?? ""}`} className="text-xs font-semibold text-brand-700">Editar arte da capa no Estúdio →</Link>}
                        {s.type === "about" && <Link to="/app/estudio?foto=1" className="text-xs font-semibold text-brand-700">Editar retrato no Estúdio →</Link>}
                      </div>
                    </li>
                  )}
                  </Fragment>
                );
              })}
            </ul>
            {adding ? (
              <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-dashed border-brand-300 p-3">
                {missing.length === 0 && <p className="text-sm text-slate-500">Todas as seções já estão no site.</p>}
                {missing.map((t) => {
                  const I = ICON[t];
                  return (
                    <button key={t} onClick={() => { update((x) => { x.site.sections.splice(x.site.sections.length - 1, 0, { id: uid(), type: t, enabled: true }); return x; }); setAdding(false); }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm hover:border-brand-400 hover:text-brand-700"><I size={14} />{SECTION_LABELS[t]}</button>
                  );
                })}
              </div>
            ) : (
              <button onClick={() => setAdding(true)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-brand-500 py-3 font-semibold text-brand-700 hover:bg-brand-50"><Plus size={20} /> Adicionar seção</button>
            )}
          </section>}
        </div>

        <section className={cn(card, "xl:sticky xl:top-6 xl:self-start")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-plum-900">Prévia de conteúdo</h2>
            <div className="flex rounded-xl border border-slate-200 p-1">
              {([["desktop", Monitor, "Desktop"], ["mobile", Smartphone, "Celular"]] as const).map(([d, I, l]) => (
                <button key={d} onClick={() => setDevice(d)} className={cn("flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm", device === d ? "bg-brand-100 font-semibold text-brand-700" : "text-slate-600")}><I size={16} />{l}</button>
              ))}
            </div>
          </div>
          <div className={cn("mx-auto mt-5 overflow-hidden rounded-2xl border border-slate-200 transition-all", device === "mobile" ? "max-w-[390px]" : "w-full")}>
            <div className="flex h-8 items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3">{[0, 1, 2].map((i) => <span key={i} className="h-2.5 w-2.5 rounded-full bg-slate-300" />)}</div>
            <iframe ref={frame} title="Prévia do site" src="/preview" className="block h-[70vh] w-full bg-white" />
          </div>
        </section>
      </div>
      <NameDialog open={!!naming} title={naming?.kind === "modelo" ? "Salvar como meu modelo" : naming?.kind === "padrao" ? "Salvar padrão visual" : "Salvar esta seção"}
        hint={naming?.kind === "modelo" ? "Guarda modelo, seções, variações, cores e CSS — não guarda seu conteúdo." : naming?.kind === "padrao" ? "Cor, fundo, tipografia e cantos, para aplicar em qualquer modelo." : "A seção com o estilo escolhido, para usar em outras páginas e hotsites."}
        onCancel={() => setNaming(null)}
        onSave={(n) => {
          update((x) => {
            if (naming?.kind === "modelo") return saveModel(x, n);
            if (naming?.kind === "padrao") return savePattern(x, n);
            const sec = x.site.sections.find((s) => s.id === naming?.sectionId);
            return sec ? saveSection(x, sec, n) : x;
          });
          flash("Salvo na biblioteca ✓"); setNaming(null);
        }} />
    </div>
  );
}

