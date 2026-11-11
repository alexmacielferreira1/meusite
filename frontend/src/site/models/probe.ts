import { demoFor } from "../../data/demoContent";
import { newWork } from "../../lib/workSpreadsheet";
import type { Portfolio } from "../../types/portfolio";
import type { BlockId } from "./blocks";

/**
 * Portfólio com uma marca única em cada bloco, para descobrir o que um modelo mostra. Só usado em testes.
 * Cada lista tem vários itens: alguns modelos só desenham uma seção a partir de 3 ou 4 itens (ex.: processo em 4 etapas).
 * São 6 trabalhos no total, abaixo do limite da galeria completa.
 */
export function probePortfolio(id: string): Portfolio {
  const p = structuredClone(demoFor(id));
  const m = (b: BlockId) => `MK${b}MK`;
  const many = <T,>(make: (i: number) => T, count = 4) => Array.from({ length: count }, (_, i) => make(i));
  p.works = [
    { ...newWork("video"), id: "v", title: m("works"), featured: true, cover: "grad:10" },
    { ...newWork("video"), id: "v2", title: m("works") + "2", cover: "grad:15" },
    { ...newWork("image"), id: "i", title: m("works") + "3", cover: "grad:20" },
    { ...newWork("article"), id: "a", title: m("clipping"), cover: "grad:30" },
    { ...newWork("article"), id: "a2", title: m("clipping") + "2", cover: "grad:35" },
    { ...newWork("audio"), id: "s", title: m("audio"), cover: "grad:40" },
  ];
  p.profile.bio = "Frase de abertura. " + "Texto longo da trajetória profissional com detalhes ".repeat(8) + m("about") + ".";
  p.clients = many((i) => `${m("clients")}${i}`, 5);
  p.services = many((i) => ({ id: `sv${i}`, title: `${m("services")}${i}`, text: "x" }));
  p.profile = { ...p.profile, stats: many((i) => ({ label: `${m("stats")}${i}`, value: String(9 + i) }), 3),
    pillars: many((i) => ({ title: `${m("pillars")}${i}`, text: "x" })) };
  p.experience = many((i) => ({ id: `e${i}`, period: String(2020 - i), title: `${m("experience")}${i}`, org: "x" }), 3);
  p.education = many((i) => ({ id: `d${i}`, period: String(2010 - i), title: `${m("education")}${i}`, org: "x" }), 2);
  p.testimonials = many((i) => ({ id: `t${i}`, quote: `${m("testimonials")}${i}`, author: "x", role: "x" }), 2);
  p.team = many((i) => ({ id: `tm${i}`, name: `${m("team")}${i}`, role: "x" }));
  p.faq = many((i) => ({ id: `f${i}`, question: `${m("faq")}${i}`, answer: "x" }), 3);
  return p;
}
