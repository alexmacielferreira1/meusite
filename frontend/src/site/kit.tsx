import { createContext, useContext } from "react";
import type { Portfolio, Section, TemplateStyle, Theme } from "../types/portfolio";
import { CATALOG_DESIGNS } from "../data/catalogDesigns";

export interface SiteCtx {
  p: Portfolio;
  section?: Section;
  style: TemplateStyle;
  theme: Theme;
  dark: boolean;
  /** true quando o site está dentro do preview do editor */
  embedded: boolean;
  contact?: () => void;
  openWork: (id: string) => void;
}

export const SiteContext = createContext<SiteCtx | null>(null);
export const useSite = () => {
  const c = useContext(SiteContext);
  if (!c) throw new Error("useSite fora do site");
  return c;
};

export function useCatalogDesign() {
  const { p, section } = useSite();
  if (section?.variant) return undefined;
  return CATALOG_DESIGNS[section?.variantModelId ?? p.site.templateId];
}

/** Classes de cor/forma derivadas do tema escolhido. */
export function useTokens() {
  const { theme, style, dark } = useSite();
  const heading = theme.font === "serif" ? "font-serif" : theme.font === "display" ? "font-display" : "font-sans";
  const radius = theme.radius === "none" ? "rounded-none" : theme.radius === "lg" ? "rounded-3xl" : "rounded-xl";
  const bg = dark ? (style === "bold" ? "bg-[#0d0b14]" : "bg-[#0b0c10]") : style === "editorial" ? "bg-[#fbfaf7]" : "bg-white";
  return {
    heading,
    radius,
    bg,
    text: dark ? "text-white" : "text-slate-900",
    muted: dark ? "text-white/60" : "text-slate-500",
    soft: dark ? "text-white/80" : "text-slate-700",
    card: dark ? "bg-white/[0.04] border border-white/10" : "bg-white border border-slate-200",
    line: dark ? "border-white/10" : "border-slate-200",
    chip: dark ? "border border-white/15 text-white/80" : "border border-slate-300 text-slate-700",
    accentText: "text-[var(--accent)]",
    accentBg: "bg-[var(--accent)]",
    accentBorder: "border-[var(--accent)]",
  };
}

export function SectionTitle({ eyebrow, title, id }: { eyebrow?: string; title: string; id?: string }) {
  const t = useTokens();
  const { style, section } = useSite();
  if (style === "editorial")
    return (
      <div id={id} className={`mb-10 border-b ${t.line} pb-4`}>
        <h2 className={`${t.heading} text-3xl sm:text-4xl`}>{section?.title || title}</h2>
      </div>
    );
  if (style === "grid")
    return (
      <div id={id} className={`mb-8 grid grid-cols-12 border-t ${t.line} pt-4`}>
        <span className={`col-span-3 text-xs uppercase tracking-[0.2em] ${t.muted}`}>{eyebrow}</span>
        <h2 className={`col-span-9 ${t.heading} text-2xl font-semibold`}>{section?.title || title}</h2>
      </div>
    );
  return (
    <div id={id} className="mb-10">
      {eyebrow && <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.25em] ${t.accentText}`}>{eyebrow}</p>}
      <h2 className={`${t.heading} ${style === "bold" ? "text-4xl sm:text-6xl font-bold" : "text-3xl sm:text-4xl font-bold"}`}>{section?.title || title}</h2>
    </div>
  );
}

export const Wrap = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`mx-auto max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>
);
