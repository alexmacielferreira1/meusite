import { DEMO_MODE } from "../../config/app";
import { Instagram, Linkedin, Mail, MessageCircle, Pause, Play, Quote } from "lucide-react";
import { useState } from "react";
import type { TimelineItem } from "../../types/portfolio";
import { Photo } from "../models/PhotoLayer";
import { SectionTitle, useCatalogDesign, useSite, useTokens, Wrap } from "../kit";

export function About() {
  const { p, style } = useSite();
  const t = useTokens();
  const pr = p.profile;
  return (
    <section id="sobre" className="py-20">
      <Wrap>
        <SectionTitle eyebrow="Sobre" title={style === "editorial" ? "Sobre mim" : "Quem está por trás do trabalho"} />
        <div className="grid gap-10 lg:grid-cols-5">
          <p className={`lg:col-span-2 text-lg leading-relaxed ${t.soft} ${style === "editorial" ? "first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-6xl first-letter:leading-none" : ""}`}>{pr.bio}</p>
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-3">
            {pr.pillars.map((pl, i) => (
              <div key={pl.title} className={`${t.card} ${t.radius} p-5`}>
                <span className={`${t.heading} text-sm font-bold ${t.accentText}`}>0{i + 1}</span>
                <h3 className={`${t.heading} mt-3 text-lg font-semibold`}>{pl.title}</h3>
                <p className={`mt-2 text-sm ${t.muted}`}>{pl.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Wrap>
    </section>
  );
}

export function Clients() {
  const { p } = useSite();
  const t = useTokens();
  if (!p.clients.length) return null;
  return (
    <section id="clientes" className="py-16">
      <Wrap>
        <p className={`mb-6 text-center text-xs uppercase tracking-[0.25em] ${t.muted}`}>Marcas e clientes atendidos</p>
        <div className="flex flex-wrap justify-center gap-3">
          {p.clients.map((c) => <span key={c} className={`${t.radius} ${t.chip} px-5 py-3 text-sm font-semibold tracking-wide`}>{c}</span>)}
        </div>
      </Wrap>
    </section>
  );
}

function Timeline({ items }: { items: TimelineItem[] }) {
  const t = useTokens();
  return (
    <ol className={`relative space-y-8 border-l ${t.line} pl-8`}>
      {items.map((it) => (
        <li key={it.id} className="relative">
          <span className={`absolute -left-[37px] top-1.5 h-3 w-3 rounded-full ${t.accentBg}`} />
          <p className={`text-xs font-semibold uppercase tracking-wider ${t.accentText}`}>{it.period}</p>
          <h3 className={`${t.heading} mt-1 text-lg font-semibold`}>{it.title}</h3>
          <p className={`text-sm ${t.muted}`}>{it.org}</p>
          {it.text && <p className={`mt-2 text-sm ${t.soft}`}>{it.text}</p>}
        </li>
      ))}
    </ol>
  );
}

export function Experience() {
  const { p } = useSite();
  if (!p.experience.length) return null;
  return <section id="experiencia" className="py-20"><Wrap><SectionTitle eyebrow="Trajetória" title="Experiência" /><Timeline items={p.experience} /></Wrap></section>;
}

export function Education() {
  const { p } = useSite();
  if (!p.education.length) return null;
  return <section id="formacao" className="py-20"><Wrap><SectionTitle eyebrow="Estudos" title="Formação" /><Timeline items={p.education} /></Wrap></section>;
}

export function Clipping() {
  const { p, openWork } = useSite();
  const design = useCatalogDesign();
  const t = useTokens();
  const items = p.works.filter((w) => w.kind === "article");
  const archive = p.site.templateId === "arquivo-editorial";
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ category: "", outlet: "", year: "" });
  const outlet = (w: (typeof items)[number]) => w.outlet || w.client;
  const fields = { category: { label: "Tema", values: items.map((w) => w.category) },
    outlet: { label: "Veículo", values: items.map(outlet) }, year: { label: "Ano", values: items.map((w) => w.year) } };
  const list = items.filter((w) => (!filters.category || filters.category === w.category)
    && (!filters.outlet || filters.outlet === outlet(w)) && (!filters.year || filters.year === w.year)
    && `${w.title} ${w.description}`.toLowerCase().includes(query.toLowerCase()));
  const lead = design?.works === "feature" ? list.find((work) => work.featured) ?? list[0] : undefined;
  return (
    <section id="clipping" className="py-20">
      <Wrap>
        <SectionTitle eyebrow="Publicações" title={design?.workTitle ?? "Matérias e publicações"} />
        {archive && <div className="mb-6 flex flex-wrap gap-2">
          <input aria-label="Buscar publicações" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar publicações" className={`border px-3 py-2 ${t.card}`} />
          {(Object.keys(fields) as (keyof typeof fields)[]).map((key) => <select key={key} aria-label={fields[key].label} className={`border px-3 py-2 ${t.card}`}
            value={filters[key]} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}>
            <option value="">{fields[key].label}</option>
            {[...new Set(fields[key].values.filter(Boolean))].sort().map((v) => <option key={v}>{v}</option>)}
          </select>)}
          <button className="px-2 underline" onClick={() => { setQuery(""); setFilters({ category: "", outlet: "", year: "" }); }}>Limpar</button>
        </div>}
        {!list.length && <p className={t.muted}>Nenhuma publicação encontrada.</p>}
        {lead && <button onClick={() => openWork(lead.id)} className={`group mb-8 grid w-full overflow-hidden text-left sm:grid-cols-2 ${t.card} ${t.radius}`}>
          <Photo as="span" src={lead.cover} className="aspect-video" />
          <span className="self-center p-6">
            <span className={`text-xs font-semibold uppercase tracking-wide ${t.muted}`}>{[outlet(lead), lead.year].filter(Boolean).join(" · ")}</span>
            <span className={`mt-2 block text-3xl font-bold group-hover:underline ${t.heading}`}>{lead.title}</span>
            <span className="mt-3 line-clamp-3 block text-sm">{lead.description}</span>
          </span>
        </button>}
        <div className={`divide-y ${t.line} border-y ${t.line}`}>
          {list.filter((work) => work.id !== lead?.id).map((w) => (
            <button key={w.id} onClick={() => openWork(w.id)} className="group grid w-full gap-4 py-6 text-left sm:grid-cols-[140px_1fr_120px] sm:items-center">
              <Photo src={w.cover} className={`aspect-[4/3] ${t.radius}`} />
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${t.accentText}`}>{w.outlet || w.client}</p>
                <h3 className={`${t.heading} mt-1 text-xl group-hover:underline`}>{w.title}</h3>
                <p className={`mt-1 line-clamp-2 text-sm ${t.muted}`}>{w.description}</p>
              </div>
              <p className={`text-sm ${t.muted} sm:text-right`}>{w.category} · {w.year}</p>
            </button>
          ))}
        </div>
      </Wrap>
    </section>
  );
}

export function Services() {
  const { p } = useSite();
  const t = useTokens();
  if (!p.services.length) return null;
  return (
    <section id="servicos" className="py-20">
      <Wrap>
        <SectionTitle eyebrow="Serviços" title="Como posso ajudar" />
        <div className="grid gap-4 md:grid-cols-3">
          {p.services.map((s) => (
            <div key={s.id} className={`${t.card} ${t.radius} flex flex-col p-6`}>
              <h3 className={`${t.heading} text-lg font-semibold`}>{s.title}</h3>
              <p className={`mt-2 flex-1 text-sm ${t.muted}`}>{s.text}</p>
              {s.price && <p className={`mt-5 font-semibold ${t.accentText}`}>{s.price}</p>}
            </div>
          ))}
        </div>
      </Wrap>
    </section>
  );
}

export function Testimonials() {
  const { p } = useSite();
  const t = useTokens();
  if (!p.testimonials.length) return null;
  return (
    <section id="depoimentos" className="py-20">
      <Wrap>
        <SectionTitle eyebrow="Depoimentos" title="Quem já trabalhou comigo" />
        <div className="grid gap-4 md:grid-cols-2">
          {p.testimonials.map((d) => (
            <figure key={d.id} className={`${t.card} ${t.radius} p-6`}>
              <Quote className={t.accentText} size={22} />
              <blockquote className={`mt-3 text-lg ${t.soft}`}>{d.quote}</blockquote>
              <figcaption className={`mt-4 text-sm ${t.muted}`}><b className={t.text}>{d.author}</b> · {d.role}</figcaption>
            </figure>
          ))}
        </div>
      </Wrap>
    </section>
  );
}

export function Audio() {
  const { p, openWork } = useSite();
  const t = useTokens();
  const [playing, setPlaying] = useState<string | null>(null);
  const items = p.works.filter((w) => w.kind === "audio");
  const list = items.length ? items : p.works.slice(0, 4);
  return (
    <section id="demos" className="py-20">
      <Wrap>
        <SectionTitle eyebrow="Ouça" title="Demos" />
        <div className="space-y-3">
          {list.map((w, i) => (
            <div key={w.id} className={`${t.card} ${t.radius} flex items-center gap-4 p-4`}>
              <button onClick={() => DEMO_MODE ? setPlaying(playing === w.id ? null : w.id) : openWork(w.id)} className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${t.accentBg} text-[var(--on-accent)]`} aria-label="Tocar demo">
                {playing === w.id ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{w.title}</p>
                <div className="mt-2 flex h-6 items-end gap-[3px]" aria-hidden>
                  {Array.from({ length: 48 }).map((_, j) => (
                    <span key={j} className={`w-1 rounded-sm ${playing === w.id && j < 18 ? t.accentBg : "bg-current opacity-25"}`} style={{ height: `${25 + ((j * 37 + i * 13) % 75)}%` }} />
                  ))}
                </div>
              </div>
              <span className={`text-sm ${t.muted}`}>{w.category}</span>
            </div>
          ))}
        </div>
      </Wrap>
    </section>
  );
}

export function Contact() {
  const { p, style, contact } = useSite();
  const t = useTokens();
  const pr = p.profile;
  const [sent, setSent] = useState(false);
  const inp = `w-full ${t.radius} ${style === "cinema" || style === "bold" ? "bg-white/5 border border-white/15 text-white placeholder:text-white/40" : "bg-white border border-slate-300"} px-4 py-3 text-sm outline-none focus:border-[var(--accent)]`;
  return (
    <section id="contato" className="py-24">
      <Wrap>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionTitle eyebrow="Contato" title="Vamos trabalhar juntos?" />
            <p className={`text-lg ${t.soft}`}>Conte sobre o projeto, o prazo e o formato de que você precisa.</p>
            <div className="mt-8 space-y-3 text-sm">
              {pr.email && <a onClick={contact} href={`mailto:${pr.email}`} className="flex items-center gap-3 hover:underline"><Mail size={18} className={t.accentText} />{pr.email}</a>}
              {pr.whatsapp && <a onClick={contact} href={`https://wa.me/${pr.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:underline"><MessageCircle size={18} className={t.accentText} />WhatsApp</a>}
              {pr.instagram && <a href={`https://instagram.com/${pr.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:underline"><Instagram size={18} className={t.accentText} />@{pr.instagram}</a>}
              {pr.linkedin && <a href={`https://linkedin.com/in/${pr.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:underline"><Linkedin size={18} className={t.accentText} />LinkedIn</a>}
            </div>
          </div>
          {(DEMO_MODE || pr.email) && <form className="space-y-3" onSubmit={(e) => {
            e.preventDefault();
            if (DEMO_MODE) { setSent(true); return; }
            contact?.();
            const form = new FormData(e.currentTarget);
            const body = `${form.get("nome")} · ${form.get("email")}

${form.get("mensagem")}`;
            window.location.href = `mailto:${pr.email}?subject=${encodeURIComponent(String(form.get("assunto") || "Contato pelo site"))}&body=${encodeURIComponent(body)}`;
          }}>
            <div className="grid gap-3 sm:grid-cols-2"><input name="nome" aria-label="Seu nome" required className={inp} placeholder="Seu nome" /><input name="email" aria-label="Seu e-mail" required type="email" className={inp} placeholder="Seu e-mail" /></div>
            <input name="assunto" aria-label="Assunto" className={inp} placeholder="Assunto" />
            <textarea name="mensagem" aria-label="Mensagem" required rows={5} className={inp} placeholder="Mensagem" />
            <button className={`${t.radius} ${t.accentBg} px-6 py-3 text-sm font-semibold text-[var(--on-accent)]`}>{DEMO_MODE ? (sent ? "Envio simulado ✓" : "Simular mensagem") : "Abrir no aplicativo de e-mail"}</button>
          </form>}
        </div>
      </Wrap>
    </section>
  );
}
