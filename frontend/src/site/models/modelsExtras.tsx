import { ArrowRight, ArrowUpRight, Quote } from "lucide-react";
import { Extras } from "./Extras";
import { Box, ContactButton, ContactLine, Cover, firstSentence, fit, Nav, Page, PlayDot, Portrait, Socials, summary, usePage, WorkTile , roleText } from "./shared";

const n2 = (i: number) => String(i + 1).padStart(2, "0");

/* Grade Suíça — tipografia em grade de 12 colunas, peças numeradas, serviços e clientes em lista. */
export function GradeSuica() {
  const { p, pr, visual } = usePage();
  return (
    <Page bg="#ffffff" ink="#111111">
      <header className="border-b border-black"><Box className="grid h-12 grid-cols-12 items-center text-xs uppercase tracking-[0.2em]">
        <span className="col-span-6 font-bold">{pr.name}</span>
        <Nav className="col-span-6 justify-end" items={[["Destaques", "#itens", visual.length > 0], ["Serviços", "#servicos", p.services.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid grid-cols-12 gap-6 py-12">
        <p className="col-span-12 text-xs uppercase tracking-[0.2em] opacity-60 @3xl:col-span-3">{roleText(pr, "short")} — {pr.city}/{pr.state}</p>
        <div className="col-span-12 @3xl:col-span-9">
          <h1 style={fit(pr.headline)} className="font-sans text-6xl font-semibold leading-[0.92] tracking-tight @3xl:text-8xl">{pr.headline}<span className="text-[var(--accent)]">.</span></h1>
          <p className="mt-6 max-w-xl text-lg opacity-70">{summary(pr.bio, 320)}</p>
          {pr.stats.length > 0 && <div className="mt-8 grid grid-cols-3 border-t border-black pt-3">{pr.stats.map((s) => <div key={s.label}><b className="text-3xl text-[var(--accent)]">{s.value}</b><p className="text-xs opacity-60">{s.label}</p></div>)}</div>}
        </div>
      </Box></section>
      {visual.length > 0 && <section id="itens" className="border-t border-black py-10"><Box>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 @3xl:grid-cols-4">{visual.map((w, i) => (
          <WorkTile key={w.id} w={w} ratio="aspect-[4/5]" play={false}>
            <span className="mt-2 grid grid-cols-[2rem_1fr] text-sm"><span className="font-bold text-[var(--accent)]">{n2(i)}</span><span><b>{w.title}</b><span className="block text-xs opacity-60">{w.category} · {w.year}</span></span></span>
          </WorkTile>))}</div>
      </Box></section>}
      {p.services.length > 0 && <section id="servicos" className="border-t border-black py-10"><Box className="grid grid-cols-12 gap-6">
        <h2 className="col-span-12 text-xs uppercase tracking-[0.2em] opacity-60 @3xl:col-span-3">Serviços</h2>
        <ol className="col-span-12 divide-y divide-black/20 @3xl:col-span-9">{p.services.map((s, i) => <li key={s.id} className="grid grid-cols-[3rem_1fr_2fr] gap-4 py-3"><span className="text-[var(--accent)]">{n2(i)}</span><b>{s.title}</b><span className="opacity-70">{s.text}</span></li>)}</ol>
      </Box></section>}
      {p.clients.length > 0 && <section id="clientes" className="border-t border-black py-8"><Box className="grid grid-cols-12 gap-6">
        <h2 className="col-span-12 text-xs uppercase tracking-[0.2em] opacity-60 @3xl:col-span-3">Clientes</h2>
        <p className="col-span-12 text-2xl font-semibold leading-snug @3xl:col-span-9">{p.clients.join(" / ")}</p>
      </Box></section>}
      <Extras />
      <footer id="contato" className="bg-[var(--accent)] py-10 text-[var(--on-accent)]"><Box className="grid grid-cols-12 items-end gap-6">
        <p className="col-span-12 text-5xl font-semibold leading-none tracking-tight @3xl:col-span-8">Vamos conversar.</p>
        <div className="col-span-12 space-y-3 text-sm @3xl:col-span-4"><ContactLine /><Socials /></div>
      </Box></footer>
    </Page>
  );
}

