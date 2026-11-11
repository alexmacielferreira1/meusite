import { AudioLines, ChevronDown, Newspaper, Quote } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import type { Area, TimelineItem } from "../../types/portfolio";
import { BLOCKS, isHidden, showsGallery, type BlockId } from "./blocks";
import { Gallery } from "./Gallery";
import { EXTRA_ANCHORS } from "./navigation";
import { MODEL_BLOCKS } from "./modelBlocks";
import { Box, Eyebrow, summary, TeamStrip, usePage, WorkTile } from "./shared";

/** Linhas e fundos derivados da cor do texto do modelo: funcionam em páginas claras e escuras. */
const line: CSSProperties = { borderColor: "color-mix(in srgb, currentColor 14%, transparent)" };
const tint: CSSProperties = { backgroundColor: "color-mix(in srgb, currentColor 5%, transparent)" };


function Block({ id, title, children }: { id: BlockId; title: string; children: ReactNode }) {
  const { head } = usePage();
  return (
    <section id={EXTRA_ANCHORS[id]} data-block={id} className="border-t py-14" style={line}><Box>
      <Eyebrow className="text-[var(--accent)]">{BLOCKS.find((b) => b.id === id)!.label}</Eyebrow>
      <h2 className={`${head} mt-2 text-2xl font-bold @3xl:text-3xl`}>{title}</h2>
      <div className="mt-8">{children}</div>
    </Box></section>
  );
}

function Works() {
  const { visual, round } = usePage();
  const [all, setAll] = useState(false);
  return (
    <Block id="works" title="Destaques">
      <div className="grid gap-6 @3xl:grid-cols-3">{(all ? visual : visual.slice(0, 6)).map((w) =>
        <WorkTile key={w.id} w={w} round={round} meta={[w.category, w.client, w.year].filter(Boolean).join(" · ")} />)}</div>
      {visual.length > 6 && <button onClick={() => setAll(!all)} className="mt-6 text-sm font-semibold text-[var(--accent)]">{all ? "Ver menos" : `Ver todos (${visual.length})`}</button>}
    </Block>
  );
}

function ListOf({ id, title, kind }: { id: "clipping" | "audio"; title: string; kind: "article" | "audio" }) {
  const { p, openWork, round } = usePage();
  const Icon = kind === "audio" ? AudioLines : Newspaper;
  return (
    <Block id={id} title={title}>
      <ul className="grid gap-3 @3xl:grid-cols-2">{p.works.filter((w) => w.kind === kind).map((w) => (
        <li key={w.id}><button onClick={() => openWork(w.id)} className={`flex w-full items-center gap-4 p-4 text-left transition hover:opacity-80 ${round}`} style={tint}>
          <span className={`grid h-11 w-11 shrink-0 place-items-center bg-[var(--accent)] text-[var(--on-accent)] ${round}`}><Icon size={18} /></span>
          <span className="min-w-0"><b className="block truncate">{w.title}</b><span className="text-sm opacity-60">{[w.outlet || w.client, w.year].filter(Boolean).join(" · ")}</span></span>
        </button></li>))}</ul>
    </Block>
  );
}

type Item = TimelineItem;

/** Com duas áreas ou mais entre os itens, a lista vira trilhas lado a lado (ex.: Audiovisual e Tecnologia). */
export function tracks(items: Item[], areas: Area[]) {
  const used = areas.filter((area) => items.some((item) => item.area === area.id));
  if (used.length < 2) return [{ id: "", label: "", items }];
  const known = new Set(used.map((area) => area.id));
  const loose = items.filter((item) => !item.area || !known.has(item.area));
  return [...used.map((area) => ({ ...area, items: items.filter((item) => item.area === area.id) })),
    ...(loose.length ? [{ id: "", label: "Geral", items: loose }] : [])];
}

function Timeline({ id, title, items }: { id: "experience" | "education"; title: string; items: Item[] }) {
  const { p, head } = usePage();
  const [all, setAll] = useState(false);
  const limit = 4;
  const groups = tracks(items, p.areas ?? []);
  const split = groups.length > 1;
  const longest = Math.max(...groups.map((group) => group.items.length));
  const list = (group: Item[]) => (
    <ol className="grid gap-0">{(all ? group : group.slice(0, limit)).map((item) => (
      <li key={item.id} className={`grid gap-1 border-b py-5 ${split ? "" : "@3xl:grid-cols-[180px_1fr] @3xl:gap-8"}`} style={line}>
        <span className="text-sm font-semibold text-[var(--accent)]">{item.period}</span>
        <span><b className="block text-lg">{item.title}</b>{item.org && <span className="opacity-70">{item.org}</span>}
          {item.text && <span className="mt-2 block text-sm opacity-70">{item.text}</span>}</span>
      </li>))}</ol>
  );
  return (
    <Block id={id} title={title}>
      {split ? <div className="grid gap-10 @3xl:grid-cols-2">{groups.map((group) => (
        <div key={group.id || "geral"}><h3 className={`${head} text-lg font-bold`}>Trilha {group.label.toLowerCase()}</h3>{list(group.items)}</div>))}</div>
        : list(items)}
      {longest > limit && <button onClick={() => setAll(!all)} className="mt-5 text-sm font-semibold text-[var(--accent)]">
        {all ? "Ver menos" : `${id === "experience" ? "Ver toda a trajetória" : "Ver toda a formação"} (${items.length})`}</button>}
    </Block>
  );
}

