// IA SIMULADA para a demonstração visual. Na versão real estas funções chamam o
// módulo `ai` do backend (LLM + Whisper/OCR reaproveitados do MediaMind AI).
import type { Profile, Work } from "../types/portfolio";
import { roleById } from "../data/roles";
import { sleep } from "./utils";

export type Tone = "profissional" | "proximo" | "criativo";

export async function generateBio(p: Pick<Profile, "name" | "roleId" | "city">, years: string, focus: string, tone: Tone) {
  await sleep(900);
  const role = roleById(p.roleId).label.toLowerCase();
  const first = p.name.split(" ")[0] || "Eu";
  const area = focus || "projetos de comunicação";
  if (tone === "proximo")
    return `Oi, eu sou ${first}! Trabalho como ${role} há ${years || "alguns"} anos, em ${p.city || "qualquer lugar"}, com foco em ${area}. Gosto de entender a história antes de começar e de entregar com prazo e cuidado.`;
  if (tone === "criativo")
    return `${first} transforma ideias em imagem, som e palavra. ${years ? years + " anos" : "Anos"} como ${role}, ${area} no currículo e uma obsessão: fazer o público sentir antes de entender.`;
  return `${p.name} é ${role} com ${years || "vários"} anos de experiência em ${area}. Atua a partir de ${p.city || "Brasil"} para clientes de todo o país, unindo qualidade técnica, prazo e visão de narrativa.`;
}

export async function generateHeadline(roleId: Profile["roleId"], focus: string) {
  await sleep(500);
  const r = roleById(roleId).label;
  return focus ? `${r} · ${focus}` : r;
}

export async function describeWork(w: Pick<Work, "title" | "client" | "role" | "category" | "software">) {
  await sleep(800);
  const sw = w.software.length ? `, usando ${w.software.join(", ")}` : "";
  return `${w.role || "Trabalho"} para ${w.client || "cliente"} no projeto "${w.title || "sem título"}"${w.category ? ` (${w.category.toLowerCase()})` : ""}${sw}. Responsável pela entrega do início ao fim, com revisões alinhadas ao briefing.`;
}

export async function suggestTags(text: string) {
  await sleep(400);
  const base = ["portfólio", "comunicação"];
  const words = text.toLowerCase().match(/[a-zà-ú]{5,}/g) ?? [];
  return Array.from(new Set([...words.slice(0, 4), ...base])).slice(0, 5);
}
