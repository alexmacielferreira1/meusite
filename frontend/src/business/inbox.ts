import type { BusinessRequest } from "./types";

// QA 12/11/2026: telefone digitado pelo cliente sem DDI (ex.: 51977776666) não abre no wa.me.
export function whatsAppLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const brazilian = !phone.trim().startsWith("+") && (digits.length === 10 || digits.length === 11);
  return `https://wa.me/${brazilian ? `55${digits}` : digits}`;
}

// QA 12/11/2026: a caixa não mostrava se o pedido é para retirar ou entregar.
export function fulfillmentLine(payload: BusinessRequest["payload"], money: (cents: number) => string) {
  if (payload.fulfillment === "pickup") return "Retirar no local";
  if (payload.fulfillment !== "delivery") return "";
  const where = [payload.address, payload.postalCode && `CEP ${payload.postalCode}`].filter(Boolean).join(" · ");
  const fee = payload.deliveryFeeCents ? ` · taxa ${money(payload.deliveryFeeCents)}` : "";
  return `Entrega${where ? `: ${where}` : ""}${fee}`;
}

// QA 12/11/2026: o endereço vinha do nome da pessoa (bruno-teste-qa). Antes da primeira publicação,
// se o endereço ainda é o automático, sugerir o nome do negócio (o campo continua editável).
export function businessSlug(current: string, userName: string, businessName: string, published: boolean, slugify: (s: string) => string) {
  const clean = (s: string) => slugify(s).slice(0, 50).replace(/-$/, "");
  const automatic = !current || current === "meu-negocio" || current === clean(userName);
  const fromBusiness = clean(businessName);
  return !published && automatic && fromBusiness.length >= 2 ? fromBusiness : current;
}
