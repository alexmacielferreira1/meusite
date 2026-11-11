import { Camera, Plus, Trash2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import { PageHeader } from "../../components/layout/AppShell";
import { PhotoFocus } from "../../components/PhotoFocus";
import { TimelineDates } from "../../components/TimelineDates";
import { ResumeImport } from "../../components/ResumeImport";
import { photoPosition } from "../../site/models/shared";
import { Field, Input, TagInput, Textarea, Toggle } from "../../components/ui";
import { ROLES } from "../../data/roles";
import { applyImport } from "../../lib/resumeParse";
import { useStore } from "../../lib/store";
import { imageToDataURL, initials, uid } from "../../lib/utils";
import type { Portfolio, Profile as ProfileT, RoleId } from "../../types/portfolio";

/** Âncoras usadas pelo "Adicionar conteúdo" da tela Seções do site. */
const ANCHORS: Record<string, string> = {
  "Números em destaque": "numeros", "Pilares e etapas": "pilares", "Clientes e marcas": "clientes", Experiência: "experiencia", Formação: "formacao",
  "Serviços e preços": "servicos", Equipe: "equipe", "Perguntas frequentes": "perguntas", Depoimentos: "depoimentos",
};

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section id={ANCHORS[title]} className="scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="font-display text-xl font-bold text-plum-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

type ListKey = "experience" | "education" | "services" | "testimonials" | "team" | "faq";

export default function Profile() {
  const { portfolio: p, update } = useStore();
  const { hash } = useLocation();
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }); }, [hash]);
  const pr = p.profile;
  const set = (patch: Partial<ProfileT>) => update((x) => { x.profile = { ...x.profile, ...patch }; return x; });
  const setItem = (key: ListKey, i: number, patch: Record<string, string>) =>
    update((x) => { (x[key] as unknown as Record<string, string>[])[i] = { ...(x[key] as unknown as Record<string, string>[])[i], ...patch }; return x; });
  const remove = (key: ListKey, i: number) => update((x) => { (x[key] as unknown[]).splice(i, 1); return x; });
  const add = (key: ListKey, item: NonNullable<Portfolio[ListKey]>[number]) => update((x) => { ((x[key] ??= []) as unknown[]).push(item); return x; });
  const del = <button className="self-end rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remover"><Trash2 size={16} /></button>;
  const addBtn = (label: string, onClick: () => void) => <button onClick={onClick} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"><Plus size={16} /> {label}</button>;

  return (
    <div className="mx-auto max-w-5xl p-5 sm:p-8">
      <PageHeader title="Meu perfil" subtitle="Preencha só o que quiser mostrar. Tudo aqui alimenta todos os modelos." />
      <div className="space-y-6">
        <details open={!pr.bio && !p.experience.length} className="group">
          <summary className="cursor-pointer text-sm font-semibold text-brand-700">Preencher automaticamente com currículo ou LinkedIn</summary>
          <div className="mt-3"><ResumeImport onApply={(data, picks) => update((x) => applyImport(x, data, picks))} /></div>
        </details>
        <Card title="Apresentação">
          <div className="flex flex-col gap-6 sm:flex-row">
            <label className="group relative h-28 w-28 shrink-0 cursor-pointer overflow-hidden rounded-full bg-brand-100">
              {pr.photo ? <span className="block h-full w-full bg-cover" style={{ backgroundImage: `url(${pr.photo})`, backgroundPosition: photoPosition(pr.photoFocus) }} /> : <span className="grid h-full w-full place-items-center text-3xl font-bold text-brand-700">{initials(pr.name)}</span>}
              <span className="absolute inset-0 grid place-items-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100"><Camera /></span>
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) set({ photo: await imageToDataURL(f, 1200, 0.85), photoFocus: undefined }); }} />
            </label>
            <Link to="/app/estudio?foto=1" className="self-center text-xs font-semibold text-brand-700 sm:self-end">Editar no Estúdio →</Link>
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <Field label="Nome"><Input value={pr.name} onChange={(e) => set({ name: e.target.value })} /></Field>
              <Field label="Função">
                <select value={pr.roleId} onChange={(e) => set({ roleId: e.target.value as RoleId })} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </Field>
              <div className="sm:col-span-2"><Field label="Outras profissões (perfil híbrido)" hint="Aparecem junto da principal e ajudam a sugerir modelos.">
                <div className="flex flex-wrap gap-2">{ROLES.filter((r) => r.id !== pr.roleId).map((r) => {
                  const on = (pr.roles ?? []).includes(r.id);
                  return <button key={r.id} type="button" aria-pressed={on} onClick={() => set({ roles: on ? (pr.roles ?? []).filter((x) => x !== r.id) : [...(pr.roles ?? []), r.id] })}
                    className={`rounded-full border px-3 py-1 text-xs ${on ? "border-brand-600 bg-brand-50 font-semibold text-brand-700" : "border-slate-200 hover:bg-slate-50"}`}>{r.emoji} {r.short}</button>;
                })}</div></Field></div>
              <div className="sm:col-span-2"><Field label="Título (aparece na capa)" hint="Curto funciona melhor (até 45 caracteres). Títulos longos ficam menores na capa."><Input value={pr.headline} onChange={(e) => set({ headline: e.target.value })} /></Field></div>
              <Field label="Cidade"><Input value={pr.city} onChange={(e) => set({ city: e.target.value })} /></Field>
              <Field label="UF"><Input value={pr.state} maxLength={2} onChange={(e) => set({ state: e.target.value.toUpperCase() })} /></Field>
            </div>
          </div>
          {pr.photo && <div className="mt-5"><PhotoFocus photo={pr.photo} focus={pr.photoFocus} onChange={(photoFocus) => set({ photoFocus })} /></div>}
          <div className="mt-5"><Field label="Bio" hint="Dica: use o Assistente IA para melhorar este texto."><Textarea rows={4} value={pr.bio} onChange={(e) => set({ bio: e.target.value })} /></Field></div>
          <label className="mt-4 flex items-center gap-3 text-sm"><Toggle label="Disponível" checked={pr.available} onChange={(v) => set({ available: v })} /> Disponível para novos projetos</label>
        </Card>

        <Card title="Direção criativa" subtitle="Conteúdos opcionais usados pelos novos modelos em movimento.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Chamada acima do título"><Input value={pr.heroKicker??""} maxLength={100} onChange={e=>set({heroKicker:e.target.value})} placeholder="Direção, edição e histórias" /></Field>
            <Field label="Título da abertura"><Input value={pr.heroTitle??""} maxLength={180} onChange={e=>set({heroTitle:e.target.value})} placeholder={pr.headline} /></Field>
            <Field label="Texto do botão de contato"><Input value={pr.ctaLabel??""} maxLength={60} onChange={e=>set({ctaLabel:e.target.value})} placeholder="Vamos criar juntos" /></Field>
            <Field label="Imagem de abertura (URL)"><Input type="url" value={pr.heroImage??""} onChange={e=>set({heroImage:e.target.value})} placeholder="https://…" /></Field>
            <div className="sm:col-span-2"><Field label="Manifesto ou abordagem criativa"><Textarea rows={3} value={pr.manifesto??""} maxLength={3000} onChange={e=>set({manifesto:e.target.value})} placeholder="Como você pensa e realiza os projetos?" /></Field></div>
            <div className="sm:col-span-2"><Field label="Especialidades e profissões" hint="Digite qualquer profissão e pressione Enter. Clique no × para remover; remova e adicione para corrigir."><TagInput value={pr.professions??[]} onChange={professions=>set({professions})} suggestions={[...ROLES.map(r=>r.label),"Colorista","Diretor de fotografia","Roteirista","Ilustrador","Diretor de arte","Operador de câmera","Sound designer","Podcaster","Animador 3D","Redator","Apresentador","Produtor executivo","Designer de marcas"]} placeholder="Busque ou escreva sua especialidade" /></Field></div>
          </div>
        </Card>

        <Card title="Números em destaque" subtitle="Aparecem na capa do site.">
          <div className="grid gap-3 sm:grid-cols-3">
            {pr.stats.map((s, i) => (
              <div key={i} className="rounded-2xl bg-slate-50 p-3">
                <Input value={s.value} className="font-semibold" onChange={(e) => update((x) => { x.profile.stats[i].value = e.target.value; return x; })} />
                <Input value={s.label} className="mt-2" onChange={(e) => update((x) => { x.profile.stats[i].label = e.target.value; return x; })} />
                <button className="mt-1 text-xs text-slate-400 hover:text-red-600" onClick={() => update((x) => { x.profile.stats.splice(i, 1); return x; })}>Remover</button>
              </div>
            ))}
          </div>
          {pr.stats.length < 6 && addBtn("Adicionar número", () => update((x) => { x.profile.stats.push({ value: "", label: "" }); return x; }))}
        </Card>

        <Card title="Pilares e etapas" subtitle="Habilidades, diferenciais ou etapas do seu processo. Adicione, edite ou remova conforme sua atuação.">
          <datalist id="pillar-suggestions">{Array.from(new Set([...p.works.flatMap(w=>[w.role,...w.software,...w.tags]),...(pr.professions??[]),...ROLES.map(r=>r.label),"Pesquisa e roteiro","Montagem e ritmo","Colorização","Finalização","Direção de arte","Captação de áudio","Estratégia de conteúdo"])).filter(Boolean).map(v=><option key={v} value={v}/>)}</datalist>
          <div className="grid gap-3 sm:grid-cols-3">
            {pr.pillars.map((pl, i) => (
              <div key={i} className="space-y-2 rounded-2xl bg-slate-50 p-3">
                <Input value={pl.title} list="pillar-suggestions" aria-label={`Título do pilar ${i+1}`} placeholder="Habilidade ou etapa" className="font-semibold" onChange={(e) => update((x) => { x.profile.pillars[i].title = e.target.value; return x; })} />
                <Textarea rows={1} className="min-h-[42px] resize-y" aria-label={`Descrição do pilar ${i+1}`} placeholder="Descrição opcional" value={pl.text} onChange={(e) => update((x) => { x.profile.pillars[i].text = e.target.value; return x; })} />
                <button className="text-xs text-slate-400 hover:text-red-600" onClick={() => update((x) => { x.profile.pillars.splice(i, 1); return x; })}>Remover</button>
              </div>
            ))}
          </div>
          {pr.pillars.length < 40 && addBtn("Adicionar item", () => update((x) => { x.profile.pillars.push({ title: "", text: "" }); return x; }))}
        </Card>

        <Card title="Contato">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Link do currículo" hint="Aparece no modelo Currículo com trabalhos."><Input type="url" value={pr.resumeUrl ?? ""} onChange={(e) => set({ resumeUrl: e.target.value })} placeholder="https://…" /></Field>
            <Field label="E-mail público"><Input type="email" value={pr.email} onChange={(e) => set({ email: e.target.value })} /></Field>
            <Field label="WhatsApp" hint="Com DDI e DDD, só números: 5551999990000"><Input value={pr.whatsapp} onChange={(e) => set({ whatsapp: e.target.value.replace(/\D/g, "") })} /></Field>
            <Field label="Instagram (sem @)"><Input value={pr.instagram} onChange={(e) => set({ instagram: e.target.value.replace("@", "") })} /></Field>
            <Field label="LinkedIn (usuário)"><Input value={pr.linkedin} onChange={(e) => set({ linkedin: e.target.value })} /></Field>
          </div>
        </Card>

        <Card title="Clientes e marcas"><TagInput value={p.clients} onChange={(v) => update((x) => { x.clients = v; return x; })} placeholder="Digite o nome e Enter" suggestions={Array.from(new Set(p.works.map((w) => w.client))).filter(Boolean)} /></Card>

        {(["experience", "education"] as const).map((key) => (
          <Card key={key} title={key === "experience" ? "Experiência" : "Formação"}>
            <div className="space-y-3">
              {p[key].map((it, i) => (
                <div key={it.id} className="grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <TimelineDates item={it} onChange={patch=>setItem(key,i,patch)} />
                  <Input value={it.title} placeholder={key === "experience" ? "Cargo" : "Curso"} onChange={(e) => setItem(key, i, { title: e.target.value })} />
                  <Input value={it.org} placeholder={key === "experience" ? "Empresa" : "Instituição"} onChange={(e) => setItem(key, i, { org: e.target.value })} />
                  {!!p.areas?.length && <select aria-label={`Área de ${it.title || "item"}`} value={it.area ?? ""} onChange={(e) => setItem(key, i, { area: e.target.value })} className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm sm:col-span-3">
                    <option value="">Trilha: todas</option>{p.areas.map((a) => <option key={a.id} value={a.id}>Trilha: {a.label}</option>)}</select>}
                  <span onClick={() => remove(key, i)}>{del}</span>
                </div>
              ))}
            </div>
            {addBtn("Adicionar", () => add(key, { id: uid(), period: "", title: "", org: "" }))}
          </Card>
        ))}

        <Card title="Serviços e preços">
          <div className="space-y-3">
            {p.services.map((s, i) => (
              <div key={s.id} className="grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[1fr_1.5fr_160px_auto]">
                <Input value={s.title} placeholder="Serviço" onChange={(e) => setItem("services", i, { title: e.target.value })} />
                <Input value={s.text} placeholder="Descrição curta" onChange={(e) => setItem("services", i, { text: e.target.value })} />
                <Input value={s.price ?? ""} placeholder="a partir de R$…" onChange={(e) => setItem("services", i, { price: e.target.value })} />
                <span onClick={() => remove("services", i)}>{del}</span>
              </div>
            ))}
          </div>
          {addBtn("Adicionar serviço", () => add("services", { id: uid(), title: "", text: "", price: "" }))}
        </Card>

        <Card title="Equipe" subtitle="Para estúdios e coletivos.">
          <div className="space-y-3">
            {(p.team ?? []).map((m, i) => (
              <div key={m.id} className="grid items-center gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[auto_1fr_1fr_auto]">
                <label className="relative h-12 w-12 cursor-pointer overflow-hidden rounded-full bg-brand-100" aria-label={`Foto de ${m.name || "integrante"}`}>
                  {m.photo ? <span className="block h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${m.photo})` }} /> : <span className="grid h-full w-full place-items-center text-sm font-bold text-brand-700">{initials(m.name || "?")}</span>}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setItem("team", i, { photo: await imageToDataURL(f, 300) }); }} />
                </label>
                <Input value={m.name} placeholder="Nome" onChange={(e) => setItem("team", i, { name: e.target.value })} />
                <Input value={m.role} placeholder="Função" onChange={(e) => setItem("team", i, { role: e.target.value })} />
                <span onClick={() => remove("team", i)}>{del}</span>
              </div>
            ))}
          </div>
          {addBtn("Adicionar integrante", () => add("team", { id: uid(), name: "", role: "" }))}
        </Card>

        <Card title="Perguntas frequentes" subtitle="Dúvidas comuns de quem contrata.">
          <div className="space-y-3">
            {(p.faq ?? []).map((q, i) => (
              <div key={q.id} className="grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[1fr_1.5fr_auto]">
                <Input value={q.question} placeholder="Pergunta" onChange={(e) => setItem("faq", i, { question: e.target.value })} />
                <Textarea rows={2} value={q.answer} placeholder="Resposta" onChange={(e) => setItem("faq", i, { answer: e.target.value })} />
                <span onClick={() => remove("faq", i)}>{del}</span>
              </div>
            ))}
          </div>
          {addBtn("Adicionar pergunta", () => add("faq", { id: uid(), question: "", answer: "" }))}
        </Card>

        <Card title="Depoimentos">
          <div className="space-y-3">
            {p.testimonials.map((d, i) => (
              <div key={d.id} className="grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
                <Input value={d.quote} placeholder="O que disseram" onChange={(e) => setItem("testimonials", i, { quote: e.target.value })} />
                <Input value={d.author} placeholder="Quem" onChange={(e) => setItem("testimonials", i, { author: e.target.value })} />
                <Input value={d.role} placeholder="Cargo / empresa" onChange={(e) => setItem("testimonials", i, { role: e.target.value })} />
                <span onClick={() => remove("testimonials", i)}>{del}</span>
              </div>
            ))}
          </div>
          {addBtn("Adicionar depoimento", () => add("testimonials", { id: uid(), quote: "", author: "", role: "" }))}
        </Card>
      </div>
    </div>
  );
}

