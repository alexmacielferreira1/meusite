import { readLegacyPeriod } from "./timelineDates";
import type { Portfolio } from "../types/portfolio";
import { kindOf, ROLE_KIND, titleFromUrl } from "./linkWorks";
import { uid } from "./utils";
import { newWork, videoCover } from "./workSpreadsheet";

/**
 * Leitura do currículo sem IA (grátis). Entende o PDF do LinkedIn ("Salvar como PDF"),
 * que sempre tem as mesmas seções, e currículos livres com títulos como "Experiência" e "Formação".
 */
export interface ResumeJob { title: string; org: string; period: string; text: string }
export interface ImportedCourse { title: string; org: string; period: string }
export interface ResumeProject { title: string; client: string; year: string; url: string }
export interface ImportedProfile {
  name: string; headline: string; city: string; state: string;
  email: string; phone: string; linkedin: string; website: string; bio: string;
  skills: string[]; experience: ResumeJob[]; education: ImportedCourse[]; projects?: ResumeProject[];
}
export type ResumeSource = "linkedin" | "curriculo";
export interface ImportPicks { basics: boolean; contacts: boolean; bio: boolean; experience: boolean; education: boolean; years: boolean; skills: boolean; works?: boolean }

type Section = "header" | "summary" | "experience" | "education" | "skills" | "languages" | "contact" | "projects" | "other";

const plain = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[:\s]+$/, "").trim();
const HEADINGS: [Section, RegExp][] = [
  ["summary", /^(resumo( profissional)?|perfil( profissional)?|sobre( mim)?|objetivos?( profissional| profissionais)?|apresentacao|quem sou|summary|about( me)?|profile|professional summary)$/],
  ["experience", /^((minhas )?experiencias?( profissional| profissionais| de trabalho)?|historico profissional|trajetoria( profissional)?|carreira|atuacao( profissional)?|empregos anteriores|experience|work experience|work history|employment( history)?)$/],
  ["education", /^(formacao( academica| escolar)?|educacao|escolaridade|graduacao|education|academic background)$/],
  ["skills", /^(principais competencias|competencias( tecnicas)?|habilidades( tecnicas)?|cursos( e qualificacoes| complementares| livres| e certificacoes)?|qualificacoes|certificacoes|certificados|certifications|top skills|(hard |soft |technical )?skills|ferramentas|softwares?|programas|conhecimentos( tecnicos| em informatica)?|tools)$/],
  ["languages", /^(idiomas|languages|linguas)$/],
  ["contact", /^(contato|contact|dados pessoais)$/],
  ["projects", /^(projetos( de destaque| realizados)?|principais (projetos|trabalhos)|portfolio|trabalhos( de destaque| realizados| selecionados)?|destaques)$/],
  ["other", /^(premios|honors-awards|publicacoes|publications|referencias|voluntariado|patents)$/],
];
/** Título de seção, aceitando numeração, símbolos e dois-pontos: "1. EXPERIÊNCIA:", "■ Formação". */
const headingOf = (line: string) => {
  if (line.length > 60) return undefined;
  const key = plain(line).replace(/^[\d\s.)•●■▪◦*#|>–—-]+/, "").replace(/[\s:–—-]+$/, "");
  return HEADINGS.find(([, pattern]) => pattern.test(key))?.[0];
};

const MONTH = "(?:jan|fev|feb|mar|abr|apr|mai|may|jun|jul|ago|aug|set|sep|out|oct|nov|dez|dec)[a-zç]*\\.?";
const POINT = `(?:${MONTH}(?:\\s*(?:de|\\/)\\s*|\\s+)|(?:0?[1-9]|1[0-2])[/.])?(?:19|20)\\d{2}`;
const NOW = "o momento|momento atual|atual(?:mente)?|presente|present|hoje|current|now|em andamento";
const PERIOD = new RegExp(`(${POINT})(?:\\s*[-–—]\\s*|\\s+(?:a|at[eé]|to)\\s+)(${POINT}|${NOW})`, "i");
const SINCE = new RegExp(`(?:\\bdesde\\b|\\bsince\\b|\\ba partir de\\b)\\s+(${POINT})`, "i");
const SINGLE = new RegExp(`[-–—]\\s*(${MONTH}\\s*(?:de|\\/)\\s*(?:19|20)\\d{2})\\s*$`, "i");
const DURATION = /^\(?\d+\s+(anos?|years?|m[eê]s(es)?|months?)(\s+\d+\s+(m[eê]s(es)?|months?))?\)?$/i;
/** Local de trabalho no LinkedIn: "São Paulo e Região", "Área metropolitana de...", "Remoto", "Greater X Area". */
const WORKPLACE = /^(.{2,60}\s(e regi[aã]o|area|region)|[aá]rea metropolitana .{2,60}|remot[oe]|h[ií]brido|hybrid|presencial|on-site)(\s*\(.*\))?$/i;
const BULLET =/^[•●▪◦·\-–*]\s*/;
const STATES: Record<string, string> = {
  acre: "AC", alagoas: "AL", amapa: "AP", amazonas: "AM", bahia: "BA", ceara: "CE", "distrito federal": "DF", "espirito santo": "ES",
  goias: "GO", maranhao: "MA", "mato grosso": "MT", "mato grosso do sul": "MS", "minas gerais": "MG", para: "PA", paraiba: "PB", parana: "PR",
  pernambuco: "PE", piaui: "PI", "rio de janeiro": "RJ", "rio grande do norte": "RN", "rio grande do sul": "RS", rondonia: "RO",
  roraima: "RR", "santa catarina": "SC", "sao paulo": "SP", sergipe: "SE", tocantins: "TO",
};
const UF = new Set(Object.values(STATES));

const squash = (value: string) => value.replace(/\s+/g, " ").trim();
const titleCase = (value: string) => value === value.toUpperCase() && /\p{Lu}{2}/u.test(value)
  ? value.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_all, space, letter) => space + letter.toUpperCase()).replace(/ (D[aeo]s?|E) /g, (word) => word.toLowerCase())
  : value;
