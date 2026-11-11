import { Instagram, Linkedin, Mail, Menu as MenuIcon, MessageCircle, Play } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { coverStyle, initials } from "../../lib/utils";
import { roleById } from "../../data/roles";
import type { RoleId, Work } from "../../types/portfolio";
import { useSite } from "../kit";
import { modelMenu, type MenuItem } from "./navigation";
import { arrange } from "./order";
import { PhotoLayer, useLookOn } from "./PhotoLayer";

/** Páginas exclusivas por modelo. A estrutura é fixa; a pessoa troca só cor de destaque, tipografia e cantos.
 *  Os breakpoints usam container queries (@3xl, @5xl) para a prévia em miniatura ficar igual ao site real. */

export function usePage() {
  const { p, openWork, contact, theme } = useSite();
  const pr = p.profile;
  const kind:Work["kind"] = /audio|podcast|locucao|sonor|locutor/.test(p.site.templateId)?"audio":/editorial|arquivo|jornal|clipping|texto|materias|imprensa/.test(p.site.templateId)?"article":/roteiro|script/.test(p.site.templateId)?"script":/editor-pro|cinema|filme|video|documental|direcao|producao|vfx|colorista|montagem/.test(p.site.templateId)?"video":"image";
  const of = (...kinds: Work["kind"][]) => p.business ? (kinds.includes(kind)?p.works:[]) : p.works.filter((w) => kinds.includes(w.kind));
  const lead = (list: Work[]) => list.find((w) => w.featured) ?? list[0];
  const head = theme.font === "serif" ? "font-serif" : theme.font === "display" ? "font-display" : "font-sans";
  const round = theme.radius === "none" ? "rounded-none" : theme.radius === "lg" ? "rounded-2xl" : "rounded-md";
  const mail = pr.email ? `mailto:${pr.email}` : pr.whatsapp ? `https://wa.me/${pr.whatsapp}` : undefined;
  return {
    p, pr, openWork, contact, head, round, mail, lead,
    videos: of("video"), visual: of("video", "image", "script"), articles: of("article"), audios: of("audio"),
    images: of("image"), scripts: of("script"),
  };
}

/** Raiz da página: paleta fixa do modelo, destaque vindo do tema. */
/** Sem janela (renderização no servidor ou em testes) o efeito de layout não roda e o React avisa. */
function useBrowserLayoutEffect(effect: () => void) {
  (typeof window === "undefined" ? useEffect : useLayoutEffect)(effect);
}

export function Page({ bg, ink, className = "", children }: { bg: string; ink: string; className?: string; children: ReactNode }) {
  const { p } = useSite();
  const ref = useRef<HTMLDivElement>(null);
  const order = p.site.blockOrder;
  // Ordem escolhida pela pessoa: troca as seções de blocos de lugar entre si (veja order.ts).
  useBrowserLayoutEffect(() => {
    const kids = [...ref.current!.children] as HTMLElement[];
    const orders = order?.length ? arrange(kids.map((kid) => ({ id: kid.id, block: kid.dataset.block })), p.site.templateId, order) : null;
    kids.forEach((kid, index) => { kid.style.order = orders ? String(orders[index]) : ""; });
  });
  return <div ref={ref} className={`@container min-h-full font-sans ${order?.length ? "flex flex-col" : ""} ${className}`} style={{ backgroundColor: p.site.theme.background??bg, color: p.site.theme.ink??ink, "--fc-content-width": `${p.site.presentation?.contentWidth??"1200"}px` } as CSSProperties}>{children}</div>;
}

export const Box = ({ children, className = "" }: { children: ReactNode; className?: string }) =>
  <div className={`mx-auto w-full max-w-[1200px] px-6 @3xl:px-10 ${className}`} style={{maxWidth:"var(--fc-content-width, 1200px)"}}>{children}</div>;

/**
 * Tamanho do título conforme o comprimento. Títulos curtos mantêm o desenho do modelo; longos encolhem
 * pela largura da página (container query), sem estourar o topo.
 */
