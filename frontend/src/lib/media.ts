// Cota de mídia própria. Vídeo por link (YouTube/Vimeo) usa a hospedagem de origem e NÃO conta.
// Valores = hipóteses (docs/MIDIA_E_COTAS.md), a medir com armazenamento + tráfego reais.
import type { Portfolio } from "../types/portfolio";

export const QUOTA_GB: Record<Portfolio["plan"], number> = { gratis: 0.2, essencial: 2 };
export const MAX_FILE_MB: Record<Portfolio["plan"], number> = { gratis: 20, essencial: 500 };
export const MEDIA_EXTRA = [{ gb: 10, price: "R$ 4,90/mês" }, { gb: 50, price: "R$ 14,90/mês" }];

const dataUrlBytes = (s?: string) => (s && s.startsWith("data:") ? Math.round((s.length - s.indexOf(",") - 1) * 0.75) : 0);

/** Bytes usados: arquivos próprios contam uma vez, mesmo reutilizados em várias páginas/hotsites. */
export function usedBytes(p: Portfolio) {
  const seen = new Set<string>();
  let total = dataUrlBytes(p.profile.photo);
  for (const w of p.works) {
    for (const s of [w.cover, w.coverOriginal, ...(w.coverVersions ?? [])]) if (s && !seen.has(s)) { seen.add(s); total += dataUrlBytes(s); }
    total += w.hostedBytes ?? 0;
  }
  return total;
}
export const quotaBytes = (p: Portfolio) => (QUOTA_GB[p.plan] + (p.mediaExtraGb ?? 0)) * 1024 ** 3;
export const fmtBytes = (b: number) => (b >= 1024 ** 3 ? `${(b / 1024 ** 3).toFixed(1)} GB` : `${Math.max(0.1, b / 1024 ** 2).toFixed(1)} MB`);