const isNameLike = (line: string) => {
  const words = line.split(" ");
  return words.length >= 2 && words.length <= 6 && line.length <= 60 && !/[\d@|/:]/.test(line)
    && words.every((word) => /^\p{Lu}/u.test(word) || /^(de|da|do|dos|das|e)$/i.test(word));
};

function location(line: string): { city: string; state: string } | null {
  const short = /^([\p{L}][\p{L} .'-]+?)\s*[-–,/]\s*([A-Z]{2})\b/u.exec(line);
  if (short && UF.has(short[2])) return { city: squash(short[1]), state: short[2] };
  const parts = line.split(",").map(squash);
  if (parts.length >= 2 && parts.length <= 3 && !/\d/.test(line)) {
    const state = STATES[plain(parts[1])];
    if (state || /^(brasil|brazil)$/i.test(parts[parts.length - 1])) return { city: parts[0], state: state ?? "" };
  }
  return null;
}

function contacts(text: string) {
  const email = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.exec(text)?.[0] ?? "";
  const handle = /linkedin\.com\/in\/([\w%-]+)/i.exec(text)?.[1];
  const urls = [...text.matchAll(/(?:https?:\/\/|www\.)[^\s|<>()]+/gi)].map((match) => match[0].replace(/[.,;]+$/, ""))
    .filter((url) => !/linkedin\.com/i.test(url) && !url.includes("@"));
  const website = urls[0] ? (/^https?:/i.test(urls[0]) ? urls[0] : `https://${urls[0]}`) : "";
  const phoneMatch = [...text.matchAll(/(?:\+?55[\s-]?)?\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4,5}/g)].map((match) => match[0].replace(/\D/g, ""))
    .find((digits) => digits.length >= 10 && digits.length <= 13 && !/^(19|20)\d{2}/.test(digits));
  const phone = phoneMatch ? (phoneMatch.length <= 11 ? `55${phoneMatch}` : phoneMatch) : "";
  return { email, phone, website, linkedin: handle ? `https://www.linkedin.com/in/${handle}` : "" };
}

function splitSkills(lines: string[]) {
  const seen = new Set<string>();
  return lines.flatMap((line) => line.replace(BULLET, "").split(/\s*[|•;]\s*|\s+·\s+|,\s+/))
    .map((skill) => squash(skill.replace(/\((?:linkedin|portfolio|portf[oó]lio)\)/i, "")))
    .filter((skill) => skill.length >= 2 && skill.length <= 80 && !/linkedin\.com|@/.test(skill)
      && !seen.has(plain(skill)) && Boolean(seen.add(plain(skill))))
    .slice(0, 30);
}

function joinText(lines: string[]) {
  return squash(lines.map((line) => line.replace(BULLET, "")).join(" ")).slice(0, 1200);
}

export function parseExperience(lines: string[]): ResumeJob[] {
  const dates = lines.map((line, index) => ({ index, match: BULLET.test(line) ? null : PERIOD.exec(line) ?? SINCE.exec(line) ?? SINGLE.exec(line) }))
    .filter((item) => item.match);
  const jobs: (ResumeJob & { start: number; end: number })[] = [];
  dates.forEach(({ index, match }, k) => {
    const m = match!;
    const period = m[2] ? squash(`${m[1]} - ${m[2]}`) : /^(desde|since|a partir)/i.test(m[0]) ? squash(`${m[1]} - atual`) : squash(m[1]);
    const before = squash(lines[index].slice(0, m.index).replace(/[\s–—\-|,(]+$/, ""));
    const previous = jobs[k - 1];
    const floor = previous ? previous.end : -1;
    const orgLike = (at: number) => at > floor && !BULLET.test(lines[at]) && /^\p{Lu}/u.test(lines[at]) && !/\.$/.test(lines[at]);
    let title = before, org = "", start = index, cursor = index - 1;
    if (!title && cursor > floor) { title = lines[cursor]; start = cursor; cursor--; }
    if (cursor > floor && DURATION.test(lines[cursor])) cursor--;
    if (cursor >= 0 && orgLike(cursor)) { org = lines[cursor]; start = cursor; }
    else if (!before && previous) org = previous.org;
    let end = index + 1;
    if (lines[end] && (location(lines[end]) || WORKPLACE.test(lines[end]))) end++;
    jobs.push({ title: title.slice(0, 160), org: org.slice(0, 160), period, text: "", start, end });
  });
  jobs.forEach((job, k) => {
    const stop = jobs[k + 1]?.start ?? lines.length;
    job.text = joinText(lines.slice(job.end, stop));
    job.end = Math.max(job.end, stop);
  });
  return jobs.filter((job) => job.title || job.org).slice(0, 30).map(({ title, org, period, text }) => ({ title, org, period, text }));
}

export function parseEducation(lines: string[]): ImportedCourse[] {
  const items = lines.map((line) => line.replace(BULLET, "")).filter(Boolean);
  const linkedin = items.some((line) => /·\s*\(/.test(line));
  const courses: ImportedCourse[] = [];
  items.forEach((line, index) => {
    if (linkedin) {
      const degree = /^(.*?)\s*·\s*\((.*)\)\s*$/.exec(line);
      if (degree) courses.push({ title: squash(degree[1]), org: squash(items[index - 1] ?? ""), period: squash(degree[2]) });
      else if (!/·\s*\(/.test(items[index + 1] ?? "")) courses.push({ title: squash(line), org: "", period: "" });
      return;
    }
    const year = /\(?((?:19|20)\d{2}(?:\s*[-–]\s*(?:(?:19|20)\d{2}|atual|cursando))?)\)?\s*$/i.exec(line);
    const rest = squash(year ? line.slice(0, year.index) : line).replace(/[\s,–—-]+$/, "");
    const parts = rest.split(/\s+[–—-]\s+|,\s+/).filter(Boolean);
    if (!parts.length) return;
    courses.push({ title: (parts.length > 1 ? parts.slice(0, -1).join(" – ") : parts[0]).slice(0, 160),
      org: parts.length > 1 ? parts[parts.length - 1].slice(0, 160) : "", period: year?.[1] ?? "" });
  });
  return courses.slice(0, 30);
}

const MEDIA = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]{11}|youtu\.be\/[\w-]{11}|vimeo\.com\/\d+|open\.spotify\.com\/[\w/]+|soundcloud\.com\/[\w/-]+|behance\.net\/gallery\/[\w/-]+)[^\s|,;)]*/gi;

/** Projeto citado: "3% (Netflix)", "Documentário Rios – 2021", "Campanha X https://youtu.be/...". */
function project(raw: string): ResumeProject {
  const url = new RegExp(MEDIA.source, "i").exec(raw)?.[0] ?? /https?:\/\/[^\s|,;)]+/.exec(raw)?.[0] ?? "";
  let rest = squash(raw.replace(BULLET, "").replace(url, "").replace(/[\s.:–—-]+$/, ""));
  const year = /\b((?:19|20)\d{2})\b/.exec(rest)?.[1] ?? "";
  if (year) rest = squash(rest.replace(new RegExp(`[\\s(–—-]*${year}\\)?`), "")).replace(/[\s.:–—-]+$/, "");
  const client = /\(([^)]+)\)\s*$/.exec(rest);
  return { title: squash(client ? rest.slice(0, client.index) : rest).slice(0, 160), client: squash(client?.[1] ?? "").slice(0, 120), year, url: url ? (/^https?:/i.test(url) ? url : `https://${url}`) : "" };
}

