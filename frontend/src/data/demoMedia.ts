import type { RoleId } from "../types/portfolio";
const media = (name: string) => `/brand/folios/demos/${name}.webp`;
/** AI-generated fictional imagery only for examples. Never applied to client records. */
export function examplePortrait(role: RoleId, name: string) {
  if (/estúdio|estudio|coletivo|büro|studio|aprende/i.test(name)) return media(role === "designer" || role === "social" ? "projeto-design" : "projeto-cinema");
  if (role === "fotografo") return media("fotografia-retrato");
  if (/helena|luna|clara|lia|ana|marina|nina|luísa|bia|laura|lara|cami|ines|inês|joana|julia|júlia|beatriz|sofia|aline|isabela|luiza|elisa|carla|marta/i.test(name.split(" ")[0])) return media("projeto-retrato");
  return media("editor-retrato");
}
export function exampleCover(role: RoleId, title: string, category: string, index: number) {
  const hint = `${category} ${title}`.toLowerCase();
  if (/clipe|show|palco|festival|música|musica|banda|podcast|áudio|audio|locução|locucao/.test(hint)) return media("projeto-palco");
  if (/serra|raiz|document|reel|cinema|filme|bastidor|viagem|paisag/.test(hint)) return media(index % 2 ? "projeto-cidade" : "projeto-cinema");
  if (/retratos|retrato|moda|ensaio|pessoa/.test(hint)) return media("projeto-retrato");
  if (/arquitet|territ|cultural|museu|espaço|espaco/.test(hint)) return media("projeto-editorial");
  if (role === "designer" || role === "social") return media(index % 2 ? "projeto-editorial" : "projeto-design");
  if (role === "fotografo") return media(["projeto-retrato", "projeto-editorial", "projeto-cinema", "projeto-cidade"][index % 4]);
  return media(["projeto-cinema", "projeto-cidade", "projeto-editorial", "projeto-palco"][index % 4]);
}
export const MARKETING_MODELS = ["editor-pro", "fotografia", "designer-grafico", "jornalismo", "social-media", "producao-audiovisual"];
