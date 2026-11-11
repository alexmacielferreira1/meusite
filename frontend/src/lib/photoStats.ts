/** Estatísticas de uma amostra pequena da foto (valores de 0 a 1). */
export interface PhotoStats { lum: number; sd: number; r: number; g: number; b: number }
/** Correção por foto: ganho por canal (balanço de branco), brilho e contraste. */
export interface Correction { gains: [number, number, number]; brightness: number; contrast: number }

export const NO_CORRECTION: Correction = { gains: [1, 1, 1], brightness: 1, contrast: 1 };
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const num = (n: number) => Math.round(n * 1000) / 1000;

export function statsFromPixels(px: Uint8ClampedArray): PhotoStats {
  let r = 0, g = 0, b = 0, l = 0, l2 = 0;
  const n = px.length / 4;
  for (let i = 0; i < px.length; i += 4) {
    const R = px[i] / 255, G = px[i + 1] / 255, B = px[i + 2] / 255;
    const L = 0.2126 * R + 0.7152 * G + 0.0722 * B;
    r += R; g += G; b += B; l += L; l2 += L * L;
  }
  const lum = l / n;
  return { lum, sd: Math.sqrt(Math.max(0, l2 / n - lum * lum)), r: r / n, g: g / n, b: b / n };
}

/** Gray world limitado (±12%), brilho para luminância média 0,5 e contraste para desvio 0,22. */
export function correction(s: PhotoStats): Correction {
  if (!(s.r > 0 && s.g > 0 && s.b > 0)) return NO_CORRECTION;
  const gray = (s.r + s.g + s.b) / 3;
  const gain = (c: number) => num(clamp(gray / c, 0.88, 1.12));
  return {
    gains: [gain(s.r), gain(s.g), gain(s.b)],
    brightness: num(clamp(0.5 / Math.max(s.lum, 0.01), 0.85, 1.25)),
    contrast: num(clamp(0.22 / Math.max(s.sd, 0.01), 0.9, 1.2)),
  };
}

export const colorMatrix = ({ gains: [r, g, b] }: Correction) => `${r} 0 0 0 0 0 ${g} 0 0 0 0 0 ${b} 0 0 0 0 0 1 0`;
