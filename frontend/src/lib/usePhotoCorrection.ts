import { useEffect, useState } from "react";
import { correction, statsFromPixels, type Correction } from "./photoStats";

const cache = new Map<string, Correction>();
// Medições em andamento: vários componentes com a mesma foto decodificam uma vez só.
const pending = new Map<string, Promise<Correction>>();
export const clearCorrectionCache = () => { cache.clear(); pending.clear(); };

/** Desenha a foto em 32×32, calcula a correção e guarda no cache. Falha (sem canvas, CORS, imagem quebrada) rejeita. */
export function measure(src: string): Promise<Correction> {
  const running = pending.get(src);
  if (running) return running;
  const job = new Promise<Correction>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 32;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("sem canvas");
        // Fundo cinza neutro: pixels transparentes de um PNG não escurecem a média.
        ctx.fillStyle = "#808080";
        ctx.fillRect(0, 0, 32, 32);
        ctx.drawImage(img, 0, 0, 32, 32);
        const c = correction(statsFromPixels(ctx.getImageData(0, 0, 32, 32).data));
        cache.set(src, c);
        resolve(c);
      } catch (error) { reject(error); }
    };
    img.onerror = reject;
    img.src = src;
  }).finally(() => { pending.delete(src); });
  pending.set(src, job);
  return job;
}

/** Correção da foto, ou null enquanto mede, quando desligada ou quando não dá para medir. Nunca devolve a de outro `src`. */
export function usePhotoCorrection(src: string, on: boolean): Correction | null {
  const [measured, setMeasured] = useState<{ src: string; value: Correction | null } | null>(null);
  useEffect(() => {
    if (!on || cache.has(src)) return;
    let live = true;
    measure(src).then(
      (value) => { if (live) setMeasured({ src, value }); },
      () => { if (live) setMeasured({ src, value: null }); },
    );
    return () => { live = false; };
  }, [src, on]);
  if (!on) return null;
  return cache.get(src) ?? (measured?.src === src ? measured.value : null);
}
