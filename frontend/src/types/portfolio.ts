export type RoleId =
  | "editor" | "produtor" | "designer" | "motion" | "fotografo"
  | "jornalista" | "social" | "assessor" | "locutor";

export type SectionType =
  | "hero" | "about" | "reel" | "works" | "clients" | "experience"
  | "education" | "clipping" | "services" | "testimonials" | "audio" | "contact";

export type TemplateStyle = "cinema" | "grid" | "editorial" | "bold";
export type PlanId = "gratis" | "essencial";
export type Goal = "clientes" | "vaga" | "mostrar";
export type WorkKind = "video" | "image" | "article" | "audio" | "script";

/** `variant` sobrescreve o estilo do modelo só nesta seção (mistura de modelos). */
export interface Section { id: string; type: SectionType; enabled: boolean; title?: string; variant?: TemplateStyle; variantModelId?: string }

export interface Work {
  artDocument?: import("./art").ArtDocument;
  id: string;
  title: string;
  kind: WorkKind;
  client: string;
  year: string;
  role: string;          // função exercida no trabalho
  category: string;
  software: string[];
  tags: string[];
  description: string;
  cover: string;         // dataURL ou "grad:<hue>"
  mediaUrl?: string;     // YouTube/Vimeo/Spotify/link da matéria
  gallery?: string[];
  repositoryUrl?: string;
  aspect?: "16:9" | "9:16";
  coverOriginal?: string; // capa original preservada quando a arte é editada no Estúdio
  coverVersions?: string[]; // versões geradas no Estúdio de Arte
  hostedBytes?: number;   // arquivo próprio hospedado (conta na cota); link externo = 0
  outlet?: string;       // veículo (jornalismo/assessoria)
  featured?: boolean;
  contribution?: string;
  deliverables?: string[];
  visibility?: "public" | "link" | "private";
  markers?: { time: string; label: string }[];
  /** Área (aba da galeria) a que o trabalho pertence, para perfis com mais de uma profissão. */
  area?: string;
  challenge?: string;
  solution?: string;
  results?: string;
  credits?: string;
}

export interface Stat { label: string; value: string }
export interface Pillar { title: string; text: string }
export interface TimelineItem { id: string; period: string; title: string; org: string; text?: string; startDate?: string; endDate?: string; current?: string; /** Área (trilha) do item, quando há mais de uma. */ area?: string }
/** Área do portfólio: vira aba da galeria e trilha da formação. */
export interface Area { id: string; label: string }
export interface Testimonial { id: string; quote: string; author: string; role: string }
export interface Service { id: string; title: string; text: string; price?: string }
export interface TeamMember { id: string; name: string; role: string; photo?: string }
export interface Faq { id: string; question: string; answer: string }

export interface Profile {
  artDocument?: import("./art").ArtDocument;
  photoOriginal?: string;
  photoVersions?: string[];
  professions?: string[];
  heroTitle?: string;
  heroKicker?: string;
  heroImage?: string;
  ctaLabel?: string;
  manifesto?: string;
  name: string;
  headline: string;
  roleId: RoleId;
  /** Outras profissões (perfil híbrido). */
  roles?: RoleId[];
  city: string;
  state: string;
  bio: string;
  photo?: string;
  /** Ponto de foco do retrato, em % (0–100). */
  photoFocus?: { x: number; y: number };
  email: string;
  whatsapp: string;
  instagram: string;
  linkedin: string;
  website: string;
  resumeUrl?: string;
  available: boolean;
  inDirectory?: boolean;
  stats: Stat[];
  pillars: Pillar[];
}

export type PhotoLookId = "natural" | "quente" | "frio" | "pb" | "duotone" | "filme";
/** Acabamento opcional das fotos (desligado por padrão; a foto guardada nunca muda). */
export interface PhotoLook { enabled: boolean; intensity: "suave" | "media" | "forte"; autoFix: boolean }

export interface Presentation {
  contentWidth?: "960" | "1200" | "1440";
  motion?: "off" | "soft" | "expressive";
  pointer?: boolean;
  ambient?: boolean;
  scene3d?: boolean;
  density?: "compact" | "comfortable" | "airy";
  frame?: "thin" | "glass" | "shadow";
  imageFit?: "cover" | "contain";
  gallery?: "model" | "grid" | "list" | "rail";
}
export interface Theme { background?: string; ink?: string; accent: string; mode: "dark" | "light"; font: "sans" | "display" | "serif"; radius: "none" | "md" | "lg" }

export interface SiteConfig {
  presentation?: Presentation;
  slug: string;
  templateId: string;
  theme: Theme;
  sections: Section[];
  published: boolean;
  bilingual: boolean;
  passwordProtected: boolean;
  /** objetivo escolhido no modo Rápido */
  goal?: Goal;
  /** ajustes guardados por modelo — voltar a um modelo restaura cores e seções dele */
  perTemplate?: Record<string, { theme: Theme; sections: Section[]; presentation?: Presentation }>;
  /** CSS próprio, aplicado só dentro do site da pessoa */
  customCss?: string;
  customCssEnabled?: boolean;
  /** Blocos desligados pela pessoa (valem para todos os modelos). */
  hidden?: import("../site/models/blocks").BlockId[];
  /** Ordem dos blocos escolhida pela pessoa (vale para todos os modelos). */
  blockOrder?: import("../site/models/blocks").BlockId[];
  /** Acabamento das fotos no estilo do modelo (opcional). */
  photoLook?: PhotoLook;
}

export type LibraryKind = "modelo" | "padrao" | "secao" | "codigo";

/** Item da Biblioteca Pessoal — guarda só estrutura/estilo, nunca o conteúdo do cadastro. */
export interface LibraryItem {
  id: string;
  kind: LibraryKind;
  name: string;
  createdAt: string;
  templateId?: string;
  theme?: Theme;
  presentation?: Presentation;
  sections?: Section[];
  section?: Section;
  css?: string;
  note?: string;
}

/** Foto do visual do site para "voltar a uma versão anterior". */
export interface SiteVersion { id: string; label: string; at: string; templateId: string; theme: Theme; presentation?: Presentation; sections: Section[]; customCss?: string }

export interface Analytics { visits: number[]; contactClicks: number; topWork: string }

export interface Portfolio {
  business?: import("../business/types").Business;
  profile: Profile;
  works: Work[];
  experience: TimelineItem[];
  education: TimelineItem[];
  testimonials: Testimonial[];
  services: Service[];
  clients: string[];
  /** integrantes da equipe (modelos de estúdio e coletivo) */
  team?: TeamMember[];
  /** perguntas frequentes (modelo Serviços e orçamento) */
  faq?: Faq[];
  /** Áreas do portfólio (ex.: Audiovisual, Programação). Com duas ou mais, a galeria ganha abas. */
  areas?: Area[];
  site: SiteConfig;
  plan: PlanId;
  aiCredits: number;
  analytics: Analytics;
  library?: LibraryItem[];
  versions?: SiteVersion[];
  mediaExtraGb?: number;
}

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  style: TemplateStyle;
  roles: RoleId[];
  theme: Theme;
  sections: SectionType[];
  plan: PlanId;
  /** estilo por seção — permite montar modelos misturando partes de outros */
  variants?: Partial<Record<SectionType, TemplateStyle>>;
  /** imagem de referência de onde o modelo veio (docs/modelos/entrada) */
  reference?: string;
}

export interface DirectoryEntry {
  slug: string; name: string; roleId: RoleId; headline: string; city: string; state: string;
  software: string[]; available: boolean; complete: boolean; cover: string;
}

