import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/layout/AppShell";
import { Button, Field, Input, Textarea } from "../../components/ui";
import { DEMO_MODE } from "../../config/app";
import { api, type HotsiteSource, type ImportedJob, type OpportunityLink, type OpportunityRequest, type SavedResume } from "../../lib/api";
import { matchEvidence, suggestEvidence } from "../../lib/evidence";
import { useStore } from "../../lib/store";

import OpportunityEvidence from "./OpportunityEvidence";
import ResumeWorkspace from "./ResumeWorkspace";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Lê a imagem como base64 (sem o prefixo data:). */
export function imageBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}

export function linkStatus(link: OpportunityLink, now = Date.now()) {
  if (link.revoked) return { live: false, label: "Desativado" };
  if (link.noExpiry) return { live: true, label: "No ar, sem prazo" };
  if (link.expires_at * 1000 > now) return { live: true, label: "No ar até " + new Date(link.expires_at * 1000).toLocaleDateString("pt-BR") };
  return { live: false, label: "Vencido" };
}

const SOURCES: [HotsiteSource, string][] = [
  ["livre", "Escrever eu mesmo"],
  ["vaga", "A vaga e os trabalhos escolhidos"],
  ["curriculo", "Um currículo salvo (padrão ou adaptado)"],
];

export default function Opportunities() {
  const { portfolio, flush, update } = useStore();
  const [params,setParams]=useSearchParams();
  const [deleteTarget,setDeleteTarget]=useState<string|null>(null);
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [pitch, setPitch] = useState("");
  const [days, setDays] = useState<OpportunityRequest["days"]>(30);
  const [source, setSource] = useState<HotsiteSource>("livre");
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [resumeId, setResumeId] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [links, setLinks] = useState<OpportunityLink[]>([]);
  const [ready, setReady] = useState(false);
  const [ai, setAi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const ranked = matchEvidence(brief, portfolio.works);
  const chosen = selected.flatMap((id) => ranked.filter(({ work }) => work.id === id));
  const suggestions = suggestEvidence(brief, portfolio.works);
  const resume = resumes.find((item) => item.id === resumeId);

  useEffect(() => {
    if (DEMO_MODE) return;
    api.opportunities().then((list) => { setLinks(list); setReady(true); }).catch(() => setMessage("Falha ao carregar os links."));
    api.aiStatus().then(({ enabled }) => setAi(enabled)).catch(() => {});
    api.resumes().then(setResumes).catch(() => {});
  }, []);

  async function run(operation: () => Promise<void>) {
    setBusy(true); setMessage("");
    try { await operation(); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Não foi possível concluir."); }
    finally { setBusy(false); }
  }

  function applyJob(job: ImportedJob) {
    setTitle(job.title || title);
    setBrief(job.brief);
    if (job.credits !== undefined) update((p) => ({ ...p, aiCredits: job.credits! }));
    setMessage(job.truncated ? "Vaga lida até 5.000 caracteres. Revise o briefing." : "Vaga lida. Revise o título e o briefing antes de continuar.");
  }

  async function readImage(file: File) {
    if (!IMAGE_TYPES.includes(file.type)) throw new Error("Envie PNG, JPG ou WEBP.");
    if (file.size > 4 * 1024 * 1024) throw new Error("A imagem deve ter até 4 MB.");
    applyJob(await api.importJobImage(await imageBase64(file), file.type));
  }

  const request = (): OpportunityRequest => ({
    title, pitch, days, source, brief, resumeName: source === "curriculo" ? resume?.name ?? "" : "",
    evidenceIds: chosen.map(({ work }) => work.id),
  });

  function resetForm() {
    setEditing(null); setTitle(""); setBrief(""); setPitch(""); setSelected([]); setDays(30); setSource("livre"); setResumeId("");
  }

  function load(link: OpportunityLink, duplicate: boolean) {
    const r = link.request??{title:link.title,pitch:"",brief:"",days:link.noExpiry?0:30,source:"livre",resumeName:"",evidenceIds:[]} as OpportunityRequest;
    setEditing(duplicate ? null : link.slug);
    setTitle(duplicate ? `${r.title} (cópia)`.slice(0, 120) : r.title);
    setBrief(r.brief); setPitch(r.pitch); setDays(r.days); setSource(r.source);
    setSelected(r.evidenceIds.filter((id) => portfolio.works.some((w) => w.id === id)));
    setResumeId(resumes.find((item) => item.name === r.resumeName)?.id ?? "");
    setMessage(duplicate ? "Cópia aberta. Ajuste e publique como novo hotsite." : "Editando. O link continua o mesmo.");
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  }

  useEffect(()=>{
    const slug=params.get("editar");if(!slug||!ready)return;
    const found=links.find(item=>item.slug===slug);
    if(found)load(found,false);else setMessage("Hotsite não encontrado na sua conta.");
    const next=new URLSearchParams(params);next.delete("editar");setParams(next,{replace:true});
  },[params,ready,links]);

  async function publish() {
    await flush();
    if (editing) {
      const link = await api.updateOpportunity(editing, request());
      setLinks((current) => current.map((item) => item.slug === link.slug ? link : item));
      resetForm();
      setMessage("Hotsite atualizado. O endereço continua o mesmo.");
      return;
    }
    const link = await api.createOpportunity(request());
    setLinks((current) => [link, ...current]);
    setMessage("Hotsite publicado. Copie o endereço na lista abaixo.");
  }

  async function suggestPitch() {
    if (source === "curriculo") {
      const result = await api.suggest("resume_summary", { curriculo: resume!.content, vaga: brief.trim() ? { titulo: title, descricao: brief } : "" });
      setPitch(result.text.slice(0, 1500));
      update((p) => ({ ...p, aiCredits: result.credits }));
    } else {
      const evidence = chosen.map(({ work: { title: t, role, description, contribution, deliverables } }) =>
        ({ title: t, role, description, contribution, deliverables }));
      const result = await api.suggest("pitch", { brief, title, evidence });
      setPitch(result.text);
      update((p) => ({ ...p, aiCredits: result.credits }));
    }
    setMessage("Revise a apresentação antes de publicar.");
  }

  const canSuggest = ai && !busy && portfolio.aiCredits > 0 &&
    (source === "vaga" ? !!brief.trim() && chosen.length > 0 : source === "curriculo" ? !!resume : false);

  return (
    <div className="mx-auto max-w-6xl p-5 sm:p-8">
      <PageHeader title="Hotsites por oportunidade" subtitle="Crie quantos quiser: um por vaga, por tipo de vaga ou por segmento. Cada um tem seu próprio link." />
      {DEMO_MODE && <p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">A curadoria funciona na demonstração. Ative o backend para ler vagas, publicar e compartilhar links.</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
          {editing && <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700">Editando um hotsite publicado. <button className="underline" onClick={resetForm}>Cancelar edição</button></p>}
          {!DEMO_MODE && <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-plum-900">1. A vaga (opcional)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Input type="url" aria-label="Link da vaga" placeholder="Cole o link da vaga" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} className="min-w-0 flex-1" />
              <Button variant="secondary" disabled={busy || !jobUrl.trim()} onClick={() => void run(async () => applyJob(await api.importJob(jobUrl.trim())))}>Ler vaga</Button>
            </div>
            {ai && <label className="mt-2 block text-sm text-slate-600">Ou envie um print ou foto do anúncio · 1 crédito
              <input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Print ou foto da vaga" className="mt-1 block w-full max-w-full text-sm" disabled={busy || portfolio.aiCredits < 1}
                onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void run(() => readImage(file)); }} /></label>}
          </div>}
          <Field label="Título do hotsite" hint="Pode ser a vaga, um tipo de vaga ou um segmento. Ex.: Edição para TV · Podcast · Marcas.">
            <Input maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. · Edição de documentário para produtora" />
          </Field>
          <Field label="Briefing ou descrição da vaga" hint="Fica só com você: não aparece no link. Se pedir a IA, o texto é enviado ao provedor.">
            <Textarea rows={5} maxLength={5000} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Ex. · Montagem documental, entrevistas e DaVinci Resolve." />
          </Field>
          {!DEMO_MODE && ai && <Button variant="secondary" disabled={busy || !brief.trim() || portfolio.aiCredits < 1} onClick={() => void run(async () => {
            const result=await api.suggest("job", {titulo:title,descricao:brief});
            update(p=>({...p,aiCredits:result.credits}));setBrief(result.text.slice(0,5000));
          })}>Organizar vaga com IA · 1 crédito</Button>}
          <Field label="A apresentação do hotsite parte de">
            <select aria-label="Origem da apresentação" value={source} onChange={(e) => setSource(e.target.value as HotsiteSource)} className="w-full rounded-xl border border-slate-300 px-3 py-2">
              {SOURCES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          {source === "curriculo" && (resumes.length ? <select aria-label="Currículo de origem" value={resumeId} onChange={(e) => setResumeId(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2">
            <option value="">Escolha um currículo salvo</option>
            {resumes.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.kind === "base" ? "Padrão" : "Adaptado à vaga"}</option>)}
          </select> : <p className="text-sm text-slate-600">Nenhum currículo salvo ainda. Cadastre no painel de currículos, abaixo.</p>)}
          <Field label="Apresentação para quem abrir o link"><Textarea rows={5} maxLength={1500} value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="Conte como sua experiência se conecta à oportunidade." /></Field>
          <div className="flex flex-wrap gap-3">
            <select aria-label="Validade do link" value={days} onChange={(e) => setDays(Number(e.target.value) as OpportunityRequest["days"])} className="rounded-xl border border-slate-300 px-3">
              <option value={0}>Sem prazo</option>
              {[7, 30, 60].map((d) => <option key={d} value={d}>{d} dias</option>)}
            </select>
            {ai && source !== "livre" && <Button variant="secondary" disabled={!canSuggest} onClick={() => void run(suggestPitch)}>Gerar apresentação · 1 crédito</Button>}
            <Button disabled={!ready || busy || !title.trim() || (!chosen.length && !pitch.trim())} onClick={() => void run(publish)}>{editing ? "Salvar alterações" : "Publicar hotsite"}</Button>
          </div>
          {message && <p role="status" className="text-sm text-plum-900">{message}</p>}
        </section>
        <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-plum-900">Trabalhos selecionados · {chosen.length}/3</h2>
            <Button variant="secondary" disabled={!suggestions.length} onClick={() => setSelected(suggestions)}>Selecionar sugestões</Button>
          </div>
          <p className="mt-3 text-sm text-slate-600">As sugestões comparam termos do briefing com os dados cadastrados. Confira o papel, a contribuição e a mídia de cada trabalho.</p>
          {!ranked.length && <Link className="mt-4 inline-block font-semibold text-brand-700" to="/app/trabalhos?novo=1">Adicionar primeiro trabalho</Link>}
          <div className="mt-4 max-h-96 space-y-2 overflow-auto">
            {ranked.map(({ work, matches }) => (
              <label key={work.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                <input type="checkbox" checked={selected.includes(work.id)} disabled={selected.length >= 3 && !selected.includes(work.id)}
                  onChange={(e) => setSelected(e.target.checked ? [...selected, work.id] : selected.filter((id) => id !== work.id))} className="mt-1" />
                <span><b className="block text-slate-900">{work.title}</b><span className="block text-sm text-slate-600">{work.role} {work.visibility === "link" && "· Apenas por link"}</span>
                  {matches.length > 0 && <span className="text-xs font-medium text-brand-700">{matches.join(" · ")}</span>}</span>
              </label>
            ))}
          </div>
        </section>
      </div>
      <OpportunityEvidence title={title} brief={brief} works={portfolio.works} selected={selected}
        onUse={(nextTitle, nextBrief, ids) => { setTitle(nextTitle); setBrief(nextBrief); setSelected(ids); setPitch(""); }} />
      {!DEMO_MODE && <ResumeWorkspace title={title} brief={brief} ai={ai} onPitch={setPitch}
        onJob={(jobTitle, jobBrief) => { setTitle(jobTitle); setBrief(jobBrief); }} />}
      {!DEMO_MODE && <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-plum-900">Seus hotsites</h2>
        {!links.length && <p className="mt-2 text-sm text-slate-500">Nenhum hotsite publicado.</p>}
        {links.map((link) => {
          const { live, label } = linkStatus(link);
          const href = "/o/" + link.slug;
          return <div key={link.slug} className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
            <div className="flex-1"><b>{link.title}</b><p className="text-sm text-slate-600">{label} · {link.visits} aberturas
              {link.request?.source === "curriculo" && link.request.resumeName ? ` · a partir de "${link.request.resumeName}"` : ""}</p></div>
            {live && <>
              <a href={href} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-700">Abrir</a>
              <Button variant="secondary" disabled={busy} onClick={() => void run(async () => {
                await navigator.clipboard.writeText(new URL(href, window.location.origin).href); setMessage("Link copiado.");
              })}>Copiar</Button>
            </>}
            {<>
              <Button variant="secondary" disabled={busy} onClick={() => load(link, false)}>{live ? "Editar" : "Reativar"}</Button>
              <Button variant="secondary" disabled={busy} onClick={() => load(link, true)}>Duplicar</Button>
            </>}
            <Button variant="danger" disabled={busy} onClick={()=>setDeleteTarget(link.slug)}>Excluir</Button>
            {deleteTarget===link.slug&&<div role="alertdialog" aria-label="Confirmar exclusão do hotsite" className="w-full rounded-xl border border-red-200 bg-red-50 p-3 text-sm"><p>Excluir este hotsite definitivamente? O link deixará de funcionar. Seus trabalhos e o portfólio principal são preservados.</p><div className="mt-2 flex gap-2"><Button variant="secondary" onClick={()=>setDeleteTarget(null)}>Cancelar exclusão</Button><Button variant="danger" disabled={busy} onClick={()=>void run(async()=>{await api.deleteOpportunity(link.slug);setLinks(current=>current.filter(item=>item.slug!==link.slug));if(editing===link.slug)resetForm();setDeleteTarget(null);setMessage("Hotsite excluído.");})}>Excluir definitivamente</Button></div></div>}
            {live && <Button variant="secondary" disabled={busy} onClick={() => void run(async () => {
              await api.revokeOpportunity(link.slug);
              setLinks((current) => current.map((item) => item.slug === link.slug ? { ...item, revoked: 1 } : item));
            })}>Desativar</Button>}
          </div>;
        })}
      </section>}
    </div>
  );
}

