import { LegacyMotion } from "./motion/LegacyMotion";
import "./motion/motion.css";
import { ArrowUp, MessageCircle } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { APP_NAME } from "../config/app";
import { CATALOG_DESIGNS } from "../data/catalogDesigns";
import { onAccent, templateById } from "../data/templates";
import { api } from "../lib/api";
import { scopeCss } from "../lib/library";
import type { Portfolio, SectionType } from "../types/portfolio";
import { SiteContext, useTokens, Wrap } from "./kit";
import { Nav } from "./models/shared";
import { MODEL_PAGES } from "./models";
import { applyHidden } from "./models/blocks";
import { Hero } from "./sections/Hero";
import { About, Audio, Clients, Clipping, Contact, Education, Experience, Services, Testimonials } from "./sections/Other";
import { Reel, WorkModal, Works } from "./sections/Works";

const RENDER: Record<SectionType, () => JSX.Element | null> = {
  hero: Hero, about: About, reel: Reel, works: Works, clients: Clients, experience: Experience,
  education: Education, clipping: Clipping, services: Services, testimonials: Testimonials, audio: Audio, contact: Contact,
};

const NAV_LABEL: Partial<Record<SectionType, [string, string]>> = {
  about: ["sobre", "Sobre"], works: ["itens", "Destaques"], experience: ["experiencia", "Experiência"],
  education: ["formacao", "Formação"], clients: ["clientes", "Clientes"], testimonials: ["depoimentos", "Depoimentos"],
  clipping: ["clipping", "Publicações"], services: ["servicos", "Serviços"], audio: ["demos", "Demos"], contact: ["contato", "Contato"],
};

function SiteFooter() {
  const t = useTokens();
  return (
    <footer className={`border-t ${t.line} py-10`}>
        <Wrap className={`flex flex-col items-center justify-between gap-3 text-sm ${t.muted} sm:flex-row`}>
          <span>© {new Date().getFullYear()} · todos os direitos reservados</span>
          <a href="#inicio" className="inline-flex items-center gap-1 hover:underline"><ArrowUp size={14} /> Voltar ao topo</a>
        </Wrap>
    </footer>
  );
}

