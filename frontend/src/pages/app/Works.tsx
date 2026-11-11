import { WorkLinkInput } from "../../components/WorkLinkInput";
import { identifyProvider, mediaError } from "../../lib/mediaProviders";
import { DEMO_MODE } from "../../config/app";
import { api } from "../../lib/api";
import { markerSeconds } from "../../lib/evidence";
import { AudioLines, FileSpreadsheet, FileText, Image as ImageIcon, Link2, Loader2, MoreHorizontal, Play, Search, Sparkles, Star, Table2, Upload, Video, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/layout/AppShell";
import { MediaQuota } from "../../components/MediaQuota";
import { MAX_FILE_MB, fmtBytes, quotaBytes, usedBytes } from "../../lib/media";
import { Link } from "react-router-dom";
import { Field, Input, TagInput, Textarea } from "../../components/ui";
import { roleById } from "../../data/roles";
import { describeWork, suggestTags } from "../../lib/ai";
import { useStore } from "../../lib/store";
import { cn, coverStyle, imageToDataURL } from "../../lib/utils";
import { AreasManager } from "../../components/AreasManager";
import { LinksImport } from "../../components/LinksImport";
import { WorksGrid } from "../../components/WorksGrid";
import { ImportReview } from "../../components/ImportReview";
import { WorksPending } from "../../components/WorksPending";
import { WORK_CHECKS, worksPending, type WorkCheckId } from "../../lib/completeness";
import { guessMapping, previewExternal, readExternal } from "../../lib/externalWorks";
import { WORK_KINDS, downloadWorks, headers, newWork, readWorks, splitLinks, videoCover, workLink, type Visibility } from "../../lib/workSpreadsheet";
import type { Work, WorkKind } from "../../types/portfolio";

const KINDS: { id: WorkKind | ""; label: string; icon: typeof Video }[] = [
  { id: "", label: "Todos", icon: Star }, { id: "video", label: "Vídeos", icon: Video }, { id: "image", label: "Imagens", icon: ImageIcon },
  { id: "article", label: "Matérias", icon: FileText }, { id: "audio", label: "Áudios", icon: AudioLines }, { id: "script", label: "Roteiros", icon: FileText },
];
const KIND_LABEL = WORK_KINDS;
const KIND_ICON: Record<WorkKind, typeof Video> = { video: Video, image: ImageIcon, article: FileText, audio: AudioLines, script: FileText };

function WorkDrawer({ initial, onClose }: { initial: Work; onClose: () => void }) {
  const { portfolio, update } = useStore();
  const [galleryText, setGalleryText] = useState(initial.gallery?.join("\n") ?? "");
  const [w, setW] = useState<Work>(initial);
  const [source, setSource] = useState<"link" | "file">(initial.mediaUrl || !initial.cover.startsWith("data:") ? "link" : "file");
  const [busy, setBusy] = useState<"" | "desc" | "tags">("");
  const [fileMsg, setFileMsg] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [aiText, setAiText] = useState("");
  const [markerTime, setMarkerTime] = useState("");
  const [markerLabel, setMarkerLabel] = useState("");
  async function suggest(task: "desc" | "tags") {
    setBusy(task); setAiMessage("");
    try {
      if (DEMO_MODE) {
        if (task === "desc") set({ description: await describeWork(w) });
        else set({ tags: await suggestTags(`${w.title} ${w.description} ${w.category}`) });
        return;
      }
      const { title, role, client, software, description, contribution, category } = w;
      const result = await api.suggest(task === "desc" ? "work" : "tags", { title, role, client, software, description, contribution, category });
      update((p) => ({ ...p, aiCredits: result.credits }));
      if (task === "desc") setAiText(result.text);
      else set({ tags: result.text.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5) });
    } catch (err) { setAiMessage(err instanceof Error ? err.message : "Falha na sugestão."); }
    finally { setBusy(""); }
  }
  const isNew = !portfolio.works.some((x) => x.id === initial.id);
  const role = roleById(portfolio.profile.roleId);
  const set = (patch: Partial<Work>) => setW((x) => ({ ...x, ...patch }));

  function save() {
    const gallery = w.kind === "image" ? splitLinks(galleryText) : [];
    if (gallery.length > 12 || gallery.some((url) => !workLink(url))) {
      setFileMsg("A galeria aceita até 12 links http ou https, um por linha.");
      return;
    }
    if (w.repositoryUrl && !/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/i.test(w.repositoryUrl)) {
      setFileMsg("Informe a URL de um repositório do GitHub.");
      return;
    }
    if (source === "link" && w.mediaUrl) {
      const error = mediaError(identifyProvider(w.mediaUrl), w.mediaUrl);
      if (error) { setFileMsg(error); return; }
    }
    const entry = { ...w, gallery, cover: w.cover.startsWith("grad:") ? gallery[0] || (w.kind === "video" && videoCover(w.mediaUrl)) || w.cover : w.cover };
    if (w.mediaUrl && !/^https?:\/\/[^\s]+$/i.test(w.mediaUrl)) {
      setFileMsg("Informe um link que comece com https:// ou http://.");
      return;
    }
    update((p) => { const i = p.works.findIndex((x) => x.id === w.id); if (i >= 0) p.works[i] = entry; else p.works.unshift(entry); return p; });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-plum-900/30" onClick={onClose}>
      <aside className="flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-7 pb-2 pt-7">
          <div><h2 className="font-display text-3xl font-bold text-plum-900">{isNew ? "Novo trabalho" : "Editar trabalho"}</h2><p className="mt-1 text-slate-500">Adicione um projeto ao seu portfólio em poucos passos.</p></div>
          <button onClick={onClose} aria-label="Fechar" className="rounded-lg p-1.5 hover:bg-slate-100"><X size={22} /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-7 py-5 scrollbar-thin">
          <div className="grid grid-cols-2 gap-3">
            {([["link", Link2, "Colar link", "YouTube, Vimeo, Drive, matéria etc."], ["file", Upload, "Enviar arquivo", DEMO_MODE ? "Vídeo, imagem, áudio ou PDF" : "Imagem JPG, PNG ou WebP"]] as const).map(([id, I, t, d]) => (
              <button key={id} type="button" onClick={() => setSource(id)} className={cn("flex items-start gap-3 rounded-2xl border p-4 text-left", source === id ? "border-brand-500 bg-brand-50" : "border-slate-200")}>
                <I size={20} className="mt-0.5 text-brand-700" />
                <span className="flex-1"><span className="block font-semibold">{t}</span><span className="block text-xs text-slate-500">{d}</span></span>
                <span className={cn("mt-1 h-4 w-4 rounded-full border-2", source === id ? "border-brand-600 bg-brand-600 ring-2 ring-inset ring-white" : "border-slate-300")} />
              </button>
            ))}
          </div>

          {source === "link" ? (
            <WorkLinkInput key={w.kind} kind={w.kind} value={w.mediaUrl??""} onChange={mediaUrl=>set({mediaUrl})} />
          ) : (
            <><label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-brand-400">
              {w.cover.startsWith("data:") ? <span className="h-28 w-full rounded-xl" style={coverStyle(w.cover)} /> : <Upload className="text-slate-400" />}
              <span className="text-sm text-slate-600">Clique para escolher uma imagem de capa</span>
              <span className="text-xs text-slate-400">{DEMO_MODE ? `Imagem vira capa. Na demonstração o vídeo não é guardado. Limite simulado de ${MAX_FILE_MB[portfolio.plan]} MB por arquivo.` : "A imagem é guardada no rascunho. Para vídeo, áudio e PDF, use o endereço do material."}</span>
              <input type="file" accept={DEMO_MODE ? "image/*,video/*,audio/*,application/pdf" : "image/jpeg,image/png,image/webp"} className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                if (f.type.startsWith("image/")) {
                  try { set({ cover: await imageToDataURL(f), kind: "image", mediaUrl: "", title: w.title || f.name.replace(/\.[^.]+$/, "") }); setFileMsg(""); }
                  catch { setFileMsg("Não foi possível abrir essa imagem."); }
                  return;
                }
                if (!DEMO_MODE) { setFileMsg("Use um link para este formato."); return; }
                if (f.size > MAX_FILE_MB[portfolio.plan] * 1024 ** 2) { setFileMsg(`Arquivo de ${fmtBytes(f.size)} passa do limite de ${MAX_FILE_MB[portfolio.plan]} MB do seu plano. Use um link do YouTube/Vimeo ou mude de plano.`); return; }
                if (usedBytes(portfolio) + f.size > quotaBytes(portfolio)) { setFileMsg(`Sem espaço: este arquivo (${fmtBytes(f.size)}) passa da sua cota. Contrate mídia extra em Configurações ou use um link.`); return; }
                set({ hostedBytes: f.size, kind: f.type.startsWith("video/") ? "video" : f.type.startsWith("audio/") ? "audio" : "article", title: w.title || f.name.replace(/\.[^.]+$/, "") });
                setFileMsg(`✓ ${f.name} (${fmtBytes(f.size)}) — processamento de vídeo, pôster e legendas acontecem no servidor (backend).`);
              }} />
            </label></>
          )}
          {fileMsg && <p role="status" className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{fileMsg}</p>}
          {source === "link" && w.mediaUrl && <p className="-mt-3 text-xs text-slate-500">Link externo: usa a hospedagem do YouTube/Vimeo e não conta na sua cota. Se a incorporação falhar, o site mostra "Assistir no YouTube".</p>}

          <Field label="Título *"><Input value={w.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ex.: Rios do Brasil" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Formato *">
              <select value={w.kind} onChange={(e) => set({ kind: e.target.value as WorkKind })} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
                {(Object.keys(KIND_LABEL) as WorkKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
              </select>
            </Field>
            <Field label={w.kind === "article" ? "Veículo" : "Cliente ou veículo"}><Input value={w.kind === "article" ? w.outlet ?? "" : w.client} onChange={(e) => set(w.kind === "article" ? { outlet: e.target.value, client: e.target.value } : { client: e.target.value })} placeholder="Canal Brasil" /></Field>
          </div>
          <details className="rounded-2xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold">Case, resultados e ficha técnica</summary><div className="mt-3 space-y-3">
            <Field label="Desafio"><Textarea rows={2} value={w.challenge??""} maxLength={3000} onChange={e=>set({challenge:e.target.value})}/></Field>
            <Field label="Solução e abordagem"><Textarea rows={2} value={w.solution??""} maxLength={3000} onChange={e=>set({solution:e.target.value})}/></Field>
            <Field label="Resultados comprovados"><Textarea rows={2} value={w.results??""} maxLength={3000} onChange={e=>set({results:e.target.value})}/></Field>
            <Field label="Créditos e equipe"><Textarea rows={2} value={w.credits??""} maxLength={2000} onChange={e=>set({credits:e.target.value})}/></Field>
          </div></details>
          <Field label="Seu papel no projeto *"><Input value={w.role} onChange={(e) => set({ role: e.target.value })} placeholder="Direção, roteiro e edição" /></Field>
          <div className="grid grid-cols-[1fr_110px] gap-3">
            <Field label="Categoria"><Input value={w.category} onChange={(e) => set({ category: e.target.value })} placeholder="Documentário, Campanha, Reportagem…" /></Field>
            <Field label="Ano"><Input value={w.year} onChange={(e) => set({ year: e.target.value })} /></Field>
          </div>
          {!!portfolio.areas?.length && <Field label="Área (aba da galeria)">
            <select aria-label="Área do trabalho" value={w.area ?? ""} onChange={(e) => set({ area: e.target.value || undefined })} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="">Sem área</option>{portfolio.areas.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select></Field>}
          <Field label="Softwares" hint="Viram filtro no seu site."><TagInput value={w.software} onChange={(software) => set({ software })} placeholder="Digite e Enter" suggestions={role.software} /></Field>
          <Field label="Código no GitHub (opcional)"><Input value={w.repositoryUrl ?? ""} placeholder="https://github.com/usuario/repositorio" onChange={(e) => set({ repositoryUrl: e.target.value.trim() })} /></Field>
          {w.kind === "video" && <Field label="Proporção do vídeo">
            <select value={w.aspect ?? "16:9"} onChange={(e) => set({ aspect: e.target.value === "9:16" ? "9:16" : "16:9" })} className="w-full rounded-lg border p-2">
              <option value="16:9">Horizontal (16:9)</option><option value="9:16">Vertical (9:16)</option>
            </select>
          </Field>}
          {w.kind === "image" && <Field label="Imagens da galeria" hint="Um link direto de imagem por linha. Até 12 imagens.">
            <Textarea rows={4} value={galleryText} onChange={(e) => setGalleryText(e.target.value)} />
          </Field>}
          <Field label={w.kind === "script" ? "Trecho do roteiro ou sinopse" : w.kind === "audio" ? "Descrição, ficha ou transcrição do áudio" : "Descrição"}><Textarea rows={4} value={w.description} onChange={(e) => set({ description: e.target.value })} /></Field>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!!busy} onClick={() => void suggest("desc")}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100">{busy === "desc" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Sugerir descrição {DEMO_MODE ? "com IA" : "· 1 crédito"}</button>
            <button type="button" disabled={!!busy} onClick={() => void suggest("tags")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50">{busy === "tags" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Sugerir tags {DEMO_MODE ? "" : "· 1 crédito"}</button>
          </div>
          {aiMessage && <p role="status" className="text-sm text-red-700">{aiMessage}</p>}
          {aiText && <Field label="Sugestão para revisar">
            <Textarea rows={4} value={aiText} onChange={(e) => setAiText(e.target.value)} />
            <button className="mt-2 text-sm font-semibold text-brand-700" onClick={() => { set({ description: aiText }); setAiText(""); }}>Aplicar à descrição</button>
          </Field>}
          <Field label="Minha contribuição"><Textarea rows={3} value={w.contribution ?? ""} onChange={(e) => set({ contribution: e.target.value })} placeholder="Quais decisões e etapas ficaram sob sua responsabilidade?" /></Field>
          <Field label="Entregas"><TagInput value={w.deliverables ?? []} onChange={(deliverables) => set({ deliverables })} placeholder="Ex. · Montagem do trailer (Enter)" /></Field>
          <Field label="Visibilidade" hint="Republicar atualiza o site. Para remover o trabalho de uma vitrine já enviada, desative o link em Oportunidades.">
            <select value={w.visibility ?? "public"} onChange={(e) => set({ visibility: e.target.value as Work["visibility"] })} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="public">Site público e vitrines</option><option value="link">Somente em vitrines compartilhadas</option><option value="private">Somente no acervo privado</option>
            </select>
          </Field>
          {w.kind === "video" && <Field label="Momentos que mostram seu trabalho" hint="Use mm:ss ou hh:mm:ss. A reprodução por trecho funciona com YouTube e Vimeo.">
            <div className="flex gap-2"><Input aria-label="Timecode" placeholder="02:15" value={markerTime} onChange={(e) => setMarkerTime(e.target.value)} className="w-24" />
              <Input aria-label="Descrição do momento" value={markerLabel} onChange={(e) => setMarkerLabel(e.target.value)} placeholder="Ex. · montagem de entrevistas" />
              <button disabled={markerSeconds(markerTime) === null || !markerLabel.trim() || (w.markers?.length ?? 0) >= 12} className="rounded-lg border px-2 text-sm disabled:opacity-50"
                onClick={() => { set({ markers: [...(w.markers ?? []), { time: markerTime, label: markerLabel.trim() }] }); setMarkerTime(""); setMarkerLabel(""); }}>Adicionar</button></div>
            <ul>{w.markers?.map((marker, index) => <li key={index} className="mt-2 text-sm">{marker.time} · {marker.label} <button aria-label={`Excluir marcador ${marker.time}`} className="text-red-700" onClick={() => set({ markers: w.markers?.filter((_, i) => i !== index) })}>Excluir</button></li>)}</ul>
          </Field>}
          {w.tags.length > 0 && <Field label="Tags"><TagInput value={w.tags} onChange={(tags) => set({ tags })} /></Field>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!w.featured} onChange={(e) => set({ featured: e.target.checked })} /> Usar como destaque (reel e capa do site)</label>
        </div>
        <div className="flex gap-3 border-t border-slate-100 px-7 py-5">
          <button onClick={onClose} className="h-12 rounded-xl border border-slate-300 px-8 font-medium hover:bg-slate-50">Cancelar</button>
          <button onClick={save} disabled={!w.title.trim() || !w.role.trim()} className="h-12 flex-1 rounded-xl bg-brand-600 font-semibold text-white hover:bg-brand-700 disabled:opacity-50">Salvar trabalho</button>
        </div>
      </aside>
    </div>
  );
}

export default function Works() {
  const { portfolio: p, update, flush } = useStore();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<WorkKind | "">("");
  const [editing, setEditing] = useState<Work | null>(null);
  const [sheet, setSheet] = useState<Awaited<ReturnType<typeof readWorks>>>();
  const [external, setExternal] = useState<Awaited<ReturnType<typeof readExternal>>>();
  const [externalFile, setExternalFile] = useState<File>();
  const [selectedSheet, setSelectedSheet] = useState("");
  const [mapping, setMapping] = useState<number[]>([]);
  const [defaultKind, setDefaultKind] = useState<WorkKind>("video");
  const [defaultRole, setDefaultRole] = useState("");
  async function loadExternal(file: File, tab?: string) {
    setExternal(undefined); setSheet(undefined); setSheetMessage(""); setSheetBusy(true);
    try {
      const result = await readExternal(file, tab);
      setExternal(result); setExternalFile(file); setSelectedSheet(tab ?? result.sheets[0] ?? "");
      setMapping(guessMapping(result.table.columns));
    } catch (error) { setSheetMessage(error instanceof Error ? error.message : "Não foi possível ler o arquivo."); }
    finally { setSheetBusy(false); }
  }
  const [sheetMessage, setSheetMessage] = useState("");
  const [sheetBusy, setSheetBusy] = useState(false);
  /** Acervo antes da última importação, para desfazer. */
  const [undo, setUndo] = useState<Work[]>();
  const [menu, setMenu] = useState<string | null>(null);
  const [grid, setGrid] = useState(false);
  const [newVisibility, setNewVisibility] = useState<Visibility>("public");
  const privateCount = p.works.filter((w) => w.visibility === "private").length;
  // Guia de pendências: ?pendencias=capas|descricoes|anos abre direto no que falta (links do painel).
  const pendingParam = params.get("pendencias");
  const pendingTab = WORK_CHECKS.find((c) => c.id === pendingParam)?.id;
  const pendingCounts = WORK_CHECKS.map((c) => ({ id: c.id, n: worksPending(p.works, c.id).length }));
  const pendingTotal = pendingCounts.reduce((sum, c) => sum + c.n, 0);
  const tabsRef = useRef<HTMLDivElement>(null);
  // Vindo do painel (já rolado), a guia abre no topo para a pessoa ver o que falta.
  useEffect(() => { if (pendingTab) tabsRef.current?.scrollIntoView?.({ block: "start" }); }, [pendingTab]);
  const openPending = (id?: WorkCheckId) => setParams({ pendencias: id ?? pendingCounts.find((c) => c.n)?.id ?? "capas" });

  useEffect(() => { if (params.get("novo")) { setEditing(newWork()); setParams({}, { replace: true }); } }, [params, setParams]);

  const list = useMemo(() => p.works.filter((w) => (!kind || w.kind === kind) &&
    (!q || `${w.title} ${w.client} ${w.category} ${w.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()))), [p.works, kind, q]);

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <PageHeader title="Trabalhos" subtitle="Seu acervo criativo em um só lugar."
        action={<button onClick={() => setEditing(newWork())} className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700">+ Novo trabalho</button>} />
      <div ref={tabsRef} role="tablist" aria-label="Visão dos trabalhos" className="mb-5 scroll-mt-24 flex gap-1 border-b border-slate-200">
        {([["todos", "Todos os trabalhos"], ["pendencias", `Pendências (${pendingTotal})`]] as const).map(([id, label]) => {
          const on = id === "pendencias" ? !!pendingTab : !pendingTab;
          return <button key={id} role="tab" type="button" aria-selected={on} onClick={() => id === "pendencias" ? openPending() : setParams({})}
            className={cn("-mb-px border-b-2 px-4 py-2.5 text-sm", on ? "border-brand-600 font-semibold text-brand-700" : "border-transparent text-slate-600 hover:text-plum-900")}>{label}</button>;
        })}
      </div>
      {pendingTab ? <WorksPending works={p.works} check={pendingTab} onCheck={openPending} onEdit={setEditing} onDone={() => setParams({})} /> : <>
      {/* Vários de uma vez primeiro: preencher um por um cansa e faz a pessoa desistir. */}
      <section id="varios" aria-label="Adicionar vários trabalhos de uma vez" className="mb-5 rounded-2xl border border-brand-100 bg-white p-5">
        <h2 className="font-display text-xl font-bold text-plum-900">Adicionar vários trabalhos de uma vez</h2>
        <p className="mt-1 text-sm text-slate-600">Escolha o jeito mais fácil para você. Depois dá para completar cada trabalho com calma.</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="flex flex-col rounded-2xl border-2 border-brand-500 bg-brand-50 p-4">
            <span className="flex items-center gap-2 font-semibold text-plum-900"><Table2 size={20} className="text-brand-700" /> Preencher numa tabela</span>
            <p className="mt-1 flex-1 text-sm text-slate-600">Uma linha por trabalho, direto aqui na tela. Dá para colar linhas do Excel ou do Google Planilhas.</p>
            <button type="button" aria-pressed={grid} onClick={() => setGrid(!grid)} className="mt-3 h-11 rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700">{grid ? "Fechar tabela" : "Abrir tabela"}</button>
          </div>
          <div className="flex flex-col rounded-2xl border border-slate-200 p-4">
            <span className="flex items-center gap-2 font-semibold text-plum-900"><FileSpreadsheet size={20} className="text-brand-700" /> Planilha Excel</span>
            <ol className="mt-2 flex-1 space-y-1 text-sm text-slate-600">
              <li><b>1.</b> Baixe o modelo</li>
              <li><b>2.</b> Preencha no Excel ou no Google Planilhas</li>
              <li><b>3.</b> Envie a planilha preenchida</li>
            </ol>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="h-11 rounded-xl border border-brand-200 text-sm font-semibold text-brand-700 hover:bg-brand-50" onClick={() => void downloadWorks().catch(() => setSheetMessage("Não foi possível gerar o Excel."))}>Baixar modelo</button>
              <label className="relative grid h-11 cursor-pointer place-items-center rounded-xl bg-plum-900 text-sm font-semibold text-white hover:opacity-90">Enviar planilha
                <input type="file" aria-label="Importar Excel" accept=".xlsx" disabled={sheetBusy} className="absolute inset-0 cursor-pointer opacity-0" onChange={async (e) => {
                  const file = e.target.files?.[0]; e.target.value = "";
                  if (!file) return;
                  setExternal(undefined); setSheet(undefined); setSheetBusy(true); setSheetMessage("");
                  try { setSheet(await readWorks(file, p.works, newVisibility)); }
                  catch (error) { setSheetMessage(error instanceof Error ? error.message : "Não foi possível ler a planilha."); }
                  finally { setSheetBusy(false); }
                }} />
              </label>
            </div>
            {!!p.works.length && <button type="button" className="mt-2 text-left text-xs font-semibold text-brand-700" onClick={() => void downloadWorks(p.works).catch(() => setSheetMessage("Não foi possível exportar o acervo."))}>Ou baixe seu acervo atual em Excel para editar</button>}
          </div>
          <div className="flex flex-col rounded-2xl border border-slate-200 p-4">
            <span className="flex items-center gap-2 font-semibold text-plum-900"><Link2 size={20} className="text-brand-700" /> Colar links</span>
            <p className="mt-1 flex-1 text-sm text-slate-600">Cole os links do YouTube, Vimeo, Instagram, Behance ou de matérias. Buscamos título e capa.</p>
            <button type="button" className="mt-3 h-11 rounded-xl border border-brand-200 text-sm font-semibold text-brand-700 hover:bg-brand-50" onClick={() => {
              const box = document.getElementById("colar-links") as HTMLDetailsElement;
              box.open = true;
              box.scrollIntoView?.({ behavior: "smooth", block: "start" });
            }}>Colar links</button>
          </div>
        </div>
        <label className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">Trabalhos que entram pela planilha ficam
          <select aria-label="Visibilidade dos trabalhos importados" value={newVisibility} onChange={(e) => { setNewVisibility(e.target.value as Visibility); setSheet(undefined); }} className="rounded border p-1">
            <option value="public">Públicos</option><option value="link">Só com link</option><option value="private">Privados</option>
          </select></label>
        <details className="mt-4 rounded-xl border p-3">
          <summary className="cursor-pointer font-semibold">Importar arquivo externo e mapear colunas</summary>
          <p className="my-2 text-sm text-slate-600">Use Excel, CSV ou o JSON do portfólio. A primeira linha é o cabeçalho. Confira os dados antes de salvar. No Google Planilhas, use Arquivo → Fazer download → Microsoft Excel (.xlsx).</p>
          <input type="file" aria-label="Arquivo externo" accept=".xlsx,.csv,.json" disabled={sheetBusy} onChange={(e) => {
            const file = e.target.files?.[0]; e.target.value = ""; if (file) void loadExternal(file);
          }} />
          {external && <>
            {external.sheets.length > 1 && <label className="mt-3 block text-sm">Aba <select value={selectedSheet} className="rounded border p-1"
              onChange={(e) => { if (externalFile) void loadExternal(externalFile, e.target.value); }}>
              {external.sheets.map((tab) => <option key={tab}>{tab}</option>)}
            </select></label>}
            <div className="mt-3 flex flex-wrap gap-3">
              <label className="text-sm">Formato padrão <select value={defaultKind} className="rounded border p-1" onChange={(e) => {
                setDefaultKind(e.target.value as WorkKind); setSheet(undefined);
              }}>{Object.entries(KIND_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
              <label className="text-sm">Função quando faltar <input className="rounded border p-1" value={defaultRole} onChange={(e) => { setDefaultRole(e.target.value); setSheet(undefined); }} /></label>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {headers.map((header, index) => <label key={header} className="flex flex-col text-sm">{header}
                <select value={mapping[index]} className="rounded border p-1" onChange={(e) => {
                  const column = Number(e.target.value); setMapping((previous) => previous.map((value, position) => position === index ? column : value));
                  setSheet(undefined);
                }}><option value={-1}>Sem coluna</option>
                  {external.table.columns.map((column, i) => <option value={i} key={i}>{column || `Coluna ${i + 1}`}</option>)}
                </select></label>)}
            </div>
            <button className="mt-3 rounded border px-3 py-2 text-sm" onClick={() => setSheet(previewExternal(external.table, mapping, defaultKind, defaultRole, p.works, newVisibility))}>Conferir tabela</button>
          </>}
        </details>
        {sheetMessage && <p className="mt-3 text-sm" role="status">{sheetMessage}</p>}
        {undo && <p className="mt-3 text-sm">Importação aplicada. <button type="button" className="font-semibold text-brand-700" disabled={sheetBusy} onClick={async () => {
          const previous = undo;
          update((current) => ({ ...current, works: previous }));
          setUndo(undefined); setSheetBusy(true);
          try { await flush(); setSheetMessage("Importação desfeita. O acervo voltou a ser como antes."); }
          catch { setSheetMessage("Importação desfeita no rascunho. O servidor ainda não salvou a alteração."); }
          finally { setSheetBusy(false); }
        }}>Desfazer importação</button></p>}
        {sheet && (sheet.errors.length ? <div className="mt-3 text-sm">
          <ul className="text-red-700">{sheet.errors.slice(0, 10).map((error) => <li key={error}>{error}</li>)}</ul>
          <button className="mt-2 text-slate-600" onClick={() => setSheet(undefined)}>Cancelar</button>
        </div> : <ImportReview existing={p.works} incoming={sheet.works} busy={sheetBusy} onCancel={() => setSheet(undefined)} onConfirm={async (works, summary) => {
          setUndo(p.works);
          update((current) => ({ ...current, works }));
          setSheet(undefined); setSheetBusy(true);
          try { await flush(); setSheetMessage(`${DEMO_MODE ? "Planilha aplicada ao acervo de demonstração" : "Planilha salva no acervo"}: ${summary}.`); }
          catch { setSheetMessage("Planilha aplicada ao rascunho. O servidor ainda não salvou a alteração."); }
          finally { setSheetBusy(false); }
        }} />)}
      </section>
      {grid && <WorksGrid key={p.works.map((work) => work.id).join()} onClose={() => setGrid(false)} />}
      <LinksImport open={!p.works.length} />
      <AreasManager />
      <section className="mb-5 rounded-2xl border bg-white p-4">
        <h2 className="font-semibold">Um trabalho por vez, começando pelo formato</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(KIND_LABEL) as WorkKind[]).map((format) => <button key={format} type="button"
            className="rounded-lg border px-3 py-2 text-sm hover:bg-brand-50" onClick={() => setEditing(newWork(format))}>{KIND_LABEL[format]}</button>)}
        </div>
      </section>
      {privateCount > 0 && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <span><b>{privateCount} trabalho(s) privado(s)</b> não aparecem no site publicado. Privado serve para rascunhos e versões só para você.</span>
        <button type="button" className="rounded-lg bg-amber-600 px-3 py-2 font-semibold text-white hover:bg-amber-700" onClick={() => {
          if (!window.confirm(`Tornar públicos os ${privateCount} trabalho(s) privado(s)? Eles passam a aparecer no site.`)) return;
          update((x) => { x.works = x.works.map((w) => w.visibility === "private" ? { ...w, visibility: "public" } : w); return x; });
        }}>Tornar todos públicos</button>
      </div>}
      <div className="mb-5 max-w-2xl"><MediaQuota p={p} /></div>
      <label className="relative block max-w-2xl">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar trabalhos" className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 outline-none focus:border-brand-400" />
      </label>
      <div className="mt-5 flex flex-wrap gap-2">
        {KINDS.map(({ id, label, icon: I }) => (
          <button key={label} onClick={() => setKind(id)} className={cn("inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm", kind === id ? "border-brand-100 bg-brand-100 font-semibold text-brand-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}>
            {id && <I size={16} />}{label}
          </button>
        ))}
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((w) => {
          const I = KIND_ICON[w.kind];
          return (
            <article key={w.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <button onClick={() => setEditing(w)} className="relative block aspect-[16/10] w-full" style={coverStyle(w.cover)} aria-label={`Editar ${w.title}`}>
                {w.featured && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><Star size={12} fill="currentColor" /> Destaque</span>}
                <span className="absolute bottom-3 left-3 grid h-8 w-8 place-items-center rounded-lg bg-black/55 text-white">{w.kind === "video" ? <Play size={14} fill="currentColor" /> : <I size={15} />}</span>
              </button>
              <div className="relative flex items-start justify-between gap-2 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{w.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500"><I size={14} /> {KIND_LABEL[w.kind]} · {w.category || "Sem categoria"}</p>
                </div>
                <button aria-label="Mais opções" onClick={() => setMenu(menu === w.id ? null : w.id)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><MoreHorizontal size={18} /></button>
                {menu === w.id && (
                  <div className="absolute right-3 top-11 z-10 w-44 rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg" onMouseLeave={() => setMenu(null)}>
                    <button className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50" onClick={() => { setEditing(w); setMenu(null); }}>Editar</button>
                    <Link to={`/app/estudio?trabalho=${w.id}`} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50">Editar arte (Estúdio)</Link>
                    <button className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50" onClick={() => { update((x) => { x.works.forEach((y) => (y.featured = y.id === w.id)); return x; }); setMenu(null); }}>Marcar como destaque</button>
                    <button className="w-full rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50" onClick={() => { update((x) => { x.works = x.works.filter((y) => y.id !== w.id); return x; }); setMenu(null); }}>Excluir</button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
        <button onClick={() => setEditing(newWork())} className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-brand-400 hover:text-brand-700">
          <Upload /> <span className="font-medium">Adicionar trabalho</span><span className="text-xs">Link ou arquivo</span>
        </button>
      </div>
      </>}
      {editing && <WorkDrawer key={editing.id} initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

