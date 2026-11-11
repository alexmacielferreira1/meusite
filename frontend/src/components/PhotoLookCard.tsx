import { useId } from "react";
import { DEFAULT_LOOK } from "../lib/photoLook";
import { cn } from "../lib/utils";
import type { PhotoLook } from "../types/portfolio";
import { Toggle } from "./ui";

const LEVELS = [["suave", "Suave"], ["media", "Média"], ["forte", "Forte"]] as const;
const pill = (on: boolean) => cn("rounded-xl border px-3 py-2 text-sm", on ? "border-brand-600 bg-brand-50 font-medium text-brand-700" : "border-slate-200 hover:bg-slate-50");

/** Acabamento opcional: a pessoa testa na prévia e só liga se gostar. */
export function PhotoLookCard({ value, lookName, trying, onChange, onTry }: {
  value?: PhotoLook; lookName: string; trying: boolean; onChange: (v: PhotoLook) => void; onTry: (on: boolean) => void;
}) {
  const levelsId = useId();
  const v = { ...DEFAULT_LOOK, ...value };
  const set = (patch: Partial<PhotoLook>) => onChange({ ...v, ...patch });
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-700">Acabamento das fotos <span className="font-normal text-slate-400">— experimente</span></p>
      <p className="mt-1 text-xs text-slate-500">Ajusta cor e luz das suas fotos ao estilo do modelo. Suas fotos originais não mudam.</p>
      <p className="mt-1 text-xs text-slate-500">Este modelo: {lookName}.</p>
      <label className="mt-3 flex items-center gap-2 text-sm"><Toggle label="Usar no site" checked={v.enabled} onChange={(on) => { set({ enabled: on }); onTry(false); }} /> Usar no site</label>
      {!v.enabled && (trying ? (
        <div className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-700">
          Prévia com acabamento. Nada foi salvo.
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button className={pill(true)} onClick={() => { set({ enabled: true }); onTry(false); }}>Ligar no site</button>
            <button className="text-xs text-slate-500 underline" onClick={() => onTry(false)}>Descartar</button>
          </div>
        </div>
      ) : <button className={cn(pill(false), "mt-3")} onClick={() => onTry(true)}>Testar na prévia</button>)}
      {(v.enabled || trying) && (
        <>
          <p id={levelsId} className="mt-3 text-xs font-medium text-slate-600">Intensidade</p>
          <div role="group" aria-labelledby={levelsId} className="mt-1 grid grid-cols-3 gap-2">{LEVELS.map(([id, label]) => <button key={id} className={pill(v.intensity === id)} onClick={() => set({ intensity: id })}>{label}</button>)}</div>
          <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={v.autoFix} onChange={(e) => set({ autoFix: e.target.checked })} /> Corrigir luz e cor</label>
        </>
      )}
    </div>
  );
}
