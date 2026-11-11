import type { Portfolio } from "../../types/portfolio";
import { BLOCKS, blockCount, isHidden, type BlockId } from "./blocks";
import { MODEL_SECTIONS } from "./modelBlocks";
import { summary } from "./summary";

export type MenuItem = [label: string, href: string, show: boolean];
export const EXTRA_ANCHORS: Record<BlockId, string> = {
  gallery: "galeria", about: "sobre-extra", works: "mais-trabalhos", clipping: "publicacoes", audio: "audios", stats: "numeros", pillars: "pilares", services: "servicos-extra", clients: "clientes-extra", experience: "experiencia", education: "formacao", testimonials: "depoimentos", team: "equipe-extra", faq: "perguntas",
};
const labels: Record<BlockId, string> = { about: "Sobre", works: "Trabalhos", gallery: "Galeria", clipping: "Publicações", audio: "Áudios", stats: "Números", pillars: "Processo", services: "Serviços", clients: "Clientes", experience: "Experiência", education: "Formação", testimonials: "Depoimentos", team: "Equipe", faq: "Perguntas" };

/** Menu candidates from actual content. Nav then validates targets against rendered DOM. */
export function modelMenu(p: Portfolio, supplied: MenuItem[]): MenuItem[] {
  const native = MODEL_SECTIONS[p.site.templateId] ?? {};
  const menu = supplied.filter(([label, , show]) => show && !(label === "Sobre" && isHidden(p, "about"))).map(([label, href, show]): MenuItem => {
    if (label === "Sobre" && href === "#inicio") label = "Início";
    if (label === "Formação" && native.education) href = "#" + native.education;
    if (label === "Serviços" && href === "#clientes") label = "Clientes";
    return [label, href, show];
  });
  for (const { id } of BLOCKS) {
    if (isHidden(p, id) || !blockCount(p, id)) continue;
    if (id === "about" && !native.about && p.profile.bio.trim().length <= summary(p.profile.bio).length) continue;
    const anchor = native[id] ?? EXTRA_ANCHORS[id];
    if (anchor === "inicio" || anchor === "contato") continue;
    if (menu.some(([label, href]) => href === "#" + anchor && label === labels[id])) continue;
    if (id === "works" && menu.some(([label]) => /^(Trabalhos|Projetos|Portfólio|Produções|Cases|Filmes|Shots)$/.test(label))) continue;
    menu.push([labels[id], "#" + anchor, true]);
  }
  // Experience/education remain discoverable in the header; contact stays last.
  return menu.sort((a, b) => (a[1] === "#contato" ? 1 : 0) - (b[1] === "#contato" ? 1 : 0)).filter((item, i, all) => all.findIndex((x) => x[0] === item[0] && x[1] === item[1]) === i);
}
