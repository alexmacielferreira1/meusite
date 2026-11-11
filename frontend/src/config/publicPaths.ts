// Reserved product paths; server is authoritative. Consistency checked in backend tests.
export const RESERVED_SLUGS = ["api", "app", "assets", "brand", "build", "cadastro", "checkout", "configuracoes", "contato", "diretorio", "docs", "entrar", "exemplo", "favicon", "health", "login", "logout", "media", "modelos", "pranchas", "o", "p", "planos", "preview", "privacidade", "redoc", "robots", "sitemap", "static", "suporte", "termos", "uploads"] as const;
export const validPublicSlug = (slug: string) => slug.length <= 64 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && !(RESERVED_SLUGS as readonly string[]).includes(slug);
export const portfolioPath = (slug: string) => `${validPublicSlug(slug) ? "/" : "/p/"}${encodeURIComponent(slug)}`;
