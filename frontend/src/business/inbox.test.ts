import { describe, expect, it } from "vitest";
import { fulfillmentLine, whatsAppLink } from "./inbox";

const money = (c: number) => `R$ ${(c / 100).toFixed(2).replace(".", ",")}`;
const base = { name: "Carla", phone: "51977776666" };

describe("QA 12/11: caixa de pedidos", () => {
  it("WhatsApp de número brasileiro sem DDI ganha 55; com DDI fica igual", () => {
    expect(whatsAppLink("(51) 97777-6666")).toBe("https://wa.me/5551977776666");
    expect(whatsAppLink("5133334444")).toBe("https://wa.me/555133334444");
    expect(whatsAppLink("+55 51 97777-6666")).toBe("https://wa.me/5551977776666");
    expect(whatsAppLink("+1 415 555 0100")).toBe("https://wa.me/14155550100");
  });
  it("mostra retirada ou entrega com endereço, CEP e taxa", () => {
    expect(fulfillmentLine({ ...base, fulfillment: "pickup" }, money)).toBe("Retirar no local");
    expect(fulfillmentLine({ ...base, fulfillment: "delivery", address: "Rua A, 10", postalCode: "90000-000", deliveryFeeCents: 700 }, money)).toBe("Entrega: Rua A, 10 · CEP 90000-000 · taxa R$ 7,00");
    expect(fulfillmentLine({ ...base, fulfillment: "delivery" }, money)).toBe("Entrega");
    expect(fulfillmentLine(base, money)).toBe("");
  });
});

import { businessSlug } from "./inbox";
import { slugify } from "../lib/utils";

describe("QA 12/11: endereço do site", () => {
  it("troca o automático pelo nome do negócio antes de publicar; respeita o que a pessoa escolheu", () => {
    expect(businessSlug("bruno-teste-qa", "Bruno Teste QA", "Pizzaria QA do Bairro", false, slugify)).toBe("pizzaria-qa-do-bairro");
    expect(businessSlug("meu-negocio", "", "Ateliê Ana", false, slugify)).toBe("atelie-ana");
    expect(businessSlug("minha-pizza", "Bruno Teste QA", "Pizzaria QA", false, slugify)).toBe("minha-pizza");
    expect(businessSlug("bruno-teste-qa", "Bruno Teste QA", "Pizzaria QA", true, slugify)).toBe("bruno-teste-qa");
    expect(businessSlug("bruno-teste-qa", "Bruno Teste QA", "", false, slugify)).toBe("bruno-teste-qa");
  });
});
