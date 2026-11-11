type HeroLayout = "split" | "reverse" | "cover" | "type";
type WorkLayout = "cards" | "credits" | "portrait" | "feature" | "list" | "pair" | "comparison" | "breakdown" | "scripts" | "mosaic" | "case" | "formats";

interface CatalogDesign {
  hero: HeroLayout;
  works: WorkLayout;
  workTitle: string;
  target: "works" | "reel" | "clipping" | "demos" | "servicos" | "contato" | "experiencia";
  action: string;
  background: string;
}

export const CATALOG_DESIGNS: Partial<Record<string, CatalogDesign>> = {
  "editor-pro": { hero: "split", works: "cards", workTitle: "Trabalhos em destaque", target: "reel", action: "Ver reel", background: "#101014" },
  "videomaker": { hero: "cover", works: "cards", workTitle: "Projetos recentes", target: "works", action: "Ver trabalhos", background: "#211c15" },
  "producao-audiovisual": { hero: "split", works: "credits", workTitle: "Produções em destaque", target: "works", action: "Conhecer os projetos", background: "#e9e3dc" },
  "designer-grafico": { hero: "split", works: "portrait", workTitle: "Projetos selecionados", target: "works", action: "Ver projetos", background: "#fafaf8" },
  "motion-design": { hero: "split", works: "cards", workTitle: "Projetos em movimento", target: "reel", action: "Ver motion reel", background: "#20102c" },
  "fotografia": { hero: "split", works: "portrait", workTitle: "Séries em destaque", target: "works", action: "Ver portfólio", background: "#f4ebdd" },
  "jornalismo": { hero: "split", works: "feature", workTitle: "Reportagens e publicações", target: "clipping", action: "Ler reportagens", background: "#f5f2ea" },
  "social-media": { hero: "split", works: "cards", workTitle: "Cases e campanhas", target: "works", action: "Ver cases", background: "#eaddfc" },
  "assessoria-imprensa": { hero: "split", works: "list", workTitle: "Clippings recentes", target: "clipping", action: "Conhecer as publicações", background: "#eaf1f5" },
  "locucao-audio": { hero: "split", works: "cards", workTitle: "Principais produções", target: "demos", action: "Ouvir os demos", background: "#102820" },
  "direcao-fotografia": { hero: "cover", works: "credits", workTitle: "Filmes e projetos selecionados", target: "reel", action: "Ver reel", background: "#10100f" },
  "documentarista": { hero: "reverse", works: "list", workTitle: "Meus filmes", target: "reel", action: "Ver documentário", background: "#f3e8d4" },
  "reporter-tv": { hero: "split", works: "list", workTitle: "Reportagens recentes", target: "reel", action: "Ver reportagem", background: "#102039" },
  "direcao-arte": { hero: "reverse", works: "portrait", workTitle: "Campanhas e projetos", target: "works", action: "Ver campanhas", background: "#f7efe3" },
  "redacao-publicitaria": { hero: "type", works: "list", workTitle: "Cases selecionados", target: "works", action: "Ver cases", background: "#edff54" },
  "podcast-producao-sonora": { hero: "split", works: "portrait", workTitle: "Episódios e produções", target: "demos", action: "Ouvir produções", background: "#0d1626" },
  "cobertura-eventos": { hero: "cover", works: "cards", workTitle: "Projetos recentes", target: "servicos", action: "Ver tipos de cobertura", background: "#080d10" },
  "comunicacao-corporativa": { hero: "split", works: "pair", workTitle: "Cases de comunicação", target: "works", action: "Ver cases", background: "#f5f2e9" },
  "estrategia-conteudo": { hero: "split", works: "cards", workTitle: "Cases em destaque", target: "works", action: "Conhecer os cases", background: "#f5ece5" },
  "estudio-criativo": { hero: "split", works: "cards", workTitle: "Projetos do estúdio", target: "works", action: "Ver projetos", background: "#f2f2f4" },
  "colorista": { hero: "split", works: "comparison", workTitle: "Stills e projetos", target: "reel", action: "Ver showreel", background: "#171716" },
  "efeitos-visuais": { hero: "cover", works: "breakdown", workTitle: "Shots em destaque", target: "reel", action: "Ver reel de VFX", background: "#111225" },
  "roteiro-audiovisual": { hero: "split", works: "scripts", workTitle: "Projetos de roteiro", target: "works", action: "Ler projetos", background: "#f4eee2" },
  "ilustracao-editorial": { hero: "split", works: "mosaic", workTitle: "Ilustrações em destaque", target: "works", action: "Ver ilustrações", background: "#f8efe3" },
  "fotojornalismo": { hero: "cover", works: "list", workTitle: "Reportagens visuais", target: "clipping", action: "Ver reportagens", background: "#f7f7f5" },
  "design-informacao": { hero: "split", works: "cards", workTitle: "Projetos de informação", target: "works", action: "Explorar projetos", background: "#f6f6fc" },
  "apresentacao-mediacao": { hero: "split", works: "cards", workTitle: "Eventos e conversas", target: "reel", action: "Ver highlights", background: "#f6ede6" },
  "comunicacao-publica": { hero: "cover", works: "cards", workTitle: "Campanhas e projetos", target: "works", action: "Ver campanhas", background: "#f5f4ed" },
  "ux-writing": { hero: "split", works: "case", workTitle: "Projetos de conteúdo", target: "works", action: "Ver projetos", background: "#eaf5ee" },
  "producao-criadores": { hero: "split", works: "formats", workTitle: "Vídeos para criadores", target: "works", action: "Ver vídeos", background: "#1a1122" },
  "vitrine-multidisciplinar": { hero: "split", works: "mosaic", workTitle: "Projetos por área", target: "works", action: "Ver portfólio", background: "#20102c" },
  "case-em-profundidade": { hero: "split", works: "case", workTitle: "Cases em profundidade", target: "works", action: "Ler os cases", background: "#f7f3eb" },
  "portfolio-compacto": { hero: "split", works: "pair", workTitle: "Projetos em destaque", target: "works", action: "Ver projetos", background: "#fbf8f3" },
  "servicos-orcamento": { hero: "split", works: "cards", workTitle: "Trabalhos recentes", target: "contato", action: "Solicitar orçamento", background: "#101c2e" },
  "curriculo-com-trabalhos": { hero: "split", works: "list", workTitle: "Trabalhos selecionados", target: "experiencia", action: "Ver trajetória", background: "#eaf3f7" },
  "arquivo-editorial": { hero: "split", works: "feature", workTitle: "Arquivo de publicações", target: "clipping", action: "Explorar arquivo", background: "#f6f0e7" },
  "campanhas-resultados": { hero: "cover", works: "case", workTitle: "Campanhas e resultados", target: "works", action: "Ver campanhas", background: "#171411" },
  "projetos-digitais": { hero: "type", works: "list", workTitle: "Projetos digitais", target: "works", action: "Ver projetos", background: "#f3f7ff" },
  "projetos-educacionais": { hero: "split", works: "cards", workTitle: "Cursos e materiais", target: "works", action: "Ver cursos e materiais", background: "#f3f4e9" },
  "equipe-projetos": { hero: "cover", works: "credits", workTitle: "Projetos recentes", target: "works", action: "Ver projetos", background: "#faf3eb" },
};
