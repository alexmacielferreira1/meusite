import { providerEmbed } from "./mediaProviders";
export const uid = () => Math.random().toString(36).slice(2, 10);

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

/** Capa: dataURL de imagem enviada, ou "grad:<hue>" para um gradiente de demonstração. */
export function coverStyle(cover: string): React.CSSProperties {
  if (cover.startsWith("grad:")) {
    const h = Number(cover.slice(5)) || 220;
    return { backgroundImage: `linear-gradient(135deg, hsl(${h} 70% 45%), hsl(${(h + 50) % 360} 75% 25%))` };
  }
  return { backgroundImage: `url(${cover})`, backgroundSize: "cover", backgroundPosition: "center" };
}

/** Converte links de YouTube/Vimeo em URL de embed. */
export function toEmbed(url?: string): string | null {
  return providerEmbed(url);
}

export const readFileAsDataURL = (file: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Reduz a imagem antes de guardar (o localStorage da demonstração tem ~5 MB). */
export async function imageToDataURL(file: File, max = 1280, quality = 0.8): Promise<string> {
  const src = await readFileAsDataURL(file);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src; });
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", quality);
}

