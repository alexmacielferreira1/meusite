/** Formatos da Administração (datas em segundos, valores em centavos). */
export const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function date(seconds: number | null | undefined, withTime = false) {
  if (!seconds) return "—";
  return new Date(seconds * 1000).toLocaleString("pt-BR", withTime ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "short" });
}

/** Valor de <input type="date"> (AAAA-MM-DD) para segundos, ao meio-dia UTC (não muda de dia pelo fuso). */
export const fromDateInput = (value: string) => (value ? Math.floor(Date.parse(`${value}T12:00:00Z`) / 1000) : null);
export const toDateInput = (seconds: number | null | undefined) => (seconds ? new Date(seconds * 1000).toISOString().slice(0, 10) : "");

/** "R$ 29,90", "29.90" ou "29" para centavos. */
export function parseMoney(value: string) {
  const clean = value.replace(/[^\d,.-]/g, "");
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const amount = Math.round(Number(normalized) * 100);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}