export function parseProjects(lines: string[], text: string): ResumeProject[] {
  const list = lines.map(project);
  for (const match of text.matchAll(/(?:destaques de projetos|projetos de destaque|principais projetos|projetos realizados)\s*:\s*([^\n]+)/gi)) {
    list.push(...match[1].replace(/\.\s*$/, "").split(/,\s*|\s+e\s+(?=[\p{Lu}\d])/u).map(project));
  }
  for (const url of text.match(MEDIA) ?? []) list.push(project(url));
  const seen = new Set<string>();
  return list.filter((item) => {
    const key = plain(item.url || item.title);
    if (!key || key.length < 2 || seen.has(key) || (!item.url && item.title.length > 120)) return false;
    seen.add(key);
    return true;
  }).slice(0, 30);
}

export function parseResume(text: string, source: ResumeSource = "curriculo"): ImportedProfile {
  const lines = text.split(/\r?\n/).map(squash).filter((line) => line && !/^(page|página) \d+ (of|de) \d+$/i.test(line));
  const result: ImportedProfile = { name: "", headline: "", city: "", state: "", bio: "", skills: [], experience: [], education: [], ...contacts(text) };
  // No LinkedIn, nome, título e cidade ficam logo antes do Resumo (ou da Experiência), depois da coluna lateral.
  let intro: number[] = [];
  if (source === "linkedin") {
    const main = lines.findIndex((line) => ["summary", "experience"].includes(headingOf(line) ?? ""));
    const limit = main < 0 ? lines.length : main;
    let place = -1;
    for (let i = limit - 1; i >= 0 && place < 0; i--) if (location(lines[i])) place = i;
    const anchor = place >= 0 ? place : limit;
    let nameAt = -1;
    for (let i = anchor - 1; i >= Math.max(0, anchor - 5) && nameAt < 0; i--) if (isNameLike(lines[i]) && !headingOf(lines[i])) nameAt = i;
    if (nameAt >= 0) {
      result.name = lines[nameAt];
      result.headline = squash(lines.slice(nameAt + 1, anchor).join(" "));
      intro = Array.from({ length: anchor - nameAt + (place >= 0 ? 1 : 0) }, (_, i) => nameAt + i);
    }
    if (place >= 0) Object.assign(result, location(lines[place]));
  }
  const sections: Record<Section, string[]> = { header: [], summary: [], experience: [], education: [], skills: [], languages: [], contact: [], projects: [], other: [] };
  let current: Section = "header";
  lines.forEach((line, index) => {
    if (intro.includes(index)) return;
    const heading = headingOf(line);
    if (heading) current = heading;
    else sections[current].push(line);
  });
  if (source !== "linkedin") {
    const header = sections.header;
    const nameLine = header.find((line) => isNameLike(titleCase(line)));
    result.name = nameLine ? titleCase(nameLine) : "";
    result.headline = header.find((line) => line !== nameLine && !location(line) && !/@|https?:|www\.|\d{4}/.test(line) && line.length > 3) ?? "";
    const place = header.map(location).find(Boolean);
    if (place) Object.assign(result, place);
  }
  result.headline = result.headline.slice(0, 160);
  result.bio = joinText(sections.summary).slice(0, 1500);
  // Sem o título "Experiência", procura cargos com datas no restante do texto (fora de resumo e formação).
  result.experience = parseExperience(sections.experience.length ? sections.experience : [...sections.header, ...sections.other]);
  result.education = parseEducation(sections.education);
  result.skills = splitSkills(sections.skills);
  result.projects = parseProjects(sections.projects, lines.join("\n"));
  return result;
}

