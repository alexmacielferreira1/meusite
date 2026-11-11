import { photoPosition } from "../site/models/shared";

/**
 * Ponto de foco do retrato. Cada modelo recorta a foto de um jeito (redondo, vertical, faixa larga);
 * a pessoa vê os três e move o foco até o rosto ficar certo em todos.
 */
export function PhotoFocus({ photo, focus, onChange }: { photo: string; focus?: { x: number; y: number }; onChange: (focus: { x: number; y: number }) => void }) {
  const current = { x: focus?.x ?? 50, y: focus?.y ?? 30 };
  const frame = (className: string, label: string) => (
    <figure className="text-center text-[11px] text-slate-500">
      <span role="img" aria-label={`Prévia ${label}`} className={`block bg-cover ${className}`} style={{ backgroundImage: `url(${photo})`, backgroundPosition: photoPosition(current) }} />
      <figcaption className="mt-1">{label}</figcaption>
    </figure>
  );
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-800">Enquadramento da foto</p>
      <p className="text-xs text-slate-500">Mova até o rosto aparecer bem nos três formatos usados pelos modelos.</p>
      <div className="mt-3 flex flex-wrap items-end gap-4">
        {frame("h-16 w-16 rounded-full", "redondo")}
        {frame("h-24 w-[4.8rem] rounded-lg", "vertical")}
        {frame("h-16 w-40 rounded-lg", "faixa larga")}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-slate-600">Horizontal
          <input type="range" min={0} max={100} value={current.x} aria-label="Foco horizontal" className="block w-full"
            onChange={(event) => onChange({ ...current, x: Number(event.target.value) })} /></label>
        <label className="text-xs text-slate-600">Vertical
          <input type="range" min={0} max={100} value={current.y} aria-label="Foco vertical" className="block w-full"
            onChange={(event) => onChange({ ...current, y: Number(event.target.value) })} /></label>
      </div>
    </div>
  );
}
