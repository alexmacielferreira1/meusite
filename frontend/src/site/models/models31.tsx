import { ArrowRight, Code2, Download, ExternalLink, Film, Megaphone, Newspaper, PenTool, Search } from "lucide-react";
import { useState } from "react";
import { workLink } from "../../lib/workSpreadsheet";
import { Extras } from "./Extras";
import { Box, ContactButton, ContactLine, Cover, firstSentence, fit, Nav, Page, photoPosition, Portrait, Socials, summary, TeamStrip, usePage, WorkTile , roleText } from "./shared";

const AREA_ICONS = [Film, Newspaper, Code2, PenTool, Megaphone];
const strip = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

function Footer({ className }: { className: string }) {
  return (
    <><Extras /><footer id="contato" className={`py-6 ${className}`}><Box className="flex flex-wrap items-center justify-between gap-4 text-sm">
      <b>Contato</b><ContactLine /><Socials />
    </Box></footer></>
  );
}

/* 31 · Vitrine multidisciplinar — áreas de atuação em cards e galeria com filtros. */
export function VitrineMultidisciplinar() {
  const { pr, round, visual, articles } = usePage();
  const all = [...visual, ...articles];
  const areas = [...new Set(all.map((w) => w.category).filter(Boolean))];
  const [area, setArea] = useState("");
  const shown = all.filter((w) => !area || w.category === area);
  return (
    <Page bg="#20102c" ink="#ffffff">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="font-serif text-lg font-bold">{pr.name}</span>
        <Nav items={[["Áreas", "#areas", areas.length > 1], ["Projetos", "#projetos", all.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-8 py-8 @3xl:grid-cols-2">
        <div><h1 style={fit(pr.headline)} className="font-serif text-5xl leading-[1.05]">{pr.headline}</h1><p className="mt-4 max-w-sm text-sm text-white/70">{firstSentence(pr.bio)}</p>
          {all.length > 0 && <a href="#projetos" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--on-accent)]">Ver site <ArrowRight size={14} /></a>}</div>
        <Portrait className={`aspect-[4/3] ${round}`} />
      </Box></section>
      {areas.length > 1 && <section id="areas"><Box className="grid gap-4 @3xl:grid-cols-3">{areas.slice(0, 3).map((a, i) => { const Icon = AREA_ICONS[i % AREA_ICONS.length]; return (
        <button key={a} onClick={() => setArea(a)} className={`bg-white/10 p-5 text-left hover:bg-white/15 ${round}`}><Icon className="text-[var(--accent)]" /><b className="mt-2 block">{a}</b>
          <span className="text-xs text-white/60">{all.filter((w) => w.category === a).length} projeto(s)</span></button>); })}</Box></section>}
      {all.length > 0 && <section id="projetos" className="py-10"><Box>
        <div className="mb-5 flex flex-wrap items-center gap-2"><h2 className="mr-3 text-lg font-bold">Projetos</h2>
          {["", ...areas].map((a) => <button key={a || "todos"} aria-pressed={area === a} onClick={() => setArea(a)}
            className={`rounded-full px-3 py-1 text-xs ${area === a ? "bg-[var(--accent)] text-[var(--on-accent)]" : "bg-white/10"}`}>{a || "Todos"}</button>)}</div>
        <div className="grid gap-4 @3xl:grid-cols-4">{shown.map((w, i) => (
          <WorkTile key={w.id} w={w} round={round} className={i === 0 && !area ? "@3xl:col-span-2 @3xl:row-span-2" : ""} ratio={i === 0 && !area ? "aspect-square" : "aspect-video"} meta={w.category} />))}</div>
      </Box></section>}
      <Footer className="bg-[var(--accent)] text-[var(--on-accent)]" />
    </Page>
  );
}

/* 32 · Case em profundidade — sumário e ficha laterais, narrativa numerada com processo. */
export function CaseEmProfundidade() {
  const { pr, round, visual, lead, openWork } = usePage();
  const main = lead(visual);
  const steps = pr.pillars.map((x) => ({ title: x.title, text: x.text }));
  const process = visual.filter((w) => w.id !== main?.id)[0];
  if (main && process) steps.splice(Math.max(steps.length - 1, 0), 0, { title: "Processo", text: process.description });
  return (
    <Page bg="#f7f3eb" ink="#1f2a44">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="font-serif text-lg font-bold">{pr.name}</span>
        <Nav items={[["Case", "#case", steps.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-8 py-8 @3xl:grid-cols-2">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">{pr.headline}</p>
          <h1 style={fit(main?.title ?? pr.headline)} className="mt-2 font-serif text-5xl leading-[1.05] text-[var(--accent)]">{main?.title ?? pr.headline}</h1><p className="mt-4 max-w-sm opacity-75">{summary(pr.bio)}</p></div>
        <Cover src={main?.cover ?? pr.photo} className={`aspect-[4/3] ${round}`} label={main?.title} />
      </Box></section>
      {steps.length > 0 && <section id="case" className="py-8"><Box className="grid gap-10 @3xl:grid-cols-[14rem_1fr]">
        <aside className="space-y-6 text-sm">
          <div><b>Conteúdo</b><ol className="mt-2 space-y-1 opacity-75">{steps.map((s, i) => <li key={s.title}><a href={`#passo-${i + 1}`}>{i + 1}. {s.title}</a></li>)}</ol></div>
          {main && <dl className="space-y-2 border-t border-black/10 pt-4"><dt className="text-xs opacity-60">Projeto</dt><dd>{main.category}</dd><dt className="text-xs opacity-60">Período</dt><dd>{main.year}</dd>
            {!!main.deliverables?.length && <><dt className="text-xs opacity-60">Formatos</dt><dd>{main.deliverables.join(", ")}</dd></>}</dl>}
        </aside>
        <ol className="space-y-8">{steps.map((s, i) => (
          <li key={s.title} id={`passo-${i + 1}`}><h2 className="font-serif text-2xl text-[var(--accent)]">{i + 1}. {s.title}</h2><p className="mt-2 opacity-80">{s.text}</p>
            {s.title === "Processo" && main && process && <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <button onClick={() => openWork(process.id)}><Cover src={process.cover} className={`aspect-video ${round}`} /><span className="text-xs opacity-60">{process.title}</span></button>
              <ArrowRight aria-hidden />
              <button onClick={() => openWork(main.id)}><Cover src={main.cover} className={`aspect-video ${round}`} /><span className="text-xs opacity-60">Versão final</span></button>
            </div>}</li>))}</ol>
      </Box></section>}
      <Footer className="border-t border-black/10" />
    </Page>
  );
}

/* 33 · Vitrine compacto — apresentação enxuta, até três itens e trajetória breve. */
export function PortfolioCompacto() {
  const { p, pr, round, visual } = usePage();
  const works = [...visual.filter((w) => w.featured), ...visual.filter((w) => !w.featured)].slice(0, 3);
  return (
    <Page bg="#fbf8f3" ink="#2b241e">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="font-serif text-lg">{pr.name}</span>
        <Nav items={[["Projetos", "#projetos", works.length > 0], ["Trajetória", "#trajetoria", p.experience.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-10 py-12 @3xl:grid-cols-[1.5fr_1fr]">
        <div><h1 style={fit(pr.headline)} className="font-serif text-5xl leading-[1.1]">{pr.headline}</h1><p className="mt-4 max-w-md opacity-70">{summary(pr.bio)}</p></div>
        <Portrait className="aspect-square rounded-full" />
      </Box></section>
      {works.length > 0 && <section id="projetos" className="py-8"><Box>
        <h2 className="mb-4 font-serif text-xl">Projetos em destaque</h2>
        <div className={`grid gap-6 ${works.length > 1 ? "@3xl:grid-cols-2" : ""}`}>{works.map((w) => (
          <WorkTile key={w.id} w={w} round={round} ratio={works.length === 1 ? "aspect-[21/9]" : "aspect-video"}>
            <span className="mt-3 block"><b className="font-serif text-lg">{w.title}</b><span className="block text-sm opacity-70">{w.description}</span></span>
          </WorkTile>))}</div>
      </Box></section>}
      {p.experience.length > 0 && <section id="trajetoria" className="py-8"><Box>
        <h2 className="mb-4 font-serif text-xl">Trajetória profissional</h2>
        <ol className="space-y-3 border-l border-black/20 pl-5">{p.experience.map((x) => <li key={x.id} className="text-sm"><b>{x.period}</b> · {x.title} — <span className="opacity-70">{x.org}</span></li>)}</ol>
      </Box></section>}
      <Footer className="border-t border-black/10" />
    </Page>
  );
}

/* 34 · Serviços e orçamento — serviços em cards escuros, itens e faixa de orçamento. */
export function ServicosOrcamento() {
  const { p, pr, round, visual } = usePage();
  const faq = (p.faq ?? []).filter((q) => q.question);
  return (
    <Page bg="#f4f6f9" ink="#101c2e">
      <section id="inicio" className="bg-[#101c2e] text-white">
        <Box className="flex h-14 items-center justify-between"><span className="font-bold">{pr.name}</span>
          <Nav items={[["Serviços", "#servicos", p.services.length > 0], ["Destaques", "#itens", visual.length > 0], ["FAQ", "#faq", faq.length > 0], ["Orçamento", "#contato", true]]} /></Box>
        <Box className="grid items-center gap-8 pb-10 @3xl:grid-cols-2">
          <div><h1 style={fit(pr.headline)} className="font-display text-5xl font-bold leading-[1.02]">{pr.headline}</h1><p className="mt-4 max-w-sm text-sm text-white/70">{firstSentence(pr.bio)}</p>
            <ContactButton className={`mt-6 bg-[var(--accent)] text-[var(--on-accent)] ${round}`}>Solicitar orçamento <ArrowRight size={14} /></ContactButton></div>
          <Portrait className={`aspect-[4/3] ${round}`} />
        </Box>
      </section>
      {p.services.length > 0 && <section id="servicos" className="py-10"><Box>
        <h2 className="mb-4 text-lg font-bold">Serviços</h2>
        <div className="grid gap-4 @3xl:grid-cols-3">{p.services.map((s) => (
          <div key={s.id} className={`bg-[#101c2e] p-5 text-white ${round}`}><b className="block">{s.title}</b><span className="mt-1 block text-sm text-white/70">{s.text}</span>
            {s.price && <span className="mt-3 block text-sm font-semibold text-[var(--accent)]">{s.price}</span>}</div>))}</div>
      </Box></section>}
      {visual.length > 0 && <section id="itens" className="py-8"><Box>
        <h2 className="mb-4 text-lg font-bold">Destaques recentes</h2>
        <div className="grid gap-4 @3xl:grid-cols-3">{visual.slice(0, 3).map((w) => <WorkTile key={w.id} w={w} round={round} meta={[w.category, w.client].filter(Boolean).join(" · ")} />)}</div>
      </Box></section>}
      {faq.length > 0 && <section id="faq" className="py-8"><Box>
        <h2 className="mb-4 text-lg font-bold">Perguntas frequentes</h2>
        <div className="space-y-2">{faq.map((q) => (
          <details key={q.id} className={`group border border-black/10 bg-white px-4 py-3 ${round}`}>
            <summary className="cursor-pointer list-none font-semibold">{q.question}<span className="float-right transition group-open:rotate-45" aria-hidden>+</span></summary>
            <p className="mt-2 text-sm opacity-75">{q.answer}</p>
          </details>))}</div>
      </Box></section>}
      <Extras />
      <footer id="contato" className="bg-[var(--accent)] py-8 text-[var(--on-accent)]"><Box className="flex flex-col gap-4 @3xl:flex-row @3xl:items-center @3xl:justify-between">
        <p className="font-serif text-xl italic">“{firstSentence(pr.bio)}” Vamos conversar?</p>
        <div className="flex items-center gap-6"><ContactButton className={`bg-[#101c2e] text-white ${round}`}>Pedir orçamento <ArrowRight size={14} /></ContactButton><Socials /></div>
      </Box></footer>
    </Page>
  );
}

/* 35 · Currículo com itens — resumo, trajetória × itens e painéis de formação e contato. */
export function CurriculoComTrabalhos() {
  const { p, pr, round, visual, openWork } = usePage();
  const resume = /^https?:\/\//i.test(pr.resumeUrl ?? "") ? pr.resumeUrl : undefined;
  return (
    <Page bg="#ffffff" ink="#14303a">
      <header className="border-b border-black/10"><Box className="flex h-14 items-center justify-between">
        <span className="font-bold">{pr.name}</span>
        <Nav items={[["Currículo", "#experiencia", p.experience.length > 0], ["Destaques", "#itens", visual.length > 0], ["Formação", "#formacao", p.education.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-8 py-10 @3xl:grid-cols-[1.4fr_1fr]">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">{roleText(pr)}</p>
          <p className="mt-2 font-display text-5xl font-bold">{pr.name}</p><h1 className="mt-3 max-w-md opacity-75">{pr.headline}. {firstSentence(pr.bio)}</h1>
          {resume && <a href={resume} target="_blank" rel="noreferrer" className={`mt-6 inline-flex items-center gap-2 bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] ${round}`}><Download size={14} />Baixar currículo (PDF)</a>}</div>
        <Portrait className={`aspect-square ${round}`} />
      </Box></section>
      {(p.experience.length > 0 || visual.length > 0) && <section id="curriculo" className="py-8"><Box className="grid gap-10 @3xl:grid-cols-2">
        {p.experience.length > 0 && <div id="experiencia"><h2 className="mb-4 font-bold">Experiência profissional</h2>
          <ol className="space-y-4 border-l-2 border-[var(--accent)] pl-5">{p.experience.map((x) => <li key={x.id}><b className="text-sm">{x.period}</b><p className="font-semibold">{x.title}</p><p className="text-sm opacity-70">{x.org}</p></li>)}</ol></div>}
        {visual.length > 0 && <div id="itens"><h2 className="mb-4 font-bold">Destaques selecionados</h2>
          <ul className="space-y-3">{visual.map((w) => <li key={w.id}><button onClick={() => openWork(w.id)} className="group grid w-full grid-cols-[8rem_1fr] items-center gap-3 text-left">
            <Cover src={w.cover} className={`aspect-video ${round}`} /><span><b className="group-hover:underline">{w.title}</b><span className="block text-xs opacity-60">{[w.category, w.year].filter(Boolean).join(" · ")}</span></span></button></li>)}</ul></div>}
      </Box></section>}
      <section id="formacao-curriculo" className="pb-10"><Box className="grid gap-4 @3xl:grid-cols-2">
        {p.education.length > 0 && <div id="formacao" className={`bg-[#eaf3f7] p-5 ${round}`}><h2 className="font-bold">Formação</h2>{p.education.map((x) => <p key={x.id} className="mt-2 text-sm">{x.title} — {x.org} ({x.period})</p>)}</div>}
        <div id="contato" className={`bg-[#eaf3f7] p-5 ${round}`}><h2 className="font-bold">Contato</h2><p className="mt-2 text-sm"><ContactLine /></p><Socials className="mt-3" /></div>
      </Box></section>
      <Extras />
    </Page>
  );
}

/* 36 · Arquivo editorial — matéria em destaque, busca e filtros sobre o acervo e bio de autoria. */
export function ArquivoEditorial() {
  const { pr, round, articles, lead, openWork } = usePage();
  const top = lead(articles);
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("");
  const [year, setYear] = useState("");
  const topics = [...new Set(articles.map((w) => w.category).filter(Boolean))].sort();
  const years = [...new Set(articles.map((w) => w.year).filter(Boolean))].sort().reverse();
  const list = articles.filter((w) => (!topic || w.category === topic) && (!year || w.year === year) && strip(`${w.title} ${w.description}`).includes(strip(q)));
  return (
    <Page bg="#f6f0e7" ink="#2a1a1f">
      <header className="border-b border-black/10"><Box className="flex h-16 items-center justify-between">
        <span className="leading-tight"><span className="block font-serif text-2xl text-[var(--accent)]">{pr.name}</span><span className="text-xs opacity-60">{pr.headline}</span></span>
        <Nav items={[["Arquivo", "#arquivo", articles.length > 0], ["Sobre", "#sobre", true], ["Contato", "#contato", true]]} />
      </Box></header>
      {top && <section id="inicio"><Box className="py-8"><button onClick={() => openWork(top.id)} className="grid w-full items-center gap-6 text-left @3xl:grid-cols-[1fr_1.3fr]">
        <span><span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Reportagem especial</span><h1 style={fit(top.title)} className="mt-2 font-serif text-5xl leading-[1.05]">{top.title}</h1><span className="mt-3 block opacity-75">{top.description}</span></span>
        <Cover src={top.cover} className={`aspect-video ${round}`} />
      </button></Box></section>}
      {!top && <section id="inicio"><Box className="py-10"><h1 style={fit(pr.headline)} className="font-serif text-5xl">{pr.headline}</h1></Box></section>}
      {articles.length > 0 && <section id="arquivo" className="py-8"><Box>
        <div className="mb-4 flex flex-wrap gap-2">
          <label className="flex flex-1 items-center gap-2 border border-black/15 bg-white px-3"><Search size={16} aria-hidden /><input aria-label="Buscar no arquivo" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar no arquivo…" className="w-full bg-transparent py-2 text-sm outline-none" /></label>
          <select aria-label="Tema" value={topic} onChange={(e) => setTopic(e.target.value)} className="border border-black/15 bg-white px-3 text-sm"><option value="">Todos os temas</option>{topics.map((t) => <option key={t}>{t}</option>)}</select>
          <select aria-label="Ano" value={year} onChange={(e) => setYear(e.target.value)} className="border border-black/15 bg-white px-3 text-sm"><option value="">Todos os anos</option>{years.map((y) => <option key={y}>{y}</option>)}</select>
        </div>
        <h2 className="mb-2 font-bold">Mais recentes</h2>
        {list.length === 0 ? <p className="py-6 text-sm">Nenhuma publicação encontrada. <button className="underline" onClick={() => { setQ(""); setTopic(""); setYear(""); }}>Limpar filtros</button></p> :
          <ul className="divide-y divide-black/10 border-y border-black/10">{list.map((w) => <li key={w.id}><button onClick={() => openWork(w.id)} className="group grid w-full grid-cols-[6rem_4rem_1fr_auto] items-center gap-4 py-3 text-left">
            <Cover src={w.cover} className={`aspect-video ${round}`} /><span className="text-xs opacity-60">{w.year}</span>
            <span><b className="group-hover:underline">{w.title}</b><span className="block text-xs opacity-60">{[w.category, w.outlet || w.client].filter(Boolean).join(" · ")}</span></span><ArrowRight size={16} /></button></li>)}</ul>}
      </Box></section>}
      <section id="sobre" className="py-8"><Box className="flex items-center gap-5">
        <Portrait className="h-20 w-20 shrink-0 rounded-full" /><div><h2 className="font-bold">Sobre a autoria</h2><p className="text-sm opacity-75">{pr.bio}</p></div>
      </Box></section>
      <Footer className="bg-[var(--accent)] text-[var(--on-accent)]" />
    </Page>
  );
}

/* 37 · Campanhas e resultados — campanha no topo, peças por canal, contribuição e resultados. */
export function CampanhasResultados() {
  const { pr, round, visual, lead } = usePage();
  const main = lead(visual);
  return (
    <Page bg="#171411" ink="#ffffff">
      <header className="absolute inset-x-0 top-0 z-10"><Box className="flex h-14 items-center justify-between">
        <span className="font-bold">{pr.name}</span>
        <Nav items={[["Campanhas", "#pecas", visual.length > 0], ["Resultados", "#resultados", pr.stats.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Cover src={main?.cover ?? pr.photo} className="min-h-[26rem]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#171411] via-[#171411]/70 to-transparent" />
        <Box className="relative flex min-h-[26rem] flex-col justify-center pt-14">
          {main && <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Campanha · {main.client}</p>}
          <h1 style={fit(pr.headline)} className="mt-2 max-w-lg font-display text-5xl font-black leading-[1.0]">{pr.headline}</h1><p className="mt-3 max-w-sm text-sm text-white/70">{firstSentence(pr.bio)}</p>
        </Box>
      </Cover></section>
      {visual.length > 0 && <section id="pecas" className="py-10"><Box>
        <h2 className="mb-4 text-lg font-bold">A campanha em {visual.length} {visual.length === 1 ? "canal" : "canais"}</h2>
        <div className="grid gap-4 @3xl:grid-cols-3">{visual.map((w) => <WorkTile key={w.id} w={w} round={round} meta={w.category} />)}</div>
      </Box></section>}
      {(main?.contribution || pr.stats.length > 0) && <section id="resultados" className="py-8"><Box className="grid gap-8 @3xl:grid-cols-2">
        {main && <p className="text-sm text-white/60 @3xl:col-span-2"><b className="text-white">Contexto · </b>{main.description}</p>}
        {main?.contribution && <div><h2 className="font-bold">Nossa proposta</h2><p className="mt-2 text-sm text-white/75">{main.contribution}</p>
          {!!main.deliverables?.length && <p className="mt-2 text-xs text-white/50">{main.deliverables.join(" · ")}</p>}</div>}
        {pr.stats.length > 0 && <div><h2 className="font-bold">Resultados</h2><div className="mt-3 grid grid-cols-3 gap-4">{pr.stats.slice(0, 3).map((s) => <div key={s.label}><b className="block text-3xl text-[var(--accent)]">{s.value}</b><span className="text-xs text-white/60">{s.label}</span></div>)}</div></div>}
      </Box></section>}
      <Footer className="bg-[var(--accent)] text-[var(--on-accent)]" />
    </Page>
  );
}

/* 38 · Projetos digitais — capturas em notebook e celular, tecnologias e link para ver ao vivo. */
export function ProjetosDigitais() {
  const { pr, round, visual, openWork } = usePage();
  return (
    <Page bg="#f3f7ff" ink="#0f1b3d">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="font-bold text-[var(--accent)]">{pr.name}</span>
        <Nav items={[["Projetos", "#projetos", visual.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio" className="relative overflow-hidden"><Box className="py-12">
        <div className="absolute -right-20 top-0 h-80 w-80 rotate-12 bg-[var(--accent)] opacity-90 [clip-path:polygon(30%_0,100%_0,100%_100%,0_70%)]" aria-hidden />
        <h1 style={fit(pr.headline)} className="relative max-w-xl font-display text-5xl font-bold leading-[1.02] text-[var(--accent)]">{pr.headline}</h1><p className="relative mt-4 max-w-md opacity-70">{firstSentence(pr.bio)}</p>
      </Box></section>
      {visual.length > 0 && <section id="projetos" className="space-y-10 py-8"><Box>
        <h2 className="mb-6 font-bold">Projetos em destaque</h2>
        {visual.map((w) => { const live = [w.repositoryUrl, w.mediaUrl].find((url) => url && workLink(url)); return (
          <article key={w.id} className="mb-10 grid items-center gap-8 @3xl:grid-cols-[1.4fr_1fr]">
            <button onClick={() => openWork(w.id)} className="relative block pb-8 pr-10" aria-label={`Abrir ${w.title}`}>
              <div className="rounded-t-xl border-[6px] border-b-0 border-[#0f1b3d] bg-[#0f1b3d]"><Cover src={w.cover} className="aspect-[16/10]" /></div><div className="mx-[-4%] h-3 rounded-b-xl bg-[#0f1b3d]" />
              <div className="absolute bottom-0 right-0 w-20 rounded-xl border-4 border-[#0f1b3d] bg-[#0f1b3d]"><Cover src={w.cover} className="aspect-[9/19] rounded-lg" /></div>
            </button>
            <div><b className="text-xl">{w.title}</b><p className="mt-2 text-sm opacity-75">{w.description}</p>
              {w.software.length > 0 && <p className="mt-3 flex flex-wrap gap-2">{w.software.map((s) => <span key={s} className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs text-[var(--accent)]">{s}</span>)}</p>}
              {w.role && <p className="mt-2 text-xs opacity-60">Papel: {w.role}</p>}
              {live && <a href={live} target="_blank" rel="noreferrer" className={`mt-4 inline-flex items-center gap-2 bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] ${round}`}>Ver ao vivo <ExternalLink size={14} /></a>}</div>
          </article>); })}
      </Box></section>}
      <Footer className="bg-[var(--accent)] text-[var(--on-accent)]" />
    </Page>
  );
}

/* 39 · Projetos educacionais — cursos, materiais para baixar e públicos e objetivos. */
export function ProjetosEducacionais() {
  const { p, pr, round, visual } = usePage();
  return (
    <Page bg="#f3f4e9" ink="#16302a">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="font-serif text-xl font-bold text-[var(--accent)]">{pr.name}</span>
        <Nav items={[["Cursos", "#cursos", visual.length > 0], ["Materiais", "#materiais", p.services.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-8 py-8 @3xl:grid-cols-2">
        <div><h1 style={fit(pr.headline)} className="font-serif text-5xl leading-[1.05]">{pr.headline}</h1><p className="mt-4 max-w-sm opacity-70">{firstSentence(pr.bio)}</p></div>
        <Portrait className={`aspect-[4/3] ${round}`} />
      </Box></section>
      {visual.length > 0 && <section id="cursos" className="py-8"><Box>
        <h2 className="mb-4 font-bold">Cursos e módulos</h2>
        <div className="grid gap-4 @3xl:grid-cols-3">{visual.map((w) => <WorkTile key={w.id} w={w} round={round} meta={[w.client, w.category].filter(Boolean).join(" · ")} />)}</div>
      </Box></section>}
      {(p.services.length > 0 || pr.pillars.length > 0) && <section id="materiais" className="py-8"><Box className="grid gap-8 @3xl:grid-cols-2">
        {p.services.length > 0 && <div><h2 className="mb-3 font-bold">Materiais para download</h2><ul className="space-y-2">{p.services.map((s) => (
          <li key={s.id} className={`flex items-center justify-between bg-white p-3 text-sm ${round}`}><span><b>{s.title}</b><span className="block text-xs opacity-60">{s.text}</span></span><Download size={16} className="text-[var(--accent)]" /></li>))}</ul></div>}
        {pr.pillars.length > 0 && <div><h2 className="mb-3 font-bold">Públicos e objetivos</h2><ul className="space-y-2">{pr.pillars.map((x) => <li key={x.title} className="text-sm">✓ <b>{x.title}</b> — {x.text}</li>)}</ul></div>}
      </Box></section>}
      <Footer className="bg-[var(--accent)] text-[var(--on-accent)]" />
    </Page>
  );
}

/* 40 · Equipe e projetos — foto do coletivo com texto, projetos com créditos por pessoa e serviços. */
export function EquipeProjetos() {
  const { p, pr, round, visual, lead } = usePage();
  return (
    <Page bg="#faf3eb" ink="#2a1414">
      <header className="absolute inset-x-0 top-0 z-10 bg-[#faf3eb]/90"><Box className="flex h-14 items-center justify-between">
        <span className="font-bold text-[var(--accent)]">{pr.name}</span>
        <Nav items={[["Projetos", "#projetos", visual.length > 0], ["Equipe", "#equipe", (p.team ?? []).some((m) => m.name)], ["Serviços", "#servicos", p.services.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Cover src={lead(visual)?.cover ?? pr.photo} position={lead(visual) ? undefined : photoPosition(pr.photoFocus)} className="min-h-[26rem]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
        <Box className="relative flex min-h-[26rem] flex-col justify-end pb-10 text-white">
          <h1 style={fit(pr.headline)} className="max-w-xl font-serif text-5xl leading-[1.05]">{pr.headline}</h1><p className="mt-3 max-w-md text-sm text-white/80">{summary(pr.bio)}</p>
        </Box>
      </Cover></section>
      {visual.length > 0 && <section id="projetos" className="py-10"><Box>
        <h2 className="mb-4 font-bold">Projetos recentes</h2>
        <div className="grid gap-5 @3xl:grid-cols-3">{visual.map((w) => (
          <WorkTile key={w.id} w={w} round={round}>
            <span className="mt-3 block"><b>{w.title}</b><span className="block text-xs opacity-60">{[w.category, w.year].filter(Boolean).join(" · ")}</span>
              {w.contribution && <span className="mt-1 block text-xs"><span className="font-semibold text-[var(--accent)]">Equipe:</span> {w.contribution}</span>}</span>
          </WorkTile>))}</div>
      </Box></section>}
      <TeamStrip />
      {p.services.length > 0 && <section id="servicos" className="py-8"><Box>
        <h2 className="mb-3 font-bold">Serviços</h2>
        <ul className="grid gap-2 @3xl:grid-cols-3">{p.services.map((s) => <li key={s.id} className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-[var(--accent)]" />{s.title}</li>)}</ul>
      </Box></section>}
      <Footer className="bg-[var(--accent)] text-[var(--on-accent)]" />
    </Page>
  );
}
