// Com API na mesma origem, os dados ficam no servidor. A demo usa armazenamento local.
import { API_URL, DEMO_MODE } from "../config/app";
import type { Analytics, Portfolio } from "../types/portfolio";
import type { LinkPreview } from "./linkWorks";
import { clearOrigin, readOrigin } from "./origin";
import type { ImportedProfile, ResumeSource } from "./resumeParse";

const KEY = "meusite:portfolio:v1";
const USER_KEY = "meusite:user:v1";

export interface User { id?: string; name: string; email: string; /** Acesso à administração (ADMIN_EMAILS no servidor). */ admin?: boolean }

/** Provedor de IA cadastrado na administração. A chave nunca volta: só os 4 últimos caracteres. */
export interface AiProvider { id: string; name: string; provider: "anthropic"; model: string; key_hint: string; features: string[]; enabled: boolean; updated_at: number }
export interface AiProviderInput { name: string; provider: "anthropic"; model: string; api_key: string; features: string[]; enabled: boolean }
export interface AiAdmin { features: Record<string, string>; secret_ready: boolean; providers: AiProvider[] }

/* ---------- Administração do sistema (só administradores) ---------- */
export type AdminPlan = "gratuito" | "teste" | "pro";
export interface AdminOverview {
  accounts: { total: number; testers: number; suspended: number; new_7d: number; new_30d: number; active_7d: number };
  plans: Record<AdminPlan, number>;
  sites: { published: number; hotsites: number; visits_30d: number };
  ai_credits: number;
  payments: { month_cents: number; total_cents: number; count: number };
  errors_open: number;
  signups: { day: string; count: number }[];
  /** Cadastros e portfólios publicados por etiqueta UTM; sem etiqueta (null) = direto. */
  origins?: { source: string | null; medium: string | null; campaign: string | null; content: string | null; signups: number; published: number }[];
}
export interface AdminUser {
  id: string; name: string; email: string; created_at: number | null; last_seen_at: number | null;
  disabled: boolean; tester: boolean; plan: AdminPlan; plan_until: number | null; ai_credits: number; admin_note: string | null;
  slug: string | null; published: boolean; hotsites: number; visits: number; admin: boolean; fixed_admin: boolean;
}
export type AdminUserPatch = Partial<Pick<AdminUser, "name" | "disabled" | "tester" | "plan" | "plan_until" | "ai_credits" | "admin_note">>;
export interface AdminPayment { id: string; account_id: string; name: string; email: string; amount_cents: number; method: string; paid_at: number; note: string; created_by: string; created_at: number }
export interface AdminPaymentInput { account_id: string; amount_cents: number; method: string; paid_at: number; note: string; plan?: AdminPlan | null; plan_until?: number | null }
export interface AdminError { id: string; source: "api" | "web"; path: string; message: string; detail: string; email: string | null; hits: number; first_at: number; last_at: number; resolved: boolean }
export interface AdminAdmins { fixed: string[]; added: { email: string; name: string | null; added_by: string; added_at: number }[] }

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function request<T>(path: string, method = "GET", body?: unknown, extra: Record<string, string> = {}): Promise<T> {
  const csrf = typeof document!=="undefined" ? document.cookie.split("; ").map(x=>x.split("=")).find(([key])=>key==="__Host-meusite-csrf"||key==="meusite-csrf-dev")?.[1] : undefined;
  const response = await fetch((API_URL === "." ? "" : API_URL.replace(/\/$/, "")) + "/api/v1" + path, {
    method, credentials: "same-origin",
    headers: { ...extra, ...(method !== "GET" && { "Content-Type": "application/json", ...(csrf?{"X-CSRF-Token":csrf}:{}) }) },
    ...(method !== "GET" && { body: JSON.stringify(body ?? {}) }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result === null) throw new ApiError(response.status, typeof result?.detail === "string" ? result.detail : "Falha na conexão com o servidor.");
  return result as T;
}

export interface DraftState { portfolio: Portfolio | null; revision: number; publishedSlug: string | null; credits: number }
export interface ResumeDocument {
  name: string;
  kind: "base" | "vaga";
  content: string;
  letter: string;
  job_title: string;
  job_url: string;
  brief: string;
}
export type SavedResume = ResumeDocument & { id: string };

export type HotsiteSource = "livre" | "vaga" | "curriculo";
export interface OpportunityRequest { title: string; pitch: string; days: 0 | 7 | 30 | 60; evidenceIds: string[]; source: HotsiteSource; brief: string; resumeName: string }
export interface OpportunityLink { slug: string; title: string; expires_at: number; revoked: number; visits: number; noExpiry?: boolean; request?: OpportunityRequest | null }
export interface ImportedJob { title: string; brief: string; truncated: boolean; credits?: number }

/** Senha de visita digitada nesta aba, por endereço (não fica salva no navegador). */
const visitPasswords = new Map<string, string>();
const visitHeader = (slug: string): Record<string, string> => {
  const password = visitPasswords.get(slug);
  return password ? { "X-Site-Password": password } : {};
};

function readJSON<T>(key: string): T | null {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : null; } catch { return null; }
}
function writeJSON(key: string, v: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch { return false; /* navegador sem espaço (imagens grandes na demo) */ }
}

export const api = {
  // POST /api/v1/auth/login
  async login(email: string, _password: string): Promise<User> {
    if (!DEMO_MODE) return request<User>("/auth/login", "POST", { email, password: _password });
    const u = { name: email.split("@")[0], email };
    writeJSON(USER_KEY, u);
    return u;
  },
  // POST /api/v1/auth/register
  async register(name: string, email: string, _password: string): Promise<User> {
    if (!DEMO_MODE) {
      const user = await request<User>("/auth/register", "POST", { name, email, password: _password, origin: readOrigin() ?? undefined });
      clearOrigin();
      return user;
    }
    const u = { name, email };
    writeJSON(USER_KEY, u);
    return u;
  },
  currentUser: () => readJSON<User>(USER_KEY),
  logout: async () => {
    if (!DEMO_MODE) await request("/auth/logout", "POST");
    else localStorage.removeItem(USER_KEY);
  },
  session: () => request<User>("/auth/session"),
  draft: () => request<DraftState>("/sites/me"),
  persist: (portfolio: Portfolio, revision: number) => request<{ revision: number }>("/sites/me", "PUT", { portfolio, revision }),
  publish: (revision: number) => request<{ revision: number; publishedSlug: string }>("/sites/me/publish", "POST", { revision }),
  analytics: () => request<Analytics>("/sites/me/analytics"),
  siteEvent: (slug: string, kind: "work" | "contact", item = "") => request("/public/sites/" + encodeURIComponent(slug) + "/events", "POST", { kind, item }, visitHeader(slug)),
  unpublish: () => request("/sites/me/unpublish", "POST"),
  publicSite: (slug: string, password?: string) => {
    if (password !== undefined) visitPasswords.set(slug, password);
    return request<Portfolio>("/public/sites/" + encodeURIComponent(slug), "GET", undefined, visitHeader(slug));
  },
  visitPassword: () => request<{ protected: boolean }>("/sites/me/visit-password"),
  setVisitPassword: (password: string | null) => request<{ protected: boolean }>("/sites/me/visit-password", "PUT", { password }),
  opportunities: () => request<OpportunityLink[]>("/opportunities"),
  opportunity: (slug: string) => request<{ title: string; portfolio: Portfolio }>("/public/opportunities/" + encodeURIComponent(slug)),
  createOpportunity: (body: OpportunityRequest) => request<OpportunityLink>("/opportunities", "POST", body),
  updateOpportunity: (slug: string, body: OpportunityRequest) => request<OpportunityLink>("/opportunities/" + encodeURIComponent(slug), "PUT", body),
  deleteOpportunity: async (slug: string) => {
    try { return await request("/opportunities/" + encodeURIComponent(slug) + "/permanent", "DELETE"); }
    catch (error) {
      if (!(error instanceof ApiError) || error.status !== 405) throw error;
      try { return await request("/opportunities/" + encodeURIComponent(slug) + "/permanent/delete", "POST"); }
      catch (fallback) {
        if (fallback instanceof ApiError && [404, 405].includes(fallback.status)) throw new ApiError(fallback.status, "A exclusão definitiva ainda não está disponível nesta versão do servidor. Atualize a página; se persistir, a publicação da API precisa ser concluída. O hotsite não foi excluído.");
        throw fallback;
      }
    }
  },
  revokeOpportunity: (slug: string) => request("/opportunities/" + encodeURIComponent(slug), "DELETE"),
  resumes: () => request<SavedResume[]>("/resumes"),
  saveResume: (body: ResumeDocument, id?: string) => request<SavedResume>(id ? "/resumes/" + encodeURIComponent(id) : "/resumes", id ? "PUT" : "POST", body),
  deleteResume: (id: string) => request("/resumes/" + encodeURIComponent(id), "DELETE"),
  importJob: (url: string) => request<ImportedJob>("/resumes/import-job", "POST", { url }),
  importJobImage: (data: string, media_type: string) => request<ImportedJob>("/resumes/import-job-image", "POST", { data, media_type }),
  importResumePdf: (data: string) => request<{ content: string; source?: ResumeSource }>("/resumes/import-pdf", "POST", { data }),
  previewLinks: (urls: string[]) => request<LinkPreview[]>("/links/preview", "POST", { urls }),
  importResumeDrive: (url: string) => request<{ content: string; source?: ResumeSource }>("/resumes/import-drive", "POST", { url }),
  /** A IA lê o arquivo original (PDF ou imagem). 1 crédito, devolvido se falhar. */
  readResumeFile: (data: string, media_type: string, source: ResumeSource) => request<{ profile: ImportedProfile; credits: number; content: string; source: ResumeSource }>("/resumes/read-file", "POST", { data, media_type, source }),
  extractProfile: (content: string, source: ResumeSource) => request<{ profile: ImportedProfile; credits: number }>("/resumes/extract-profile", "POST", { content, source }),
  aiStatus: () => request<{ enabled: boolean; features?: string[] }>("/ai/status"),
  aiAdmin: () => request<AiAdmin>("/admin/ai"),
  createAiProvider: (body: AiProviderInput) => request<AiProvider>("/admin/ai", "POST", body),
  updateAiProvider: (id: string, body: AiProviderInput) => request<AiProvider>("/admin/ai/" + encodeURIComponent(id), "PUT", body),
  deleteAiProvider: (id: string) => request<{ ok: true }>("/admin/ai/" + encodeURIComponent(id), "DELETE"),
  testAiProvider: (id: string) => request<{ ok: true; model: string }>("/admin/ai/" + encodeURIComponent(id) + "/test", "POST"),
  adminOverview: () => request<AdminOverview>("/admin/overview"),
  adminUsers: (q = "", show = "todos") => request<{ plans: Record<AdminPlan, string>; users: AdminUser[] }>(`/admin/users?q=${encodeURIComponent(q)}&show=${show}`),
  adminCreateUser: (body: { name: string; email: string; tester: boolean; plan: AdminPlan; ai_credits: number }) => request<{ user: AdminUser; password: string }>("/admin/users", "POST", body),
  adminUpdateUser: (id: string, body: AdminUserPatch) => request<AdminUser>("/admin/users/" + encodeURIComponent(id), "PATCH", body),
  adminResetPassword: (id: string) => request<{ password: string }>("/admin/users/" + encodeURIComponent(id) + "/password", "POST"),
  adminPayments: () => request<{ plans: Record<AdminPlan, string>; methods: Record<string, string>; payments: AdminPayment[] }>("/admin/payments"),
  adminCreatePayment: (body: AdminPaymentInput) => request<AdminPayment>("/admin/payments", "POST", body),
  adminDeletePayment: (id: string) => request<{ ok: true }>("/admin/payments/" + encodeURIComponent(id), "DELETE"),
  adminErrors: (status = "abertos") => request<{ errors: AdminError[] }>("/admin/errors?status=" + status),
  adminResolveError: (id: string, resolved: boolean) => request<{ ok: true; resolved: boolean }>("/admin/errors/" + encodeURIComponent(id), "PATCH", { resolved }),
  adminAdmins: () => request<AdminAdmins>("/admin/admins"),
  adminAddAdmin: (email: string) => request<AdminAdmins & { password: string }>("/admin/admins", "POST", { email }),
  adminRemoveAdmin: (email: string) => request<AdminAdmins>("/admin/admins/" + encodeURIComponent(email), "DELETE"),
  reportError: (body: { message: string; path: string; detail: string }) => request<{ ok: true }>("/errors", "POST", body),
  suggest: (task: "bio" | "work" | "pitch" | "tags" | "resume" | "letter" | "resume_summary" | "job", facts: unknown) =>
    request<{ text: string; credits: number }>("/ai/suggest", "POST", { task, facts: JSON.stringify(facts).slice(0, 26000) }),
  // GET /api/v1/sites/me
  loadPortfolio: () => {
    const p = readJSON<Portfolio>(KEY);
    if (p && (p.plan as string) !== "gratis" && p.plan !== "essencial") p.plan = "essencial"; // planos antigos pro/estudio
    return p;
  },
  // PUT /api/v1/sites/me  (rascunho)  ·  POST /api/v1/sites/me/publish
  savePortfolio: (p: Portfolio): boolean => writeJSON(KEY, p),
  resetPortfolio: () => localStorage.removeItem(KEY),
};

