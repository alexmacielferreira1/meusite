import type { DirectoryEntry, Portfolio, RoleId, SectionType } from "../types/portfolio";
import { templateById } from "./templates";
import { uid } from "../lib/utils";

export const sectionsFrom = (types: SectionType[]) =>
  types.map((type) => ({ id: uid(), type, enabled: true }));

// Perfil de DEMONSTRAÇÃO (dados fictícios) para ver o produto funcionando.
export function demoPortfolio(): Portfolio {
  const tpl = templateById("editor-pro");
  return {
    profile: {
      name: "Marina Duarte",
      headline: "Editora de vídeo e montadora para TV, documentário e marcas",
      roleId: "editor",
      city: "Porto Alegre", state: "RS",
      bio: "Edito histórias há 12 anos — de séries documentais para TV a campanhas para marcas. Gosto de ritmo, de silêncio na hora certa e de entregar o corte que o cliente nem sabia que queria.",
      email: "contato@marinaduarte.com.br", whatsapp: "5551999990000", instagram: "marinaduarte.edit", linkedin: "marinaduarte", website: "",
      available: true,
      stats: [{ label: "anos de edição", value: "12+" }, { label: "projetos entregues", value: "340" }, { label: "TV · Doc · Marcas", value: "3 frentes" }],
      pillars: [
        { title: "Edição", text: "Montagem narrativa, ritmo e finalização para TV e web." },
        { title: "Cor e som", text: "Correção de cor no DaVinci e mixagem básica de áudio." },
        { title: "Motion", text: "Lettering, vinhetas e animações de apoio no After." },
      ],
    },
    works: [
      { id: uid(), title: "Rios do Sul — série documental", kind: "video", client: "Canal Educativo", year: "2025", role: "Montagem", category: "Documentário", software: ["Premiere", "DaVinci Resolve"], tags: ["documentário", "série"], description: "Montagem dos 6 episódios da série sobre as bacias hidrográficas do RS, com 120 horas de material bruto.", cover: "grad:200", featured: true },
      { id: uid(), title: "Campanha Verão — 30s", kind: "video", client: "Marca de Moda", year: "2025", role: "Edição e cor", category: "Publicidade", software: ["Premiere", "DaVinci Resolve"], tags: ["comercial"], description: "Filme de 30s e 6 cortes para redes, com correção de cor e trilha licenciada.", cover: "grad:20" },
      { id: uid(), title: "Programa Plantão Cultural", kind: "video", client: "Sindicato Médico", year: "2024", role: "Edição", category: "TV", software: ["Premiere"], tags: ["programa", "tv"], description: "Edição semanal do programa, com entrevistas, cobertura de eventos e vinheta própria.", cover: "grad:330" },
      { id: uid(), title: "Vinheta institucional", kind: "video", client: "Instituto de Saúde", year: "2024", role: "Motion e edição", category: "Institucional", software: ["After Effects"], tags: ["motion", "vinheta"], description: "Vinheta animada de 8s e pacote de lower thirds.", cover: "grad:265" },
      { id: uid(), title: "Making of — Festival de Cinema", kind: "video", client: "Festival", year: "2023", role: "Captação e edição", category: "Evento", software: ["Final Cut"], tags: ["evento", "making of"], description: "Cobertura de 5 dias e resumo diário publicado nas redes do festival.", cover: "grad:150" },
      { id: uid(), title: "Série de cortes para YouTube", kind: "video", client: "Canal de Finanças", year: "2023", role: "Edição", category: "Web", software: ["CapCut", "Premiere"], tags: ["youtube", "cortes"], description: "60 cortes verticais por mês com legendas animadas.", cover: "grad:45" },
    ],
    experience: [
      { id: uid(), period: "2021 — hoje", title: "Editora sênior (freelancer)", org: "Produtoras e marcas", text: "Montagem de documentários, programas e campanhas." },
      { id: uid(), period: "2016 — 2021", title: "Editora", org: "Emissora regional", text: "Edição diária de jornalismo e programas." },
      { id: uid(), period: "2013 — 2016", title: "Assistente de edição", org: "Produtora local" },
    ],
    education: [
      { id: uid(), period: "2019", title: "Pós-graduação em Cinema Documental", org: "Universidade (exemplo)" },
      { id: uid(), period: "2013", title: "Comunicação Social — Jornalismo", org: "Universidade (exemplo)" },
    ],
    testimonials: [
      { id: uid(), quote: "A Marina entendeu o filme antes da gente. Entregou no prazo e com uma montagem que emocionou a equipe.", author: "Diretora de produção", role: "Produtora parceira" },
    ],
    services: [
      { id: uid(), title: "Edição de vídeo", text: "Do material bruto ao corte final, com revisões.", price: "a partir de R$ 800" },
      { id: uid(), title: "Correção de cor", text: "Look e padronização no DaVinci Resolve.", price: "a partir de R$ 400" },
      { id: uid(), title: "Cortes para redes", text: "Pacote mensal de vídeos verticais legendados.", price: "sob consulta" },
    ],
    clients: ["Canal Educativo", "Marca de Moda", "Sindicato Médico", "Instituto de Saúde", "Festival", "Canal de Finanças"],
    site: { slug: "marinaduarte", templateId: tpl.id, theme: { ...tpl.theme }, sections: sectionsFrom(tpl.sections), published: true, bilingual: false, passwordProtected: false },
    plan: "gratis",
    aiCredits: 10,
    analytics: { visits: [32, 41, 38, 55, 61, 48, 72, 80, 66, 91, 103, 97, 120, 134], contactClicks: 18, topWork: "Rios do Sul — série documental" },
  };
}

