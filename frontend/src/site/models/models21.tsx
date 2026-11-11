import { ArrowRight, AudioLines, Braces, Captions, Clapperboard, FileText, Image as ImageIcon, Layers, Scissors } from "lucide-react";
import { useState } from "react";
import { Extras } from "./Extras";
import { PhotoImg } from "./PhotoLayer";
import { Box, ContactLine, Cover, firstSentence, fit, Nav, Page, PlayDot, Portrait, Socials, usePage, WorkTile } from "./shared";

const MATERIAL_ICONS = [FileText, Captions, AudioLines, Layers];
const DELIVERY_ICONS = [Scissors, ImageIcon, Clapperboard, Braces];

function Footer({ className, label = "Contato" }: { className: string; label?: string }) {
  return (
    <><Extras /><footer id="contato" className={`py-6 ${className}`}><Box className="flex flex-wrap items-center justify-between gap-4 text-sm">
      <b>{label}</b><ContactLine /><Socials />
    </Box></footer></>
  );
}

/** Comparador antes/depois: o controle desliza com mouse, toque ou setas do teclado. */
export function BeforeAfter({ before, after, title }: { before: string; after: string; title: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative aspect-video overflow-hidden">
      <Cover src={after} className="absolute inset-0" label={`${title} — versão final`} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Cover src={before} className="absolute inset-0" label={`${title} — original`} />
      </div>
      <span className="pointer-events-none absolute inset-y-0 w-0.5 bg-white" style={{ left: `${pos}%` }} />
      <input type="range" min={0} max={100} value={pos} aria-label="Comparar original e versão final"
        onChange={(e) => setPos(Number(e.target.value))} className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
      <span className="absolute bottom-2 left-2 bg-black/60 px-2 text-xs text-white">Original</span>
      <span className="absolute bottom-2 right-2 bg-black/60 px-2 text-xs text-white">Final</span>
    </div>
  );
}

