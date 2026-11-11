import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Logo } from "../../components/layout/Logo";
import { ResumeImport } from "../../components/ResumeImport";
import { TemplatePreview } from "../../components/TemplatePreview";
import { Button, Field, Input } from "../../components/ui";
import { DEMO_MODE } from "../../config/app";
import { ROLES, roleById } from "../../data/roles";
import { demoPortfolio, sectionsFrom } from "../../data/seed";
import { TEMPLATES, templateById } from "../../data/templates";
import { generateBio, generateHeadline, type Tone } from "../../lib/ai";
import { applyImport, yearsOfExperience, type ImportedProfile, type ImportPicks } from "../../lib/resumeParse";
import { useStore } from "../../lib/store";
import { cn, slugify } from "../../lib/utils";
import type { Goal, Portfolio, RoleId, SectionType } from "../../types/portfolio";

const STEPS = ["Seu currículo", "Sua função", "O básico", "Seu estilo", "Pronto"];

const GOALS: [Goal, string, string][] = [
  ["clientes", "Conseguir clientes", "Serviços, depoimentos e orçamento em destaque"],
  ["vaga", "Buscar uma vaga", "Experiência, formação e trabalhos que comprovam"],
  ["mostrar", "Mostrar meu trabalho", "Trabalhos e reel em primeiro lugar"],
];

/** Ajusta as seções sugeridas pela função conforme o objetivo (antes do Contato). */
/** "A", "A e B", "A, B e C" (antes saía "A e B e C e D…"). */
function listNames(names: string[]) {
  return [names.slice(0, -1).join(", "), names[names.length - 1]].filter(Boolean).join(" e ");
}

function withGoal(base: SectionType[], goal: Goal): SectionType[] {
  const extra: Record<Goal, SectionType[]> = { clientes: ["services", "testimonials"], vaga: ["experience", "education"], mostrar: [] };
  const list: SectionType[] = base.filter((s) => s !== "contact");
  extra[goal].forEach((s) => { if (!list.includes(s)) list.push(s); });
  return [...list, "contact"];
}