export function fit(text: string): CSSProperties | undefined {
  const size = text.length;
  if (size <= 45) return undefined;
  if (size <= 70) return { fontSize: "clamp(1.7rem, 4.2cqw, 3.4rem)", lineHeight: 1.08 };
  if (size <= 110) return { fontSize: "clamp(1.5rem, 3.2cqw, 2.6rem)", lineHeight: 1.12 };
  return { fontSize: "clamp(1.35rem, 2.6cqw, 2.1rem)", lineHeight: 1.15 };
}

export { firstSentence, summary } from "./summary";

/** Profissão para o rótulo do topo; no perfil híbrido, a principal e as outras ("Editor · Jornalista"). */
export function roleText(pr: { roleId: RoleId; roles?: RoleId[]; professions?: string[] }, form: "label" | "short" = "label") {
  if(pr.professions?.length)return pr.professions.join(" · ");
  const extra = (pr.roles ?? []).filter((id) => id !== pr.roleId);
  if (!extra.length) return roleById(pr.roleId)[form];
  return [pr.roleId, ...extra].map((id) => roleById(id).short).join(" · ");
}

export function Cover({ src, className = "", children, label, position, as: Tag = "div" }: { src?: string; className?: string; children?: ReactNode; label?: string; position?: string; as?: "div" | "span" }) {
  const on = useLookOn(src);
  return (
    // "relative" só quando a capa não vem posicionada: no CSS do Tailwind, relative vence absolute e a capa sumia (altura zero).
    // Com acabamento, "isolate" cria o contexto para a camada (-z-10) ficar atrás dos filhos e à frente do fundo da página.
    <Tag role={label ? "img" : undefined} aria-label={label} className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative "}overflow-hidden ${on ? "isolate " : ""}${className}`}
      style={on ? undefined : src ? { ...coverStyle(src), ...(position && { backgroundPosition: position }) } : { background: "rgba(127,127,127,.2)" }}>
      {on && <PhotoLayer src={src!} position={position} />}{children}</Tag>
  );
}

/** Enquadramento do retrato: ponto de foco escolhido pela pessoa; padrão um pouco acima do centro (rosto). */
export const photoPosition = (focus?: { x: number; y: number }) => `${focus?.x ?? 50}% ${focus?.y ?? 30}%`;

/** Retrato da pessoa, ou iniciais na cor de destaque. */
export function Portrait({ className = "" }: { className?: string }) {
  const { pr } = usePage();
  if (pr.photo) return <Cover src={pr.photo} className={className} label={`Retrato de ${pr.name}`} position={photoPosition(pr.photoFocus)} />;
  return <div className={`grid place-items-center bg-[var(--accent)] text-5xl font-bold text-[var(--on-accent)] ${className}`}>{initials(pr.name)}</div>;
}

export const PlayDot = ({ size = 56, className = "" }: { size?: number; className?: string }) => (
  <span className={`grid place-items-center rounded-full bg-[var(--accent)] text-[var(--on-accent)] shadow-xl ${className}`} style={{ width: size, height: size }}>
    <Play size={size * 0.38} fill="currentColor" />
  </span>
);

/** Botão para abrir um trabalho no modal com capa e legenda. */
export function WorkTile({ w, ratio = "aspect-video", round = "", meta, children, className = "", play = true }: {
  w: Work; ratio?: string; round?: string; meta?: string; children?: ReactNode; className?: string; play?: boolean;
}) {
  const { openWork } = usePage();
  return (
    <button onClick={() => openWork(w.id)} className={`group block w-full text-left ${className}`}>
      <Cover src={w.cover} className={`${ratio} ${round}`}>
        <div className="absolute inset-0 transition group-hover:bg-black/10" />
        {play && w.kind === "video" && <PlayDot size={34} className="absolute bottom-3 right-3" />}
      </Cover>
      {children ?? (
        <span className="mt-3 block">
          <span className="block font-semibold group-hover:underline">{w.title}</span>
          {meta && <span className="mt-0.5 block text-xs opacity-60">{meta}</span>}
        </span>
      )}
    </button>
  );
}

