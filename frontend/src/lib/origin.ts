// Origem do cadastro: as etiquetas UTM do link que trouxe a pessoa (anúncio, grupo, parceiro).
// Ficam só neste navegador, por 30 dias, e vão junto no cadastro; o primeiro link que trouxe a
// pessoa vale (um segundo link não sobrescreve). Sem cookie de terceiros.
const ORIGIN_KEY = "meusite:origem:v1";
const MAX_AGE = 30 * 864e5;
const KEYS = ["source", "medium", "campaign", "content"] as const;

export type Origin = Partial<Record<(typeof KEYS)[number], string>>;

export function readOrigin(now = Date.now()): Origin | null {
  try {
    const raw = localStorage.getItem(ORIGIN_KEY);
    if (!raw) return null;
    const { at, ...origin } = JSON.parse(raw) as Origin & { at?: unknown };
    if (typeof at === "number" && now - at <= MAX_AGE) return origin;
    localStorage.removeItem(ORIGIN_KEY);
    return null;
  } catch {
    return null;
  }
}

export function captureOrigin(search: string, now = Date.now()) {
  const params = new URLSearchParams(search);
  const origin: Origin = {};
  for (const key of KEYS) {
    const value = params.get(`utm_${key}`)?.trim();
    if (value) origin[key] = value.slice(0, 200);
  }
  if (!Object.keys(origin).length || readOrigin(now)) return;
  try { localStorage.setItem(ORIGIN_KEY, JSON.stringify({ ...origin, at: now })); } catch { /* navegador sem armazenamento: cadastro segue sem origem */ }
}

export function clearOrigin() {
  try { localStorage.removeItem(ORIGIN_KEY); } catch { /* idem */ }
}