export default function Onboarding() {
  const { user, replace, ready, portfolio } = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [roleId, setRoleId] = useState<RoleId>("editor");
  const [name, setName] = useState(user?.name ?? "");
  const [city, setCity] = useState("");
  const [state, setState] = useState("RS");
  const [years, setYears] = useState("");
  const [focus, setFocus] = useState("");
  // Sem contato, o site e as vitrines publicados não têm como receber resposta (QA de 09/11).
  // Na demonstração o rascunho é o exemplo (Marina): não herdar o contato dele.
  const [email, setEmail] = useState(DEMO_MODE ? user?.email ?? "" : portfolio.profile.email || user?.email || "");
  const [whatsapp, setWhatsapp] = useState(DEMO_MODE ? "" : portfolio.profile.whatsapp || "");
  const [tone, setTone] = useState<Tone>("profissional");
  const [templateId, setTemplateId] = useState("editor-pro");
  const [goal, setGoal] = useState<Goal>("mostrar");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [imported, setImported] = useState<{ data: ImportedProfile; picks: ImportPicks } | null>(null);
  const preview = useMemo(() => demoPortfolio(), []);
  // recomendação local: função + objetivo
  const GOAL_TPL: Record<Goal, string[]> = { clientes: ["impacto", "mosaico"], vaga: ["curriculo-com-trabalhos", "editorial", "documental"], mostrar: ["portfolio-compacto"] };
  const suggested = TEMPLATES.filter((t) => t.roles.includes(roleId) || GOAL_TPL[goal].includes(t.id));

  async function build() {
    setStep(4); setBusy(true); setLog([]);
    const say = (m: string) => setLog((l) => [...l, m]);
    say("Escolhendo as seções certas para " + roleById(roleId).short.toLowerCase() + "…");
    const headline = await generateHeadline(roleId, focus);
    say("Escrevendo seu título…");
    const bio = DEMO_MODE ? await generateBio({ name, roleId, city }, years, focus, tone) : [name, headline, city].filter(Boolean).join(" · ");
    say(DEMO_MODE ? "Escrevendo sua bio no tom " + tone + "…" : "Montando um resumo com seus dados…");
    const tpl = templateById(templateId);
    const role = roleById(roleId);
    const base = DEMO_MODE ? demoPortfolio() : portfolio;
    const p: Portfolio = {
      ...base,
      profile: {
        ...base.profile, name, roleId, city, state, headline, bio: DEMO_MODE ? bio : base.profile.bio || bio,
        ...(DEMO_MODE && { photo: undefined, instagram: "", linkedin: "", website: "" }),
        email: email.trim(), whatsapp,
        stats: !DEMO_MODE ? (years ? [{ label: "anos de experiência", value: years }, ...base.profile.stats.filter((stat) => stat.label !== "anos de experiência")] : base.profile.stats) : [{ label: "anos de experiência", value: years ? years + "+" : "—" }, { label: "projetos", value: "—" }, { label: role.short, value: city || "Brasil" }],
        pillars: DEMO_MODE ? role.software.slice(0, 3).map((s) => ({ title: s, text: `Trabalho diário com ${s}.` })) : base.profile.pillars,
      },
      works: !DEMO_MODE ? base.works : base.works.map((w) => ({ ...w, client: "Cliente exemplo", description: "Trabalho de exemplo — substitua pelo seu em Trabalhos." })).slice(0, 3),
      ...(DEMO_MODE && { experience: [], education: [], testimonials: [], services: [], clients: [] }),
      site: { ...base.site, slug: !DEMO_MODE && base.site.published ? base.site.slug : slugify(name).slice(0, 50).replace(/-$/, "") || "meu-portfolio", templateId, theme: { ...tpl.theme }, sections: sectionsFrom(withGoal(DEMO_MODE ? role.sections : tpl.sections, goal)), published: base.site.published && !DEMO_MODE, bilingual: false, passwordProtected: false, goal },
      analytics: { visits: Array(14).fill(0), contactClicks: 0, topWork: "" },
    };
    say("Montando o modelo " + tpl.name + "…");
    if (imported) say("Aplicando os dados do seu currículo…");
    replace(imported ? applyImport(p, imported.data, imported.picks) : p);
    setBusy(false);
  }

  if (!ready) return <p className="p-8">Carregando conta…</p>;
  if (!DEMO_MODE && !user) return <Navigate to="/entrar" replace />;
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6"><Logo to="/app" />
        <ol className="hidden items-center gap-2 text-sm sm:flex">
          {STEPS.map((s, i) => (
            <li key={s} className={cn("flex items-center gap-2", i <= step ? "text-slate-900" : "text-slate-400")}>
              <span className={cn("grid h-6 w-6 place-items-center rounded-full text-xs", i < step ? "bg-brand-600 text-white" : i === step ? "border-2 border-brand-600 text-brand-700" : "border border-slate-300")}>{i < step ? <Check size={12} /> : i + 1}</span>{s}
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-slate-300" />}
            </li>
          ))}
        </ol>
        <button onClick={() => nav("/app")} className="text-sm text-slate-500 hover:text-slate-800">Pular</button>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12">
        {step === 0 && (
          <div className="mx-auto max-w-3xl">
            <h1 className="font-display text-3xl font-bold">Comece pelo seu currículo</h1>
            <p className="mt-2 text-slate-600">Envie o PDF do LinkedIn (recomendado: mais completo e com menos erros) ou outro currículo e preenchemos o perfil para você. Se preferir, continue e preencha à mão.</p>
            <div className="mt-6">
              <ResumeImport title="Importar currículo ou LinkedIn" onApply={(data, picks) => {
                setImported({ data, picks });
                if (picks.basics) {
                  if (data.name) setName(data.name);
                  if (data.city) setCity(data.city);
                  if (data.state) setState(data.state);
                  if (data.headline) setFocus(data.headline.slice(0, 120));
                }
                const total = yearsOfExperience(data);
                if (picks.years && total) setYears(String(total));
                setStep(1);
              }} />
            </div>
            {imported && <p className="mt-4 text-sm font-semibold text-emerald-700">Currículo lido. Os dados entram no portfólio ao gerar.</p>}
          </div>
        )}

        {step === 1 && (
          <>
            <h1 className="font-display text-3xl font-bold">O que você faz?</h1>
            <p className="mt-2 text-slate-600">Isso define as seções e os campos do seu portfólio. Dá para mudar depois.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ROLES.map((r) => (
                <button key={r.id} onClick={() => setRoleId(r.id)} className={cn("rounded-xl border bg-white p-5 text-left transition", roleId === r.id ? "border-brand-600 ring-2 ring-brand-100" : "border-slate-200 hover:border-slate-300")}>
                  <span className="text-2xl">{r.emoji}</span><p className="mt-2 font-semibold">{r.label}</p><p className="mt-1 text-sm text-slate-500">{r.needs}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <div className="mx-auto max-w-xl">
            <h1 className="font-display text-3xl font-bold">O básico sobre você</h1>
            <p className="mt-2 text-slate-600">Preencha o básico. Você pode revisar os textos antes de publicar.</p>
            <div className="mt-8 space-y-4 rounded-2xl bg-white p-6 shadow-sm">
              <Field label="Nome que aparece no site"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Marina Duarte" /></Field>
              <div className="grid grid-cols-[1fr_90px] gap-3">
                <Field label="Cidade"><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Porto Alegre" /></Field>
                <Field label="UF"><Input value={state} maxLength={2} onChange={(e) => setState(e.target.value.toUpperCase())} /></Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="E-mail para contato" hint="Aparece no site e nas vitrines."><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" /></Field>
                <Field label="WhatsApp" hint="Com DDI e DDD, só números: 5551999990000"><Input inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))} placeholder="5551999990000" /></Field>
              </div>
              <Field label="Anos de experiência"><Input value={years} onChange={(e) => setYears(e.target.value.replace(/\D/g, ""))} placeholder="12" /></Field>
              <Field label="Seu foco" hint="Ex.: documentário e publicidade · identidade visual · economia e dados"><Input value={focus} onChange={(e) => setFocus(e.target.value)} /></Field>
              <Field label="Seu objetivo agora">
                <div className="grid gap-2">
                  {GOALS.map(([g, t, d]) => (
                    <button key={g} type="button" onClick={() => setGoal(g)} className={cn("rounded-lg border px-3 py-2 text-left", goal === g ? "border-brand-600 bg-brand-50" : "border-slate-200 hover:bg-slate-50")}>
                      <span className={cn("block text-sm font-semibold", goal === g ? "text-brand-700" : "text-slate-800")}>{t}</span><span className="block text-xs text-slate-500">{d}</span>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Tom dos textos">
                <div className="grid grid-cols-3 gap-2">
                  {(["profissional", "proximo", "criativo"] as Tone[]).map((t) => (
                    <button key={t} type="button" onClick={() => setTone(t)} className={cn("rounded-lg border py-2 text-sm capitalize", tone === t ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200")}>{t === "proximo" ? "Próximo" : t}</button>
                  ))}
                </div>
              </Field>
            </div>
          </div>
        )}

        {step === 3 && (
          <>
            <h1 className="font-display text-3xl font-bold">Escolha um estilo</h1>
            <p className="mt-2 text-slate-600">Sugerimos {listNames(suggested.map((t) => t.name))} para {roleById(roleId).short.toLowerCase()}, mas todos servem.</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setTemplateId(t.id)} className={cn("overflow-hidden rounded-2xl border bg-white text-left transition", templateId === t.id ? "border-brand-600 ring-4 ring-brand-100" : "border-slate-200 hover:border-slate-300")}>
                  <TemplatePreview portfolio={preview} templateId={t.id} width={480} height={240} />
                  <div className="flex items-center justify-between p-4">
                    <div><p className="font-semibold">{t.name}</p><p className="text-sm text-slate-500">{t.description}</p></div>
                    {suggested.includes(t) && <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Sugerido</span>}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">{busy ? <Loader2 className="animate-spin" /> : <Sparkles />}</span>
            <h1 className="mt-5 font-display text-2xl font-bold">{busy ? "Montando seu portfólio…" : "Seu rascunho está pronto!"}</h1>
            <ul className="mt-6 space-y-2 text-left text-sm text-slate-600">
              {log.map((l) => <li key={l} className="flex items-center gap-2"><Check size={16} className="text-emerald-600" />{l}</li>)}
            </ul>
            {!busy && (
              <div className="mt-8 flex flex-col gap-2">
                <Button size="lg" onClick={() => nav("/app/secoes")}>Ver meu site montado</Button>
                <Button variant="secondary" onClick={() => nav("/app/trabalhos")}>Adicionar meus trabalhos (links, tabela ou um por um)</Button>
              </div>
            )}
          </div>
        )}

        {step < 4 && (
          <div className="mt-10 flex justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Voltar</Button>
            {step < 3 ? <Button onClick={() => setStep(step + 1)} disabled={step === 2 && !name.trim()}>{step === 0 && !imported ? "Preencher à mão" : "Continuar"} <ArrowRight size={16} /></Button>
              : <Button onClick={build}><Sparkles size={16} /> Gerar meu portfólio</Button>}
          </div>
        )}
      </main>
    </div>
  );
}
