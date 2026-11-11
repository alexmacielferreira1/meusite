import type { RoleId, Work, WorkKind } from "../types/portfolio";
import { newWork, videoCover } from "./workSpreadsheet";

/** Prévia de um link de trabalho (vinda do servidor ou montada no navegador). */
export interface LinkPreview { url: string; kind: WorkKind; title: string; cover: string; author: string; ok: boolean }

/** Formato mais comum de trabalho em cada profissão. */
export const ROLE_KIND: Record<RoleId, WorkKind> = {
  editor: "video", produtor: "video", motion: "video", designer: "image", fotografo: "image",
  social: "image", jornalista: "article", assessor: "article", locutor: "audio",
};

const YOUTUBE = /(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})(?=$|[?&#/])/;

/** Encontra links no texto colado (um por linha, separados por espaço ou vírgula). */
export function extractUrls(text: string) {
  const found = [...text.matchAll(/(?:https?:\/\/|www\.)[^\s,;<>"']+/gi)]
    .map((match) => match[0].replace(/[.)\]]+$/, ""))
    .map((url) => /^https?:/i.test(url) ? url : `https://${url}`);
  return [...new Set(found)];
}

export function kindOf(url: string): WorkKind {
  const host = (() => { try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } })();
  if (YOUTUBE.test(url) || /(^|\.)(vimeo|tiktok|dailymotion|twitch)\.(com|tv)$/.test(host) || host === "globoplay.globo.com") return "video";
  if (/(^|\.)(spotify|soundcloud|deezer)\.com$|anchor\.fm$|castbox\.fm$/.test(host)) return "audio";
  if (/behance\.net|dribbble\.com|instagram\.com|pinterest\.|flickr\.com|artstation\.com/.test(host) || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url)) return "image";
  return "article";
}

/** Título provisório a partir do endereço: "/materias/enchentes-no-sul" → "Enchentes no sul". */
export function titleFromUrl(url: string) {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    const slug = decodeURIComponent(parts[parts.length - 1] ?? "").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_+]+/g, " ").trim();
    if (!slug || /^\d+$/.test(slug) || /^[\w-]{11}$/.test(slug) && !slug.includes(" ")) return "";
    return slug.charAt(0).toUpperCase() + slug.slice(1, 160);
  } catch { return ""; }
}

/** Prévia sem servidor (modo demonstração ou quando a busca falha). */
export function localPreview(url: string): LinkPreview {
  const id = YOUTUBE.exec(url)?.[1];
  const title = titleFromUrl(url);
  return { url: id ? `https://www.youtube.com/watch?v=${id}` : url, kind: kindOf(url), title,
    cover: id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "", author: "", ok: Boolean(title) };
}

export function previewToWork(item: LinkPreview, role: string): Work {
  const image = item.kind === "image" && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(item.url);
  return {
    ...newWork(item.kind),
    title: item.title.trim() || "Trabalho sem título",
    role: role.trim(),
    client: item.author.trim(),
    mediaUrl: item.url,
    cover: item.cover || (image ? item.url : "") || videoCover(item.url) || "grad:265",
    visibility: "public",
  };
}

/** Link já usado em algum trabalho do acervo (compara sem "www." e sem barra final). */
export function sameLink(a = "", b = "") {
  const norm = (url: string) => url.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const ya = YOUTUBE.exec(a)?.[1], yb = YOUTUBE.exec(b)?.[1];
  return ya || yb ? ya === yb : Boolean(a) && norm(a) === norm(b);
}