export function PortfolioSite({ portfolio, embedded = false, opportunityTitle, trackSlug }: { portfolio: Portfolio; embedded?: boolean; opportunityTitle?: string; trackSlug?: string }) {
  if (portfolio.site.templateId === "portfolio-compacto" && !opportunityTitle) {
    // O compacto mostra só 3 itens visuais; matérias e áudios seguem para os blocos extras.
    const visual = portfolio.works.filter((w) => w.kind !== "article" && w.kind !== "audio");
    const others = portfolio.works.filter((w) => w.kind === "article" || w.kind === "audio");
    portfolio = { ...portfolio, works: [...visual.filter((w) => w.featured), ...visual.filter((w) => !w.featured)].slice(0, 3).concat(others) };
  }
  // Blocos desligados pela pessoa somem (as vitrines de oportunidade escolhem o próprio conteúdo).
  // A prévia mostra o mesmo que o site publicado: só itens públicos.
  if (!opportunityTitle) portfolio = applyHidden({ ...portfolio, works: portfolio.works.filter((w) => (w.visibility ?? "public") === "public") });
  const tpl = templateById(portfolio.site.templateId);
  const theme = portfolio.site.theme;
  const dark = theme.mode === "dark";
  const [openId, setOpenId] = useState<string | null>(null);
  const empty: Partial<Record<SectionType, boolean>> = {
    services: !portfolio.services.length, testimonials: !portfolio.testimonials.length, clients: !portfolio.clients.length,
    experience: !portfolio.experience.length, education: !portfolio.education.length, works: !portfolio.works.some((w) => w.kind === "video" || w.kind === "image" || w.kind === "script"), reel: !portfolio.works.some((w) => w.kind === "video"),
    clipping: !portfolio.works.some((w) => w.kind === "article"), audio: !portfolio.works.some((w) => w.kind === "audio"),
  };
  const sections = portfolio.site.sections.filter((s) => s.enabled && !empty[s.type]);
  const design = CATALOG_DESIGNS[tpl.id];
  const pr = portfolio.profile;

  const track = (kind: "work" | "contact", id?: string) => {
    if (trackSlug) void api.siteEvent(trackSlug, kind, id).catch(() => {});
  };
  const ctx = { p: portfolio, style: tpl.style, theme, dark, embedded,
    openWork: (id: string) => { track("work", id); setOpenId(id); },
    contact: () => track("contact"),
  };
  const Fixed = !opportunityTitle ? MODEL_PAGES[tpl.id] : undefined;
  if (Fixed) return (
    <SiteContext.Provider value={ctx}>
      <div data-fm-motion={portfolio.site.presentation?.motion??"soft"} data-fm-ambient={portfolio.site.presentation?.ambient===false?"off":"on"} data-fm-fit={portfolio.site.presentation?.imageFit??"cover"} className="fc-site relative min-h-full" style={{ "--accent": theme.accent, "--on-accent": onAccent(theme.accent) } as CSSProperties}>
        {portfolio.site.customCssEnabled && portfolio.site.customCss && <style>{scopeCss(portfolio.site.customCss)}</style>}
        <Fixed />
        <LegacyMotion />
        {portfolio.plan === "gratis" && <p className="bg-black py-3 text-center text-xs text-white/50">Feito com <b>{APP_NAME}</b></p>}
        {!embedded && pr.whatsapp && (
          <a href={`https://wa.me/${pr.whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" onClick={ctx.contact}
            className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-xl hover:bg-emerald-600"><MessageCircle size={24} /></a>
        )}
        <WorkModal key={openId ?? ""} work={portfolio.works.find((w) => w.id === openId) ?? null} onClose={() => setOpenId(null)} />
      </div>
    </SiteContext.Provider>
  );
  const bg = dark ? (tpl.style === "bold" ? "bg-[#0d0b14] text-white" : "bg-[#0b0c10] text-white") : tpl.style === "editorial" ? "bg-[#fbfaf7] text-slate-900" : "bg-white text-slate-900";
  const navBg = dark ? "bg-black/30 border-white/10" : "bg-white/80 border-slate-200";

  return (
    <SiteContext.Provider value={ctx}>
      <div data-fm-motion={portfolio.site.presentation?.motion??"soft"} data-fm-ambient={portfolio.site.presentation?.ambient===false?"off":"on"} className={`fc-site relative min-h-full font-sans ${bg}`} style={{ "--accent": theme.accent, "--on-accent": onAccent(theme.accent),
        backgroundColor: theme.mode === tpl.theme.mode ? design?.background : undefined } as CSSProperties}>
        {portfolio.site.customCssEnabled && portfolio.site.customCss && <style>{scopeCss(portfolio.site.customCss)}</style>}
        <header className={`${embedded ? "absolute" : "fixed"} inset-x-0 top-0 z-30 border-b backdrop-blur ${navBg}`}>
          <Wrap className="flex h-16 items-center justify-between">
            <a href="#inicio" className={`font-bold ${theme.font === "serif" ? "font-serif" : "font-display"}`}>{pr.name}</a>
            <Nav native={false} items={sections.filter((s) => NAV_LABEL[s.type]).map((s) => {
              const [id, label] = NAV_LABEL[s.type]!;
              return [s.title || label, `#${id}`, true];
            })} />
            {portfolio.site.bilingual && <span className="text-xs opacity-70">PT · EN</span>}
          </Wrap>
        </header>

        {opportunityTitle && <div className="mx-auto max-w-6xl px-5 pt-20 text-sm font-semibold sm:px-8">Seleção para {opportunityTitle}</div>}
        {portfolio.site.templateId === "curriculo-com-itens" && /^https?:\/\//i.test(pr.resumeUrl ?? "") && <Wrap className="pt-20"><a href={pr.resumeUrl} target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent)] underline">Abrir currículo</a></Wrap>}
        {sections.map((s) => {
          const C = RENDER[s.type];
          const local = s.variantModelId ? templateById(s.variantModelId) : null;
          const model = local ?? tpl;
          const style = s.variant ?? model.variants?.[s.type] ?? model.style;
          const content = local ? <div className={local.theme.mode === "dark" ? "bg-slate-950 text-white" : "bg-white text-slate-900"}
            style={{ "--accent": local.theme.accent, "--on-accent": onAccent(local.theme.accent) } as CSSProperties}><C /></div> : <C />;
          return <SiteContext.Provider key={s.id} value={{ ...ctx, style, theme: local?.theme ?? theme,
            dark: local ? local.theme.mode === "dark" : dark, section: s }}>{content}</SiteContext.Provider>;
        })}

        <SiteFooter />
        <LegacyMotion />
        {portfolio.plan === "gratis" && (
          <p className={`pb-6 text-center text-xs ${dark ? "text-white/40" : "text-slate-400"}`}>Feito com <b>{APP_NAME}</b></p>
        )}
        {!embedded && pr.whatsapp && (
          <a href={`https://wa.me/${pr.whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" onClick={ctx.contact}
            className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-xl hover:bg-emerald-600"><MessageCircle size={24} /></a>
        )}
        <WorkModal key={openId ?? ""} work={portfolio.works.find((w) => w.id === openId) ?? null} onClose={() => setOpenId(null)} />
      </div>
    </SiteContext.Provider>
  );
}

