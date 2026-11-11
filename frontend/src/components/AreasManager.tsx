import { Layers, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useStore } from "../lib/store";
import { slugify } from "../lib/utils";

const MAX_AREAS = 8;

/**
 * Áreas do portfólio (perfil híbrido): cada área vira uma aba da galeria e uma trilha da formação.
 * Inclui a atribuição em lote por categoria, para quem já tem muitos trabalhos.
 */
export function AreasManager() {
  const { portfolio: p, update } = useStore();
  const areas = p.areas ?? [];
  const [name, setName] = useState("");
  const categories = [...new Set(p.works.map((w) => w.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const [category, setCategory] = useState("");
  const [target, setTarget] = useState("");
  const [message, setMessage] = useState("");

  function add() {
    const label = name.trim().slice(0, 40);
    if (!label) return;
    const base = slugify(label).slice(0, 30) || "area";
    let id = base, n = 2;
    while (areas.some((a) => a.id === id)) id = `${base}-${n++}`;
    update((x) => ({ ...x, areas: [...(x.areas ?? []), { id, label }] }));
    setName("");
  }
  function remove(id: string) {
    const used = p.works.filter((w) => w.area === id).length;
    if (used && !window.confirm(`${used} trabalho(s) estão nesta área e ficarão sem área. Remover?`)) return;
    update((x) => ({ ...x, areas: x.areas!.filter((a) => a.id !== id),
      works: x.works.map((w) => w.area === id ? { ...w, area: undefined } : w),
      experience: x.experience.map((e) => e.area === id ? { ...e, area: undefined } : e),
      education: x.education.map((e) => e.area === id ? { ...e, area: undefined } : e) }));
  }
  function assign() {
    const count = p.works.filter((w) => w.category === category).length;
    update((x) => ({ ...x, works: x.works.map((w) => w.category === category ? { ...w, area: target || undefined } : w) }));
    setMessage(`${count} trabalho(s) de "${category}" ${target ? `foram para ${areas.find((a) => a.id === target)?.label}` : "ficaram sem área"}.`);
  }

  return (
    <details open={areas.length > 0} className="mb-5 rounded-2xl border bg-white p-4">
      <summary className="flex cursor-pointer items-center gap-2 font-semibold"><Layers size={18} /> Áreas do portfólio (abas da galeria)</summary>
      <p className="mt-2 text-sm text-slate-600">Para quem atua em mais de uma área, como Audiovisual e Programação ou Jornalismo e Fotografia. Com duas áreas, o site ganha abas na galeria e a formação se divide em trilhas.</p>
      <ul className="mt-3 flex flex-wrap gap-2">{areas.map((area) => (
        <li key={area.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-1 text-sm">
          <input aria-label={`Nome da área ${area.label}`} value={area.label} maxLength={40} className="w-32 bg-transparent"
            onChange={(e) => update((x) => ({ ...x, areas: x.areas!.map((a) => a.id === area.id ? { ...a, label: e.target.value } : a) }))} />
          <span className="text-xs text-slate-500">{p.works.filter((w) => w.area === area.id).length}</span>
          <button type="button" aria-label={`Remover área ${area.label}`} onClick={() => remove(area.id)} className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
        </li>))}</ul>
      {areas.length < MAX_AREAS && <div className="mt-3 flex gap-2">
        <input aria-label="Nova área" value={name} maxLength={40} placeholder="Ex.: Programação" onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} className="h-9 rounded-lg border border-slate-200 px-3 text-sm" />
        <button type="button" onClick={add} disabled={!name.trim()} className="inline-flex items-center gap-1 rounded-lg border px-3 text-sm font-semibold text-brand-700 disabled:opacity-50"><Plus size={14} /> Adicionar área</button>
      </div>}
      {areas.length > 0 && categories.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span>Mover todos de</span>
        <select aria-label="Categoria para mover" value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border p-1">
          <option value="">categoria…</option>{categories.map((c) => <option key={c}>{c}</option>)}</select>
        <span>para</span>
        <select aria-label="Área de destino" value={target} onChange={(e) => setTarget(e.target.value)} className="rounded border p-1">
          <option value="">sem área</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select>
        <button type="button" disabled={!category} onClick={assign} className="rounded-lg bg-brand-600 px-3 py-1.5 font-semibold text-white disabled:opacity-50">Aplicar</button>
      </div>}
      {message && <p role="status" className="mt-2 text-sm text-plum-900">{message}</p>}
    </details>
  );
}
