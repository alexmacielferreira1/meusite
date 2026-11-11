import { Linkedin, Loader2, Sparkles, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DEMO_MODE } from "../config/app";
import { api } from "../lib/api";
import { mergeProfiles, parseResume, reviewNotes, yearsOfExperience, type ImportedProfile, type ImportPicks, type ResumeSource } from "../lib/resumeParse";
import { useStore } from "../lib/store";
import { Button, Field, Input, Textarea } from "./ui";

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).replace(/^[^,]*,/, ""));
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

const ALL: ImportPicks = { basics: true, contacts: true, bio: true, experience: true, education: true, years: true, skills: false, works: true };

/** Passo a passo curto para baixar o PDF do LinkedIn (sempre visível no cartão recomendado). */
export function LinkedinSteps() {
  const steps = [
    <>No computador, abra o seu perfil em linkedin.com (sua foto → <b>Ver perfil</b>).</>,
    <>Logo abaixo do nome, clique em <b>Mais</b> (ou <b>Recursos</b>) → <b>Salvar como PDF</b>.</>,
    <>Envie aqui o PDF baixado (normalmente <b>Profile.pdf</b>, na pasta Downloads).</>,
  ];
  return (
    <ol aria-label="Como baixar o PDF do LinkedIn" className="mt-3 grid gap-2 text-sm text-slate-700">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-2">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{index + 1}</span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Importa o currículo (PDF livre, PDF do LinkedIn ou texto colado), mostra o que foi lido
 * e aplica só o que a pessoa marcar.
 */
export function ResumeImport({ onApply, title = "Preencher com seu currículo", compact = false }: {
  onApply: (data: ImportedProfile, picks: ImportPicks) => void;
  title?: string;
  /** Dois botões lado a lado (painel); a revisão abre numa janela. */
  compact?: boolean;
}) {
  const [driveUrl, setDriveUrl] = useState("");
  const { portfolio, update } = useStore();
  const [text, setText] = useState("");
  const [source, setSource] = useState<ResumeSource>("curriculo");
  const [data, setData] = useState<ImportedProfile | null>(null);
  const [picks, setPicks] = useState<ImportPicks>(ALL);
  const [keepBase, setKeepBase] = useState(true);
  const [ai, setAi] = useState(false);
  const [byAi, setByAi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Leitura com IA só quando há provedor para o recurso "curriculo".
    if (!DEMO_MODE) api.aiStatus().then(({ enabled, features }) => setAi(features ? features.includes("curriculo") : enabled)).catch(() => {});
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true); setMessage("");
    try { await action(); }
    catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  const aiReady = ai && !DEMO_MODE && portfolio.aiCredits >= 1;

  function show(found: ImportedProfile, content: string, kind: ResumeSource, viaAi: boolean, note = "") {
    setText(content); setSource(kind); setData(found); setPicks(ALL); setByAi(viaAi);
    const empty = !found.name && !found.experience.length && !found.education.length;
    setMessage(note + (empty ? "Lemos pouca coisa deste arquivo. Confira o resumo abaixo ou cole o texto do currículo."
      : viaAi ? "Lemos seu currículo com IA (1 crédito). Confira o resumo e preencha seu perfil." : "Lemos seu currículo. Confira o resumo e preencha seu perfil."));
  }

  function read(content: string, kind: ResumeSource, note = "") {
    show(parseResume(content, kind), content, kind, false, note);
  }

  /** Com IA disponível, ela lê o arquivo original (colunas, ícones e arte entram na leitura). Sem IA, a leitura automática. */
  async function importFile(file: File, kind: ResumeSource) {
    const image = /^image\/(png|jpeg|webp)$/.test(file.type);
    if ((!/\.pdf$/i.test(file.name) && !(image && aiReady)) || file.size > 2 * 1024 * 1024)
      throw new Error(aiReady ? "Envie um PDF ou uma imagem de até 2 MB." : "Envie um PDF de até 2 MB.");
    const data = await fileToBase64(file);
    let note = "";
    if (aiReady) {
      try {
        const result = await api.readResumeFile(data, image ? file.type : "application/pdf", kind);
        update((current) => ({ ...current, aiCredits: result.credits }));
        show(mergeProfiles(result.profile, parseResume(result.content, result.source)), result.content, result.source, true);
        return;
      } catch (error) {
        if (image) throw error;
        note = "A leitura com IA não deu certo agora e o crédito não foi usado. ";
      }
    }
    const result = await api.importResumePdf(data);
    read(result.content, kind === "linkedin" || result.source === "linkedin" ? "linkedin" : "curriculo", note);
  }

  async function importDrive() {
    const result = await api.importResumeDrive(driveUrl.trim());
    read(result.content, result.source === "linkedin" ? "linkedin" : "curriculo");
  }

  async function improve() {
    const { profile, credits } = await api.extractProfile(text.slice(0, 12000), source);
    update((current) => ({ ...current, aiCredits: credits }));
    setData(mergeProfiles(profile, parseResume(text, source)));
    setByAi(true);
    setMessage("A IA organizou o currículo. Confira o resumo e preencha seu perfil.");
  }

  async function apply(current: ImportedProfile) {
    onApply(current, picks);
    if (keepBase && !DEMO_MODE && text.trim()) {
      await api.saveResume({ name: source === "linkedin" ? "LinkedIn" : "Currículo-base", kind: "base", content: text.trim().slice(0, 12000),
        letter: "", job_title: "", job_url: "", brief: "" }).catch(() => setMessage("Perfil preenchido. O currículo não foi guardado; tente em Oportunidades."));
    }
    setData(null);
    setMessage((current) => current.startsWith("Perfil preenchido") ? current : "Perfil preenchido. O que faltar aparece nas pendências, para completar aos poucos.");
  }

  const edit = (patch: Partial<ImportedProfile>) => setData((current) => current && { ...current, ...patch });
  const pick = (key: keyof ImportPicks, label: string, count?: number) => (
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={picks[key]} onChange={(event) => setPicks({ ...picks, [key]: event.target.checked })} />
      {label}{count !== undefined && ` (${count})`}</label>
  );
  const years = data ? yearsOfExperience(data) : 0;
  const notes = data ? reviewNotes(data) : [];

  const fileInput = (kind: ResumeSource, className: string) => (
    <input aria-label={kind === "linkedin" ? "PDF do LinkedIn" : "Currículo em PDF"} type="file" accept={aiReady && kind === "curriculo" ? ".pdf,application/pdf,image/png,image/jpeg,image/webp" : ".pdf,application/pdf"} disabled={DEMO_MODE || busy} className={className}
      onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void run(() => importFile(file, kind)); }} />
  );
  const driveField = (
    <details className="text-sm">
      <summary className="cursor-pointer font-semibold text-brand-700">Está no Google Drive? Cole o link</summary>
      <p className="mt-1 text-xs text-slate-500">PDF no Drive ou documento do Google Docs, compartilhado como "Qualquer pessoa com o link". No celular, o botão de carregar também abre o Drive.</p>
      <div className="mt-2 flex gap-2">
        <Input aria-label="Link do Google Drive" type="url" placeholder="https://drive.google.com/…" value={driveUrl} disabled={DEMO_MODE || busy} onChange={(event) => setDriveUrl(event.target.value)} />
        <Button type="button" variant="secondary" disabled={DEMO_MODE || busy || !driveUrl.trim()} onClick={() => void run(importDrive)}>Ler</Button>
      </div>
    </details>
  );
  const pasteField = (
    <details open={DEMO_MODE && !compact}>
      <summary className="cursor-pointer text-sm font-semibold text-brand-700">Ou cole o texto do currículo</summary>
      {DEMO_MODE && <p className="mt-2 text-xs text-slate-500">Na demonstração, o envio de PDF fica desligado. Cole o texto para testar.</p>}
      <Textarea aria-label="Texto do currículo" rows={6} maxLength={12000} className="mt-2" value={text} onChange={(event) => setText(event.target.value)} />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={busy || text.trim().length < 20} onClick={() => read(text, "curriculo")}>Ler currículo</Button>
        <Button type="button" variant="secondary" disabled={busy || text.trim().length < 20} onClick={() => read(text, "linkedin")}>Ler como LinkedIn</Button>
      </div>
    </details>
  );
  // O LinkedIn vem primeiro e maior: o formato é sempre o mesmo, então a leitura sai mais completa e com menos erros.
  const linkedinCard = (
    <div className="rounded-2xl border-2 border-brand-500 bg-brand-50 p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white"><Linkedin size={22} /></span>
        <span>
          <span className="rounded-md bg-brand-600 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">Recomendado</span>
          <span className="mt-1 block font-display text-lg font-bold text-plum-900">Currículo do LinkedIn</span>
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-700">Mais completo e com menos erros: o PDF do LinkedIn segue sempre o mesmo formato.</p>
      <LinkedinSteps />
      <label className="relative mt-4 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700">
        <Upload size={18} /> Enviar PDF do LinkedIn
        {fileInput("linkedin", "absolute inset-0 cursor-pointer opacity-0")}
      </label>
      <p className="mt-2 text-center text-xs text-slate-500">No aplicativo do celular essa opção não aparece. Use o navegador.</p>
      {aiReady && <p className="mt-1 flex items-center justify-center gap-1 text-center text-xs text-brand-700"><Sparkles size={13} /> Lido com IA · usa 1 dos seus créditos</p>}
    </div>
  );
  const otherCard = (
    <label className="relative flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-brand-200 p-3 hover:border-brand-500 hover:bg-brand-50">
      <Upload size={20} className="shrink-0 text-brand-700" />
      <span><span className="block text-sm font-semibold text-plum-900">Carregar outro currículo</span>
        <span className="block text-xs text-slate-500">PDF de qualquer formato</span>
        <span className="block text-xs text-amber-700">{aiReady ? "PDF ou foto do currículo · lido com IA (1 crédito)" : "(menos preciso, requer ajustes)"}</span></span>
      {fileInput("curriculo", "absolute inset-0 cursor-pointer opacity-0")}
    </label>
  );
  const chooser = (
    <fieldset disabled={busy} className="mt-4" aria-label="Ler currículo">
      {linkedinCard}
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Não usa LinkedIn?</p>
      <div className="mt-2">{otherCard}</div>
      <div className="mt-2 grid gap-1">{driveField}{pasteField}</div>
    </fieldset>
  );

  const status = (<>
    {busy && <p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><Loader2 size={16} className="animate-spin" /> Lendo…</p>}
    {message && <p role="status" className="mt-3 text-sm text-plum-900">{message}</p>}
  </>);
  const counts = data ? [
    data.experience.length && `${data.experience.length} experiência(s)`, data.education.length && `${data.education.length} formação(ões)`,
    data.skills.length && `${data.skills.length} competência(s)`, data.projects?.length && `${data.projects.length} trabalho(s) citado(s)`,
    (data.email || data.phone) && "contatos",
  ].filter(Boolean) : [];
  const review = data && (
    <div aria-label="Resumo da leitura" className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
      <p className="font-semibold text-plum-900">{data.name || "Seu currículo"}{data.headline && <span className="font-normal text-slate-600"> · {data.headline}</span>}</p>
      <p className="mt-1 text-sm text-slate-700">{counts.length ? counts.join(" · ") : "Poucas informações encontradas."}</p>
      {byAi && <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700"><Sparkles size={13} /> Lido com IA</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => void run(() => apply(data))}>Preencher meu perfil</Button>
        {ai && !byAi && <Button type="button" variant="secondary" disabled={busy || portfolio.aiCredits < 1 || text.trim().length < 20} onClick={() => void run(improve)}>
          <Sparkles size={16} /> Ler com IA · 1 crédito</Button>}
        <Button type="button" variant="ghost" onClick={() => { setData(null); setMessage(""); }}>Descartar</Button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Nada é salvo sem você clicar em Preencher. O que faltar vira pendência, para completar aos poucos.</p>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-brand-700">Ver e ajustar antes de preencher</summary>
        <div className="mt-3 grid gap-4 rounded-xl bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome"><Input value={data.name} maxLength={120} onChange={(event) => edit({ name: event.target.value })} /></Field>
            <Field label="Título profissional"><Input value={data.headline} maxLength={160} onChange={(event) => edit({ headline: event.target.value })} /></Field>
            <Field label="Cidade"><Input value={data.city} maxLength={80} onChange={(event) => edit({ city: event.target.value })} /></Field>
            <Field label="UF"><Input value={data.state} maxLength={2} onChange={(event) => edit({ state: event.target.value.toUpperCase() })} /></Field>
          </div>
          {!!notes.length && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" aria-label="Pontos para conferir">
            <p className="font-semibold">Para conferir</p>
            <ul className="mt-1 list-disc pl-5">{notes.map((note) => <li key={note}>{note}</li>)}</ul>
            <p className="mt-1 text-xs">Dá para completar aqui ou depois, em Meu perfil.{ai && !byAi ? " A leitura com IA entende melhor currículos com colunas e arte." : ""}</p>
          </div>}
          <p className="text-sm text-slate-600">{[data.email, data.phone && `+${data.phone}`, data.linkedin, data.website].filter(Boolean).join(" · ") || "Contatos: nenhum."}</p>
          {(!data.name || !data.headline || !data.experience.length || !data.education.length) && <p role="status" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Campos não identificados: {[!data.name&&"nome",!data.headline&&"título profissional",!data.experience.length&&"experiência",!data.education.length&&"formação"].filter(Boolean).join(", ")}. Você pode completar manualmente no perfil. A importação não deve inventar esses dados.</p>}
          {data.bio && <p className="line-clamp-3 text-sm text-slate-700">{data.bio}</p>}
          {!!data.experience.length && <ul className="grid gap-1 text-sm">
            {data.experience.map((job, index) => <li key={index} className="grid gap-2 rounded-lg bg-white p-2 sm:grid-cols-[2fr_2fr_1fr_auto]">
              {(["title", "org", "period"] as const).map((field) => (
                <input key={field} aria-label={`${field === "title" ? "Cargo" : field === "org" ? "Empresa" : "Período"} da experiência ${index + 1}`} value={job[field]} maxLength={160}
                  placeholder={field === "title" ? "Cargo" : field === "org" ? "Empresa" : "Período"}
                  className={`rounded border px-2 py-1 ${job[field] ? "border-slate-200" : "border-amber-300 bg-amber-50"}`}
                  onChange={(event) => edit({ experience: data.experience.map((item, i) => i === index ? { ...item, [field]: event.target.value } : item) })} />
              ))}
              <button type="button" aria-label={`Remover ${job.title}`} className="justify-self-end text-slate-400 hover:text-red-600" onClick={() => edit({ experience: data.experience.filter((_, i) => i !== index) })}><X size={16} /></button>
            </li>)}
          </ul>}
          {!!data.education.length && <p className="text-sm text-slate-600">Formação: {data.education.map((course) => [course.title, course.org].filter(Boolean).join(" · ")).join("; ")}</p>}
          {!!data.skills.length && <p className="text-sm text-slate-600">Competências: {data.skills.join(", ")}</p>}
          {!!data.projects?.length && <p className="text-sm text-slate-600">Projetos citados: {data.projects.map((item) => [item.title || item.url, item.client && `(${item.client})`].filter(Boolean).join(" ")).join("; ")}</p>}
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {pick("basics", "Nome, título e cidade")}
            {pick("contacts", "Contatos")}
            {pick("bio", "Resumo como bio")}
            {pick("experience", "Experiências", data.experience.length)}
            {pick("education", "Formação", data.education.length)}
            {years > 0 && pick("years", `${years}+ anos de experiência`)}
            {!!data.skills.length && pick("skills", "Competências como pilares (até 40)")}
            {!!data.projects?.length && pick("works", "Criar trabalhos com os projetos citados (sem link entram como rascunho privado)", data.projects.length)}
          </div>
          <p className="text-xs text-slate-500">Experiências e formação marcadas substituem as que já estão no perfil.</p>
          {!DEMO_MODE && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={keepBase} onChange={(event) => setKeepBase(event.target.checked)} />
            Guardar também como currículo-base (para adaptar a vagas em Oportunidades)</label>}
        </div>
      </details>
    </div>
  );

  if (compact) return (
    <div className="mt-1">
      {chooser}
      {status}
      {review}
    </div>
  );
  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5">
      <h2 className="font-display text-lg font-bold text-plum-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">Envie o PDF do LinkedIn (recomendado) ou outro currículo e nós preenchemos nome, contatos, resumo, experiências e formação. Você confere antes de aplicar.</p>
      {chooser}
      {status}
      {review}
    </section>
  );
}

