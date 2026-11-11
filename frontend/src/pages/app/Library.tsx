import { Code2, History, LayoutTemplate, Palette, RotateCcw, Rows3, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../../components/layout/AppShell";
import { TemplatePreview } from "../../components/TemplatePreview";
import { Modal, NameDialog, Textarea } from "../../components/ui";
import { SECTION_LABELS } from "../../data/roles";
import { STYLE_LABELS, resetTemplate, templateById } from "../../data/templates";
import { applyItem, describeChange, restoreVersion, saveCode, saveModel, savePattern, snapshot } from "../../lib/library";
import { useStore } from "../../lib/store";
import { cn } from "../../lib/utils";
import type { LibraryItem, LibraryKind, Portfolio, SiteVersion } from "../../types/portfolio";

type Part = "tudo" | "estilo" | "estrutura";
const KIND: Record<LibraryKind, { label: string; icon: typeof Palette; empty: string }> = {
  modelo: { label: "Meus modelos", icon: LayoutTemplate, empty: "Em Seções do site, use \"Salvar como meu modelo\"." },
  padrao: { label: "Padrões visuais", icon: Palette, empty: "Cores, fontes e cantos salvos para aplicar em qualquer modelo." },
  secao: { label: "Seções salvas", icon: Rows3, empty: "Em Seções do site, clique numa seção e use \"Salvar esta seção\"." },
  codigo: { label: "Códigos (CSS)", icon: Code2, empty: "CSS que só afeta o seu site. Salve trechos para reusar." },
};
const date = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function Library() {
  const { portfolio: p, update } = useStore();
  const [tab, setTab] = useState<LibraryKind | "versoes">("modelo");
  const [pending, setPending] = useState<{ item: LibraryItem; part: Part } | null>(null);
  const [pendingVersion, setPendingVersion] = useState<SiteVersion | null>(null);
  const [naming, setNaming] = useState<"modelo" | "padrao" | null>(null);
  const [codeName, setCodeName] = useState(""); const [codeCss, setCodeCss] = useState("");
  const items = (p.library ?? []).filter((i) => i.kind === tab);
  const remove = (id: string) => update((x) => { x.library = (x.library ?? []).filter((i) => i.id !== id); return x; });

  const preview = (over: Partial<Portfolio["site"]>): Portfolio => ({ ...p, site: { ...p.site, ...over } });

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <PageHeader title="Biblioteca" subtitle="Seus modelos, padrões, seções e códigos para reusar em qualquer página ou hotsite. Nada aqui apaga seu conteúdo."
        action={<div className="flex gap-2">
          <button onClick={() => setNaming("padrao")} className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium hover:bg-slate-50">Salvar padrão visual atual</button>
          <button onClick={() => setNaming("modelo")} className="h-11 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">Salvar página atual como modelo</button>
        </div>} />

      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">
        {(Object.keys(KIND) as LibraryKind[]).map((k) => {
          const I = KIND[k].icon; const n = (p.library ?? []).filter((i) => i.kind === k).length;
          return <button key={k} onClick={() => setTab(k)} className={cn("flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm", tab === k ? "bg-brand-100 font-semibold text-brand-700" : "text-slate-700 hover:bg-slate-50")}><I size={17} />{KIND[k].label}<span className="text-xs opacity-60">{n}</span></button>;
        })}
        <button onClick={() => setTab("versoes")} className={cn("flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm", tab === "versoes" ? "bg-brand-100 font-semibold text-brand-700" : "text-slate-700 hover:bg-slate-50")}><History size={17} />Versões e restaurar<span className="text-xs opacity-60">{p.versions?.length ?? 0}</span></button>
      </div>

      {tab === "versoes" ? (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-xl font-bold text-plum-900">Restaurar</h2>
            <button onClick={() => update((x) => resetTemplate(snapshot(x, "Antes de voltar ao padrão do Folios")))} className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50">
              <RotateCcw size={18} className="mt-0.5 text-brand-700" /><span><b className="block text-sm">Voltar ao padrão original do Folios</b><span className="text-xs text-slate-500">Modelo {templateById(p.site.templateId).name} como veio. Seu conteúdo fica.</span></span>
            </button>
            <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Voltar ao meu padrão salvo</p>
            {(p.library ?? []).filter((i) => i.kind === "modelo").map((i) => (
              <button key={i.id} onClick={() => setPending({ item: i, part: "tudo" })} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50">{i.name}<span className="text-xs text-slate-400">{date(i.createdAt)}</span></button>
            ))}
            {!(p.library ?? []).some((i) => i.kind === "modelo") && <p className="text-sm text-slate-400">Nenhum modelo salvo ainda.</p>}
            <button onClick={() => update((x) => snapshot(x, "Versão salva manualmente"))} className="mt-2 w-full rounded-xl border border-brand-500 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">Salvar versão agora</button>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-xl font-bold text-plum-900">Histórico do visual</h2>
            <p className="mt-1 text-sm text-slate-500">Uma versão é guardada automaticamente antes de trocar de modelo, aplicar algo da biblioteca ou restaurar. Últimas 20.</p>
            <ol className="mt-4 divide-y divide-slate-100">
              {(p.versions ?? []).map((v) => (
                <li key={v.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="h-4 w-4 rounded-full border border-slate-200" style={{ background: v.theme.accent }} />
                  <span className="flex-1 text-sm"><b>{v.label}</b><span className="block text-xs text-slate-500">{date(v.at)} · {templateById(v.templateId).name} · {v.sections.length} seções</span></span>
                  <button onClick={() => setPendingVersion(v)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">Ver e restaurar</button>
                </li>
              ))}
              {!(p.versions ?? []).length && <li className="py-6 text-sm text-slate-400">Sem versões ainda.</li>}
            </ol>
          </section>
        </div>
      ) : (
        <>
          {tab === "codigo" && (
            <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="font-display text-lg font-bold text-plum-900">Novo trecho de CSS</h2>
              <p className="mt-1 text-xs text-slate-500">Vale só dentro do seu site (o painel não é afetado). Bloqueados: @import, javascript:, url() que não seja https. JavaScript personalizado fica para uma etapa futura.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[220px_1fr]">
                <input value={codeName} onChange={(e) => setCodeName(e.target.value)} placeholder="Nome (ex.: Títulos em caixa alta)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                <Textarea value={codeCss} onChange={(e) => setCodeCss(e.target.value)} rows={4} className="font-mono text-xs" placeholder={"h1, h2 { text-transform: uppercase; letter-spacing: .02em; }"} />
              </div>
              <div className="mt-3 flex gap-2">
                <button disabled={!codeName || !codeCss} onClick={() => { update((x) => saveCode(x, codeName, codeCss)); setCodeName(""); setCodeCss(""); }} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Salvar na biblioteca</button>
              </div>
            </section>
          )}
          {items.length === 0 && <div className="rounded-3xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-500">{KIND[tab as LibraryKind].empty}</div>}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((i) => (
              <article key={i.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                {i.kind === "modelo" && <div className="border-b border-slate-100"><TemplatePreview portfolio={preview({ templateId: i.templateId!, theme: i.theme!, sections: i.sections!, customCss: i.css, customCssEnabled: !!i.css })} width="fill" height={220} /></div>}
                {i.kind === "padrao" && i.theme && (
                  <div className={cn("flex h-28 items-center justify-center gap-3", i.theme.mode === "dark" ? "bg-[#0b0c10] text-white" : "bg-slate-50")}>
                    <span className="h-12 w-12 rounded-full" style={{ background: i.theme.accent }} />
                    <span className={cn("text-2xl font-bold", i.theme.font === "serif" ? "font-serif" : i.theme.font === "display" ? "font-display" : "font-sans")}>Aa</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div><h3 className="font-semibold text-plum-900">{i.name}</h3><p className="text-xs text-slate-500">{date(i.createdAt)}{i.section ? ` · ${SECTION_LABELS[i.section.type]}${i.section.variant ? " · " + STYLE_LABELS[i.section.variant] : ""}` : ""}{i.templateId ? ` · base ${templateById(i.templateId).name}` : ""}</p></div>
                    <button aria-label="Excluir" onClick={() => remove(i.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                  {i.css && i.kind === "codigo" && <pre className="mt-3 max-h-24 overflow-auto rounded-lg bg-slate-50 p-2 text-[11px]">{i.css}</pre>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {i.kind === "modelo" ? (
                      <>
                        <button onClick={() => setPending({ item: i, part: "tudo" })} className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">Aplicar tudo</button>
                        <button onClick={() => setPending({ item: i, part: "estilo" })} className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Só cores e fontes</button>
                        <button onClick={() => setPending({ item: i, part: "estrutura" })} className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Só seções</button>
                      </>
                    ) : <button onClick={() => setPending({ item: i, part: "tudo" })} className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">{i.kind === "secao" ? "Usar na página" : "Aplicar"}</button>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {pending && (
        <Modal open title={`Aplicar "${pending.item.name}"`} onClose={() => setPending(null)}>
          <p className="text-sm text-slate-600">Vai mudar:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{describeChange(p, pending.item, pending.part).map((d) => <li key={d}>{d}</li>)}</ul>
          <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">Perfil, trabalhos, mídias e contatos continuam como estão. Uma versão do visual atual é salva antes, para você poder voltar.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setPending(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
            <button onClick={() => { update((x) => applyItem(x, pending.item, pending.part)); setPending(null); }} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Aplicar</button>
          </div>
        </Modal>
      )}
      {pendingVersion && (
        <Modal open wide title={`Restaurar: ${pendingVersion.label}`} onClose={() => setPendingVersion(null)}>
          <div className="overflow-hidden rounded-xl border border-slate-200"><TemplatePreview portfolio={preview({ templateId: pendingVersion.templateId, theme: pendingVersion.theme, sections: pendingVersion.sections, customCss: pendingVersion.customCss })} width="fill" height={320} /></div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setPendingVersion(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
            <button onClick={() => { update((x) => restoreVersion(x, pendingVersion)); setPendingVersion(null); }} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Restaurar esta versão</button>
          </div>
        </Modal>
      )}
      <NameDialog open={!!naming} title={naming === "modelo" ? "Salvar página como meu modelo" : "Salvar padrão visual"}
        hint={naming === "modelo" ? "Guarda modelo, seções, variações, cores e CSS. Não guarda seu conteúdo." : "Guarda cor de destaque, fundo, tipografia e cantos."}
        onCancel={() => setNaming(null)} onSave={(n) => { update((x) => (naming === "modelo" ? saveModel(x, n) : savePattern(x, n))); setTab(naming!); setNaming(null); }} />
    </div>
  );
}