/** Shared navigation for every model: only visible targets; all sections on mobile too. */
export function Nav({ items, className = "", native = true }: { items: MenuItem[]; className?: string; native?: boolean }) {
  const { p, theme } = useSite();
  const ref = useRef<HTMLElement>(null);
  const candidates = native ? modelMenu(p, items) : items.filter(([, , show]) => show);
  const [targets, setTargets] = useState<string[] | null>(null);

  useBrowserLayoutEffect(() => {
    const root = ref.current?.closest(".fc-site");
    if (!root || ref.current?.closest('[aria-hidden="true"]')) return;
    const ids = [...root.querySelectorAll<HTMLElement>("[id]")].filter((el) => !el.hidden && !el.closest("[hidden]")).map((el) => el.id);
    setTargets((old) => JSON.stringify(old) === JSON.stringify(ids) ? old : ids);
  });
  const menu = candidates.filter(([, href]) => !targets || targets.includes(href.slice(1)));
  const find=(label:string)=>menu.find(([name])=>name===label);
  const about=find("Sobre") ?? (!p.site.hidden?.includes("about") && (p.profile.bio || p.profile.manifesto) ? ["Sobre","#inicio",true] as MenuItem : undefined);
  const featured=menu.find(([name])=>/^(Destaques|Projetos|Vitrine|Produções|Cases|Filmes|Shots|Reel|Reportagens|Publicações|Clippings|Demos|Áudios)$/.test(name));
  const selected:MenuItem[]=[...(about?[about]:[]),...(featured?[["Destaque",featured[1],true] as MenuItem]:[]),...(["Galeria","Formação","Experiência"].map(find).filter(Boolean) as MenuItem[]),...(find("Contato")?[find("Contato")!]:!targets||targets.includes("contato")?[["Contato","#contato",true] as MenuItem]:[])];
  const focused=selected.filter((item,i,all)=>all.findIndex(x=>x[0]===item[0])===i);
  const measure=useRef<HTMLDivElement>(null);
  const dropdownRef=useRef<HTMLDetailsElement>(null);
  const [fits,setFits]=useState(6);
  useEffect(()=>{
    const nav=ref.current, parent=nav?.parentElement;if(!nav||!parent||nav.closest('[aria-hidden="true"]'))return;
    const resize=()=>{
      const styles=getComputedStyle(parent),gap=parseFloat(styles.columnGap)||12;
      const siblings=[...parent.children].filter(x=>x!==nav) as HTMLElement[];
      const available=Math.max(44,parent.clientWidth-(parseFloat(styles.paddingLeft)||0)-(parseFloat(styles.paddingRight)||0)-siblings.reduce((n,x)=>n+x.getBoundingClientRect().width,0)-gap*siblings.length);
      const widths=[...(measure.current?.children??[])].map(x=>(x as HTMLElement).getBoundingClientRect().width+4);
      const total=widths.reduce((n,x)=>n+x,0);let used=0,count=0;
      if(total<=available)count=widths.length;else for(const width of widths){if(used+width+44>available)break;used+=width;count++;}
      setFits(old=>old===count?old:count);
    };
    const ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;
    ro?.observe(parent);resize();window.addEventListener("resize",resize);let active=true;
    void document.fonts?.ready.then(()=>{if(active)resize();});
    return()=>{active=false;ro?.disconnect();window.removeEventListener("resize",resize);};
  },[focused.map(x=>x[0]+x[1]).join("|")]);
  useEffect(()=>{
    const close=(event:PointerEvent)=>{if(!ref.current?.contains(event.target as Node))dropdownRef.current?.removeAttribute("open");};
    document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close);
  },[]);
  const direct=focused.slice(0,fits),rest=focused.slice(fits);
  const link=([label,href]:MenuItem)=><a key={label} href={href} onClick={()=>dropdownRef.current?.removeAttribute("open")} className="block whitespace-nowrap rounded px-2 py-2 opacity-85 hover:opacity-100 focus-visible:opacity-100">{label}</a>;
  return <nav ref={ref} aria-label="Seções do site" className={`relative flex min-w-0 shrink items-center justify-end gap-1 text-sm ${className}`}>
    <div ref={measure} aria-hidden="true" className="pointer-events-none invisible absolute flex w-max" style={{insetInlineEnd:0}}>{focused.map(([label])=><span key={label} className="whitespace-nowrap px-2 py-2">{label}</span>)}</div>
    {direct.map(link)}
    {rest.length>0&&<details ref={dropdownRef} className="relative shrink-0" onKeyDown={e=>{if(e.key==="Escape"){e.currentTarget.removeAttribute("open");e.currentTarget.querySelector("summary")?.focus();}}}>
      <summary aria-label="Abrir navegação" className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-current/20 [&::-webkit-details-marker]:hidden"><MenuIcon size={20}/></summary>
      <div className={`absolute right-0 top-full z-50 mt-2 max-h-[65vh] min-w-48 max-w-[85vw] overflow-auto rounded-2xl border p-2 text-sm shadow-xl ${theme.mode==="dark"?"border-white/15 bg-slate-950 text-white":"border-slate-200 bg-white text-slate-900"}`}>{rest.map(link)}</div>
    </details>}
  </nav>;
}