/* 21 · Colorista — retrato cinematográfico, comparador antes/depois e stills. */
export function Colorista() {
  const { pr, round, visual, videos, lead } = usePage();
  const pair = visual.find((w) => w.coverOriginal && w.coverOriginal !== w.cover);
  const reel = lead(videos);
  return (
    <Page bg="#171716" ink="#ffffff">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="font-bold text-[var(--accent)]">{pr.name}</span>
        <Nav items={[["Antes e depois", "#cor", !!pair], ["Projetos", "#projetos", visual.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio" className="relative overflow-hidden"><Box className="grid min-h-[24rem] items-center gap-8 @3xl:grid-cols-2">
        <div className="relative z-10">
          <h1 style={fit(pr.headline)} className="font-serif text-5xl leading-[1.05]">{pr.headline}</h1>
          <p className="mt-4 max-w-sm text-sm text-white/70">{firstSentence(pr.bio)}</p>
          {reel && <a href="#projetos" className="mt-6 inline-flex items-center gap-3 rounded-full border border-[var(--accent)] px-4 py-2 text-sm"><PlayDot size={26} />Ver showreel</a>}
        </div>
        <div className="relative h-80"><Portrait className="absolute inset-0" /><div className="absolute inset-0 bg-gradient-to-r from-[#171716] to-transparent" /></div>
      </Box></section>
      {pair && <section id="cor" className="py-10"><Box className="grid items-center gap-8 @3xl:grid-cols-[1fr_2fr]">
        <div><h2 className="text-2xl font-bold">Antes e depois</h2><p className="mt-3 text-sm text-white/70">Arraste para comparar o plano original e a versão final de <b>{pair.title}</b>.</p></div>
        <div className={`overflow-hidden ${round}`}><BeforeAfter before={pair.coverOriginal!} after={pair.cover} title={pair.title} /></div>
      </Box></section>}
      {visual.length > 0 && <section id="projetos" className="py-10"><Box>
        <h2 className="mb-5 text-xl font-bold">Projetos em destaque</h2>
        <div className="grid gap-5 @3xl:grid-cols-3">{visual.slice(0, 3).map((w) => <WorkTile key={w.id} w={w} round={round} meta={[w.category, w.client].filter(Boolean).join(" · ")} />)}</div>
      </Box></section>}
      <Footer className="bg-[var(--accent)] text-[var(--on-accent)]" />
    </Page>
  );
}

/* 22 · Efeitos visuais — cena de ficção, breakdown Plate → Máscaras → Final e shots. */
export function EfeitosVisuais() {
  const { pr, round, visual, lead } = usePage();
  const hero = lead(visual);
  const shot = visual.find((w) => (w.gallery?.length ?? 0) > 1);
  return (
    <Page bg="#111225" ink="#ffffff">
      <header className="absolute inset-x-0 top-0 z-10"><Box className="flex h-14 items-center justify-between">
        <span className="font-display text-lg font-bold">{pr.name}</span>
        <Nav items={[["Breakdown", "#breakdown", !!shot], ["Shots", "#shots", visual.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Cover src={hero?.cover} className="min-h-[28rem]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#111225] via-[#111225]/70 to-transparent" />
        <Box className="relative flex min-h-[28rem] flex-col justify-center pt-14">
          <h1 style={fit(pr.headline)} className="max-w-lg font-serif text-5xl leading-[1.05]">{pr.headline}</h1>
          <p className="mt-4 max-w-sm text-sm text-white/70">{firstSentence(pr.bio)}</p>
          <a href="#shots" className="mt-6 inline-flex w-fit items-center gap-3 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)]">Ver seleção de VFX</a>
        </Box>
      </Cover></section>
      {shot && <section id="breakdown" className="py-10"><Box>
        <h2 className="mb-5 text-xl font-bold">Breakdown de produção · {shot.title}</h2>
        <ol className="grid items-center gap-3 @3xl:grid-cols-[1fr_auto_1fr_auto_1fr]">{shot.gallery!.slice(0, 3).flatMap((src, i, all) => [
          <li key={src} className="list-none"><PhotoImg src={src} alt={`${shot.title} — etapa ${i + 1}`} className={`aspect-video w-full object-cover ${round}`} /><span className="mt-1 block text-xs text-white/60">Etapa {i + 1}</span></li>,
          ...(i < all.length - 1 ? [<ArrowRight key={`a${i}`} aria-hidden className="mx-auto hidden text-[var(--accent)] @3xl:block" />] : []),
        ])}</ol>
      </Box></section>}
      {visual.length > 0 && <section id="shots" className="py-10"><Box>
        <h2 className="mb-5 text-xl font-bold">Shots em destaque</h2>
        <div className="grid gap-5 @3xl:grid-cols-3">{visual.slice(0, 3).map((w) => <WorkTile key={w.id} w={w} round={round} meta={[w.category, w.client].filter(Boolean).join(" · ")} />)}</div>
      </Box></section>}
      <Footer className="bg-[var(--accent)] text-[var(--on-accent)]" />
    </Page>
  );
}

/* 23 · Roteiro audiovisual — páginas de roteiro, lista com logline/gênero/formato e trecho diagramado. */
export function RoteiroAudiovisual() {
  const { pr, round, scripts, visual, lead, openWork } = usePage();
  const list = scripts.length ? scripts : visual;
  const excerpt = lead(scripts);
  return (
    <Page bg="#f4eee2" ink="#181715">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="font-serif text-xl font-bold">{pr.name}</span>
        <Nav items={[["Projetos", "#projetos", list.length > 0], ["Trecho", "#trecho", !!excerpt], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-8 py-10 @3xl:grid-cols-2">
        <div><h1 style={fit(pr.headline)} className="font-serif text-5xl leading-[1.05]">{pr.headline}</h1><p className="mt-4 max-w-sm opacity-70">{firstSentence(pr.bio)}</p></div>
        <div className="relative h-72" aria-hidden>
          {[0, 1, 2].map((i) => <div key={i} className="absolute h-64 w-48 bg-white p-4 font-mono text-[9px] leading-relaxed shadow-lg" style={{ left: `${20 + i * 18}%`, top: `${i * 6}%`, transform: `rotate(${(i - 1) * 5}deg)` }}>
            <p className="text-center font-bold">{(excerpt?.title ?? pr.name).toUpperCase()}</p><p className="mt-3">INT. CENA {i + 1} — NOITE</p><p className="mt-2 opacity-60">{firstSentence(pr.bio)}</p>
          </div>)}
        </div>
      </Box></section>
      {list.length > 0 && <section id="projetos" className="py-8"><Box>
        <h2 className="mb-3 font-serif text-2xl">Projetos</h2>
        <ul className="divide-y divide-black/10 border-y border-black/10">{list.map((w) => (
          <li key={w.id}><button onClick={() => openWork(w.id)} className="group grid w-full items-center gap-4 py-3 text-left @3xl:grid-cols-[6rem_2fr_1fr_1fr]">
            <Cover src={w.cover} className={`aspect-video ${round}`} />
            <span><b className="group-hover:underline">{w.title}</b><span className="block text-sm opacity-70">{firstSentence(w.description)}</span></span>
            <span className="text-sm"><span className="block text-xs opacity-50">Gênero</span>{w.category}</span>
            <span className="text-sm"><span className="block text-xs opacity-50">Formato</span>{w.client}</span>
          </button></li>))}</ul>
      </Box></section>}
      {excerpt && <section id="trecho" className="py-10"><Box className="grid gap-8 @3xl:grid-cols-[1fr_1.5fr]">
        <div><h2 className="font-serif text-2xl">Trecho de roteiro</h2><p className="mt-2 text-sm opacity-70">{excerpt.title}</p></div>
        <pre className="whitespace-pre-wrap bg-white p-8 font-mono text-sm leading-relaxed shadow">{excerpt.description.replace(/\. /g, ".\n\n")}</pre>
      </Box></section>}
      <Footer className="bg-[#181715] text-[#f4eee2]" />
    </Page>
  );
}

/* 24 · Ilustração editorial — ilustração grande no topo, grade assimétrica e capas de publicações. */
export function IlustracaoEditorial() {
  const { pr, round, images, visual, articles, lead } = usePage();
  const pieces = images.length ? images : visual;
  const [big, ...small] = pieces;
  return (
    <Page bg="#f8efe3" ink="#1b1b2e">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="font-bold"><span className="text-[var(--accent)]">{pr.name.split(" ")[0]}</span> {pr.name.split(" ").slice(1).join(" ")}</span>
        <Nav items={[["Vitrine", "#projetos", pieces.length > 0], ["Publicações", "#publicacoes", articles.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-8 py-8 @3xl:grid-cols-2">
        <div><h1 style={fit(pr.headline)} className="font-serif text-5xl leading-[1.05] text-[var(--accent)]">{pr.headline}</h1><p className="mt-4 max-w-sm opacity-70">{firstSentence(pr.bio)}</p></div>
        <Cover src={lead(pieces)?.cover ?? pr.photo} className={`aspect-[4/3] ${round}`} label="Ilustração em destaque" />
      </Box></section>
      {big && <section id="projetos" className="py-8"><Box>
        <h2 className="mb-4 font-serif text-2xl">Projetos em destaque</h2>
        <div className="grid gap-4 @3xl:grid-cols-[1.4fr_1fr]">
          <WorkTile w={big} round={round} ratio="aspect-[4/3]" meta={[big.category, big.client].filter(Boolean).join(" · ")} />
          {small.length > 0 && <div className="grid gap-4">{small.slice(0, 2).map((w) => <WorkTile key={w.id} w={w} round={round} ratio="aspect-[2/1]" meta={[w.category, w.client].filter(Boolean).join(" · ")} />)}</div>}
        </div>
      </Box></section>}
      {articles.length > 0 && <section id="publicacoes" className="py-8"><Box>
        <h2 className="mb-4 font-serif text-2xl">Publicações</h2>
        <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-4">{articles.map((w) => <WorkTile key={w.id} w={w} round={round} ratio="aspect-[3/4]" meta={[w.outlet || w.client, w.year].filter(Boolean).join(" · ")} />)}</div>
      </Box></section>}
      <Footer className="border-t border-black/10" />
    </Page>
  );
}

/* 25 · Fotojornalismo — foto P&B no topo, reportagens em linhas com data e créditos. */
export function Fotojornalismo() {
  const { pr, round, articles, visual, lead, openWork } = usePage();
  const list = articles.length ? articles : visual;
  const outlets = [...new Set(list.map((w) => w.outlet || w.client).filter(Boolean))];
  return (
    <Page bg="#f6f5f2" ink="#1d1d1d">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="font-bold">{pr.name.split(" ")[0]} <span className="text-[var(--accent)]">{pr.name.split(" ").slice(1).join(" ")}</span></span>
        <Nav items={[["Reportagens", "#reportagens", list.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Cover src={lead(list)?.cover ?? pr.photo} className="min-h-[24rem] grayscale">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
        <Box className="relative flex min-h-[24rem] flex-col justify-center text-white">
          <h1 style={fit(pr.headline)} className="max-w-md font-serif text-5xl leading-[1.05]">{pr.headline}</h1><p className="mt-3 max-w-sm text-sm text-white/75">{firstSentence(pr.bio)}</p>
        </Box>
      </Cover></section>
      {list.length > 0 && <section id="reportagens" className="py-10"><Box>
        <h2 className="mb-3 font-bold">Reportagens visuais</h2>
        <ul className="divide-y divide-black/10">{list.map((w) => (
          <li key={w.id}><button onClick={() => openWork(w.id)} className="group grid w-full items-center gap-4 py-3 text-left @3xl:grid-cols-[9rem_1fr_6rem]">
            <Cover src={w.cover} className={`aspect-video grayscale ${round}`} />
            <span><b className="group-hover:underline">{w.title}</b><span className="block text-sm opacity-70">{w.description}</span></span>
            <span className="text-right text-xs opacity-60">{w.year}</span>
          </button></li>))}</ul>
      </Box></section>}
      {outlets.length > 0 && <section id="veiculos" className="pb-10"><Box><div className="border-l-4 border-[var(--accent)] pl-4">
        <h2 className="font-bold">Créditos e veiculações</h2><p className="mt-1 text-sm opacity-75">Fotos publicadas em: {outlets.join(", ")}.</p>
      </div></Box></section>}
      <Footer className="bg-[var(--accent)] text-[var(--on-accent)]" />
    </Page>
  );
}

/* 26 · Design de informação — composição de dados, cards, dashboard em destaque e metodologia. */
export function DesignInformacao() {
  const { pr, round, visual, lead, openWork } = usePage();
  const dash = lead(visual);
  return (
    <Page bg="#f6f6fc" ink="#1b1a4b">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="font-bold text-[var(--accent)]">{pr.name}</span>
        <Nav items={[["Projetos", "#projetos", visual.length > 0], ["Método", "#metodo", pr.pillars.length > 1], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-8 py-8 @3xl:grid-cols-2">
        <div><h1 style={fit(pr.headline)} className="font-display text-5xl font-bold leading-[1.02]">{pr.headline}</h1><p className="mt-4 max-w-sm opacity-70">{firstSentence(pr.bio)}</p></div>
        <svg viewBox="0 0 300 200" className="w-full" aria-hidden>
          {Array.from({ length: 60 }).map((_, i) => <circle key={i} cx={20 + (i % 10) * 12} cy={30 + Math.floor(i / 10) * 12} r={4} fill="var(--accent)" opacity={0.25 + ((i * 7) % 10) / 14} />)}
          {[40, 70, 55, 95, 120].map((h, i) => <rect key={i} x={170 + i * 22} y={180 - h} width={14} height={h} fill="var(--accent)" opacity={0.5 + i / 10} />)}
          <circle cx={250} cy={45} r={30} fill="none" stroke="var(--accent)" strokeWidth={12} strokeDasharray="120 200" />
        </svg>
      </Box></section>
      {visual.length > 0 && <section id="projetos" className="py-8"><Box>
        <h2 className="mb-4 font-bold">Projetos em destaque</h2>
        <div className="grid gap-5 @3xl:grid-cols-3">{visual.slice(0, 3).map((w) => <WorkTile key={w.id} w={w} round={round} ratio="aspect-[4/3]" meta={[w.category, w.client].filter(Boolean).join(" · ")} />)}</div>
      </Box></section>}
      {dash && <section id="destaque" className="py-6"><Box>
        <button onClick={() => openWork(dash.id)} className={`grid w-full items-center gap-6 bg-white p-4 text-left shadow-sm @3xl:grid-cols-[1.4fr_1fr] ${round}`}>
          <Cover src={dash.cover} className={`aspect-[2.4/1] ${round}`} />
          <span><span className="text-xs font-bold uppercase tracking-wide text-[var(--accent)]">Dashboard</span><b className="block text-lg">{dash.title}</b><span className="text-sm opacity-70">{dash.description}</span></span>
        </button>
      </Box></section>}
      {pr.pillars.length > 1 && <section id="metodo" className="py-8"><Box>
        <h2 className="mb-4 font-bold">Metodologia</h2>
        <ol className="grid gap-4 @3xl:grid-cols-4">{pr.pillars.map((x, i) => (
          <li key={x.title} className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-[var(--accent)] text-sm font-bold text-[var(--accent)]">{i + 1}</span><span><b>{x.title}</b><span className="block text-xs opacity-70">{x.text}</span></span></li>))}</ol>
      </Box></section>}
      <Footer className="bg-[var(--accent)] text-[var(--on-accent)]" />
    </Page>
  );
}

/* 27 · Apresentação e mediação — palco vinho, highlight em vídeo, próximos encontros e eventos. */
export function ApresentacaoMediacao() {
  const { p, pr, round, videos, visual, lead, openWork } = usePage();
  const hl = lead(videos);
  const recent = visual.filter((w) => w.id !== hl?.id);
  return (
    <Page bg="#f6ede6" ink="#2a1018">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="font-serif text-lg font-bold text-[var(--accent)]">{pr.name}</span>
        <Nav items={[["Agenda", "#agenda", p.experience.length > 0], ["Eventos", "#eventos", recent.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio" className="bg-[var(--accent)] text-[var(--on-accent)]"><Box className="grid items-center gap-8 py-10 @3xl:grid-cols-2">
        <div><h1 style={fit(pr.headline)} className="font-serif text-5xl leading-[1.05]">{pr.headline}</h1><p className="mt-4 max-w-sm text-sm opacity-80">{firstSentence(pr.bio)}</p></div>
        <Portrait className={`aspect-[4/3] ${round}`} />
      </Box></section>
      {(hl || p.experience.length > 0) && <section id="agenda" className="py-10"><Box className={`grid gap-8 ${hl && p.experience.length ? "@3xl:grid-cols-[1.4fr_1fr]" : ""}`}>
        {hl && <div><h2 className="mb-3 font-serif text-2xl">Highlights</h2>
          <button onClick={() => openWork(hl.id)} className={`relative block w-full overflow-hidden ${round}`}><Cover src={hl.cover} className="aspect-video" /><PlayDot size={56} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" /><span className="absolute bottom-0 inset-x-0 bg-black/60 px-3 py-2 text-left text-sm text-white">{hl.title}</span></button></div>}
        {p.experience.length > 0 && <div id="agenda"><h2 className="mb-3 font-serif text-2xl">Próximos encontros</h2>
          <ul className="space-y-3">{p.experience.map((x) => (
            <li key={x.id} className="flex gap-4 border-b border-black/10 pb-3"><b className="w-14 shrink-0 font-serif text-lg leading-tight text-[var(--accent)]">{x.period}</b><span><b className="block text-sm">{x.title}</b><span className="text-xs opacity-60">{x.org}</span></span></li>))}</ul></div>}
      </Box></section>}
      {recent.length > 0 && <section id="eventos" className="py-8"><Box>
        <h2 className="mb-4 font-serif text-2xl">Eventos e conversas recentes</h2>
        <div className="grid gap-5 @3xl:grid-cols-3">{recent.slice(0, 3).map((w) => <WorkTile key={w.id} w={w} round={round} meta={[w.category, w.year].filter(Boolean).join(" · ")} />)}</div>
      </Box></section>}
      <Footer className="border-t border-black/10" />
    </Page>
  );
}

/* 28 · Comunicação pública — espaço urbano no topo, campanhas, materiais acessíveis e impacto. */
export function ComunicacaoPublica() {
  const { p, pr, round, visual, lead } = usePage();
  return (
    <Page bg="#f7f7f0" ink="#0f2a1d">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="font-bold text-[var(--accent)]">{pr.name}</span>
        <Nav items={[["Campanhas", "#campanhas", visual.length > 0], ["Materiais", "#materiais", p.services.length > 0], ["Impacto", "#impacto", pr.stats.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Cover src={lead(visual)?.cover ?? pr.photo} className="min-h-[22rem]">
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-transparent" />
        <Box className="relative flex min-h-[22rem] flex-col justify-center text-white"><h1 style={fit(pr.headline)} className="max-w-md font-serif text-5xl leading-[1.05]">{pr.headline}</h1><p className="mt-3 max-w-sm text-sm text-white/80">{firstSentence(pr.bio)}</p></Box>
      </Cover></section>
      {visual.length > 0 && <section id="campanhas" className="py-8"><Box>
        <h2 className="mb-4 font-bold">Campanhas e projetos</h2>
        <div className="grid gap-5 @3xl:grid-cols-3">{visual.slice(0, 3).map((w) => <WorkTile key={w.id} w={w} round={round} ratio="aspect-[16/10]" meta={[w.category, w.client].filter(Boolean).join(" · ")} />)}</div>
      </Box></section>}
      {p.services.length > 0 && <section id="materiais" className="py-8"><Box>
        <h2 className="mb-4 font-bold">Materiais acessíveis</h2>
        <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-4">{p.services.map((s, i) => { const Icon = MATERIAL_ICONS[i % 4]; return (
          <div key={s.id} className={`border border-black/10 bg-white p-4 text-center ${round}`}><Icon className="mx-auto text-[var(--accent)]" /><b className="mt-2 block text-sm">{s.title}</b><span className="text-xs opacity-60">{s.text}</span></div>); })}</div>
      </Box></section>}
      {pr.stats.length > 0 && <section id="impacto" className="py-8"><Box>
        <h2 className="mb-4 font-bold">Impacto público</h2>
        <div className={`grid gap-4 bg-[#e3f1df] p-6 @3xl:grid-cols-3 ${round}`}>{pr.stats.slice(0, 3).map((s) => <div key={s.label}><b className="block text-3xl text-[var(--accent)]">{s.value}</b><span className="text-sm opacity-70">{s.label}</span></div>)}</div>
      </Box></section>}
      <Footer className="bg-[var(--accent)] text-[var(--on-accent)]" />
    </Page>
  );
}

/* 29 · UX Writing — celular sobre formas menta, antes/depois do microtexto, projeto e processo. */
export function UxWriting() {
  const { pr, round, visual, lead, openWork } = usePage();
  const main = lead(visual);
  const swap = main?.contribution?.match(/Antes:\s*(.+?)\.\s*Depois:\s*(.+?)\.?$/);
  return (
    <Page bg="#f8f8f3" ink="#16221e">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="font-bold">{pr.name}</span>
        <Nav items={[["Antes e depois", "#antes-depois", !!swap], ["Projetos", "#projetos", visual.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-8 py-8 @3xl:grid-cols-2">
        <div><h1 style={fit(pr.headline)} className="font-serif text-5xl leading-[1.05]">{pr.headline}</h1><p className="mt-4 max-w-sm opacity-70">{firstSentence(pr.bio)}</p></div>
        <div className="relative h-80" aria-hidden>
          <div className="absolute right-6 top-6 h-64 w-64 rounded-full bg-[#cbeedc]" />
          <div className="absolute left-1/2 top-0 w-44 -translate-x-1/2 rounded-[2rem] border-[6px] border-[#16221e] bg-white p-3 shadow-xl">
            <p className="text-xs font-bold">Serviços</p>{["Agendar atendimento", "Acompanhar pedido", "Tirar dúvidas"].map((t) => <p key={t} className="mt-2 rounded-lg border px-2 py-1.5 text-[10px]">{t} ›</p>)}
          </div>
        </div>
      </Box></section>
      {swap && <section id="antes-depois" className="py-8"><Box>
        <h2 className="mb-4 font-serif text-2xl">Antes e depois: a força da linguagem</h2>
        <div className="grid items-center gap-4 @3xl:grid-cols-[1fr_auto_1fr]">
          <div className={`border border-black/10 bg-white p-5 ${round}`}><span className="text-xs font-bold uppercase opacity-50">Antes</span><p className="mt-2 text-lg">{swap[1]}</p></div>
          <ArrowRight className="mx-auto text-[var(--accent)]" aria-hidden />
          <div className={`border-2 border-[var(--accent)] bg-[#eaf8f0] p-5 ${round}`}><span className="text-xs font-bold uppercase text-[var(--accent)]">Depois</span><p className="mt-2 text-lg">{swap[2]}</p></div>
        </div>
      </Box></section>}
      {(main || pr.pillars.length > 1) && <section id="projetos" className="py-8"><Box className={`grid gap-8 ${pr.pillars.length > 1 ? "@3xl:grid-cols-[1.4fr_1fr]" : ""}`}>
        {main && <div><h2 className="mb-3 font-bold">Projeto em destaque</h2>
          <button onClick={() => openWork(main.id)} className={`grid w-full gap-4 bg-white p-4 text-left shadow-sm @3xl:grid-cols-[1fr_1.2fr] ${round}`}>
            <Cover src={main.cover} className={`aspect-[4/3] ${round}`} />
            <span><b className="block">{main.title}</b><span className="text-sm opacity-70">{main.description}</span>
              {!!main.deliverables?.length && <span className="mt-2 block text-xs">{main.deliverables.join(" · ")}</span>}</span>
          </button></div>}
        {pr.pillars.length > 1 && <div><h2 className="mb-3 font-bold">Processo</h2>
          <ol className="space-y-3">{pr.pillars.map((x, i) => <li key={x.title} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--on-accent)]">{i + 1}</span><span className="text-sm"><b>{x.title}</b> — {x.text}</span></li>)}</ol></div>}
      </Box></section>}
      <Footer className="bg-[#cbeedc]" />
    </Page>
  );
}

/* 30 · Produção para criadores — Shorts verticais × episódios horizontais e entregas. */
export function ProducaoCriadores() {
  const { p, pr, round, visual } = usePage();
  const shorts = visual.filter((w) => w.aspect === "9:16");
  const episodes = visual.filter((w) => w.aspect !== "9:16");
  return (
    <Page bg="#1a1122" ink="#ffffff">
      <header><Box className="flex h-14 items-center justify-between">
        <span className="font-bold"><span className="text-[var(--accent)]">{pr.name}</span></span>
        <Nav items={[["Formatos", "#formatos", visual.length > 0], ["Entregas", "#entregas", p.services.length > 0], ["Contato", "#contato", true]]} />
      </Box></header>
      <section id="inicio"><Box className="grid items-center gap-8 py-8 @3xl:grid-cols-2">
        <div><h1 style={fit(pr.headline)} className="font-serif text-5xl leading-[1.05]">{pr.headline}</h1><p className="mt-4 max-w-sm text-sm text-white/70">{firstSentence(pr.bio)}</p></div>
        <Portrait className={`aspect-[4/3] ${round}`} />
      </Box></section>
      {visual.length > 0 && <section id="formatos" className="py-8"><Box className={`grid gap-8 ${shorts.length && episodes.length ? "@3xl:grid-cols-[1fr_1.2fr]" : ""}`}>
        {shorts.length > 0 && <div><h2 className="mb-3 font-bold">Shorts e Reels (vertical)</h2>
          <div className="grid grid-cols-3 gap-3">{shorts.slice(0, 3).map((w) => <WorkTile key={w.id} w={w} round={round} ratio="aspect-[9/16]" meta={w.client} />)}</div></div>}
        {episodes.length > 0 && <div><h2 className="mb-3 font-bold">Episódios no YouTube (horizontal)</h2>
          <div className="space-y-3">{episodes.slice(0, 3).map((w) => (
            <WorkTile key={w.id} w={w} round={round} ratio="aspect-video w-40 shrink-0" className="flex gap-3">
              <span className="block"><b className="block text-sm">{w.title}</b><span className="text-xs opacity-60">{[w.client, w.description].filter(Boolean).join(" · ")}</span></span>
            </WorkTile>))}</div></div>}
      </Box></section>}
      {p.services.length > 0 && <section id="entregas" className="py-8"><Box>
        <h2 className="mb-4 font-bold">Entregas e ativos</h2>
        <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-4">{p.services.map((s, i) => { const Icon = DELIVERY_ICONS[i % 4]; return (
          <div key={s.id} className={`bg-white/5 p-4 text-center ${round}`}><Icon className="mx-auto text-[var(--accent)]" /><b className="mt-2 block text-sm">{s.title}</b><span className="text-xs opacity-60">{s.text}</span></div>); })}</div>
      </Box></section>}
      <Footer className="bg-[var(--accent)] text-[var(--on-accent)]" />
    </Page>
  );
}
