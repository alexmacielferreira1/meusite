import { ExternalLink, Play, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Work } from "../../types/portfolio";
import { markerSeconds } from "../../lib/evidence";
import { toEmbed } from "../../lib/utils";
import { activities, SoftwareChip } from "../../components/SoftwareChip";
import { Photo, PhotoImg } from "../models/PhotoLayer";
import { SectionTitle, useCatalogDesign, useSite, useTokens, Wrap } from "../kit";

export function Reel() {
  const { p, openWork } = useSite();
  const t = useTokens();
  const videos = p.works.filter((work) => work.kind === "video");
  const w = videos.find((work) => work.featured) ?? videos[0];
  if (!w) return null;
  return (
    <section id="reel" className="py-20">
      <Wrap>
        <SectionTitle eyebrow="Reel" title="Em movimento" />
        <Photo as="button" src={w.cover} onClick={() => openWork(w.id)} className={`group relative block aspect-video w-full overflow-hidden ${t.radius}`}>
          <div className="absolute inset-0 bg-black/30 transition group-hover:bg-black/20" />
          <span className={`absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full ${t.accentBg} text-[var(--on-accent)] shadow-2xl transition group-hover:scale-110`}><Play size={30} fill="currentColor" /></span>
          <span className="absolute bottom-5 left-5 text-left text-white">
            <span className="block text-xs uppercase tracking-widest text-white/70">{w.client} · {w.year}</span>
            <span className="block text-xl font-semibold">{w.title}</span>
          </span>
        </Photo>
      </Wrap>
    </section>
  );
}