export function Socials({ className = "" }: { className?: string }) {
  const { pr, contact } = usePage();
  const links = [
    pr.email && { href: `mailto:${pr.email}`, label: "E-mail", icon: <Mail size={18} /> },
    pr.whatsapp && { href: `https://wa.me/${pr.whatsapp}`, label: "WhatsApp", icon: <MessageCircle size={18} /> },
    pr.instagram && { href: `https://instagram.com/${pr.instagram}`, label: "Instagram", icon: <Instagram size={18} /> },
    pr.linkedin && { href: `https://linkedin.com/in/${pr.linkedin}`, label: "LinkedIn", icon: <Linkedin size={18} /> },
  ].filter(Boolean) as { href: string; label: string; icon: ReactNode }[];
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {links.map((l) => <a key={l.label} href={l.href} onClick={contact} aria-label={l.label} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="opacity-80 hover:opacity-100">{l.icon}</a>)}
    </div>
  );
}

/** Botão de contato principal (e-mail ou WhatsApp cadastrado). */
export function ContactButton({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { mail, contact } = usePage();
  if (!mail) return null;
  return <a href={mail} onClick={contact} target={mail.startsWith("http") ? "_blank" : undefined} rel="noreferrer"
    className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold ${className}`}>{children}</a>;
}

export const Eyebrow = ({ children, className = "" }: { children: ReactNode; className?: string }) =>
  <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${className}`}>{children}</p>;

/** Linha de contato discreta para rodapés: e-mail visível ou WhatsApp. */
export function ContactLine() {
  const { pr, mail, contact } = usePage();
  if (!mail) return null;
  return <a href={mail} onClick={contact} target={mail.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="underline">{pr.email || "WhatsApp"}</a>;
}

/** Retratos da equipe cadastrada. Some quando não há integrantes. */
export function TeamStrip({ title = "Nossa equipe", className = "", gray = false }: { title?: string; className?: string; gray?: boolean }) {
  const { p, head } = usePage();
  const team = (p.team ?? []).filter((m) => m.name);
  if (!team.length) return null;
  return (
    <section id="equipe" className={`py-10 ${className}`}><Box>
      <h2 className={`${head} mb-5 text-xl font-bold`}>{title}</h2>
      <ul className={`grid grid-cols-2 gap-5 ${team.length === 5 ? "@3xl:grid-cols-5" : "@3xl:grid-cols-4"}`}>{team.map((m) => (
        <li key={m.id}>
          {m.photo ? <Cover src={m.photo} className={`aspect-square ${gray ? "grayscale" : ""}`} label={`Foto de ${m.name}`} /> : <div className="grid aspect-square place-items-center bg-[var(--accent)] text-3xl font-bold text-[var(--on-accent)]">{initials(m.name)}</div>}
          <b className="mt-2 block text-sm">{m.name}</b>{m.role && <span className="text-xs opacity-60">{m.role}</span>}
        </li>))}</ul>
    </Box></section>
  );
}