/**
 * O que a pessoa deve conferir depois da leitura. Currículos fora do padrão são o normal:
 * em vez de errar calado, a leitura aponta os campos vazios ou duvidosos.
 */
export function reviewNotes(profile: ImportedProfile): string[] {
  const jobs = profile.experience;
  const noOrg = jobs.filter((job) => !job.org).length;
  const merged = jobs.filter((job) => job.title.split(" ").length > 9).length;
  return [
    !profile.name && "Falta o nome: escreva acima.",
    !profile.headline && "Falta o título profissional (ex.: Editor de vídeo).",
    profile.headline.length > 120 && "O título ficou longo: confira se juntou outras linhas.",
    !jobs.length && "Nenhuma experiência encontrada: dá para adicionar depois, em Meu perfil.",
    noOrg > 0 && `${noOrg} experiência(s) sem empresa: confira se cargo e empresa ficaram na mesma linha.`,
    merged > 0 && `${merged} cargo(s) longo(s): confira se o nome da empresa entrou junto.`,
    !profile.education.length && "Falta a formação: dá para adicionar depois.",
    !profile.email && !profile.phone && "Falta um contato (e-mail ou telefone).",
  ].filter((note): note is string => Boolean(note));
}

/** Junta duas leituras: vale a primeira (IA) e o que ela deixou vazio vem da segunda (leitura grátis). */
export function mergeProfiles(main: ImportedProfile, backup: ImportedProfile): ImportedProfile {
  const pickText = (key: "name" | "headline" | "city" | "state" | "email" | "phone" | "linkedin" | "website" | "bio") => main[key]?.trim() ? main[key] : backup[key];
  const pickList = <T,>(a: T[] | undefined, b: T[] | undefined) => (a?.length ? a : b ?? []);
  return {
    name: pickText("name"), headline: pickText("headline"), city: pickText("city"), state: pickText("state"),
    email: pickText("email"), phone: pickText("phone"), linkedin: pickText("linkedin"), website: pickText("website"), bio: pickText("bio"),
    skills: pickList(main.skills, backup.skills), experience: pickList(main.experience, backup.experience),
    education: pickList(main.education, backup.education), projects: pickList(main.projects, backup.projects),
  };
}