const d = (slug: string, name: string, roleId: RoleId, headline: string, city: string, state: string, software: string[], hue: number, available = true): DirectoryEntry =>
  ({ slug, name, roleId, headline, city, state, software, available, complete: true, cover: `grad:${hue}` });

// Perfis FICTÍCIOS para demonstrar o diretório.
export const DIRECTORY: DirectoryEntry[] = [
  d("marinaduarte", "Marina Duarte", "editor", "Editora de vídeo para TV, documentário e marcas", "Porto Alegre", "RS", ["Premiere", "DaVinci Resolve"], 200),
  d("caiofreitas", "Caio Freitas", "motion", "Motion designer 2D/3D para marcas e games", "São Paulo", "SP", ["After Effects", "Cinema 4D"], 265),
  d("julianamelo", "Juliana Melo", "designer", "Diretora de arte e identidade visual", "Curitiba", "PR", ["Illustrator", "Figma"], 10),
  d("rafaelsouza", "Rafael Souza", "fotografo", "Fotógrafo de eventos e retrato corporativo", "Porto Alegre", "RS", ["Lightroom"], 35, false),
  d("anapaulacosta", "Ana Paula Costa", "jornalista", "Repórter de economia e dados", "Brasília", "DF", ["WordPress"], 160),
  d("brunolima", "Bruno Lima", "social", "Social media para saúde e varejo", "Canoas", "RS", ["Meta Business", "Canva"], 300),
  d("fernandarocha", "Fernanda Rocha", "assessor", "Assessora de imprensa para cultura e terceiro setor", "Recife", "PE", ["Cision"], 120),
  d("thiagonunes", "Thiago Nunes", "locutor", "Locutor publicitário e narrador de documentários", "Belo Horizonte", "MG", ["Audition"], 50),
  d("larissaprado", "Larissa Prado", "produtor", "Produtora executiva de publicidade", "Rio de Janeiro", "RJ", ["StudioBinder"], 340, false),
  d("diegoalves", "Diego Alves", "editor", "Editor de cortes e conteúdo para YouTube", "Florianópolis", "SC", ["CapCut", "Premiere"], 220),
  d("patriciagomes", "Patrícia Gomes", "designer", "Designer editorial e diagramadora", "Porto Alegre", "RS", ["InDesign", "Photoshop"], 80),
  d("lucasmartins", "Lucas Martins", "motion", "Animador de explainers e lettering", "Campinas", "SP", ["After Effects", "Lottie"], 280),
];