function Faq() {
  const { p, round } = usePage();
  return (
    <Block id="faq" title="Perguntas frequentes">
      <div className="grid gap-3">{p.faq!.map((item) => (
        <details key={item.id} className={`group p-4 ${round}`} style={tint}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{item.question}<ChevronDown size={18} className="shrink-0 transition group-open:rotate-180" /></summary>
          <p className="mt-3 text-sm opacity-75">{item.answer}</p>
        </details>))}</div>
    </Block>
  );
}

/**
 * Blocos que o modelo não desenha no próprio layout, no visual dele (cores, fonte, cantos e destaque).
 * Aparecem quando há conteúdo e o bloco não foi desligado. Entram antes do contato.
 */
export function Extras() {
  const page = usePage();
  const { p, head, round, visual, articles, audios } = page;
  const native = new Set(MODEL_BLOCKS[p.site.templateId]);
  const show = (id: BlockId, has: boolean) => !native.has(id) && has;
  const gallery = !isHidden(p, "gallery") && showsGallery(p, p.works);
  const pr = p.profile;
  return (
    <>
      {show("about", pr.bio.trim().length > summary(pr.bio).length) && <Block id="about" title="Sobre">
        <p className="max-w-3xl whitespace-pre-line text-lg leading-relaxed opacity-85">{pr.bio}</p>
      </Block>}
      {show("stats", pr.stats.length > 0) && <Block id="stats" title="Em números">
        <div className="grid grid-cols-2 gap-6 @3xl:grid-cols-4">{pr.stats.map((s) => (
          <div key={s.label}><p className={`${head} text-4xl font-bold text-[var(--accent)]`}>{s.value}</p><p className="mt-1 text-sm opacity-70">{s.label}</p></div>))}</div>
      </Block>}
      {/* A galeria completa (com abas e filtros) substitui as listas simples de itens, matérias e áudios. */}
      {gallery && <Gallery works={p.works} />}
      {!gallery && show("works", visual.length > 0) && <Works />}
      {!gallery && show("clipping", articles.length > 0) && <ListOf id="clipping" title="Matérias e publicações" kind="article" />}
      {!gallery && show("audio", audios.length > 0) && <ListOf id="audio" title="Áudios e demos" kind="audio" />}
      {show("pillars", pr.pillars.length > 0) && <Block id="pillars" title="Como eu trabalho">
        <ol className="grid gap-4 @3xl:grid-cols-3">{pr.pillars.map((pl, i) => (
          <li key={pl.title} className={`p-5 ${round}`} style={tint}><span className={`${head} text-sm font-bold text-[var(--accent)]`}>{String(i + 1).padStart(2, "0")}</span>
            <b className="mt-2 block">{pl.title}</b>{pl.text && <p className="mt-1 text-sm opacity-70">{pl.text}</p>}</li>))}</ol>
      </Block>}
      {show("services", p.services.length > 0) && <Block id="services" title="Serviços">
        <div className="grid gap-4 @3xl:grid-cols-3">{p.services.map((s) => (
          <div key={s.id} className={`border p-5 ${round}`} style={line}><b className="block">{s.title}</b><p className="mt-2 text-sm opacity-70">{s.text}</p>
            {s.price && <p className="mt-4 text-sm font-semibold text-[var(--accent)]">{s.price}</p>}</div>))}</div>
      </Block>}
      {show("clients", p.clients.length > 0) && <Block id="clients" title="Clientes e parceiros">
        <ul className="flex flex-wrap gap-3">{p.clients.map((c) => <li key={c} className={`${head} border px-4 py-2 font-semibold opacity-80 ${round}`} style={line}>{c}</li>)}</ul>
      </Block>}
      {show("experience", p.experience.length > 0) && <Timeline id="experience" title="Experiência" items={p.experience} />}
      {show("education", p.education.length > 0) && <Timeline id="education" title="Formação" items={p.education} />}
      {show("testimonials", p.testimonials.length > 0) && <Block id="testimonials" title="O que dizem">
        <div className="grid gap-5 @3xl:grid-cols-2">{p.testimonials.map((t) => (
          <figure key={t.id} className={`p-6 ${round}`} style={tint}><Quote className="text-[var(--accent)]" size={22} />
            <blockquote className="mt-3">{t.quote}</blockquote><figcaption className="mt-4 text-sm"><b>{t.author}</b>{t.role && <span className="opacity-60"> · {t.role}</span>}</figcaption></figure>))}</div>
      </Block>}
      {show("team", (p.team ?? []).some((m) => m.name)) && <div id="equipe-extra" data-block="team" className="border-t" style={line}><TeamStrip title="Equipe" /></div>}
      {show("faq", (p.faq ?? []).length > 0) && <Faq />}
    </>
  );
}
