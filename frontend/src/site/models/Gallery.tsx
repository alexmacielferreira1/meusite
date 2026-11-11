import { SlidersHorizontal, X } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { activities, SoftwareChip } from "../../components/SoftwareChip";
import type { Work } from "../../types/portfolio";
import { galleryTabs } from "./blocks";
import { Box, Cover, Eyebrow, PlayDot, usePage } from "./shared";

const PAGE = 12;
const ALL = "Todos";
const line: CSSProperties = { borderColor: "color-mix(in srgb, currentColor 14%, transparent)" };
const tint: CSSProperties = { backgroundColor: "color-mix(in srgb, currentColor 6%, transparent)" };

type Filter = "activity" | "client" | "software";
const sorted = (list: string[]) => [...new Set(list.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
const valuesOf = (work: Work, key: Filter) => key === "activity" ? activities(work.role) : key === "client" ? [work.client] : work.software;

/**
 * Galeria completa: abas por área (perfil híbrido), categorias, filtros por atividade, cliente e software,
 * contagem e "Carregar mais". Os filtros só oferecem opções que ainda têm resultado.
 */
export function Gallery({ works }: { works: Work[] }) {
  const { p, head, round, openWork } = usePage();
  const tabs = galleryTabs(p, works);
  const known = new Set(tabs.map((tab) => tab.id));
  const [tab, setTab] = useState(tabs[0]?.id ?? "");
  const [category, setCategory] = useState(ALL);
  const [filters, setFilters] = useState<Record<Filter, string>>({ activity: ALL, client: ALL, software: ALL });
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  const inTab = tabs.length ? works.filter((work) => tab ? work.area === tab : !work.area || !known.has(work.area)) : works;
  const count = new Map<string, number>();
  inTab.forEach((work) => work.category && count.set(work.category, (count.get(work.category) ?? 0) + 1));
  const categories = [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR")).map(([name]) => name);
  const matches = (work: Work, skip?: Filter) => (category === ALL || work.category === category)
    && (Object.keys(filters) as Filter[]).every((key) => key === skip || filters[key] === ALL || valuesOf(work, key).includes(filters[key]));
  const result = inTab.filter((work) => matches(work));
  const options = (key: Filter) => sorted(inTab.filter((work) => matches(work, key)).flatMap((work) => valuesOf(work, key)));
  const active = (Object.values(filters).filter((value) => value !== ALL).length);

  const reset = () => { setCategory(ALL); setFilters({ activity: ALL, client: ALL, software: ALL }); setLimit(PAGE); };
  const chip = (on: boolean) => `border px-3 py-1.5 text-sm transition ${round} ${on ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]" : "hover:opacity-80"}`;

  return (
    <section id="galeria" data-block="gallery" className="border-t py-14" style={line}><Box>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><Eyebrow className="text-[var(--accent)]">Vitrine</Eyebrow><h2 className={`${head} mt-2 text-2xl font-bold @3xl:text-3xl`}>Todos os itens</h2></div>
        {tabs.length > 1 && <div role="tablist" aria-label="Áreas do site" className={`inline-flex p-1 ${round}`} style={tint}>
          {tabs.map((item) => <button key={item.id || "outros"} role="tab" aria-selected={tab === item.id} onClick={() => { setTab(item.id); reset(); }}
            className={`px-4 py-2 text-sm font-semibold ${round} ${tab === item.id ? "bg-[var(--accent)] text-[var(--on-accent)]" : "opacity-70 hover:opacity-100"}`}>{item.label}</button>)}
        </div>}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {[ALL, ...categories].map((name) => <button key={name} onClick={() => { setCategory(name); setLimit(PAGE); }} className={chip(category === name)} style={category === name ? undefined : line} aria-pressed={category === name}>{name}</button>)}
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
          <SlidersHorizontal size={16} /> Filtros{active ? ` (${active})` : ""}</button>
      </div>
      {open && <div className={`mt-4 grid gap-3 p-4 @3xl:grid-cols-4 ${round}`} style={tint}>
        {([["activity", "Atividade"], ["client", "Cliente"], ["software", "Software"]] as [Filter, string][]).map(([key, label]) => (
          <label key={key} className="text-sm">{label}
            <select aria-label={label} value={filters[key]} onChange={(event) => { setFilters({ ...filters, [key]: event.target.value }); setLimit(PAGE); }}
              className={`mt-1 block w-full border bg-transparent px-2 py-2 ${round}`} style={line}>
              <option value={ALL}>{ALL}</option>{options(key).map((value) => <option key={value} value={value}>{value}</option>)}
            </select></label>))}
        <button onClick={reset} className={`inline-flex items-center justify-center gap-1 self-end border px-3 py-2 text-sm ${round}`} style={line}><X size={14} /> Limpar filtros</button>
      </div>}

      <p aria-live="polite" className="mt-5 text-sm opacity-60">{result.length} {result.length === 1 ? "trabalho" : "itens"}</p>
      {result.length ? <div className="mt-4 grid gap-6 @xl:grid-cols-2 @5xl:grid-cols-3">
        {result.slice(0, limit).map((work) => (
          <button key={work.id} onClick={() => openWork(work.id)} className="group text-left">
            <Cover src={work.cover} className={`aspect-video ${round}`}>
              <div className="absolute inset-0 transition group-hover:bg-black/15" />
              {work.kind === "video" && <PlayDot size={38} className="absolute bottom-3 right-3" />}
            </Cover>
            <span className="mt-3 block text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">{work.category || work.client}</span>
            <span className="mt-1 block font-semibold leading-snug group-hover:underline">{work.title}</span>
            {!!activities(work.role).length && <span className="mt-1 block text-sm opacity-60">{activities(work.role).join(" • ")}</span>}
            {!!work.software.length && <span className="mt-3 flex flex-wrap gap-1.5">{work.software.slice(0, 4).map((name) => <SoftwareChip key={name} name={name} />)}</span>}
          </button>))}
      </div> : <div className={`mt-6 p-8 text-center ${round}`} style={tint}>
        <p className="font-semibold">Nenhum trabalho com esses filtros</p>
        <button onClick={reset} className="mt-2 text-sm font-semibold text-[var(--accent)]">Limpar filtros</button>
      </div>}
      {result.length > limit && <div className="mt-8 text-center"><button onClick={() => setLimit(limit + PAGE)} className={`border px-5 py-2.5 text-sm font-semibold ${round}`} style={line}>
        Carregar mais ({result.length - limit})</button></div>}
    </Box></section>
  );
}
