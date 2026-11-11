import type { Portfolio, Section, TemplateDef } from "../types/portfolio";
import { MOTION_TEMPLATES } from "./motionDesigns";
import { CATALOG_TEMPLATES } from "./catalogTemplates";
import { uid } from "../lib/utils";

export const TEMPLATES: TemplateDef[] = [
  { id: "editor-pro", name: "Editor Pro", style: "cinema", plan: "gratis", reference: "docs/modelos/entrada/01_editor-pro",
    description: "Escuro e cinematográfico, destaque violeta. Hero com indicadores, reel, trabalhos com filtros por cliente e software.",
    roles: ["editor", "produtor", "motion"],
    theme: { accent: "#7c36ea", mode: "dark", font: "display", radius: "md" },
    sections: ["hero", "about", "reel", "works", "clients", "experience", "education", "contact"] },
  { id: "grade-suica", name: "Grade Suíça", style: "grid", plan: "gratis",
    description: "Claro, tipográfico e em grade. As peças falam sozinhas — ideal para designers e fotógrafos.",
    roles: ["designer", "fotografo", "social"],
    theme: { accent: "#e5482f", mode: "light", font: "sans", radius: "none" },
    sections: ["hero", "works", "about", "services", "clients", "contact"] },
  { id: "editorial", name: "Editorial", style: "editorial", plan: "gratis",
    description: "Tipografia serifada de revista. Clipping com veículo em destaque para jornalistas e assessores.",
    roles: ["jornalista", "assessor", "locutor"],
    theme: { accent: "#1f6f5c", mode: "light", font: "serif", radius: "md" },
    sections: ["hero", "about", "clipping", "experience", "education", "contact"] },
  { id: "impacto", name: "Impacto", style: "bold", plan: "essencial",
    description: "Tipografia gigante, cor forte e trabalhos em mosaico. Para motion, social media e quem quer chamar atenção.",
    roles: ["motion", "social", "designer", "editor"],
    theme: { accent: "#7c5cff", mode: "dark", font: "display", radius: "lg" },
    sections: ["hero", "reel", "works", "services", "testimonials", "clients", "contact"] },
  { id: "documental", name: "Documental", style: "cinema", plan: "gratis",
    description: "Mistura: capa editorial com retrato, trabalhos em cinema escuro. Para documentaristas, produtores e repórteres de vídeo.",
    roles: ["produtor", "editor", "jornalista"],
    theme: { accent: "#e0a96d", mode: "dark", font: "serif", radius: "md" },
    variants: { hero: "editorial", about: "editorial", experience: "editorial" },
    sections: ["hero", "about", "reel", "works", "experience", "clients", "contact"] },
  { id: "mosaico", name: "Mosaico", style: "grid", plan: "essencial",
    description: "Mistura: capa gigante do Impacto em fundo claro, trabalhos em mosaico. Para designers e social media que querem leveza com impacto.",
    roles: ["designer", "social", "fotografo"],
    theme: { accent: "#ff5c8a", mode: "light", font: "display", radius: "lg" },
    variants: { hero: "bold", works: "bold", testimonials: "bold" },
    sections: ["hero", "works", "services", "testimonials", "clients", "contact"] },
  { id: "portfolio-compacto", name: "Portfólio compacto", style: "editorial", plan: "gratis",
    description: "Apresentação enxuta com até três trabalhos e contato. Para começar com pouco material.",
    roles: ["editor", "designer", "fotografo", "produtor"],
    theme: { accent: "#6b513d", mode: "light", font: "serif", radius: "none" },
    sections: ["hero", "works", "clipping", "audio", "about", "contact"] },
  { id: "curriculo-com-trabalhos", name: "Currículo com trabalhos", style: "grid", plan: "gratis",
    description: "Trajetória, formação e projetos selecionados. Inclui link de currículo quando cadastrado.",
    roles: ["editor", "produtor", "jornalista", "designer", "social"],
    theme: { accent: "#11556c", mode: "light", font: "sans", radius: "md" },
    sections: ["hero", "experience", "works", "clipping", "audio", "education", "contact"] },
  { id: "arquivo-editorial", name: "Arquivo editorial", style: "editorial", plan: "gratis",
    description: "Vitrine de matérias com busca e filtros por tema, veículo e ano.",
    roles: ["jornalista", "assessor", "social"],
    theme: { accent: "#852344", mode: "light", font: "serif", radius: "none" },
    sections: ["hero", "clipping", "about", "contact"] },
  ...CATALOG_TEMPLATES,
  ...MOTION_TEMPLATES,
];

export const STYLE_LABELS: Record<TemplateDef["style"], string> = { cinema: "Cinema", grid: "Grade", editorial: "Editorial", bold: "Impacto" };

export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];

export const ACCENTS = ["#7c36ea", "#f5b942", "#e5482f", "#1f6f5c", "#7c5cff", "#2f80ed", "#ff5c8a", "#14b8a6", "#111827"];

/** Texto legível sobre a cor de destaque (preto ou branco, pelo contraste). */
export function onAccent(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.4 ? "#0b0b0f" : "#ffffff";
}


/** Troca de modelo guardando os ajustes do atual e restaurando os do novo (se a pessoa já usou). */
export function switchTemplate(x: Portfolio, id: string, opts: { keepSections?: boolean; keepOverrides?: boolean } = {}): Portfolio {
  const cur = x.site.templateId;
  x.site.perTemplate = { ...(x.site.perTemplate ?? {}), [cur]: { theme: { ...x.site.theme }, sections: x.site.sections.map((s) => ({ ...s })), presentation: { ...x.site.presentation } } };
  const saved = x.site.perTemplate[id];
  const tpl = templateById(id);
  x.site.templateId = id;
  x.site.presentation = saved?.presentation ? { ...saved.presentation } : undefined;
  x.site.theme = saved ? { ...saved.theme } : { ...tpl.theme };
  const previous = new Map(x.site.sections.map((section) => [section.type, section]));
  if (!opts.keepSections) x.site.sections = saved ? saved.sections.map((s) => ({ ...s })) : tpl.sections.map((type) => ({ id: uid(), type, enabled: true }));
  if (opts.keepOverrides && !opts.keepSections) x.site.sections = x.site.sections.map((section) => {
    const current = previous.get(section.type);
    return current ? { ...section, variant: current.variant, variantModelId: current.variantModelId } : section;
  });
  if (!opts.keepOverrides) x.site.sections = x.site.sections.map(({ variant: _variant, variantModelId: _model, ...section }: Section) => section);
  return x;
}

/** Volta o modelo atual ao padrão (o conteúdo do cadastro nunca é apagado). */
export function resetTemplate(x: Portfolio): Portfolio {
  const tpl = templateById(x.site.templateId);
  x.site.theme = { ...tpl.theme };
  delete x.site.presentation;
  x.site.sections = tpl.sections.map((type) => ({ id: uid(), type, enabled: true }));
  if (x.site.perTemplate) delete x.site.perTemplate[tpl.id];
  return x;
}

