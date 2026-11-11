import { ArrowDown, MapPin } from "lucide-react";
import { roleById } from "../../data/roles";
import { initials } from "../../lib/utils";
import { Photo } from "../models/PhotoLayer";
import { useCatalogDesign, useSite, useTokens, Wrap } from "../kit";

export function Hero() {
  const { p, style, embedded } = useSite();
  const design = useCatalogDesign();
  const t = useTokens();
  const pr = p.profile;
  const featured = p.works.find((w) => w.featured) ?? p.works[0];
  const photo = pr.photo ? (
    <Photo src={pr.photo} className="h-full w-full" offClass="bg-cover bg-center" base={{ backgroundImage: `url(${pr.photo})` }} />
  ) : (
    <div className={`grid h-full w-full place-items-center ${t.accentBg} text-4xl font-bold text-[var(--on-accent)]`}>{initials(pr.name)}</div>
  );

  if (design) {
    const targets = { works: "itens", reel: "reel", clipping: "clipping", demos: "demos", servicos: "servicos", contato: "contato", experiencia: "experiencia" };
    const enabled = (type: string) => p.site.sections.some((section) => section.type === type && section.enabled);
    const available = {
      works: enabled("works") && p.works.some((work) => work.kind !== "article" && work.kind !== "audio"),
      reel: enabled("reel") && p.works.some((work) => work.kind === "video"),
      clipping: enabled("clipping") && p.works.some((work) => work.kind === "article"),
      demos: enabled("audio") && p.works.some((work) => work.kind === "audio"),
      servicos: enabled("services") && p.services.length > 0,
      contato: enabled("contact"),
      experiencia: enabled("experience") && p.experience.length > 0,
    };
    const preferred = design.target;
    const target = available[preferred] ? preferred : (Object.keys(available) as (keyof typeof available)[]).find((key) => available[key]);
    const backdrop = design.hero === "cover";
    const image = backdrop ? featured?.cover || pr.photo : pr.photo || featured?.cover;
    return (
      <section id="inicio" className={`relative isolate overflow-hidden pb-14 pt-28 ${backdrop ? "bg-slate-950 text-white" : ""}`}>
        {backdrop && image && <Photo src={image} className="absolute inset-0 -z-10" />}
        {backdrop && <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/75 to-black/30" />}
        <Wrap className={`grid min-h-[23rem] items-center gap-10 ${!backdrop && design.hero !== "type" ? "md:grid-cols-2" : ""}`}>
          <div className={`min-w-0 ${design.hero === "reverse" ? "md:order-2" : ""} ${backdrop ? "max-w-2xl" : ""}`}>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest opacity-90">{roleById(pr.roleId).label}</p>
            <h1 className={`${t.heading} break-words text-4xl font-bold leading-tight sm:text-6xl`}>{pr.headline || pr.name}</h1>
            {pr.headline && <p className="mt-4 text-lg font-semibold">{pr.name}</p>}
            {target && <a className={`mt-7 inline-block px-5 py-3 text-sm font-semibold ${t.radius} ${t.accentBg} text-[var(--on-accent)]`} href={`#${targets[target]}`}>{target === preferred ? design.action : "Explorar site"}</a>}
          </div>
          {!backdrop && design.hero !== "type" && (
            <div className={`aspect-[4/3] overflow-hidden ${t.radius}`}>
              {image ? <Photo src={image} className="h-full w-full" /> : photo}
            </div>
          )}
        </Wrap>
        {pr.stats.length > 0 && <Wrap className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
          {pr.stats.map(({ value, label }) => <div key={label}><p className="text-2xl font-bold">{value}</p><p className="text-sm opacity-80">{label}</p></div>)}
        </Wrap>}
      </section>
    );
  }

  if (style === "grid")
    return (
      <section id="inicio" className="pb-16 pt-28">
        <Wrap>
          <div className="grid grid-cols-12 gap-6">
            <p className={`col-span-12 text-xs uppercase tracking-[0.2em] sm:col-span-3 ${t.muted}`}>{roleById(pr.roleId).short} — {pr.city}/{pr.state}</p>
            <div className="col-span-12 sm:col-span-9">
              <h1 className={`${t.heading} text-5xl font-semibold leading-[0.95] tracking-tight sm:text-8xl`}>{pr.name}</h1>
              <p className={`mt-6 max-w-2xl text-xl ${t.soft}`}>{pr.headline}</p>
              <div className="mt-8 flex flex-wrap gap-x-10 gap-y-3">
                {pr.stats.map((s) => (
                  <div key={s.label}><p className={`text-3xl font-semibold ${t.accentText}`}>{s.value}</p><p className={`text-sm ${t.muted}`}>{s.label}</p></div>
                ))}
              </div>
            </div>
          </div>
        </Wrap>
      </section>
    );

  if (style === "editorial")
    return (
      <section id="inicio" className="pb-14 pt-28 text-center">
        <Wrap>
          <div className={`mx-auto mb-8 h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow`}>{photo}</div>
          <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${t.accentText}`}>{roleById(pr.roleId).label}</p>
          <h1 className={`${t.heading} mt-4 text-5xl sm:text-7xl`}>{pr.name}</h1>
          <p className={`${t.heading} mx-auto mt-5 max-w-2xl text-xl italic ${t.soft}`}>{pr.headline}</p>
          <p className={`mt-4 inline-flex items-center gap-1 text-sm ${t.muted}`}><MapPin size={14} /> {pr.city}, {pr.state}</p>
          <div className={`mx-auto mt-10 flex max-w-xl justify-center divide-x ${t.line} border-y py-4`}>
            {pr.stats.map((s) => (
              <div key={s.label} className={`flex-1 px-3 ${t.line}`}><p className={`${t.heading} text-2xl`}>{s.value}</p><p className={`text-xs ${t.muted}`}>{s.label}</p></div>
            ))}
          </div>
        </Wrap>
      </section>
    );

  if (style === "bold")
    return (
      <section id="inicio" className="relative overflow-hidden pb-16 pt-32">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-[var(--accent)] opacity-30 blur-3xl" />
        <Wrap>
          <p className={`inline-flex items-center gap-2 rounded-full ${t.chip} px-3 py-1 text-xs`}>
            <span className={`h-2 w-2 rounded-full ${pr.available ? "bg-emerald-400" : "bg-slate-400"}`} />{pr.available ? "Disponível para projetos" : "Agenda cheia"}
          </p>
          <h1 className={`${t.heading} mt-6 text-6xl font-bold leading-[0.9] tracking-tighter sm:text-[9rem]`}>
            {pr.name.split(" ")[0]}<span className={t.accentText}>.</span>
          </h1>
          <p className={`mt-6 max-w-2xl text-2xl ${t.soft}`}>{pr.headline}</p>
        </Wrap>
        <div className={`mt-14 overflow-hidden border-y ${t.line} py-4`}>
          <div className={`${t.heading} flex animate-[marquee_25s_linear_infinite] gap-10 whitespace-nowrap text-3xl font-bold ${t.muted}`}>
            {Array.from({ length: 3 }).flatMap((_, i) => p.clients.map((c) => <span key={c + i}>{c} <span className={t.accentText}>✦</span></span>))}
          </div>
        </div>
      </section>
    );

  // cinema (Editor Pro)
  return (
    <section id="inicio" className={`relative flex ${embedded ? "min-h-[680px]" : "min-h-[92vh]"} items-end overflow-hidden pb-16 pt-28`}>
      {featured && <Photo src={featured.cover} className="absolute inset-0 opacity-70" />}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/75 to-[#0b0c10]/20" />
      <Wrap className="relative w-full">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className={`mb-4 text-xs font-semibold uppercase tracking-[0.3em] ${t.accentText}`}>{roleById(pr.roleId).label}</p>
            <h1 className={`${t.heading} text-5xl font-bold leading-[1.02] sm:text-7xl`}>{pr.name}</h1>
            <p className="mt-5 text-lg text-white/75 sm:text-xl">{pr.headline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#itens" className={`${t.radius} ${t.accentBg} px-5 py-3 text-sm font-semibold text-[var(--on-accent)]`}>Ver itens</a>
              <a href="#contato" className={`${t.radius} border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10`}>Falar comigo</a>
            </div>
          </div>
          <div className="order-first h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white/20 md:order-none md:h-36 md:w-36">{photo}</div>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
          {pr.stats.map((s) => (
            <div key={s.label}><p className={`${t.heading} text-2xl font-bold sm:text-4xl`}>{s.value}</p><p className="text-xs text-white/55 sm:text-sm">{s.label}</p></div>
          ))}
        </div>
        <a href="#sobre" className="mt-10 inline-flex items-center gap-2 text-xs text-white/50"><ArrowDown size={14} /> role para ver mais</a>
      </Wrap>
    </section>
  );
}