function WorkCard({ w, big, ratioOverride }: { w: Work; big?: boolean; ratioOverride?: string }) {
  const { openWork, style } = useSite();
  const t = useTokens();
  const ratio = ratioOverride ?? (style === "grid" ? "aspect-[4/5]" : big ? "aspect-square sm:aspect-auto sm:h-full" : "aspect-video");
  return (
    <button onClick={() => openWork(w.id)} className={`group block h-full w-full text-left`}>
      <div className={`relative overflow-hidden ${t.radius} ${ratio}`}>
        <Photo src={w.cover} className="absolute inset-0 transition duration-500 group-hover:scale-105" />
        {w.kind === "video" && <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white"><Play size={14} fill="currentColor" /></span>}
        {style === "bold" && (
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-5 text-white opacity-90">
            <p className="text-xs uppercase tracking-widest text-white/70">{w.category}</p>
            <p className={`${t.heading} text-xl font-bold`}>{w.title}</p>
          </div>
        )}
      </div>
      {style !== "bold" && (
        <div className="mt-3">
          <p className={`text-xs uppercase tracking-wider ${t.muted}`}>{[w.client, w.year].filter(Boolean).join(" · ")}</p>
          <p className={`mt-0.5 font-semibold ${t.text} group-hover:underline`}>{w.title}</p>
          {style === "cinema" && <p className={`mt-1 text-sm ${t.muted}`}>{[w.role, w.software.join(", ")].filter(Boolean).join(" · ")}</p>}
        </div>
      )}
    </button>
  );
}

function CatalogWorks({ works, layout }: { works: Work[]; layout: NonNullable<ReturnType<typeof useCatalogDesign>>["works"] }) {
  const { openWork } = useSite();
  const t = useTokens();
  const featured = works.find((work) => work.featured) ?? works[0];
  const row = layout === "list" || layout === "case" || layout === "scripts";
  const stages = layout === "breakdown" ? featured?.gallery?.slice(0, 3) ?? [] : [];
  const comparison = layout === "comparison" && featured?.coverOriginal && featured.coverOriginal !== featured.cover
    ? [featured.coverOriginal, featured.cover] : [];
  const vertical = works.filter((work) => work.aspect === "9:16");
  const horizontal = works.filter((work) => work.aspect !== "9:16");

  if (layout === "formats") return (
    <div className="grid gap-10 lg:grid-cols-2">
      {[{ label: "Curtas e Reels", items: vertical, ratio: "aspect-[9/16]" }, { label: "Episódios e vídeos", items: horizontal, ratio: "aspect-video" }]
        .filter(({ items }) => items.length > 0).map(({ label, items, ratio }) => (
          <div key={label}>
            <h3 className="mb-4 text-lg font-bold">{label}</h3>
            <div className="grid gap-4 sm:grid-cols-2">{items.map((work) => <WorkCard key={work.id} w={work} ratioOverride={ratio} />)}</div>
          </div>
        ))}
    </div>
  );

  return (
    <>
      {(stages.length > 1 || comparison.length > 0) && (
        <figure className={`mb-8 border p-4 ${t.line} ${t.radius}`}>
          <figcaption className="mb-4 text-lg font-bold">{comparison.length ? "Antes e depois" : "Etapas da produção"} · {featured.title}</figcaption>
          <div className={`grid gap-4 ${stages.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {(comparison.length ? comparison : stages).map((image, index) => (
              <div key={index}>
                <PhotoImg className={`aspect-video w-full object-cover ${t.radius}`} src={image} alt="" loading="lazy" />
                <p className={`mt-2 text-sm ${t.muted}`}>{comparison.length ? ["Original", "Versão atual"][index] : `Etapa ${index + 1}`}</p>
              </div>
            ))}
          </div>
        </figure>
      )}
      {row ? (
        <div className={`divide-y border-y ${t.line}`}>
          {works.map((work) => (
            <button key={work.id} onClick={() => openWork(work.id)} className="group grid w-full gap-4 py-5 text-left sm:grid-cols-[minmax(8rem,1fr)_3fr] sm:items-center">
              <Photo as="span" src={work.cover} className={`aspect-video ${t.radius}`} />
              <span>
                <span className={`block text-xs font-semibold uppercase tracking-wide ${t.muted}`}>{[work.category, work.client, work.year].filter(Boolean).join(" · ")}</span>
                <span className={`mt-1 block text-xl font-bold group-hover:underline ${t.heading}`}>{work.title}</span>
                <span className={`mt-2 line-clamp-3 block text-sm ${layout === "scripts" ? "font-mono" : ""}`}>{work.description}</span>
                {work.contribution && <span className={`mt-2 block text-sm ${t.muted}`}>Meu papel · {work.contribution}</span>}
                {layout === "case" && !!work.deliverables?.length && <span className="mt-2 block text-sm">Entregas · {work.deliverables.join(", ")}</span>}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className={`grid gap-5 ${layout === "pair" ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {works.map((work, index) => (
            <div key={work.id} className={layout === "mosaic" && index === 0 ? "sm:col-span-2" : ""}>
              <WorkCard w={work} ratioOverride={layout === "portrait" ? "aspect-[4/5]" : "aspect-video"} />
              {layout === "credits" && <p className={`mt-2 text-sm ${t.muted}`}>{[work.role, work.contribution].filter(Boolean).join(" · ")}</p>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function Works() {
  const { p, style, dark } = useSite();
  const design = useCatalogDesign();
  const t = useTokens();
  const works = p.works.filter((w) => w.kind !== "article" && w.kind !== "audio");
  const cats = useMemo(() => Array.from(new Set(works.map((w) => w.category).filter(Boolean))), [works]);
  const clients = useMemo(() => Array.from(new Set(works.map((w) => w.client).filter(Boolean))), [works]);
  const softwares = useMemo(() => Array.from(new Set(works.flatMap((w) => w.software))), [works]);
  const [cat, setCat] = useState("");
  const [client, setClient] = useState("");
  const [sw, setSw] = useState("");
  const [limit, setLimit] = useState(6);
  const list = works.filter((w) => (!cat || w.category === cat) && (!client || w.client === client) && (!sw || w.software.includes(sw)));
  if (!works.length) return null;

  const select = `h-9 ${t.radius} ${dark ? "bg-slate-900 border border-white/15 text-white" : "bg-white border border-slate-300"} px-3 text-sm`;

  return (
    <section id="itens" className="py-20">
      <Wrap>
        <SectionTitle eyebrow="Vitrine" title={design?.workTitle ?? "Destaques em destaque"} />
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {["", ...cats].map((c) => (
            <button key={c || "todos"} onClick={() => setCat(c)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${cat === c ? `${t.accentBg} text-[var(--on-accent)] font-medium` : t.chip}`}>{c || "Todos"}</button>
          ))}
          {style === "cinema" && (
            <div className="ml-auto flex flex-wrap gap-2">
              <select aria-label="Filtrar por cliente" className={select} value={client} onChange={(e) => setClient(e.target.value)}>
                <option value="">Cliente</option>{clients.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select aria-label="Filtrar por software" className={select} value={sw} onChange={(e) => setSw(e.target.value)}>
                <option value="">Software</option>{softwares.map((c) => <option key={c}>{c}</option>)}
              </select>
              {(client || sw || cat) && <button onClick={() => { setCat(""); setClient(""); setSw(""); }} className={`text-sm underline ${t.muted}`}>Limpar filtros</button>}
            </div>
          )}
        </div>

        {design ? <CatalogWorks works={list.slice(0, limit)} layout={design.works} /> : style === "bold" ? (
          <div className="grid auto-rows-[220px] grid-cols-1 gap-4 sm:grid-cols-3">
            {list.slice(0, limit).map((w, i) => (
              <div key={w.id} className={i === 0 ? "sm:col-span-2 sm:row-span-2" : ""}><WorkCard w={w} big={i === 0} /></div>
            ))}
          </div>
        ) : (
          <div className={`grid gap-x-6 gap-y-10 ${p.site.templateId === "portfolio-compacto" && list.length === 1 ? "mx-auto max-w-3xl" : style === "grid" ? "grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
            {list.slice(0, limit).map((w) => <WorkCard key={w.id} w={w} />)}
          </div>
        )}
        {list.length === 0 && <p className={t.muted}>Nenhum trabalho com esses filtros.</p>}
        {list.length > limit && (
          <div className="mt-10 text-center"><button onClick={() => setLimit(limit + 6)} className={`${t.radius} ${t.chip} px-5 py-2.5 text-sm`}>Carregar mais</button></div>
        )}
      </Wrap>
    </section>
  );
}

export function WorkModal({ work, onClose }: { work: Work | null; onClose: () => void }) {
  const [offset, setOffset] = useState(0);
  if (!work) return null;
  const rawEmbed = toEmbed(work.mediaUrl);
  const embed = rawEmbed && offset ? rawEmbed.includes("youtube") ? rawEmbed + "&start=" + offset : rawEmbed + "#t=" + offset + "s" : rawEmbed;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/80 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white text-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className={`relative bg-black ${/instagram|tiktok/.test(embed??"") ? "mx-auto h-[65vh] max-w-[500px]" : work.aspect === "9:16" ? "mx-auto aspect-[9/16] max-h-[70vh]" : "aspect-video"}`}>
          {embed ? <iframe src={embed} title={work.title} className="h-full w-full" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
            : work.kind === "video" && /^https?:\/\/.+\.(mp4|webm|ogv)(?:[?#].*)?$/i.test(work.mediaUrl ?? "")
              ? <video controls preload="metadata" className="h-full w-full" src={work.mediaUrl} />
              : work.kind === "audio" && /^https?:\/\/.+\.(mp3|ogg|wav|m4a)(?:[?#].*)?$/i.test(work.mediaUrl ?? "")
              ? <div className="grid h-full place-items-center"><audio controls preload="none" src={work.mediaUrl} /></div>
              : <Photo src={work.cover} className="h-full w-full" />}
          <button onClick={onClose} aria-label="Fechar" className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white"><X size={18} /></button>
        </div>
        {!!work.gallery?.length && <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
          {work.gallery.filter((url) => /^https?:\/\/[^\s]+$/i.test(url)).map((url, i) =>
            <a href={url} key={i} target="_blank" rel="noreferrer"><PhotoImg loading="lazy" src={url} alt={`${work.title} · imagem ${i + 1}`} className="aspect-square w-full rounded-lg object-cover" /></a>)}
        </div>}
        <div className="grid gap-6 p-6 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <p className="text-xs uppercase tracking-widest text-slate-500">{work.category}</p>
            <h3 className="mt-1 text-2xl font-bold">{work.title}</h3>
            <p className={`mt-3 whitespace-pre-wrap text-slate-600 ${work.kind === "script" ? "font-mono" : ""}`}>{work.description}</p>
            {work.contribution && <><h4 className="mt-4 font-semibold">Minha contribuição</h4><p className="whitespace-pre-line text-slate-600">{work.contribution}</p></>}
            {([["Desafio",work.challenge],["Solução",work.solution],["Resultados",work.results],["Créditos",work.credits]] as const).filter(([,value])=>value).map(([label,value])=><div key={label}><h4 className="mt-4 font-semibold">{label}</h4><p className="whitespace-pre-line text-slate-600">{value}</p></div>)}
            {!!work.deliverables?.length && <><h4 className="mt-4 font-semibold">Entregas</h4><p className="text-slate-600">{work.deliverables.join(" · ")}</p></>}
            {!!work.markers?.length && <><h4 className="mt-4 font-semibold">Momentos do trabalho</h4><ul className="space-y-1 text-sm">
              {work.markers.map(({ time, label }, i) => <li key={i}>{embed ? <button className="text-brand-700 underline" onClick={() => setOffset(markerSeconds(time) ?? 0)}>{time} · {label}</button> : <span>{time} · {label}</span>}</li>)}
            </ul></>}
            {/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/i.test(work.repositoryUrl ?? "") && <a href={work.repositoryUrl} target="_blank" rel="noreferrer" className="mr-4 mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700"><ExternalLink size={14} /> Ver código no GitHub</a>}
            {/^https?:\/\//i.test(work.mediaUrl ?? "") && <a href={work.mediaUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700"><ExternalLink size={14} /> Abrir original</a>}
          </div>
          <dl className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
            {[["Cliente", work.client], ["Ano", work.year], ["Veículo", work.outlet]].filter(([, v]) => v).map(([k, v]) => (
              <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
            {!!activities(work.role).length && <div><dt className="text-xs text-slate-500">Atividades</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">{activities(work.role).map((item) => <span key={item} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs">{item}</span>)}</dd></div>}
            {!!work.software.length && <div><dt className="text-xs text-slate-500">Softwares</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">{work.software.map((name) => <SoftwareChip key={name} name={name} />)}</dd></div>}
          </dl>
        </div>
      </div>
    </div>
  );
}

