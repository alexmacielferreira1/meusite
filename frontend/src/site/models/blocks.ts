import type { Portfolio, Work } from "../../types/portfolio";
import { summary } from "./summary";

/**
 * Blocos de conteúdo que qualquer modelo pode mostrar. Topo (apresentação) e contato estão sempre presentes.
 * O modelo define o visual; a pessoa liga ou desliga cada bloco e cadastra o conteúdo no lugar indicado.
 */
export type BlockId = "about" | "works" | "gallery" | "clipping" | "audio" | "clients" | "services" | "stats" | "pillars"
  | "experience" | "education" | "testimonials" | "team" | "faq";

export interface BlockDef { id: BlockId; label: string; hint: string; to: string; action: string }

const VISUAL: Work["kind"][] = ["video", "image", "script"];

export const BLOCKS: BlockDef[] = [
  { id: "about", label: "Sobre (bio completa)", hint: "No topo aparece um resumo; aqui, a bio inteira.", to: "/app/perfil", action: "Escrever bio" },
  { id: "works", label: "Trabalhos", hint: "Vídeos, imagens e roteiros do acervo público.", to: "/app/trabalhos", action: "Adicionar trabalhos" },
  { id: "gallery", label: "Galeria completa (abas e filtros)", hint: "Todos os trabalhos com categorias e filtros. Aparece com mais de 6 trabalhos ou com 2 áreas.", to: "/app/trabalhos", action: "Adicionar trabalhos" },
  { id: "clipping", label: "Matérias e publicações", hint: "Trabalhos no formato Matéria.", to: "/app/trabalhos", action: "Adicionar matérias" },
  { id: "audio", label: "Áudios e demos", hint: "Trabalhos no formato Áudio.", to: "/app/trabalhos", action: "Adicionar áudios" },
  { id: "stats", label: "Números em destaque", hint: "Anos de experiência, projetos, prêmios…", to: "/app/perfil#numeros", action: "Adicionar números" },
  { id: "pillars", label: "Pilares e etapas", hint: "Como você trabalha, em até 6 pontos.", to: "/app/perfil#pilares", action: "Adicionar pilares" },
  { id: "services", label: "Serviços", hint: "O que você oferece, com preço opcional.", to: "/app/perfil#servicos", action: "Adicionar serviços" },
  { id: "clients", label: "Clientes", hint: "Marcas, veículos e empresas atendidas.", to: "/app/perfil#clientes", action: "Adicionar clientes" },
  { id: "experience", label: "Experiência", hint: "Cargos e empresas.", to: "/app/perfil#experiencia", action: "Adicionar experiência" },
  { id: "education", label: "Formação", hint: "Cursos e instituições.", to: "/app/perfil#formacao", action: "Adicionar formação" },
  { id: "testimonials", label: "Depoimentos", hint: "Falas de clientes e colegas.", to: "/app/perfil#depoimentos", action: "Adicionar depoimentos" },
  { id: "team", label: "Equipe", hint: "Pessoas que trabalham com você.", to: "/app/perfil#equipe", action: "Adicionar equipe" },
  { id: "faq", label: "Perguntas frequentes", hint: "Dúvidas comuns de quem contrata.", to: "/app/perfil#perguntas", action: "Adicionar perguntas" },
];

/** Abas da galeria: uma por área com trabalhos; trabalhos sem área ficam em "Outros". */
export function galleryTabs(p: Portfolio, works: Work[]) {
  const areas = (p.areas ?? []).filter((area) => works.some((work) => work.area === area.id));
  const known = new Set(areas.map((area) => area.id));
  const loose = works.some((work) => !work.area || !known.has(work.area));
  return areas.length ? [...areas, ...(loose ? [{ id: "", label: "Outros" }] : [])] : [];
}

/** A galeria completa aparece com mais de 6 trabalhos ou com abas (duas áreas ou mais). */
export const showsGallery = (p: Portfolio, works: Work[]) => works.length > 6 || galleryTabs(p, works).length > 1;

const publicWorks = (p: Portfolio) => p.works.filter((w) => (w.visibility ?? "public") === "public");

/** Quantos itens o bloco tem (só o que aparece no site público). */
export function blockCount(p: Portfolio, id: BlockId): number {
  switch (id) {
    case "about": return p.profile.bio.trim() ? 1 : 0;
    case "gallery": return showsGallery(p, publicWorks(p)) ? publicWorks(p).length : 0;
    case "works": return publicWorks(p).filter((w) => VISUAL.includes(w.kind)).length;
    case "clipping": return publicWorks(p).filter((w) => w.kind === "article").length;
    case "audio": return publicWorks(p).filter((w) => w.kind === "audio").length;
    case "stats": return p.profile.stats.length;
    case "pillars": return p.profile.pillars.length;
    case "team": return p.team?.length ?? 0;
    case "faq": return p.faq?.length ?? 0;
    default: return p[id].length;
  }
}

export const isHidden = (p: Portfolio, id: BlockId) => (p.site.hidden ?? []).includes(id);

/** Portfólio sem o conteúdo dos blocos desligados: o modelo esconde o bloco vazio sozinho. */
export function applyHidden(p: Portfolio): Portfolio {
  const hidden = new Set(p.site.hidden ?? []);
  if (!hidden.size) return p;
  const dropKinds = new Set<Work["kind"]>([...(hidden.has("works") ? VISUAL : []), ...(hidden.has("clipping") ? ["article" as const] : []), ...(hidden.has("audio") ? ["audio" as const] : [])]);
  const empty = <T,>(id: BlockId, list: T[]) => (hidden.has(id) ? [] : list);
  return {
    ...p,
    works: p.works.filter((w) => !dropKinds.has(w.kind)),
    // Sem o bloco Sobre, a bio fica só com o resumo usado no topo.
    profile: { ...p.profile, bio: hidden.has("about") ? summary(p.profile.bio, 200) : p.profile.bio, stats: empty("stats", p.profile.stats), pillars: empty("pillars", p.profile.pillars) },
    services: empty("services", p.services), clients: empty("clients", p.clients), experience: empty("experience", p.experience),
    education: empty("education", p.education), testimonials: empty("testimonials", p.testimonials),
    team: empty("team", p.team ?? []), faq: empty("faq", p.faq ?? []),
  };
}
