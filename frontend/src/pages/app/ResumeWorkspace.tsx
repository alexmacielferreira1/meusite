import { useEffect, useState } from "react";
import { Button, Field, Input, Textarea } from "../../components/ui";
import { api, type ResumeDocument, type SavedResume } from "../../lib/api";
import { useStore } from "../../lib/store";

const empty: ResumeDocument = { name: "", kind: "base", content: "", letter: "", job_title: "", job_url: "", brief: "" };

function readPdf(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Não foi possível ler o PDF."));
    reader.readAsDataURL(file);
  });
}

function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ResumeWorkspace({ title, brief, ai, onJob, onPitch }: {
  title: string;
  brief: string;
  ai: boolean;
  onJob: (title: string, brief: string) => void;
  onPitch: (pitch: string) => void;
}) {
  const { portfolio, update } = useStore();
  const [documents, setDocuments] = useState<SavedResume[]>([]);
  const [active, setActive] = useState("");
  const [draft, setDraft] = useState<ResumeDocument>(empty);
  const [jobUrl, setJobUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.resumes().then(setDocuments).catch(() => setMessage("Não foi possível carregar os currículos."));
  }, []);

  function open(id: string) {
    const record = documents.find((item) => item.id === id);
    setActive(id);
    setDraft(record ?? empty);
    setJobUrl(record?.job_url ?? "");
    setSummary("");
    setMessage("");
  }

  function change(patch: Partial<ResumeDocument>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try { await action(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível concluir."); }
    finally { setBusy(false); }
  }

  async function importPdf(file: File) {
    if (file.size > 2 * 1024 * 1024) throw new Error("O PDF deve ter até 2 MB.");
    const { content } = await api.importResumePdf(await readPdf(file));
    setActive("");
    setDraft({ ...empty, name: file.name.replace(/\.pdf$/i, "").slice(0, 120), content });
    setSummary("");
    setMessage("Texto importado. Revise e salve como currículo-base.");
  }

  async function save(asNew = false) {
    const record = await api.saveResume({
      ...draft, job_url: draft.kind === "vaga" ? jobUrl.trim() : "",
    }, asNew ? undefined : active || undefined);
    setDocuments((list) => [record, ...list.filter((item) => item.id !== record.id)]);
    setActive(record.id);
    setMessage("Currículo salvo na sua biblioteca privada.");
  }

  async function generate(task: "resume" | "letter" | "resume_summary", general = false) {
    const { text, credits } = await api.suggest(task, {
      curriculo: draft.content,
      vaga: general ? "" : { titulo: title, descricao: brief },
    });
    update((current) => ({ ...current, aiCredits: credits }));
    if (task === "resume") {
      setActive("");
      setDraft({ ...empty, kind: "vaga", name: (title.trim() || "Currículo para vaga").slice(0, 120),
        content: text.slice(0, 12000), job_title: title.trim(), job_url: jobUrl.trim(), brief });
      setSummary("");
      setMessage("Versão criada para revisão. Salve para adicioná-la à biblioteca.");
    } else if (task === "letter") {
      // Se a carta partir de um currículo-base, preserve o original e abra outra versão.
      if (draft.kind === "base") setActive("");
      change({ kind: "vaga", name: draft.kind === "base" ? (title.trim() || "Currículo com carta").slice(0, 120) : draft.name,
        letter: text.slice(0, 5000), job_title: title.trim(), job_url: jobUrl.trim(), brief });
      setMessage("Carta criada. Revise e salve a versão.");
    } else {
      setSummary(text.slice(0, 1500));
      setMessage("Revise a apresentação pública antes de usá-la.");
    }
  }

  const canGenerate = ai && !busy && !!draft.content.trim() && portfolio.aiCredits > 0;
  const baseSaved = draft.kind !== "base" || documents.some((item) =>
    item.id === active && item.name === draft.name.trim() && item.content === draft.content.trim());
  const canSave = !busy && !!draft.name.trim() && !!draft.content.trim();

  return (
    <details className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
      <summary className="cursor-pointer font-bold text-plum-900">Currículos, cartas e apresentação do portfólio</summary>
      <p className="mt-3 text-sm text-slate-600">Importe seu currículo ou o PDF exportado do LinkedIn, ou cole o texto. Guarde um original e crie versões para vagas específicas. Currículos e cartas ficam privados.</p>
      <fieldset disabled={busy} className="mt-4 grid gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Currículo salvo">
            <select aria-label="Currículo salvo" value={active} onChange={(event) => open(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
              <option value="">Novo currículo ou versão em edição</option>
              {documents.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.kind === "base" ? "Base" : "Vaga"}</option>)}
            </select>
          </Field>
          <Button type="button" variant="secondary" onClick={() => open("")}>Novo currículo</Button>
          <Field label="Importar PDF de currículo ou LinkedIn" hint="Até 2 MB, 10 páginas e texto selecionável.">
            <input aria-label="Importar PDF de currículo ou LinkedIn" type="file" accept=".pdf,application/pdf" className="text-sm" onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void run(() => importPdf(file));
            }} />
          </Field>
        </div>
        <Field label="Nome da versão"><Input value={draft.name} maxLength={120} onChange={(event) => change({ name: event.target.value })} /></Field>
        <Field label="Tipo de versão">
          <select aria-label="Tipo de versão" value={draft.kind} onChange={(event) => {
            if (event.target.value === "vaga") {
              setActive("");
              change({ kind: "vaga", job_title: title.trim(), brief });
            } else {
              setActive("");
              change({ kind: "base", job_title: "", brief: "", letter: "" });
            }
          }} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="base">Currículo-base</option>
            <option value="vaga">Versão para uma vaga</option>
          </select>
        </Field>
        <Field label="Texto do currículo">
          <Textarea rows={10} maxLength={12000} value={draft.content} onChange={(event) => change({ content: event.target.value })} />
        </Field>
        <Field label="Link da vaga (opcional)" hint="Funciona com páginas públicas de vagas. Se o site pedir login, cole a descrição ou envie um print no campo da vaga, acima.">
          <Input value={jobUrl} maxLength={2000} type="url" placeholder="https://" onChange={(event) => setJobUrl(event.target.value)} />
        </Field>
        <Button type="button" variant="secondary" disabled={!jobUrl.trim()} onClick={() => void run(async () => {
          if ((title.trim() || brief.trim()) && !window.confirm("Substituir o título e o briefing atuais pela vaga importada?")) return;
          const job = await api.importJob(jobUrl.trim());
          onJob(job.title, job.brief);
          setMessage(job.truncated ? "Vaga importada até 5.000 caracteres. Revise o briefing acima." : "Vaga importada. Revise o briefing acima.");
        })}>Importar vaga pelo link</Button>
        {ai && <Button type="button" variant="secondary" disabled={!brief.trim()} onClick={() => void run(async () => {
          const result=await api.suggest("job", {titulo:title,descricao:brief});
          update(p=>({...p,aiCredits:result.credits}));onJob(title,result.text.slice(0,5000));
          setMessage("Vaga organizada. Revise os requisitos antes de adaptar o currículo.");
        })}>Organizar vaga com IA · 1 crédito</Button>}
        {draft.kind === "vaga" && <div className="flex flex-wrap items-center gap-2">
          {draft.brief && <Button type="button" variant="secondary" onClick={() => onJob(draft.job_title, draft.brief)}>Reabrir briefing desta versão</Button>}
          <Button type="button" variant="secondary" disabled={!brief.trim()} onClick={() => {
            change({ job_title: title.trim(), brief });
            setMessage("Briefing vinculado. Salve para guardar a referência nesta versão.");
          }}>Vincular briefing atual</Button>
        </div>}
        {!ai && <p className="text-sm text-slate-600">A geração automática aparece quando a IA está configurada. A biblioteca e a edição manual já funcionam.</p>}
        {ai && <p className="text-sm text-slate-600">Ao gerar, o texto atual do currículo é enviado ao provedor de IA. Remova dados pessoais que não sejam necessários e revise os resultados.</p>}
        {ai && draft.content.trim() && !baseSaved && <p className="text-sm text-slate-600">Salve o currículo-base antes de gerar uma versão ou uma carta.</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={!canGenerate || !baseSaved || !brief.trim()} onClick={() => void run(() => generate("resume"))}>Adaptar para a vaga · 1 crédito</Button>
          <Button type="button" variant="secondary" disabled={!canGenerate || !baseSaved || !brief.trim()} onClick={() => void run(() => generate("letter"))}>Gerar carta · 1 crédito</Button>
          <Button type="button" variant="secondary" disabled={!canGenerate} onClick={() => void run(() => generate("resume_summary", true))}>Sugerir bio do portfólio · 1 crédito</Button>
          <Button type="button" variant="secondary" disabled={!canGenerate || !brief.trim()} onClick={() => void run(() => generate("resume_summary"))}>Sugerir apresentação para a vaga · 1 crédito</Button>
        </div>
        {draft.kind === "vaga" && <Field label="Carta de apresentação"><Textarea rows={6} maxLength={5000} value={draft.letter} onChange={(event) => change({ letter: event.target.value })} /></Field>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={!canSave} onClick={() => void run(() => save())}>Salvar currículo</Button>
          {active && <Button type="button" variant="secondary" disabled={!canSave} onClick={() => void run(() => save(true))}>Salvar como nova versão</Button>}
          <Button type="button" variant="secondary" disabled={!draft.content.trim()} onClick={() => downloadText(draft.content, "curriculo.txt")}>Baixar currículo</Button>
          {draft.letter && <Button type="button" variant="secondary" onClick={() => downloadText(draft.letter, "carta-de-apresentacao.txt")}>Baixar carta</Button>}
          {active && <Button type="button" variant="secondary" onClick={() => {
            if (!window.confirm("Excluir este currículo da biblioteca privada?")) return;
            void run(async () => {
              await api.deleteResume(active);
              setDocuments((list) => list.filter((item) => item.id !== active));
              open("");
              setMessage("Currículo excluído.");
            });
          }}>Excluir</Button>}
        </div>
        <Field label="Apresentação pública editável" hint="Confira se o texto contém apenas informações que você quer publicar.">
          <Textarea rows={5} maxLength={1500} value={summary} onChange={(event) => setSummary(event.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={!summary.trim()} onClick={() => {
            onPitch(summary.trim());
            setMessage("Apresentação copiada para o rascunho do hotsite acima.");
          }}>Usar no hotsite</Button>
          <Button type="button" variant="secondary" disabled={!summary.trim()} onClick={() => {
            update((current) => ({ ...current, profile: { ...current.profile, bio: summary.trim() } }));
            setMessage("Bio substituída no rascunho do portfólio. Confira a seção Sobre antes de publicar.");
          }}>Usar na bio do portfólio</Button>
        </div>
      </fieldset>
      {message && <p role="status" className="mt-3 text-sm text-plum-900">{message}</p>}
    </details>
  );
}

