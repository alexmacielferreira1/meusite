import type { RoleId, SectionType } from "../types/portfolio";

export interface RoleDef {
  id: RoleId; label: string; short: string; emoji: string;
  needs: string; sections: SectionType[]; workLabel: string; software: string[];
}

export const ROLES: RoleDef[] = [
  { id: "editor", label: "Editor de vídeo / Videomaker", short: "Editor", emoji: "🎬", needs: "Reel, trabalhos por cliente, softwares", workLabel: "Vídeo",
    sections: ["hero", "about", "reel", "works", "clients", "experience", "education", "contact"], software: ["Premiere", "After Effects", "DaVinci Resolve", "Final Cut", "CapCut"] },
  { id: "produtor", label: "Produtor audiovisual", short: "Produtor", emoji: "🎥", needs: "Cases com créditos, equipe, making-of", workLabel: "Produção",
    sections: ["hero", "about", "works", "experience", "clients", "testimonials", "contact"], software: ["StudioBinder", "Excel", "Frame.io"] },
  { id: "designer", label: "Designer / Diretor de arte", short: "Designer", emoji: "🎨", needs: "Peças em alta, processo, antes/depois", workLabel: "Peça",
    sections: ["hero", "works", "about", "services", "clients", "testimonials", "contact"], software: ["Photoshop", "Illustrator", "InDesign", "Figma"] },
  { id: "motion", label: "Motion designer", short: "Motion", emoji: "🌀", needs: "Animações em loop, reel", workLabel: "Animação",
    sections: ["hero", "reel", "works", "about", "clients", "contact"], software: ["After Effects", "Cinema 4D", "Blender", "Lottie"] },
  { id: "fotografo", label: "Fotógrafo", short: "Fotógrafo", emoji: "📷", needs: "Ensaios, coberturas, galerias", workLabel: "Ensaio",
    sections: ["hero", "works", "about", "services", "testimonials", "contact"], software: ["Lightroom", "Photoshop", "Capture One"] },
  { id: "jornalista", label: "Jornalista / Redator", short: "Jornalista", emoji: "📰", needs: "Matérias publicadas, veículos, editorias", workLabel: "Matéria",
    sections: ["hero", "about", "clipping", "experience", "education", "contact"], software: ["WordPress", "Google Docs", "Canva"] },
  { id: "social", label: "Social media / Conteúdo", short: "Social media", emoji: "📱", needs: "Perfis geridos, resultados, marcas", workLabel: "Case",
    sections: ["hero", "about", "works", "clients", "services", "testimonials", "contact"], software: ["Meta Business", "mLabs", "Canva", "CapCut"] },
  { id: "assessor", label: "Assessor de imprensa", short: "Assessor", emoji: "🗞️", needs: "Clientes, saídas na mídia, releases", workLabel: "Saída na mídia",
    sections: ["hero", "about", "clipping", "clients", "experience", "contact"], software: ["Cision", "Google Alerts", "Word"] },
  { id: "locutor", label: "Locutor / Sonoplasta", short: "Locutor", emoji: "🎙️", needs: "Demos de áudio por estilo", workLabel: "Demo",
    sections: ["hero", "audio", "about", "clients", "testimonials", "contact"], software: ["Audition", "Pro Tools", "Reaper"] },
];

export const roleById = (id: RoleId) => ROLES.find((r) => r.id === id) ?? ROLES[0];

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Capa (hero)", about: "Sobre", reel: "Reel em destaque", works: "Trabalhos", clients: "Clientes",
  experience: "Experiência", education: "Formação", clipping: "Clipping de matérias", services: "Serviços e preços",
  testimonials: "Depoimentos", audio: "Demos de áudio", contact: "Contato",
};
