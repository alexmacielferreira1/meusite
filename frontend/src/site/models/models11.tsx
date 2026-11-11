import { Camera, Radio, Sparkles, Video } from "lucide-react";
import { Extras } from "./Extras";
import { Box, ContactLine, Cover, firstSentence, fit, Nav, Page, PlayDot, Portrait, Socials, TeamStrip, usePage, WorkTile , roleText } from "./shared";

const COVERAGE_ICONS = [Video, Camera, Radio, Sparkles];

/* 11 · Direção de fotografia — still panorâmico, grade 3×2 com câmera e lentes. */
export function DirecaoFotografia() {
  const { pr, round, visual, lead, videos } = usePage();
  const hero = lead(visual);
  const reel = lead(videos);
  return (
    <Page bg="#10100f" ink="#f6e9c9">
      <header className="border-b border-white/10"><Box className="flex h-14 items-center justify-between">
        <span className="leading-tight"><span className="block text-sm font-bold">{pr.name}</span><span className="text-[10px] uppercase tracking-[0.25em] opacity-60">{roleText(pr, "short")}</span></span>
        <Nav items={[["Projetos", "#filmes", visual.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Cover src={hero?.cover} className="min-h-[30rem]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#10100f] via-[#10100f]/60 to-transparent" />
        <Box className="relative flex min-h-[30rem] flex-col justify-center">
          <h1 style={fit(pr.headline)} className="max-w-lg font-serif text-5xl leading-[1.05] @3xl:text-6xl">{pr.headline}</h1>
          <p className="mt-4 max-w-sm text-sm opacity-75">{firstSentence(pr.bio)}</p>
          {reel && <a href="#filmes" className="mt-6 inline-flex w-fit items-center gap-3 text-sm"><PlayDot size={36} />Ver seleção</a>}
        </Box>
      </Cover></section>
      {visual.length > 0 && <section id="filmes" className="py-12"><Box>
        <h2 className="mb-6 text-sm font-bold uppercase tracking-[0.2em]">Seleção especial selecionados</h2>
        <div className="grid gap-x-5 gap-y-8 @3xl:grid-cols-3">{visual.slice(0, 6).map((w) => (
          <WorkTile key={w.id} w={w} round={round} ratio="aspect-[2.2/1]">
            <span className="mt-3 block"><span className="block font-semibold">{w.title}</span>
              <span className="block text-xs opacity-60">{[w.category, w.year].filter(Boolean).join(" · ")}</span>
              {w.client && <span className="mt-1 block text-xs text-[var(--accent)]">{w.client}</span>}</span>
          </WorkTile>))}</div>
      </Box></section>}
      <Extras />
      <footer id="contato" className="border-t border-white/10 py-6"><Box className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <span className="font-bold">Contato</span><ContactLine /><Socials />
      </Box></footer>
    </Page>
  );
}

/* 12 · Documentarista — retrato e apresentação, filme em faixa, filmes × festivais e faixa ferrugem. */
export function Documentarista() {
  const { p, pr, round, videos, visual, lead, openWork } = usePage();
  const film = lead(videos);
  const list = visual.filter((w) => w.id !== film?.id);
  return (
    <Page bg="#f3e8d4" ink="#3a2418">
      <header><Box className="flex h-16 items-center justify-between">
        <span className="leading-tight"><span className="block font-serif text-xl text-[var(--accent)]">{pr.name}</span><span className="text-[10px] uppercase tracking-[0.25em] opacity-60">{roleText(pr, "short")}</span></span>
        <Nav items={[["Filmes", "#filmes", visual.length > 0], ["Exibições", "#exibicoes", p.experience.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-8 py-8 @3xl:grid-cols-[1fr_1.2fr]">
        <Portrait className={`aspect-[4/3] ${round}`} />
        <div><h1 style={fit(pr.headline)} className="font-serif text-4xl leading-tight text-[var(--accent)] @3xl:text-5xl">{pr.headline}</h1><p className="mt-4 opacity-75">{firstSentence(pr.bio)}</p></div>
      </Box></section>
      {film && <section id="destaque"><Box>
        <button onClick={() => openWork(film.id)} className={`group relative block w-full overflow-hidden ${round}`}>
          <Cover src={film.cover} className="aspect-[21/8]"><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /></Cover>
          <span className="absolute bottom-5 left-5 flex items-center gap-3 text-left text-white"><PlayDot size={44} /><span><b className="block">{film.title}</b><span className="text-xs opacity-80">{[film.category, film.client].filter(Boolean).join(" · ")}</span></span></span>
        </button>
      </Box></section>}
      <section id="sobre-trajetoria" className="py-10"><Box className="grid gap-10 @3xl:grid-cols-[1.6fr_1fr]">
        {(film || list.length > 0) && <div id="filmes">
          <h2 className="mb-4 font-serif text-2xl text-[var(--accent)]">Nossos destaques</h2>
          <ul className="space-y-4">{[film, ...list].filter(Boolean).map((w) => w && (
            <li key={w.id}><button onClick={() => openWork(w.id)} className="group grid w-full grid-cols-[7rem_1fr] gap-4 text-left">
              <Cover src={w.cover} className={`aspect-video ${round}`} />
              <span><b className="group-hover:underline">{w.title}</b> <span className="text-xs opacity-60">({w.year}) · {w.client}</span><span className="mt-1 block text-sm opacity-75">{w.description}</span></span>
            </button></li>))}</ul>
        </div>}
        {p.experience.length > 0 && <div id="exibicoes">
          <h2 className="mb-4 font-serif text-2xl text-[var(--accent)]">Exibições e festivais</h2>
          <ol className="border-l-2 border-[var(--accent)]/40 pl-5">{p.experience.map((x) => (
            <li key={x.id} className="relative mb-5"><span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-[var(--accent)]" />
              <b className="text-[var(--accent)]">{x.period}</b><p className="text-sm">{x.title}</p><p className="text-xs opacity-60">{x.org}</p></li>))}</ol>
        </div>}
      </Box></section>
      <Extras />
      <footer id="contato" className="bg-[var(--accent)] py-6 text-[var(--on-accent)]"><Box className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <b>Contato</b><ContactLine /><Socials />
      </Box></footer>
    </Page>
  );
}

/* 13 · Repórter de TV — redação, reportagem em player largo e lista densa com emissora e data. */
export function ReporterTv() {
  const { pr, round, videos, articles, lead, openWork } = usePage();
  const top = lead(videos);
  const list = [...videos.filter((w) => w.id !== top?.id), ...articles];
  return (
    <Page bg="#102039" ink="#ffffff">
      <header className="border-b border-white/10"><Box className="flex h-14 items-center justify-between">
        <span className="leading-tight"><span className="block font-bold">{pr.name}</span><span className="text-[10px] uppercase tracking-[0.25em] opacity-60">{roleText(pr, "short")}</span></span>
        <Nav items={[["Reportagens", "#reportagens", list.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio" className="relative overflow-hidden"><Box className="grid items-center gap-6 py-10 @3xl:grid-cols-2">
        <div><h1 style={fit(pr.headline)} className="font-display text-4xl font-bold leading-tight @3xl:text-5xl">{pr.headline}</h1><p className="mt-4 text-white/70">{firstSentence(pr.bio)}</p></div>
        <div className="relative"><Portrait className={`aspect-[4/3] ${round}`} /><span className="absolute right-3 top-3 bg-[var(--accent)] px-2 py-1 text-xs font-black text-[var(--on-accent)]">AO VIVO</span></div>
      </Box></section>
      {top && <section id="destaque"><Box>
        <button onClick={() => openWork(top.id)} className={`group relative block w-full overflow-hidden border border-white/15 ${round}`}>
          <Cover src={top.cover} className="aspect-[21/9]"><div className="absolute inset-0 bg-black/30" /></Cover>
          <PlayDot size={64} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          <span className="absolute bottom-0 inset-x-0 bg-black/60 px-4 py-2 text-left text-sm"><b>{top.title}</b> <span className="opacity-70">· {top.category}</span></span>
        </button>
      </Box></section>}
      {list.length > 0 && <section id="reportagens" className="py-10"><Box>
        <h2 className="mb-3 text-lg font-bold">Reportagens recentes</h2>
        <ul className="divide-y divide-white/10">{list.map((w) => (
          <li key={w.id}><button onClick={() => openWork(w.id)} className="group grid w-full grid-cols-[6rem_1fr_auto] items-center gap-4 py-3 text-left">
            <Cover src={w.cover} className={`aspect-video ${round}`} />
            <span className="font-semibold group-hover:underline">{w.title}</span>
            <span className="text-right text-xs"><span className="block bg-[var(--accent)] px-1.5 font-bold text-[var(--on-accent)]">{w.outlet || w.client}</span><span className="opacity-60">{w.year}</span></span>
          </button></li>))}</ul>
      </Box></section>}
      <Extras />
      <footer id="contato" className="bg-[#0a162a] py-6"><Box className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <b>Contato</b><ContactLine /><Socials />
      </Box></footer>
    </Page>
  );
}

/* 14 · Direção de arte — colagem à esquerda, manchete em caixa-alta com palavra vermelha, 6 campanhas. */
export function DirecaoArte() {
  const { pr, round, visual } = usePage();
  const words = pr.headline.toUpperCase().split(" ");
  const cut = Math.max(1, Math.ceil(words.length * 0.6));
  return (
    <Page bg="#f7efe3" ink="#151313">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="leading-tight"><span className="block font-bold">{pr.name}</span><span className="text-[10px] uppercase tracking-[0.25em] opacity-60">{roleText(pr, "short")}</span></span>
        <Nav items={[["Projetos", "#campanhas", visual.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-8 py-8 @3xl:grid-cols-2">
        <div className="relative h-80" aria-hidden>
          <Portrait className="absolute inset-y-0 left-0 w-3/4 grayscale" />
          <div className="absolute bottom-6 right-6 h-28 w-28 rotate-12 bg-[var(--accent)] mix-blend-multiply" />
          <div className="absolute left-4 top-6 h-16 w-40 -rotate-6 bg-[#151313]" />
        </div>
        <div>
          <h1 style={fit(pr.headline)} className="font-display text-5xl font-black leading-[0.95] @3xl:text-6xl">{words.slice(0, cut).join(" ")} <span className="text-[var(--accent)]">{words.slice(cut).join(" ")}</span></h1>
          <p className="mt-4 max-w-sm text-sm opacity-75">{firstSentence(pr.bio)}</p>
        </div>
      </Box></section>
      {visual.length > 0 && <section id="campanhas" className="py-10"><Box>
        <h2 className="mb-5 text-lg font-black uppercase">Campanhas e projetos</h2>
        <div className="grid gap-5 @3xl:grid-cols-3">{visual.slice(0, 6).map((w) => (
          <WorkTile key={w.id} w={w} round={round} ratio="aspect-[4/3]" meta={[w.category, w.year].filter(Boolean).join(" · ")} />))}</div>
      </Box></section>}
      <Extras />
      <footer id="contato" className="bg-[var(--accent)] py-6 text-[var(--on-accent)]"><Box className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <b>Contato</b><ContactLine /><Socials />
      </Box></footer>
    </Page>
  );
}

/* 15 · Redação publicitária — manchete tipográfica gigante e cases com a frase em destaque. */
export function RedacaoPublicitaria() {
  const { pr, round, visual, openWork } = usePage();
  return (
    <Page bg="#edff54" ink="#111111">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="leading-tight"><span className="block font-bold">{pr.name}</span><span className="text-[10px] uppercase tracking-[0.25em] opacity-60">{roleText(pr, "short")}</span></span>
        <Nav items={[["Cases", "#cases", visual.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio" className="relative"><Box className="py-12">
        <h1 style={fit(pr.headline)} className="max-w-4xl font-display text-6xl font-black uppercase leading-[0.9] tracking-tight @3xl:text-8xl">{pr.headline}</h1>
        <p className="mt-6 max-w-md">{firstSentence(pr.bio)}</p>
        <svg viewBox="0 0 200 60" className="absolute bottom-6 right-10 hidden w-48 @3xl:block" aria-hidden><path d="M5 50 C60 10 120 10 190 30 M170 18 L190 30 L172 42" fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round" /></svg>
      </Box></section>
      {visual.length > 0 && <section id="cases" className="py-10"><Box>
        <h2 className="mb-5 font-bold">Cases selecionados</h2>
        <ul className="space-y-4">{visual.map((w) => (
          <li key={w.id}><button onClick={() => openWork(w.id)} className={`grid w-full gap-6 bg-[#fbfbe8] p-6 text-left shadow-sm @3xl:grid-cols-[10rem_1fr] ${round}`}>
            <span className="self-center text-center font-display text-lg font-black">{w.client}</span>
            <span><span className="font-bold">{w.client} — {w.title}</span>
              <span className="mt-2 block border-l-4 border-[var(--accent)] pl-3 font-serif text-xl italic">{firstSentence(w.description)}</span>
              <span className="mt-2 block text-sm opacity-70">{w.description.slice(firstSentence(w.description).length).trim()}</span></span>
          </button></li>))}</ul>
      </Box></section>}
      <Extras />
      <footer id="contato" className="bg-[#111111] py-6 text-[#edff54]"><Box className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <b>Contato</b><ContactLine /><Socials />
      </Box></footer>
    </Page>
  );
}

/* 16 · Podcast e produção sonora — trailer com onda, capas de séries, serviços e créditos. */
export function PodcastProducaoSonora() {
  const { p, pr, round, audios, openWork, lead } = usePage();
  const works = p.works;
  const trailer = lead(audios);
  const series = works.filter((w) => w.id !== trailer?.id);
  return (
    <Page bg="#0d1626" ink="#ffffff">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="leading-tight"><span className="block font-bold">{pr.name}</span><span className="text-[10px] uppercase tracking-[0.25em] opacity-60">{roleText(pr, "short")}</span></span>
        <Nav items={[["Podcasts", "#series", series.length > 0], ["Produção", "#producao", p.services.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-8 py-8 @3xl:grid-cols-2">
        <div><h1 style={fit(pr.headline)} className="font-display text-5xl font-bold leading-[1.02] text-[var(--accent)] @3xl:text-6xl">{pr.headline}</h1><p className="mt-4 max-w-sm text-white/70">{firstSentence(pr.bio)}</p></div>
        <Portrait className={`aspect-[4/3] ${round}`} />
      </Box></section>
      {trailer && <section id="destaque"><Box>
        <button onClick={() => openWork(trailer.id)} className={`flex w-full items-center gap-5 bg-[#182335] p-5 text-left ${round}`}>
          <PlayDot size={52} />
          <span className="shrink-0"><b className="block">{trailer.title}</b><span className="text-xs opacity-60">{trailer.category}</span></span>
          <span className="flex h-10 flex-1 items-center gap-[3px]" aria-hidden>{Array.from({ length: 70 }).map((_, j) => <span key={j} className="w-1 rounded-sm bg-[var(--accent)]/70" style={{ height: `${20 + ((j * 53) % 80)}%` }} />)}</span>
        </button>
      </Box></section>}
      {series.length > 0 && <section id="series" className="py-10"><Box>
        <h2 className="mb-5 text-lg font-bold">Episódios e séries em destaque</h2>
        <div className="grid gap-5 @3xl:grid-cols-3">{series.slice(0, 3).map((w) => (
          <WorkTile key={w.id} w={w} round={round} ratio="aspect-[4/3]" meta={[w.category, w.client].filter(Boolean).join(" · ")} />))}</div>
      </Box></section>}
      {p.services.length > 0 && <section id="producao" className="border-t border-white/10 py-10"><Box className="grid gap-10 @3xl:grid-cols-2">
        <div><h2 className="mb-3 font-bold">Produção sonora</h2><ul className="space-y-2 text-sm">{p.services.map((s) => <li key={s.id}>✓ {s.title} <span className="opacity-60">— {s.text}</span></li>)}</ul></div>
        <div><h2 className="mb-3 font-bold">Créditos selecionados</h2><ul className="space-y-2 text-sm">{series.map((w) => <li key={w.id}><b>{w.title}</b> <span className="opacity-60">— {w.client} ({w.year})</span></li>)}</ul></div>
      </Box></section>}
      <Extras />
      <footer id="contato" className="bg-[var(--accent)] py-6 text-[var(--on-accent)]"><Box className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <b>Contato</b><ContactLine /><Socials />
      </Box></footer>
    </Page>
  );
}

/* 17 · Cobertura de eventos — palco no topo, tipos de cobertura, highlight e projetos. */
export function CoberturaEventos() {
  const { p, pr, round, visual, videos, lead, openWork } = usePage();
  const hero = lead(visual);
  const highlight = lead(videos);
  const words = pr.headline.toUpperCase().split(" ");
  return (
    <Page bg="#080d10" ink="#ffffff">
      <header className="absolute inset-x-0 top-0 z-10"><Box className="flex h-14 items-center justify-between">
        <span className="leading-tight"><span className="block font-bold">{pr.name}</span><span className="text-[10px] uppercase tracking-[0.25em] opacity-60">{roleText(pr, "short")}</span></span>
        <Nav items={[["Projetos", "#projetos", visual.length > 0], ["Serviços", "#servicos", p.services.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Cover src={hero?.cover} className="min-h-[30rem]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#080d10] via-[#080d10]/70 to-transparent" />
        <Box className="relative flex min-h-[30rem] flex-col justify-center pt-14">
          <h1 style={fit(pr.headline)} className="max-w-xl font-display text-5xl font-black leading-[0.95] @3xl:text-6xl"><span className="text-[var(--accent)]">{words.slice(0, 2).join(" ")}</span> {words.slice(2).join(" ")}</h1>
          <p className="mt-4 max-w-sm text-sm text-white/75">{firstSentence(pr.bio)}</p>
        </Box>
      </Cover></section>
      {p.services.length > 0 && <section id="servicos" className="py-10"><Box>
        <h2 className="mb-6 font-bold">Tipos de cobertura</h2>
        <div className="grid grid-cols-2 gap-6 @3xl:grid-cols-4">{p.services.map((s, i) => { const Icon = COVERAGE_ICONS[i % 4]; return (
          <div key={s.id} className="text-center"><Icon size={30} className="mx-auto text-[var(--accent)]" /><p className="mt-2 text-sm font-semibold">{s.title}</p></div>); })}</div>
      </Box></section>}
      {highlight && <section id="destaque"><Box>
        <button onClick={() => openWork(highlight.id)} className={`flex w-full items-center gap-5 border border-[var(--accent)]/40 p-3 text-left ${round}`}>
          <Cover src={highlight.cover} className={`aspect-video w-40 shrink-0 ${round}`}><PlayDot size={34} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" /></Cover>
          <span><b className="block">{highlight.title}</b><span className="text-sm opacity-70">{highlight.description}</span></span>
        </button>
      </Box></section>}
      {visual.length > 0 && <section id="projetos" className="py-10"><Box>
        <h2 className="mb-5 font-bold">Projetos recentes</h2>
        <div className="grid gap-5 @3xl:grid-cols-3">{visual.slice(0, 3).map((w) => <WorkTile key={w.id} w={w} round={round} meta={[w.category, w.year].filter(Boolean).join(" · ")} />)}</div>
      </Box></section>}
      <Extras />
      <footer id="contato" className="bg-[var(--accent)] py-6 text-[var(--on-accent)]"><Box className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <b>Contato</b><ContactLine /><Socials />
      </Box></footer>
    </Page>
  );
}

/* 18 · Comunicação corporativa — dois cases lado a lado, canais de atuação e entregas. */
export function ComunicacaoCorporativa() {
  const { p, pr, round, visual } = usePage();
  const channels = [...new Set(visual.map((w) => w.category).filter(Boolean))];
  return (
    <Page bg="#f5f2e9" ink="#212827">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="leading-tight"><span className="block font-bold">{pr.name}</span><span className="text-[10px] uppercase tracking-[0.25em] opacity-60">{roleText(pr, "short")}</span></span>
        <Nav items={[["Cases", "#cases", visual.length > 0], ["Entregas", "#entregas", p.services.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-8 py-8 @3xl:grid-cols-2">
        <div><h1 style={fit(pr.headline)} className="font-serif text-4xl leading-tight @3xl:text-5xl">{pr.headline}</h1><p className="mt-4 opacity-75">{firstSentence(pr.bio)}</p></div>
        <Portrait className={`aspect-[4/3] ${round}`} />
      </Box></section>
      {visual.length > 0 && <section id="cases" className="py-8"><Box>
        <h2 className="mb-5 text-lg font-bold">Cases</h2>
        <div className="grid gap-6 @3xl:grid-cols-2">{visual.slice(0, 2).map((w) => (
          <WorkTile key={w.id} w={w} round={round} ratio="aspect-[16/8]">
            <span className="mt-3 block"><span className="mb-1 inline-block bg-[var(--accent)] px-2 py-0.5 text-xs font-semibold text-[var(--on-accent)]">{w.category}</span>
              <b className="block">{w.title}</b><span className="text-xs opacity-60">{[w.client, w.year].filter(Boolean).join(" · ")}</span>
              <span className="mt-1 block text-sm opacity-75">{w.description}</span></span>
          </WorkTile>))}</div>
      </Box></section>}
      {(channels.length > 0 || p.services.length > 0) && <section id="entregas" className="py-8"><Box className="grid gap-8 @3xl:grid-cols-2">
        {channels.length > 0 && <div><h2 className="mb-3 font-bold text-[var(--accent)]">Canais de atuação</h2><ul className="space-y-2 text-sm">{channels.map((c) => <li key={c}>● {c}</li>)}</ul></div>}
        {p.services.length > 0 && <div><h2 className="mb-3 font-bold text-[var(--accent)]">Entregas</h2><ul className="space-y-2 text-sm">{p.services.map((s) => <li key={s.id}>✓ {s.title}</li>)}</ul></div>}
      </Box></section>}
      <Extras />
      <footer id="contato" className="bg-[var(--accent)] py-6 text-[var(--on-accent)]"><Box className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <b>Contato</b><ContactLine /><Socials />
      </Box></footer>
    </Page>
  );
}

/* 19 · Estratégia de conteúdo — bloco vinho com foto, cases e processo em linha do tempo. */
export function EstrategiaConteudo() {
  const { pr, round, visual } = usePage();
  return (
    <Page bg="#f5ece5" ink="#2b1a20">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="leading-tight"><span className="block font-bold">{pr.name}</span><span className="text-[10px] uppercase tracking-[0.25em] opacity-60">{roleText(pr, "short")}</span></span>
        <Nav items={[["Cases", "#cases", visual.length > 0], ["Método", "#processo", pr.pillars.length > 1], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className={`grid overflow-hidden @3xl:grid-cols-2 ${round}`}>
        <div className="bg-[var(--accent)] p-10 text-[var(--on-accent)]"><h1 style={fit(pr.headline)} className="font-serif text-4xl leading-tight @3xl:text-5xl">{pr.headline}</h1><p className="mt-4 text-sm opacity-80">{firstSentence(pr.bio)}</p></div>
        <Portrait className="min-h-64" />
      </Box></section>
      {visual.length > 0 && <section id="cases" className="py-10"><Box>
        <h2 className="mb-5 font-serif text-2xl">Cases em destaque</h2>
        <div className="grid gap-5 @3xl:grid-cols-3">{visual.slice(0, 3).map((w) => <WorkTile key={w.id} w={w} round={round} ratio="aspect-[4/3]" meta={[w.client, w.year].filter(Boolean).join(" · ")} />)}</div>
      </Box></section>}
      {pr.pillars.length > 1 && <section id="processo" className="pb-10"><Box>
        <h2 className="mb-6 font-serif text-2xl">Meu processo</h2>
        <ol className="relative grid gap-6 @3xl:grid-cols-5">
          <span className="absolute left-0 right-0 top-4 hidden h-0.5 bg-[var(--accent)]/30 @3xl:block" aria-hidden />
          {pr.pillars.map((x, i) => <li key={x.title} className="relative"><span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--on-accent)]">{i + 1}</span>
            <b className="mt-2 block">{x.title}</b><span className="text-xs opacity-70">{x.text}</span></li>)}
        </ol>
      </Box></section>}
      <Extras />
      <footer id="contato" className="bg-[#a43e58] py-6 text-white"><Box className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <b>Contato</b><ContactLine /><Socials />
      </Box></footer>
    </Page>
  );
}

/* 20 · Estúdio criativo — nome do estúdio gigante, foto da equipe e projetos de naturezas diferentes. */
export function EstudioCriativo() {
  const { p, pr, round, visual } = usePage();
  const [first, ...rest] = pr.name.split(" ");
  return (
    <Page bg="#f2f2f4" ink="#111111">
      <header><Box className="flex h-14 items-center justify-end">
        <Nav items={[["Projetos", "#projetos", visual.length > 0], ["Equipe", "#equipe", (p.team ?? []).some((m) => m.name)], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-8 pb-10 @3xl:grid-cols-[1fr_1.1fr]">
        <div>
          {rest.length > 0 && <p className="text-2xl font-bold text-[var(--accent)]">{first}</p>}
          <p className="font-display text-7xl font-black leading-[0.85] tracking-tight text-[var(--accent)] @3xl:text-8xl">{rest.join(" ") || first}</p>
          <h1 className="mt-6 max-w-xs text-lg">{pr.headline}</h1>
          <p className="mt-2 max-w-xs text-sm opacity-60">{firstSentence(pr.bio)}</p>
        </div>
        <Portrait className={`aspect-[4/3] grayscale ${round}`} />
      </Box></section>
      {visual.length > 0 && <section id="projetos" className="py-8"><Box>
        <div className="grid gap-5 @3xl:grid-cols-3">{visual.slice(0, 3).map((w) => <WorkTile key={w.id} w={w} round={round} ratio="aspect-[4/3]" meta={[w.category, w.year].filter(Boolean).join(" · ")} />)}</div>
      </Box></section>}
      <TeamStrip gray />
      <Extras />
      <footer id="contato" className="bg-[var(--accent)] py-6 text-[var(--on-accent)]"><Box className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <b>Contato</b><ContactLine /><Socials />
      </Box></footer>
    </Page>
  );
}