/** Anos desde a experiência mais antiga encontrada. */
export function yearsOfExperience(profile: ImportedProfile, now = new Date().getFullYear()) {
  const years = profile.experience.flatMap((job) => [...job.period.matchAll(/(?:19|20)\d{2}/g)].map((match) => Number(match[0])));
  return years.length ? Math.max(0, now - Math.min(...years)) : 0;
}

/** Trabalhos a partir dos projetos do currículo. Com link entram públicos; sem link, como rascunho privado. */
export function projectWorks(p: Portfolio, data: ImportedProfile) {
  const titles = new Set(p.works.map((work) => plain(work.title)));
  const links = new Set(p.works.map((work) => work.mediaUrl).filter(Boolean));
  const role = squash((data.headline.split("|")[0] || data.experience[0]?.title || "").replace(/\(.*?\)/g, "")).slice(0, 120);
  return (data.projects ?? []).filter((item) => !titles.has(plain(item.title)) && !links.has(item.url)).map((item) => ({
    ...newWork(item.url ? kindOf(item.url) : ROLE_KIND[p.profile.roleId]),
    title: item.title || titleFromUrl(item.url) || "Trabalho do currículo",
    client: item.client, year: item.year || String(new Date().getFullYear()), role,
    mediaUrl: item.url, cover: videoCover(item.url) || "grad:265",
    visibility: (item.url ? "public" : "private") as "public" | "private",
  }));
}

export function applyImport(p: Portfolio, data: ImportedProfile, picks: ImportPicks): Portfolio {
  const keep = (value: string, fallback: string) => value.trim() || fallback;
  const profile = { ...p.profile };
  if (picks.basics) Object.assign(profile, { name: keep(data.name, profile.name), headline: keep(data.headline, profile.headline),
    city: keep(data.city, profile.city), state: keep(data.state, profile.state) });
  if (picks.contacts) Object.assign(profile, { email: keep(data.email, profile.email), whatsapp: keep(data.phone, profile.whatsapp),
    linkedin: keep(data.linkedin, profile.linkedin), website: keep(data.website, profile.website) });
  if (picks.bio && data.bio.trim()) profile.bio = data.bio.trim();
  const years = yearsOfExperience(data);
  if (picks.years && years) profile.stats = [{ label: "anos de experiência", value: `${years}+` }, ...profile.stats.filter((stat) => stat.label !== "anos de experiência")].slice(0, 6);
  if (picks.skills && data.skills.length) profile.pillars = data.skills.slice(0, 40).map((title) => ({ title, text: "" }));
  return {
    ...p, profile,
    experience: picks.experience && data.experience.length ? data.experience.map((job) => ({ id: uid(), ...job, ...readLegacyPeriod(job.period) })) : p.experience,
    education: picks.education && data.education.length ? data.education.map((course) => ({ id: uid(), ...course, ...readLegacyPeriod(course.period) })) : p.education,
    works: picks.works && data.projects?.length ? [...projectWorks(p, data), ...p.works].slice(0, 250) : p.works,
  };
}

