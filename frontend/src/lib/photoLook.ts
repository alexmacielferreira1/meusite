import type { CSSProperties } from "react";
import type { PhotoLook, PhotoLookId } from "../types/portfolio";

type Fn = "sepia" | "saturate" | "brightness" | "contrast" | "grayscale" | "hue-rotate";
const NEUTRAL: Record<Fn, number> = { sepia: 0, saturate: 1, brightness: 1, contrast: 1, grayscale: 0, "hue-rotate": 0 };
const FACTOR: Record<PhotoLook["intensity"], number> = { suave: 0.5, media: 1, forte: 1.4 };

const LOOKS: Record<PhotoLookId, { steps: [Fn, number][]; overlay?: "accent" | "vignette" }> = {
  natural: { steps: [] },
  quente: { steps: [["sepia", 0.18], ["saturate", 1.08], ["brightness", 1.02]] },
  frio: { steps: [["saturate", 0.9], ["hue-rotate", -8], ["contrast", 1.04]] },
  pb: { steps: [["grayscale", 1], ["contrast", 1.12]] },
  duotone: { steps: [["grayscale", 1], ["contrast", 1.1]], overlay: "accent" },
  filme: { steps: [["contrast", 1.08], ["saturate", 0.85], ["sepia", 0.1]], overlay: "vignette" },
};

export const LOOK_LABELS: Record<PhotoLookId, string> = {
  natural: "natural", quente: "tom quente", frio: "tom frio", pb: "preto e branco",
  duotone: "duotone na cor de destaque", filme: "tom de filme",
};

export const DEFAULT_LOOK: PhotoLook = { enabled: false, intensity: "media", autoFix: true };

const num = (n: number) => Math.round(n * 1000) / 1000;

/** Filtro CSS e camada de cor do acabamento; intensidade escala cada passo a partir do valor neutro. */
export function lookFilter(look: PhotoLookId, intensity: PhotoLook["intensity"], accent: string): { filter: string; overlay?: CSSProperties } {
  const k = FACTOR[intensity];
  const filter = LOOKS[look].steps.map(([fn, value]) => {
    let v = NEUTRAL[fn] + (value - NEUTRAL[fn]) * k;
    if (fn === "grayscale" || fn === "sepia") v = Math.min(1, v);
    return fn === "hue-rotate" ? `hue-rotate(${num(v)}deg)` : `${fn}(${num(v)})`;
  }).join(" ");
  const kind = LOOKS[look].overlay;
  const overlay: CSSProperties | undefined =
    kind === "accent" ? { backgroundColor: accent, mixBlendMode: "color", opacity: num(0.55 * Math.min(1, k)) }
    : kind === "vignette" ? { background: `radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,${num(0.25 * k)}))` }
    : undefined;
  return { filter, overlay };
}

/** Foto enviada ou externa; as artes de demonstração (SVG e gradientes) ficam de fora. */
export const isRealPhoto = (src?: string) => !!src && (/^data:image\/(jpeg|png|webp)[;,]/i.test(src) || /^https?:\/\//i.test(src));
