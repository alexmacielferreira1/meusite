import {LayerStudio} from "./LayerStudio";
import type {ArtDocument} from "../types/art";
import { DEMO_MODE } from "../config/app";
// Estúdio de Arte — versão básica em canvas (modo demonstração).
// A versão completa porta as Ferramentas Gráficas e o Estúdio de Arte do MediaMind AI
// (ver docs/ESTUDIO_DE_ARTE.md — matriz de paridade).
import { Loader2, Sparkles, Upload, Wand2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { imageToDataURL } from "../lib/utils";
import { cn } from "../lib/utils";

const RATIOS = [
  { id: "16:9", w: 1280, h: 720, label: "Horizontal 16:9" },
  { id: "9:16", w: 720, h: 1280, label: "Vertical 9:16" },
  { id: "1:1", w: 1080, h: 1080, label: "Quadrado 1:1" },
  { id: "4:5", w: 1080, h: 1350, label: "Retrato 4:5" },
  { id: "1.91:1", w: 1200, h: 628, label: "Compartilhar link" },
] as const;

export interface StudioResult { dataUrl: string; ratio: string; document?: ArtDocument }

export function ArtStudio({ source, accent, title = "", initialDocument, credits, onSpendCredit, onClose, onSave }: {
  source: string; accent: string; title?: string; initialDocument?: ArtDocument; credits: number;
  onSpendCredit: () => void; onClose: () => void; onSave: (r: StudioResult, apply: boolean) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [layerMode,setLayerMode]=useState(true);
  const [layerDraft,setLayerDraft]=useState<ArtDocument|undefined>(initialDocument);
  const [exportError,setExportError]=useState("");
  const [src, setSrc] = useState(source);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>(RATIOS[0]);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const [adj, setAdj] = useState({ brightness: 100, contrast: 100, saturate: 100, blur: 0 });
  const [tint, setTint] = useState(0);
  const [text, setText] = useState(title);
  const [textPos, setTextPos] = useState<"top" | "center" | "bottom">("bottom");
  const [band, setBand] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmAi, setConfirmAi] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    if (src.startsWith("grad:")) { setImg(null); return; }
    const i = new Image(); i.onload = () => setImg(i); i.src = src;
  }, [src]);

  useEffect(() => {
    const c = canvas.current; if(!c)return;
    c.width = ratio.w; c.height = ratio.h;
    const g = c.getContext("2d")!;
    g.save();
    g.filter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturate}%) blur(${adj.blur}px)`;
    if (img) {
      const k = Math.max(ratio.w / img.width, ratio.h / img.height) * zoom;
      const w = img.width * k, h = img.height * k;
      g.drawImage(img, (ratio.w - w) * pos.x, (ratio.h - h) * pos.y, w, h);
    } else {
      const hue = Number(src.slice(5)) || 220;
      const gr = g.createLinearGradient(0, 0, ratio.w, ratio.h);
      gr.addColorStop(0, `hsl(${hue} 70% 45%)`); gr.addColorStop(1, `hsl(${(hue + 50) % 360} 75% 25%)`);
      g.fillStyle = gr; g.fillRect(0, 0, ratio.w, ratio.h);
    }
    g.restore();
    if (tint > 0) { g.save(); g.globalAlpha = tint / 100; g.globalCompositeOperation = "color"; g.fillStyle = accent; g.fillRect(0, 0, ratio.w, ratio.h); g.restore(); }
    if (text.trim()) {
      const size = Math.round(Math.min(ratio.w, ratio.h) * 0.075);
      g.font = `700 ${size}px "Space Grotesk", Inter, sans-serif`;
      const pad = size * 0.8;
      const lines = wrap(g, text, ratio.w - pad * 2);
      const blockH = lines.length * size * 1.15 + pad;
      const y0 = textPos === "top" ? 0 : textPos === "center" ? (ratio.h - blockH) / 2 : ratio.h - blockH;
      if (band) { const gr = g.createLinearGradient(0, y0, 0, y0 + blockH); gr.addColorStop(textPos === "top" ? 1 : 0, "rgba(0,0,0,0)"); gr.addColorStop(textPos === "top" ? 0 : 1, "rgba(0,0,0,.65)"); g.fillStyle = textPos === "center" ? "rgba(0,0,0,.45)" : gr; g.fillRect(0, y0, ratio.w, blockH); }
      g.fillStyle = "#fff"; g.textBaseline = "top";
      lines.forEach((l, i) => g.fillText(l, pad, y0 + pad / 2 + i * size * 1.15));
      g.fillStyle = accent; g.fillRect(pad, y0 + pad / 2 - size * 0.35, size * 1.2, size * 0.12);
    }
  }, [img, src, ratio, zoom, pos, adj, tint, text, textPos, band, accent, layerMode]);

  const save=(apply:boolean)=>{try{onSave({dataUrl:canvas.current!.toDataURL("image/jpeg",.85),ratio:ratio.id},apply);}catch{setExportError("Esta imagem externa não permite exportação. Envie o arquivo pelo botão Trocar imagem.");}};
  if(layerMode)return <LayerStudio source={src} accent={accent} title={title} initial={layerDraft} onBack={(document)=>{setLayerDraft(document);setLayerMode(false);}} onClose={onClose} onSave={onSave}/>;
  const sliders: [keyof typeof adj, string, number, number][] = [["brightness", "Brilho", 50, 150], ["contrast", "Contraste", 50, 150], ["saturate", "Saturação", 0, 200], ["blur", "Desfoque", 0, 10]];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-plum-900/90 p-3 sm:p-6">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-3xl bg-white">
        <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-3">
          <h2 className="font-display text-xl font-bold text-plum-900">Estúdio de Arte</h2>
          <button onClick={()=>setLayerMode(true)} className="rounded-xl border border-brand-400 px-3 py-2 text-xs font-semibold text-brand-700">Canvas com camadas</button>
          <span className="text-xs text-slate-500">O original fica guardado; cada salvamento vira uma versão.</span>
          <button onClick={onClose} aria-label="Fechar" className="ml-auto rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button>
        </header>
        <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_340px]">
          <div className="flex min-h-[320px] items-center justify-center overflow-hidden bg-[repeating-conic-gradient(#f1f1f4_0_25%,#fff_0_50%)] bg-[length:20px_20px] p-6">
            <canvas ref={canvas} className="max-h-full max-w-full cursor-grab rounded-lg shadow-xl active:cursor-grabbing" style={{ maxHeight: "62vh" }}
              onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
              onPointerMove={(e) => { if (!drag.current) return; const dx = (e.clientX - drag.current.x) / 300, dy = (e.clientY - drag.current.y) / 300; setPos({ x: clamp(drag.current.px - dx), y: clamp(drag.current.py - dy) }); }}
              onPointerUp={() => { drag.current = null; }} aria-label="Arte — arraste para enquadrar" role="img" />
          </div>
          <aside className="min-h-0 space-y-5 overflow-y-auto border-l border-slate-200 p-5 scrollbar-thin">
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Ações rápidas</p>
              <div className="grid gap-2">
                <button onClick={() => { setTint(35); setAdj({ brightness: 98, contrast: 112, saturate: 90, blur: 0 }); }} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"><Wand2 size={16} className="text-brand-700" /> Ajustar ao modelo</button>
                {DEMO_MODE && <button onClick={() => setConfirmAi(true)} className="flex items-center gap-2 rounded-xl border border-brand-300 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700"><Sparkles size={16} /> Melhorar imagem com IA · 1 crédito</button>}
                {confirmAi && (
                  <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                    Custa <b>1 crédito</b> (você tem {credits}). Se falhar, não cobra.
                    <div className="mt-2 flex gap-2">
                      <button disabled={credits < 1 || busy} onClick={async () => { setBusy(true); await new Promise((r) => setTimeout(r, 900)); setAdj({ brightness: 106, contrast: 114, saturate: 118, blur: 0 }); onSpendCredit(); setBusy(false); setConfirmAi(false); }}
                        className="rounded-lg bg-brand-600 px-3 py-1 font-semibold text-white disabled:opacity-50">{busy ? <Loader2 size={14} className="animate-spin" /> : credits < 1 ? "Sem créditos" : "Confirmar"}</button>
                      <button onClick={() => setConfirmAi(false)} className="rounded-lg border border-amber-300 px-3 py-1">Cancelar</button>
                    </div>
                  </div>
                )}
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"><Upload size={16} /> Trocar imagem
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setSrc(await imageToDataURL(f, 2000, 0.9)); setZoom(1); setPos({ x: 0.5, y: 0.5 }); } }} /></label>
              </div>
            </section>
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Proporção</p>
              <div className="flex flex-wrap gap-1.5">{RATIOS.map((r) => <button key={r.id} onClick={() => setRatio(r)} className={cn("rounded-lg border px-2.5 py-1 text-xs", ratio.id === r.id ? "border-brand-600 bg-brand-50 font-semibold text-brand-700" : "border-slate-200")}>{r.label}</button>)}</div>
              <label className="mt-3 block text-xs text-slate-600">Zoom <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(+e.target.value)} className="w-full accent-brand-600" /></label>
              <p className="text-[11px] text-slate-400">Arraste a imagem para enquadrar.</p>
            </section>
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Ajustes</p>
              {sliders.map(([k, l, min, max]) => (
                <label key={k} className="block text-xs text-slate-600">{l} <span className="text-slate-400">{adj[k]}</span>
                  <input type="range" min={min} max={max} value={adj[k]} onChange={(e) => setAdj({ ...adj, [k]: +e.target.value })} className="w-full accent-brand-600" /></label>
              ))}
              <label className="block text-xs text-slate-600">Tom da cor do modelo <span className="text-slate-400">{tint}%</span>
                <input type="range" min={0} max={80} value={tint} onChange={(e) => setTint(+e.target.value)} className="w-full accent-brand-600" /></label>
            </section>
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Texto na arte</p>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Título (opcional)" className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm" />
              <div className="mt-2 flex gap-1.5">{(["top", "center", "bottom"] as const).map((t) => <button key={t} onClick={() => setTextPos(t)} className={cn("flex-1 rounded-lg border py-1 text-xs", textPos === t ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200")}>{t === "top" ? "Topo" : t === "center" ? "Centro" : "Base"}</button>)}</div>
              <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={band} onChange={(e) => setBand(e.target.checked)} /> Faixa escura atrás do texto</label>
            </section>
          </aside>
        </div>
        {exportError&&<p role="alert" className="px-5 py-2 text-sm text-red-700">{exportError}</p>}
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button onClick={onClose} className="h-10 rounded-xl border border-slate-300 px-4 text-sm">Cancelar</button>
          <button onClick={() => save(false)} className="h-10 rounded-xl border border-brand-500 px-4 text-sm font-semibold text-brand-700">Salvar só como versão</button>
          <button onClick={() => save(true)} className="h-10 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white">Salvar e usar como capa</button>
        </footer>
      </div>
    </div>
  );
}

const clamp = (v: number) => Math.max(0, Math.min(1, v));
function wrap(g: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(/\s+/); const lines: string[] = []; let cur = "";
  for (const w of words) { const t = cur ? cur + " " + w : w; if (g.measureText(t).width > max && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

