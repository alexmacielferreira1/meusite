import { ArrowRight, ArrowUpRight, AudioLines, Box as Cube, Camera, Clapperboard, Film, Megaphone, Pause, Play, Scissors, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import type { Work } from "../../types/portfolio";
import { Extras } from "./Extras";
import { Box, ContactButton, Cover, Eyebrow, firstSentence, fit, Nav, Page, PlayDot, Portrait, Socials, usePage, WorkTile , roleText } from "./shared";

const SERVICE_ICONS = [Camera, Clapperboard, Scissors, Sparkles, Film, Megaphone];

/* 01 · Editor Pro — escuro cinematográfico, retrato fundido, reel largo, clientes e contato. */
export function EditorPro() {
  const { p, pr, head, round, videos, visual, lead, openWork } = usePage();
  const reel = lead(videos);
  const [all, setAll] = useState(false);
  const shown = visual.filter((w) => w.id !== reel?.id);
  return (
    <Page bg="#101014" ink="#ffffff">
      <header className="border-b border-white/10">
        <Box className="flex h-16 items-center justify-between gap-6">
          <a href="#inicio" className={`${head} flex items-center gap-2 font-bold`}><span className="h-5 w-5 rounded bg-[var(--accent)]" />{pr.name}</a>
          <Nav items={[["Destaques", "#itens", shown.length > 0], ["Serviços", "#clientes", p.clients.length > 0], ["Sobre", "#inicio", true], ["Contato", "#contato", true]]} />
          <a href="#contato" className={`${round} bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)]`}>Orçamento</a>
        </Box>
      </header>
      <section id="inicio" className="relative overflow-hidden">
        <Box className="grid items-center gap-8 py-14 @3xl:grid-cols-2 @3xl:py-20">
          <div className="relative z-10">
            <Eyebrow className="text-[var(--accent)]">{roleText(pr)}</Eyebrow>
            <h1 style={fit(pr.headline)} className={`${head} mt-4 text-4xl font-bold leading-[1.05] @3xl:text-6xl`}>{pr.headline}</h1>
            <p className="mt-5 max-w-md text-white/70">{firstSentence(pr.bio)}</p>
            {reel && <a href="#reel" className={`${round} mt-8 inline-flex items-center gap-2 bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--on-accent)]`}>Ver seleção <Play size={14} fill="currentColor" /></a>}
          </div>
          <div className="relative h-80 @3xl:h-[26rem]">
            <Portrait className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#101014] to-transparent to-30%" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101014] to-transparent to-25%" />
          </div>
        </Box>
      </section>
      {reel && <section id="reel"><Box>
        <button onClick={() => openWork(reel.id)} className={`group relative block w-full overflow-hidden border border-white/10 ${round}`}>
          <Cover src={reel.cover} className="aspect-[21/9]"><div className="absolute inset-0 bg-black/30" /></Cover>
          <PlayDot size={72} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition group-hover:scale-110" />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-6 pb-5 pt-12 text-left"><span className="block text-lg font-semibold">{reel.title}</span><span className="line-clamp-2 max-w-2xl text-sm text-white/70">{reel.description}</span></span>
        </button>
      </Box></section>}
      {shown.length > 0 && <section id="itens" className="py-16"><Box>
        <div className="mb-6 flex items-end justify-between"><h2 className={`${head} text-2xl font-bold`}>Destaques em destaque</h2>
          {shown.length > 3 && <button onClick={() => setAll(!all)} className="text-sm text-[var(--accent)]">{all ? "Ver menos" : "Ver todos →"}</button>}</div>
        <div className="grid gap-5 @3xl:grid-cols-3">{(all ? shown : shown.slice(0, 3)).map((w) => <WorkTile key={w.id} w={w} round={round} meta={[w.category, w.client].filter(Boolean).join(" · ")} />)}</div>
      </Box></section>}
      {p.clients.length > 0 && <section id="clientes" className="border-y border-white/10 bg-[#18181e] py-10"><Box>
        <h2 className={`${head} text-2xl font-bold`}>Clientes</h2>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-10 gap-y-5">
          {p.clients.map((c) => <span key={c} className={`${head} text-xl font-bold tracking-tight text-white/60 @3xl:text-2xl`}>{c}</span>)}
        </div>
      </Box></section>}
      <Extras />
      <footer id="contato" className="bg-[#18181e] py-10"><Box className="flex flex-col gap-6 @3xl:flex-row @3xl:items-center @3xl:justify-between">
        <div><p className={`${head} text-2xl font-bold`}>Vamos editar seu próximo projeto?</p><p className="mt-1 text-sm text-white/60">Conte sua ideia e receba uma proposta.</p></div>
        <div className="flex items-center gap-6"><ContactButton className={`${round} bg-[var(--accent)] text-[var(--on-accent)]`}>Enviar mensagem <ArrowRight size={16} /></ContactButton><Socials /></div>
      </Box></footer>
    </Page>
  );
}

/* 02 · Videomaker — foto de ponta a ponta, projetos, serviços com ícones e contato sobre paisagem. */
export function Videomaker() {
  const { p, pr, head, round, visual, lead } = usePage();
  const hero = lead(visual);
  const scenic = visual[visual.length - 1];
  return (
    <Page bg="#211c15" ink="#f6e9cd">
      <header className="absolute inset-x-0 top-0 z-20"><Box className="flex h-16 items-center justify-between">
        <span className={`${head} flex items-center gap-2 font-bold`}><Camera size={18} className="text-[var(--accent)]" />{pr.name}</span>
        <Nav items={[["Projetos", "#projetos", visual.length > 0], ["Serviços", "#servicos", p.services.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio" className="relative">
        <Cover src={hero?.cover ?? pr.photo} className="min-h-[34rem]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#211c15] via-[#211c15]/70 to-transparent" />
          <Box className="relative flex min-h-[34rem] flex-col justify-center py-24">
            <h1 style={fit(pr.headline)} className={`${head} max-w-xl text-4xl font-bold leading-tight @3xl:text-6xl`}>{pr.headline}</h1>
            <p className="mt-5 max-w-md opacity-80">{firstSentence(pr.bio)}</p>
            <a href="#projetos" className={`${round} mt-8 inline-flex w-fit items-center gap-2 bg-[#f6e9cd] px-5 py-3 text-sm font-semibold text-[#211c15]`}>Ver itens <Play size={14} fill="currentColor" /></a>
          </Box>
        </Cover>
      </section>
      {visual.length > 0 && <section id="projetos" className="py-16"><Box>
        <h2 className={`${head} mb-6 text-2xl font-bold`}>Projetos recentes</h2>
        <div className="grid gap-5 @3xl:grid-cols-3">{visual.slice(0, 3).map((w) => <WorkTile key={w.id} w={w} round={round} meta={[w.category, w.client].filter(Boolean).join(" · ")} />)}</div>
      </Box></section>}
      {p.services.length > 0 && <section id="servicos" className="border-t border-white/10 py-14"><Box>
        <h2 className={`${head} mb-8 text-2xl font-bold`}>Serviços</h2>
        <div className="grid gap-8 @3xl:grid-cols-4">{p.services.map((s, i) => { const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length]; return (
          <div key={s.id} className="text-center"><Icon className="mx-auto text-[var(--accent)]" size={30} /><p className="mt-3 font-semibold">{s.title}</p><p className="mt-1 text-sm opacity-70">{s.text}</p></div>); })}</div>
      </Box></section>}
      <Extras />
      <footer id="contato"><Cover src={scenic?.cover} className="py-16">
        <div className="absolute inset-0 bg-[#211c15]/75" />
        <Box className="relative flex flex-col gap-6 @3xl:flex-row @3xl:items-center @3xl:justify-between">
          <div><p className={`${head} text-3xl font-bold`}>Fale comigo</p><p className="mt-1 opacity-80">Vamos tirar seu projeto do papel?</p></div>
          <div className="flex items-center gap-6"><ContactButton className={`${round} bg-[var(--accent)] text-[var(--on-accent)]`}>Entrar em contato <ArrowRight size={16} /></ContactButton><Socials /></div>
        </Box>
      </Cover></footer>
    </Page>
  );
}

/* 03 · Produção audiovisual — produtora: set à direita, produções com créditos, o estúdio e bastidores. */
export function ProducaoAudiovisual() {
  const { p, pr, head, round, visual } = usePage();
  const [first, ...rest] = visual;
  const team = (p.team ?? []).filter((m) => m.name);
  const behind = [...visual].reverse().slice(0, 4);
  return (
    <Page bg="#e9e3dc" ink="#212120">
      <header className="border-b border-black/10"><Box className="flex h-16 items-center justify-between">
        <span className={`${head} max-w-[10rem] text-sm font-bold leading-tight`}>{pr.name}</span>
        <Nav items={[["Projetos", "#producoes", visual.length > 0], ["Estúdio", "#estudio", true], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-stretch gap-8 py-12 @3xl:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col justify-center">
          <h1 style={fit(pr.headline)} className={`${head} text-4xl font-bold leading-[1.05] @3xl:text-6xl`}>{pr.headline}</h1>
          <p className="mt-5 max-w-sm opacity-70">{firstSentence(pr.bio)}</p>
          <a href="#producoes" className={`${round} mt-8 inline-flex w-fit items-center gap-2 bg-[#212120] px-5 py-3 text-sm font-semibold text-white`}>Conheça os projetos <ArrowRight size={14} /></a>
        </div>
        <Cover src={first?.cover ?? pr.photo} className={`min-h-[22rem] ${round}`} label="Imagem de bastidores" />
      </Box></section>
      {visual.length > 0 && <section id="producoes" className="py-12"><Box>
        <h2 className={`${head} mb-6 text-2xl font-bold`}>Produções em destaque</h2>
        <div className="grid gap-5 @3xl:grid-cols-3">{[first, ...rest].slice(0, 3).map((w) => (
          <WorkTile key={w.id} w={w} round={round} ratio="aspect-[4/3]">
            <span className="mt-3 block"><span className="block font-semibold">{w.title}</span>
              <span className="block text-xs opacity-60">{[w.category, w.year].filter(Boolean).join(" · ")}</span>
              {(w.role || w.contribution) && <span className="mt-1 block text-xs">{[w.role, w.contribution].filter(Boolean).join(" — ")}</span>}</span>
          </WorkTile>))}</div>
      </Box></section>}
      <section id="estudio" className="bg-[#212120] py-14 text-white"><Box className="grid items-center gap-10 @3xl:grid-cols-2">
        <Cover src={rest[0]?.cover ?? pr.photo} className={`aspect-video ${round}`} label="Equipe do estúdio" />
        <div>
          <h2 className={`${head} text-3xl font-bold`}>O estúdio</h2>
          <p className="mt-4 text-white/75">{pr.bio}</p>
          {pr.pillars.length > 0 && <ul className="mt-6 grid gap-3 @3xl:grid-cols-3">{pr.pillars.map((x) => <li key={x.title} className="border-t border-white/20 pt-3 text-sm"><b>{x.title}</b><br /><span className="text-white/60">{x.text}</span></li>)}</ul>}
          {team.length > 0 && <ul className="mt-6 flex -space-x-3" aria-label="Equipe">{team.map((m) => (
            <li key={m.id} title={`${m.name} — ${m.role}`}>{m.photo ? <Cover src={m.photo} className="h-12 w-12 rounded-full border-2 border-[#212120]" label={m.name} /> : <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#212120] bg-[var(--accent)] text-sm font-bold text-[var(--on-accent)]">{m.name[0]}</span>}</li>))}</ul>}
        </div>
      </Box></section>
      {behind.length > 1 && <section id="bastidores" className="py-12"><Box>
        <h2 className={`${head} mb-5 text-xl font-bold`}>Bastidores</h2>
        <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">{behind.map((w) => <Cover key={w.id} src={w.cover} className={`aspect-[4/3] ${round}`} />)}</div>
      </Box></section>}
      <Extras />
      <footer id="contato" className="border-t border-black/10 bg-[#ddd5cb] py-10"><Box className="flex flex-col gap-5 @3xl:flex-row @3xl:items-center @3xl:justify-between">
        <div><p className={`${head} text-2xl font-bold`}>Vamos produzir juntos?</p><p className="text-sm opacity-70">Conte sua ideia e receba uma proposta.</p></div>
        <div className="flex items-center gap-6"><ContactButton className={`${round} bg-[#212120] text-white`}>Entrar em contato <ArrowRight size={14} /></ContactButton><Socials /></div>
      </Box></footer>
    </Page>
  );
}

/* 04 · Designer gráfico — grade suíça, peça tipográfica gigante, processo numerado e bloco cobalto. */
export function DesignerGrafico() {
  const { pr, head, round, visual } = usePage();
  const year = new Date().getFullYear().toString().slice(2);
  const mark = pr.name.replace(/[^A-Za-zÀ-ú ]/g, "").split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <Page bg="#fafaf8" ink="#161616">
      <header className="border-b border-black/10"><Box className="flex h-16 items-center justify-between">
        <span className={`${head} font-bold text-[var(--accent)]`}>{pr.name}</span>
        <Nav items={[["Projetos", "#projetos", visual.length > 0], ["Processo", "#processo", pr.pillars.length > 1], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-10 py-14 @3xl:grid-cols-2">
        <div>
          <h1 style={fit(pr.headline)} className={`${head} text-5xl font-extrabold leading-[0.98] tracking-tight text-[var(--accent)] @3xl:text-7xl`}>{pr.headline}</h1>
          <p className="mt-6 max-w-sm text-sm opacity-70">{firstSentence(pr.bio)}</p>
          <a href="#projetos" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)]">Ver projetos <ArrowRight size={14} /></a>
        </div>
        <div className="relative h-80 overflow-hidden bg-[#ecebe6] @3xl:h-[26rem]" aria-hidden>
          <div className={`${head} absolute -right-4 top-6 rotate-[-8deg] bg-white px-8 py-6 text-[9rem] font-black leading-[0.8] text-[var(--accent)] shadow-2xl`}>{mark}<br />{year}</div>
        </div>
      </Box></section>
      {visual.length > 0 && <section id="projetos" className="border-t border-black/10 py-12"><Box>
        <h2 className="mb-6 text-sm font-bold uppercase tracking-[0.2em]">Projetos selecionados</h2>
        <div className="grid gap-6 @3xl:grid-cols-3">{visual.slice(0, 3).map((w) => <WorkTile key={w.id} w={w} round={round} ratio="aspect-[4/3]" meta={w.category} />)}</div>
      </Box></section>}
      {pr.pillars.length > 1 && <section id="processo" className="border-t border-black/10 py-12"><Box>
        <h2 className="mb-6 text-sm font-bold uppercase tracking-[0.2em]">Processo de trabalho</h2>
        <ol className="grid gap-6 @3xl:grid-cols-4">{pr.pillars.map((x, i) => (
          <li key={x.title}><span className={`${head} text-3xl font-bold text-[var(--accent)]`}>{String(i + 1).padStart(2, "0")}</span>
            <p className="mt-2 font-bold">{x.title}</p><p className="mt-1 text-sm opacity-70">{x.text}</p></li>))}</ol>
      </Box></section>}
      <Extras />
      <footer id="contato" className="grid @3xl:grid-cols-2">
        <Cover src={visual[1]?.cover ?? visual[0]?.cover} className="min-h-56" />
        <div className="flex flex-col justify-center gap-5 bg-[var(--accent)] p-10 text-[var(--on-accent)]">
          <p className={`${head} text-3xl font-bold leading-tight`}>Vamos pensar seu próximo projeto?</p>
          <div className="flex items-center gap-6"><ContactButton className="border border-current">Envie uma mensagem <ArrowUpRight size={16} /></ContactButton><Socials /></div>
        </div>
      </footer>
    </Page>
  );
}

/* 05 · Motion design — ameixa, forma 3D, reel, projetos em movimento, serviços e faixa lima. */
export function MotionDesign() {
  const { p, pr, head, round, videos, visual, lead, openWork } = usePage();
  const reel = lead(videos);
  const rest = visual.filter((w) => w.id !== reel?.id);
  return (
    <Page bg="#20102c" ink="#ffffff">
      <header><Box className="flex h-16 items-center justify-between">
        <span className={`${head} flex items-center gap-2 font-bold text-[var(--accent)]`}><Cube size={18} />{pr.name}</span>
        <Nav items={[["Projetos", "#projetos", rest.length > 0], ["Serviços", "#servicos", p.services.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-8 py-12 @3xl:grid-cols-2">
        <div>
          <h1 style={fit(pr.headline)} className={`${head} text-5xl font-bold leading-[1.02] @3xl:text-6xl`}>{pr.headline}</h1>
          <p className="mt-5 max-w-md text-white/70">{firstSentence(pr.bio)}</p>
          {reel && <a href="#reel" className={`${round} mt-8 inline-flex items-center gap-2 bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--on-accent)]`}>Ver motion reel <Play size={14} fill="currentColor" /></a>}
        </div>
        <div className="relative h-80" aria-hidden>
          <div className="absolute right-10 top-4 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,#f0abfc,#7c3aed_45%,#1e1b4b)] shadow-[0_0_80px_#7c3aed]" />
          <div className="absolute bottom-6 left-10 h-40 w-40 rotate-12 rounded-[2.5rem] bg-[linear-gradient(135deg,#22d3ee,#6366f1)] opacity-90" />
          <div className="absolute right-0 bottom-0 h-24 w-24 rounded-full bg-[var(--accent)] opacity-80 blur-[1px]" />
        </div>
      </Box></section>
      {reel && <section id="reel"><Box>
        <button onClick={() => openWork(reel.id)} className={`group relative block w-full overflow-hidden ${round}`}>
          <Cover src={reel.cover} className="aspect-[21/8]" />
          <PlayDot size={64} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          <span className="absolute bottom-4 left-5 text-left font-semibold">{reel.title}<span className="block text-xs font-normal text-white/70">{reel.description}</span></span>
        </button>
      </Box></section>}
      {rest.length > 0 && <section id="projetos" className="py-14"><Box>
        <h2 className={`${head} mb-6 text-2xl font-bold`}>Projetos em movimento</h2>
        <div className="grid gap-5 @3xl:grid-cols-3">{rest.slice(0, 3).map((w) => <WorkTile key={w.id} w={w} round={round} meta={[w.category, w.client].filter(Boolean).join(" · ")} />)}</div>
      </Box></section>}
      {p.services.length > 0 && <section id="servicos" className="border-t border-white/10 py-10"><Box className="grid gap-6 @3xl:grid-cols-4">
        {p.services.map((s, i) => { const Icon = [Cube, Sparkles, Play, Clapperboard][i % 4]; return <div key={s.id} className="text-center text-sm"><Icon size={22} className="mx-auto text-[var(--accent)]" /><p className="mt-2 font-semibold">{s.title}</p></div>; })}
      </Box></section>}
      <Extras />
      <footer id="contato" className="bg-[var(--accent)] py-8 text-[var(--on-accent)]"><Box className="flex flex-col gap-4 @3xl:flex-row @3xl:items-center @3xl:justify-between">
        <p className={`${head} text-2xl font-bold`}>Vamos animar seu projeto?</p>
        <div className="flex items-center gap-6"><ContactButton className={`${round} border border-current`}>Entrar em contato <ArrowRight size={14} /></ContactButton><Socials /></div>
      </Box></footer>
    </Page>
  );
}

/* 06 · Fotografia — creme e serifada, retrato grande, séries, sobre com foto horizontal. */
export function Fotografia() {
  const { pr, head, round, visual } = usePage();
  return (
    <Page bg="#f4ebdd" ink="#372b21">
      <header className="border-b border-black/10"><Box className="flex h-16 items-center justify-between">
        <span className="leading-none"><span className="block font-serif text-xl">{pr.name}</span><span className="text-[10px] uppercase tracking-[0.3em] opacity-60">{roleText(pr, "short")}</span></span>
        <Nav items={[["Vitrine", "#series", visual.length > 0], ["Sobre", "#sobre", true], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-10 py-12 @3xl:grid-cols-[1fr_1.2fr]">
        <div>
          <h1 style={fit(pr.headline)} className={`${head} text-5xl leading-[1.05] @3xl:text-6xl`}>{pr.headline}</h1>
          <p className="mt-5 max-w-sm opacity-70">{firstSentence(pr.bio)}</p>
          <a href="#series" className={`${round} mt-8 inline-flex items-center gap-2 bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--on-accent)]`}>Ver site <ArrowRight size={14} /></a>
        </div>
        {pr.photo ? <Portrait className={`aspect-[4/3] ${round}`} /> : <Cover src={visual[0]?.cover} className={`aspect-[4/3] ${round}`} />}
      </Box></section>
      {visual.length > 0 && <section id="series" className="py-12"><Box>
        <h2 className={`${head} mb-6 text-3xl`}>Séries em destaque</h2>
        <div className="grid gap-6 @3xl:grid-cols-3">{visual.slice(0, 3).map((w) => <WorkTile key={w.id} w={w} round={round} ratio="aspect-[4/5]" meta={w.category} />)}</div>
      </Box></section>}
      <section id="sobre" className="py-12"><Box className="grid items-center gap-10 @3xl:grid-cols-2">
        <Cover src={visual[2]?.cover ?? visual[0]?.cover} className={`aspect-[16/9] ${round}`} />
        <div><h2 className={`${head} text-3xl`}>Sobre</h2><p className="mt-4 leading-relaxed opacity-80">{pr.bio}</p></div>
      </Box></section>
      <Extras />
      <footer id="contato" className="border-t border-black/10 bg-[#ede1cf] py-10"><Box className="flex flex-col gap-5 @3xl:flex-row @3xl:items-center @3xl:justify-between">
        <p className={`${head} text-2xl`}>Vamos fotografar seu próximo projeto?</p>
        <div className="flex items-center gap-6"><ContactButton className={`${round} bg-[#372b21] text-[#f4ebdd]`}>Enviar mensagem</ContactButton><Socials /></div>
      </Box></footer>
    </Page>
  );
}

/* 07 · Jornalismo — masthead marinho, manchete, reportagem em destaque e lista de publicações. */
export function Jornalismo() {
  const { pr, round, articles, lead, openWork } = usePage();
  const top = lead(articles);
  const others = articles.filter((w) => w.id !== top?.id);
  return (
    <Page bg="#f5f2ea" ink="#172337">
      <header className="bg-[#172337] text-white"><Box className="flex h-20 items-center justify-between">
        <span className="leading-none"><span className="block font-serif text-2xl">{pr.name}</span><span className="text-[10px] uppercase tracking-[0.3em] text-white/60">{roleText(pr, "short")}</span></span>
        <Nav items={[["Reportagens", "#reportagens", articles.length > 0], ["Sobre", "#inicio", true], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio" className="border-b border-[#172337]/15"><Box className="grid items-center gap-8 py-12 @3xl:grid-cols-[1.4fr_1fr]">
        <div><h1 style={fit(pr.headline)} className="font-serif text-4xl leading-tight @3xl:text-6xl">{pr.headline}</h1><p className="mt-5 max-w-md opacity-75">{firstSentence(pr.bio)}</p></div>
        <Portrait className={`aspect-[4/3] ${round}`} />
      </Box></section>
      {top && <section id="reportagens" className="py-10"><Box>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em]">Reportagem em destaque</h2>
        <button onClick={() => openWork(top.id)} className="group grid w-full gap-6 text-left @3xl:grid-cols-[1.3fr_1fr]">
          <Cover src={top.cover} className={`aspect-video ${round}`} />
          <span className="self-center"><span className="font-serif text-3xl leading-tight group-hover:underline">{top.title}</span>
            <span className="mt-3 block text-sm opacity-75">{top.description}</span>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">Ler reportagem <ArrowRight size={14} /></span></span>
        </button>
      </Box></section>}
      {others.length > 0 && <section id="mais-reportagens" className="pb-12"><Box>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.2em]">Outras publicações</h2>
        <ul className="divide-y divide-[#172337]/15 border-y border-[#172337]/15">{others.map((w) => (
          <li key={w.id}><button onClick={() => openWork(w.id)} className="group grid w-full grid-cols-[5rem_1fr_auto] items-center gap-4 py-4 text-left">
            <Cover src={w.cover} className={`aspect-[4/3] ${round}`} />
            <span><span className="block text-xs font-bold uppercase tracking-wide opacity-60">{[w.outlet || w.client, w.year].filter(Boolean).join(" · ")}</span><span className="font-serif text-lg group-hover:underline">{w.title}</span></span>
            <ArrowRight size={18} />
          </button></li>))}</ul>
      </Box></section>}
      <Extras />
      <footer id="contato" className="bg-[#172337] py-8 text-white"><Box className="flex flex-col gap-4 @3xl:flex-row @3xl:items-center @3xl:justify-between">
        <div><p className="font-serif text-2xl">Entre em contato</p><p className="text-sm text-white/60">Pautas, entrevistas e colaborações.</p></div>
        <div className="flex items-center gap-6"><ContactButton className={`${round} bg-white text-[#172337]`}>Enviar mensagem <ArrowRight size={14} /></ContactButton><Socials /></div>
      </Box></footer>
    </Page>
  );
}

/* 08 · Social media — lilás e laranja, celular inclinado, cases e resultados em números. */
export function SocialMedia() {
  const { pr, head, round, visual, lead } = usePage();
  const hero = lead(visual);
  return (
    <Page bg="#eaddfc" ink="#2c1553">
      <header><Box className="flex h-16 items-center justify-between">
        <span className={`${head} flex items-center gap-2 font-bold`}><span className="h-5 w-5 rounded-full bg-[var(--accent)]" />{pr.name}</span>
        <Nav items={[["Cases", "#cases", visual.length > 0], ["Resultados", "#resultados", pr.stats.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio" className="overflow-hidden"><Box className="grid items-center gap-8 py-10 @3xl:grid-cols-2">
        <div>
          <h1 style={fit(pr.headline)} className={`${head} text-5xl font-bold leading-[1.02] text-[var(--accent)] @3xl:text-6xl`}>{pr.headline}</h1>
          <p className="mt-5 max-w-md opacity-75">{firstSentence(pr.bio)}</p>
          <a href="#cases" className={`${round} mt-7 inline-flex items-center gap-2 bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--on-accent)]`}>Ver cases <ArrowRight size={14} /></a>
        </div>
        <div className="relative h-96" aria-hidden>
          <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-[#ff760d]" />
          <div className="absolute bottom-0 right-40 h-28 w-28 rounded-full bg-[#ff760d]/60" />
          <div className="absolute left-1/2 top-2 w-48 -translate-x-1/2 rotate-[14deg] rounded-[2.2rem] border-[7px] border-[#1d1033] bg-[#1d1033] shadow-2xl">
            <Cover src={hero?.cover} className="aspect-[9/19] rounded-[1.7rem]" />
          </div>
        </div>
      </Box></section>
      {visual.length > 0 && <section id="cases" className="bg-white/60 py-14"><Box>
        <h2 className={`${head} mb-6 text-2xl font-bold`}>Cases e campanhas</h2>
        <div className="grid gap-5 @3xl:grid-cols-3">{visual.slice(0, 3).map((w) => <WorkTile key={w.id} w={w} round={round} ratio="aspect-[4/3]" meta={[w.client, w.category].filter(Boolean).join(" · ")} />)}</div>
      </Box></section>}
      {pr.stats.length > 0 && <section id="resultados" className="py-12"><Box>
        <h2 className={`${head} mb-6 text-2xl font-bold`}>Resultados que importam</h2>
        <div className="grid gap-6 @3xl:grid-cols-3">{pr.stats.slice(0, 3).map((s) => <div key={s.label}><p className={`${head} text-5xl font-bold text-[#ff760d]`}>{s.value}</p><p className="mt-1 text-sm opacity-75">{s.label}</p></div>)}</div>
      </Box></section>}
      <Extras />
      <footer id="contato" className="relative overflow-hidden bg-[#dccaf8] py-10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#ff760d]" aria-hidden />
        <Box className="relative flex flex-col gap-4 @3xl:flex-row @3xl:items-center @3xl:justify-between">
          <div><p className={`${head} text-2xl font-bold`}>Vamos planejar sua presença digital?</p><p className="text-sm opacity-70">Fale com a gente e receba uma proposta.</p></div>
          <div className="flex items-center gap-6 @3xl:mr-32"><ContactButton className={`${round} bg-[var(--accent)] text-[var(--on-accent)]`}>Entrar em contato <ArrowRight size={14} /></ContactButton><Socials /></div>
        </Box>
      </footer>
    </Page>
  );
}

/* 09 · Assessoria de imprensa — institucional, foto com degradê, clientes e clippings. */
export function AssessoriaImprensa() {
  const { p, pr, round, articles, visual, openWork } = usePage();
  const heroImage = pr.photo ?? (articles[0] ?? visual[0])?.cover;
  return (
    <Page bg="#eaf1f5" ink="#13263c">
      <header className="bg-white/70"><Box className="flex h-16 items-center justify-between">
        <span className="leading-none"><span className="block font-serif text-xl font-semibold">{pr.name}</span><span className="text-[10px] uppercase tracking-[0.25em] opacity-60">{roleText(pr, "short")}</span></span>
        <Nav items={[["Clientes", "#clientes", p.clients.length > 0], ["Clippings", "#clippings", articles.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio" className="relative overflow-hidden">
        <Cover src={heroImage} className="absolute inset-y-0 right-0 hidden w-1/2 @3xl:block"><div className="absolute inset-0 bg-gradient-to-r from-[#eaf1f5] to-transparent" /></Cover>
        <Box className="relative py-16"><div className="max-w-lg">
          <h1 style={fit(pr.headline)} className="font-serif text-4xl font-semibold leading-tight @3xl:text-5xl">{pr.headline}</h1>
          <p className="mt-5 opacity-75">{firstSentence(pr.bio)}</p>
          <a href="#clippings" className={`${round} mt-7 inline-flex items-center gap-2 bg-[#13263c] px-5 py-3 text-sm font-semibold text-white`}>Conheça os cases <ArrowRight size={14} /></a>
        </div></Box>
      </section>
      {p.clients.length > 0 && <section id="clientes" className="bg-white py-8"><Box>
        <h2 className="mb-4 text-sm font-bold">Clientes</h2>
        <div className="flex flex-wrap items-center gap-x-12 gap-y-3">{p.clients.map((c) => <span key={c} className="font-serif text-lg font-semibold opacity-70">{c}</span>)}</div>
      </Box></section>}
      {articles.length > 0 && <section id="clippings" className="py-12"><Box>
        <h2 className="mb-4 text-sm font-bold">Clippings recentes</h2>
        <ul className="space-y-3">{articles.map((w) => (
          <li key={w.id}><button onClick={() => openWork(w.id)} className={`group grid w-full grid-cols-[5.5rem_1fr_auto] items-center gap-4 bg-white p-3 text-left ${round}`}>
            <Cover src={w.cover} className={`aspect-[4/3] ${round}`} />
            <span><span className="block text-xs font-bold uppercase tracking-wide text-[var(--accent)]">{[w.outlet || w.client, w.year].filter(Boolean).join(" · ")}</span>
              <span className="font-semibold group-hover:underline">{w.title}</span></span>
            <ArrowRight size={18} />
          </button></li>))}</ul>
      </Box></section>}
      <Extras />
      <footer id="contato" className="bg-[#d5e3ec] py-10"><Box className="flex flex-col gap-4 @3xl:flex-row @3xl:items-center @3xl:justify-between">
        <div><p className="font-serif text-2xl font-semibold">Vamos falar sobre sua pauta?</p><p className="text-sm opacity-70">Conte seu projeto e receba uma proposta de assessoria.</p></div>
        <div className="flex items-center gap-6"><ContactButton className={`${round} bg-[#13263c] text-white`}>Entrar em contato <ArrowRight size={14} /></ContactButton><Socials /></div>
      </Box></footer>
    </Page>
  );
}

function DemoRow({ w, playing, onToggle, head }: { w: Work; playing: boolean; onToggle: () => void; head: string }) {
  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3">
      <button onClick={onToggle} aria-label={`${playing ? "Pausar" : "Tocar"} ${w.title}`} className="grid h-10 w-10 place-items-center rounded-full bg-[#102820] text-[var(--accent)]">
        {playing ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
      </button>
      <span className="min-w-0"><span className={`${head} block truncate font-semibold`}>{w.title}</span>
        <span className="mt-1.5 flex h-5 items-end gap-[3px]" aria-hidden>{Array.from({ length: 40 }).map((_, j) => (
          <span key={j} className={`w-1 rounded-sm ${playing && j < 16 ? "bg-[#102820]" : "bg-[#102820]/30"}`} style={{ height: `${25 + ((j * 37 + w.title.length * 13) % 75)}%` }} />))}</span></span>
      <span className="text-sm opacity-70">{w.category}</span>
    </li>
  );
}

/* 10 · Locução e áudio — verde-floresta, demos que tocam, principais produções e rodapé lima. */
export function LocucaoAudio() {
  const { pr, head, round, audios, visual, openWork } = usePage();
  const [playing, setPlaying] = useState<string | null>(null);
  const player = useRef<HTMLAudioElement | null>(null);
  const toggle = (w: Work) => {
    player.current?.pause();
    if (playing === w.id) { setPlaying(null); return; }
    if (w.mediaUrl && /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(w.mediaUrl)) { player.current = new Audio(w.mediaUrl); void player.current.play().catch(() => {}); }
    else if (w.mediaUrl) { openWork(w.id); return; }
    setPlaying(w.id);
  };
  return (
    <Page bg="#102820" ink="#ffffff">
      <header><Box className="flex h-16 items-center justify-between">
        <span className={`${head} flex items-center gap-2 font-bold`}><AudioLines size={20} className="text-[var(--accent)]" />{pr.name}</span>
        <Nav items={[["Demos", "#demos", audios.length > 0], ["Produções", "#producoes", visual.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-8 py-10 @3xl:grid-cols-2">
        <div>
          <h1 style={fit(pr.headline)} className={`${head} text-5xl font-bold leading-[1.02] @3xl:text-6xl`}>{pr.headline}</h1>
          <p className="mt-5 max-w-md text-white/70">{firstSentence(pr.bio)}</p>
          {audios.length > 0 && <a href="#demos" className={`${round} mt-7 inline-flex items-center gap-2 bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--on-accent)]`}>Ouça as demos <Play size={14} fill="currentColor" /></a>}
        </div>
        <div className="relative h-80"><Portrait className={`absolute inset-0 h-full w-full ${round}`} /><div className="absolute inset-0 bg-gradient-to-r from-[#102820] to-transparent" /></div>
      </Box></section>
      {audios.length > 0 && <section id="demos" className="bg-[#ddeed8] py-12 text-[#102820]"><Box>
        <h2 className={`${head} mb-3 text-2xl font-bold`}>Demos de locução</h2>
        <ul className="divide-y divide-[#102820]/15">{audios.map((w) => <DemoRow key={w.id} w={w} head={head} playing={playing === w.id} onToggle={() => toggle(w)} />)}</ul>
      </Box></section>}
      {visual.length > 0 && <section id="producoes" className="py-12"><Box>
        <h2 className={`${head} mb-6 text-2xl font-bold`}>Principais produções</h2>
        <div className="grid gap-5 @3xl:grid-cols-3">{visual.slice(0, 3).map((w) => <WorkTile key={w.id} w={w} round={round} meta={[w.category, w.client].filter(Boolean).join(" · ")} />)}</div>
      </Box></section>}
      <Extras />
      <footer id="contato" className="border-t border-white/10 py-10"><Box className="flex flex-col gap-4 @3xl:flex-row @3xl:items-center @3xl:justify-between">
        <div><p className={`${head} text-2xl font-bold`}>Vamos dar voz ao seu projeto?</p><p className="text-sm text-white/60">Solicite um orçamento ou envie seu roteiro.</p></div>
        <div className="flex items-center gap-6"><ContactButton className={`${round} bg-[var(--accent)] text-[var(--on-accent)]`}>Entrar em contato <ArrowRight size={14} /></ContactButton><Socials /></div>
      </Box></footer>
    </Page>
  );
}