/* Editorial — revista serifada: retrato redondo central, capitular na bio, publicações e trajetória. */
export function Editorial() {
  const { p, pr, round, articles, openWork } = usePage();
  return (
    <Page bg="#fbfaf7" ink="#1b2a26">
      <header className="border-b border-black/10"><Box className="flex h-14 items-center justify-center gap-10">
        <Nav items={[["Sobre", "#sobre", true], ["Publicações", "#publicacoes", articles.length > 0], ["Trajetória", "#trajetoria", p.experience.length + p.education.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio" className="py-12 text-center"><Box>
        <Portrait className="mx-auto h-32 w-32 rounded-full border-4 border-white shadow" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">{roleText(pr)}</p>
        <p className="mt-3 font-serif text-6xl">{pr.name}</p>
        <h1 className="mx-auto mt-4 max-w-2xl font-serif text-xl italic opacity-75">{pr.headline}</h1>
      </Box></section>
      <section id="sobre" className="py-8"><Box className="mx-auto max-w-3xl">
        <p className="font-serif text-lg leading-relaxed first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-6xl first-letter:leading-none first-letter:text-[var(--accent)]">{pr.bio}</p>
      </Box></section>
      {articles.length > 0 && <section id="publicacoes" className="py-10"><Box>
        <h2 className="mb-6 border-b border-black/10 pb-3 text-center font-serif text-3xl">Publicações</h2>
        <div className="grid gap-8 @3xl:grid-cols-3">{articles.map((w) => (
          <button key={w.id} onClick={() => openWork(w.id)} className="group text-left">
            <Cover src={w.cover} className={`aspect-[3/2] ${round}`} />
            <span className="mt-3 block text-xs font-bold uppercase tracking-wider text-[var(--accent)]">{w.outlet || w.client}</span>
            <span className="mt-1 block font-serif text-xl leading-snug group-hover:underline">{w.title}</span>
            <span className="mt-1 block text-sm opacity-60">{w.category} · {w.year}</span>
          </button>))}</div>
      </Box></section>}
      {p.experience.length + p.education.length > 0 && <section id="trajetoria" className="py-10"><Box className="grid gap-10 @3xl:grid-cols-2">
        {([["Experiência", p.experience], ["Formação", p.education]] as const).filter(([, list]) => list.length).map(([title, list]) => (
          <div key={title}><h2 className="mb-4 font-serif text-2xl">{title}</h2>
            <ul className="space-y-3">{list.map((x) => <li key={x.id} className="border-l-2 border-[var(--accent)] pl-4"><span className="text-xs opacity-60">{x.period}</span><p className="font-serif text-lg">{x.title}</p><p className="text-sm opacity-70">{x.org}</p></li>)}</ul></div>))}
      </Box></section>}
      <Extras />
      <footer id="contato" className="border-t border-black/10 py-10 text-center"><Box>
        <p className="font-serif text-3xl">Pautas, entrevistas e colaborações</p>
        <div className="mt-4 flex flex-col items-center gap-3 text-sm"><ContactLine /><Socials /></div>
      </Box></footer>
    </Page>
  );
}

/* Impacto — primeiro nome gigante, faixa de clientes em movimento, reel, mosaico, serviços e depoimento. */
export function Impacto() {
  const { p, pr, round, videos, visual, lead, openWork } = usePage();
  const reel = lead(videos);
  const rest = visual.filter((w) => w.id !== reel?.id);
  const quote = p.testimonials[0];
  return (
    <Page bg="#0d0b14" ink="#ffffff">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs"><span className={`h-2 w-2 rounded-full ${pr.available ? "bg-emerald-400" : "bg-slate-400"}`} />{pr.available ? "Disponível para projetos" : "Agenda cheia"}</span>
        <Nav items={[["Destaques", "#itens", rest.length > 0], ["Serviços", "#servicos", p.services.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio" className="relative overflow-hidden pb-10">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-[var(--accent)] opacity-30 blur-3xl" aria-hidden />
        <Box className="relative pt-8">
          <p className="font-display text-[8rem] font-bold leading-[0.85] tracking-tighter @3xl:text-[12rem]">{pr.name.split(" ")[0]}<span className="text-[var(--accent)]">.</span></p>
          <h1 className="mt-6 max-w-2xl text-2xl text-white/80">{pr.headline}</h1>
          <p className="mt-3 max-w-xl text-white/50">{summary(pr.bio, 320)}</p>
        </Box>
        {p.clients.length > 0 && <div className="mt-10 overflow-hidden border-y border-white/10 py-4" aria-label="Clientes">
          <div className="flex animate-[marquee_25s_linear_infinite] gap-10 whitespace-nowrap font-display text-3xl font-bold text-white/40">
            {[0, 1, 2].flatMap((k) => p.clients.map((c) => <span key={`${c}${k}`}>{c} <span className="text-[var(--accent)]">✦</span></span>))}
          </div>
        </div>}
      </section>
      {reel && <section id="reel" className="py-6"><Box>
        <button onClick={() => openWork(reel.id)} className={`group relative block w-full overflow-hidden ${round}`}><Cover src={reel.cover} className="aspect-video @3xl:aspect-[21/9]" /><PlayDot size={64} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition group-hover:scale-110" /><span className="absolute inset-x-0 bottom-0 line-clamp-1 bg-gradient-to-t from-black/80 to-transparent px-5 pb-3 pt-10 text-left font-display text-sm font-bold text-white @3xl:text-xl">{reel.title}</span></button>
      </Box></section>}
      {rest.length > 0 && <section id="itens" className="py-10"><Box>
        <h2 className="mb-6 font-display text-5xl font-bold">Destaques</h2>
        <div className="grid gap-4 @3xl:grid-cols-3">{rest.map((w, i) => (
          <WorkTile key={w.id} w={w} round={round} className={i === 0 ? "@3xl:col-span-2" : ""} ratio={i === 0 ? "aspect-[2/1]" : "aspect-square"} meta={w.category} />))}</div>
      </Box></section>}
      {p.services.length > 0 && <section id="servicos" className="py-10"><Box className="grid gap-4 @3xl:grid-cols-3">{p.services.map((s) => (
        <div key={s.id} className={`border border-white/10 bg-white/[0.04] p-6 ${round}`}><b className="font-display text-xl">{s.title}</b><p className="mt-2 text-sm text-white/60">{s.text}</p></div>))}</Box></section>}
      {quote && <section id="depoimento" className="py-10"><Box className="max-w-3xl"><Quote className="text-[var(--accent)]" size={40} aria-hidden /><p className="mt-4 font-display text-3xl font-bold leading-snug">{quote.quote}</p><p className="mt-4 text-sm text-white/60">{quote.author} · {quote.role}</p></Box></section>}
      <Extras />
      <footer id="contato" className="border-t border-white/10 py-12"><Box className="flex flex-col gap-6 @3xl:flex-row @3xl:items-end @3xl:justify-between">
        <p className="font-display text-6xl font-bold leading-none">Bora<span className="text-[var(--accent)]">?</span></p>
        <div className="flex items-center gap-6"><ContactButton className={`bg-[var(--accent)] text-[var(--on-accent)] ${round}`}>Falar comigo <ArrowUpRight size={16} /></ContactButton><Socials /></div>
      </Box></footer>
    </Page>
  );
}

/* Documental — capa editorial clara com retrato, depois itens em cinema escuro com sinopse longa. */
export function Documental() {
  const { p, pr, round, videos, visual, lead, openWork } = usePage();
  const film = lead(videos);
  const rest = visual.filter((w) => w.id !== film?.id);
  return (
    <Page bg="#f1ebe1" ink="#2b2219">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="font-serif text-lg italic">{pr.name}</span>
        <Nav items={[["Filmes", "#filmes", visual.length > 0], ["Trajetória", "#trajetoria", p.experience.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-end gap-10 py-10 @3xl:grid-cols-[1fr_1.4fr]">
        <Portrait className={`aspect-[3/4] ${round}`} />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] opacity-60">{roleText(pr)} · {pr.city}</p>
          <h1 style={fit(pr.headline)} className="mt-4 font-serif text-5xl leading-[1.05] @3xl:text-6xl">{pr.headline}</h1>
          <p className="mt-5 max-w-lg font-serif text-lg leading-relaxed opacity-80">{summary(pr.bio, 320)}</p>
          {pr.pillars.length > 0 && <ul className="mt-6 grid gap-4 border-t border-black/15 pt-4 @3xl:grid-cols-3">{pr.pillars.map((x) => <li key={x.title} className="text-sm"><b className="font-serif">{x.title}</b><p className="opacity-60">{x.text}</p></li>)}</ul>}
        </div>
      </Box></section>
      {visual.length > 0 && <section id="filmes" className="bg-[#14110d] py-12 text-white"><Box>
        {film && <button onClick={() => openWork(film.id)} className="group mb-10 grid w-full items-center gap-8 text-left @3xl:grid-cols-[1.6fr_1fr]">
          <span className={`relative block overflow-hidden ${round}`}><Cover src={film.cover} className="aspect-video" /><PlayDot size={64} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" /></span>
          <span><span className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">{film.category} · {film.year}</span><span className="mt-2 block font-serif text-4xl">{film.title}</span><span className="mt-3 block text-white/70">{film.description}</span></span>
        </button>}
        {rest.length > 0 && <div className="grid gap-6 @3xl:grid-cols-2">{rest.map((w) => (
          <WorkTile key={w.id} w={w} round={round} ratio="aspect-[16/7]">
            <span className="mt-3 block"><b className="font-serif text-xl">{w.title}</b><span className="block text-xs text-white/50">{[w.category, w.client, w.year].filter(Boolean).join(" · ")}</span><span className="mt-1 block text-sm text-white/70">{w.description}</span></span>
          </WorkTile>))}</div>}
      </Box></section>}
      {p.experience.length > 0 && <section id="trajetoria" className="py-10"><Box>
        <h2 className="mb-4 font-serif text-3xl">Trajetória</h2>
        <ul className="divide-y divide-black/10">{p.experience.map((x) => <li key={x.id} className="grid grid-cols-[9rem_1fr] gap-4 py-3"><span className="text-sm opacity-60">{x.period}</span><span><b className="font-serif">{x.title}</b> — {x.org}</span></li>)}</ul>
      </Box></section>}
      {p.clients.length > 0 && <section id="clientes" className="pb-10"><Box><p className="text-sm opacity-60">Exibido e produzido com: <span className="font-serif text-base italic opacity-100">{p.clients.join(", ")}</span></p></Box></section>}
      <Extras />
      <footer id="contato" className="bg-[#14110d] py-8 text-white"><Box className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <span className="font-serif text-xl italic">Tem uma história para contar?</span><ContactLine /><Socials />
      </Box></footer>
    </Page>
  );
}

/* Mosaico — manchete gigante em fundo claro e itens em mosaico de alturas variadas. */
export function Mosaico() {
  const { p, pr, round, visual } = usePage();
  const quote = p.testimonials[0];
  const heights = ["aspect-[4/5]", "aspect-square", "aspect-[4/3]", "aspect-[3/4]", "aspect-[16/10]", "aspect-square"];
  return (
    <Page bg="#fff8f9" ink="#24121a">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="font-display font-bold">{pr.name}<span className="text-[var(--accent)]">●</span></span>
        <Nav items={[["Destaques", "#itens", visual.length > 0], ["Serviços", "#servicos", p.services.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio" className="relative overflow-hidden"><Box className="py-12">
        <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[var(--accent)] opacity-20 blur-3xl" aria-hidden />
        <h1 style={fit(pr.headline)} className="relative max-w-4xl font-display text-6xl font-bold leading-[0.95] tracking-tight @3xl:text-7xl">{pr.headline}</h1>
        <p className="relative mt-5 max-w-lg opacity-70">{firstSentence(pr.bio)}</p>
      </Box></section>
      {visual.length > 0 && <section id="itens" className="py-6"><Box>
        <div className="columns-2 gap-4 @3xl:columns-3">{visual.map((w, i) => (
          <WorkTile key={w.id} w={w} round={round} ratio={heights[i % heights.length]} className="mb-6 break-inside-avoid" meta={[w.client, w.category].filter(Boolean).join(" · ")} />))}</div>
      </Box></section>}
      {p.services.length > 0 && <section id="servicos" className="py-10"><Box>
        <h2 className="mb-5 font-display text-3xl font-bold">O que eu faço</h2>
        <div className="flex flex-wrap gap-3">{p.services.map((s) => <span key={s.id} className="rounded-full border-2 border-[var(--accent)] px-5 py-2 font-semibold" title={s.text}>{s.title}</span>)}</div>
      </Box></section>}
      {quote && <section id="depoimento" className="py-8"><Box><div className={`bg-[var(--accent)] p-8 text-[var(--on-accent)] ${round}`}><p className="font-display text-2xl font-bold">“{quote.quote}”</p><p className="mt-3 text-sm opacity-80">{quote.author} · {quote.role}</p></div></Box></section>}
      {p.clients.length > 0 && <section id="clientes" className="py-6"><Box className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-semibold opacity-60">{p.clients.map((c) => <span key={c}>{c}</span>)}</Box></section>}
      <Extras />
      <footer id="contato" className="py-10"><Box className="flex flex-col gap-4 @3xl:flex-row @3xl:items-center @3xl:justify-between">
        <p className="font-display text-4xl font-bold">Vamos criar juntos?</p>
        <div className="flex items-center gap-6"><ContactButton className={`bg-[#24121a] text-white ${round}`}>Mandar mensagem <ArrowRight size={14} /></ContactButton><Socials /></div>
      </Box></footer>
    </Page>
  );
}
