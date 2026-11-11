// Biblioteca Pessoal e versões do visual do site.
// Tudo aqui mexe só em ESTRUTURA e ESTILO (modelo, tema, seções, CSS) — nunca no conteúdo do cadastro
// (perfil, trabalhos, mídias, contatos continuam intactos).
import type { LibraryItem, Portfolio, Section, SiteVersion } from "../types/portfolio";
import { templateById } from "../data/templates";
import { uid } from "./utils";

const MAX_VERSIONS = 20;
const cloneSections = (s: Section[]) => s.map((x) => ({ ...x }));
const now = () => new Date().toISOString();

/** Guarda o visual atual como versão (chamado antes de qualquer troca grande). */
export function snapshot(x: Portfolio, label: string): Portfolio {
  const v: SiteVersion = { id: uid(), label, at: now(), templateId: x.site.templateId, theme: { ...x.site.theme }, presentation: {...x.site.presentation}, sections: cloneSections(x.site.sections), customCss: x.site.customCss };
  x.versions = [v, ...(x.versions ?? [])].slice(0, MAX_VERSIONS);
  return x;
}

export function restoreVersion(x: Portfolio, v: SiteVersion): Portfolio {
  snapshot(x, "Antes de restaurar uma versão");
  x.site.templateId = v.templateId;
  x.site.theme = { ...v.theme };
  x.site.presentation = v.presentation ? {...v.presentation} : undefined;
  x.site.sections = cloneSections(v.sections);
  x.site.customCss = v.customCss;
  return x;
}

function add(x: Portfolio, item: Omit<LibraryItem, "id" | "createdAt">): Portfolio {
  x.library = [{ ...item, id: uid(), createdAt: now() }, ...(x.library ?? [])];
  return x;
}

export const saveModel = (x: Portfolio, name: string) =>
  add(x, { kind: "modelo", name, templateId: x.site.templateId, theme: { ...x.site.theme }, presentation: {...x.site.presentation}, sections: cloneSections(x.site.sections), css: x.site.customCssEnabled ? x.site.customCss : undefined });
export const savePattern = (x: Portfolio, name: string) => add(x, { kind: "padrao", name, theme: { ...x.site.theme }, presentation: {...x.site.presentation} });
export const saveSection = (x: Portfolio, section: Section, name: string) => add(x, { kind: "secao", name, section: { ...section } });
export const saveCode = (x: Portfolio, name: string, css: string, note?: string) => add(x, { kind: "codigo", name, css, note });

/** Aplica um item da biblioteca. Para modelos dá para aplicar só uma parte. */
export function applyItem(x: Portfolio, item: LibraryItem, part: "tudo" | "estilo" | "estrutura" = "tudo"): Portfolio {
  snapshot(x, `Antes de aplicar "${item.name}"`);
  if (item.kind === "modelo") {
    if (part !== "estilo") { x.site.templateId = item.templateId ?? x.site.templateId; x.site.sections = cloneSections(item.sections ?? x.site.sections).map((s) => ({ ...s, id: uid() })); }
    if (part !== "estrutura" && item.theme) {x.site.theme = { ...item.theme }; x.site.presentation = item.presentation ? {...item.presentation} : undefined;}
    if (part === "tudo" && item.css) { x.site.customCss = item.css; x.site.customCssEnabled = true; }
  }
  if (item.kind === "padrao" && item.theme) {x.site.theme = { ...item.theme }; x.site.presentation = item.presentation ? {...item.presentation} : undefined;}
  if (item.kind === "secao" && item.section) {
    const copy = { ...item.section, id: uid(), enabled: true };
    const same = x.site.sections.findIndex((s) => s.type === copy.type);
    if (same >= 0) x.site.sections[same] = copy;
    else x.site.sections.splice(Math.max(0, x.site.sections.length - 1), 0, copy);
  }
  if (item.kind === "codigo" && item.css) { x.site.customCss = item.css; x.site.customCssEnabled = true; }
  return x;
}

/** O que vai mudar ao aplicar — mostrado antes de confirmar. */
export function describeChange(x: Portfolio, item: LibraryItem, part: "tudo" | "estilo" | "estrutura" = "tudo"): string[] {
  const out: string[] = [];
  if ((item.kind === "modelo" && part !== "estrutura") || item.kind === "padrao") {
    const t = item.theme!;
    if (t.accent !== x.site.theme.accent) out.push(`Cor de destaque: ${x.site.theme.accent} → ${t.accent}`);
    if (t.mode !== x.site.theme.mode) out.push(`Fundo: ${x.site.theme.mode === "dark" ? "escuro" : "claro"} → ${t.mode === "dark" ? "escuro" : "claro"}`);
    if (t.font !== x.site.theme.font) out.push("Tipografia");
    if (t.radius !== x.site.theme.radius) out.push("Cantos");
    if(JSON.stringify(item.presentation)!==JSON.stringify(x.site.presentation)) out.push("Movimento e composição");
  }
  if (item.kind === "modelo" && part !== "estilo") {
    if (item.templateId !== x.site.templateId) out.push(`Modelo: ${templateById(x.site.templateId).name} → ${templateById(item.templateId!).name}`);
    out.push(`Seções e ordem (${item.sections?.length ?? 0} seções)`);
  }
  if (item.kind === "secao") out.push(`Seção "${item.name}" entra na página (substitui a do mesmo tipo, se houver)`);
  if (item.kind === "codigo" || (item.kind === "modelo" && part === "tudo" && item.css)) out.push("CSS personalizado");
  if (!out.length) out.push("Nada muda — já está igual.");
  return out;
}

// ---------- CSS próprio, limitado ao site ----------
const SCOPE = ".fc-site";
const BLOCKED = /@import|expression\s*\(|javascript:|behavior\s*:|-moz-binding|<\/?\s*style|@charset|@namespace/gi;

/** Remove o que é perigoso e prefixa todo seletor com .fc-site (não vaza para o painel). */
export function scopeCss(raw: string): string {
  let css = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(BLOCKED, "");
  css = css.replace(/url\((?!\s*['"]?(?:https:|data:image\/))[^)]*\)/gi, "none"); // só https e imagens embutidas
  const scopeBlock = (src: string): string => {
    let out = "", i = 0;
    while (i < src.length) {
      const open = src.indexOf("{", i);
      if (open < 0) break;
      const head = src.slice(i, open).trim();
      // acha o fecha correspondente
      let depth = 1, j = open + 1;
      while (j < src.length && depth) { if (src[j] === "{") depth++; else if (src[j] === "}") depth--; j++; }
      const body = src.slice(open + 1, j - 1);
      if (/^@(media|supports|container)/i.test(head)) out += `${head}{${scopeBlock(body)}}`;
      else if (/^@keyframes|^@font-face/i.test(head)) out += `${head}{${body}}`;
      else if (head) {
        const sel = head.split(",").map((s) => s.trim()).filter(Boolean)
          .map((s) => (/^(html|body|:root)$/i.test(s) ? SCOPE : `${SCOPE} ${s}`)).join(", ");
        out += `${sel}{${body}}`;
      }
      i = j;
    }
    return out;
  };
  return scopeBlock(css);
}

