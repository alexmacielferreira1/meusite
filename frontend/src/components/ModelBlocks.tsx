import { ArrowDown, ArrowUp, GripVertical, Lock, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { templateById } from "../data/templates";
import { useStore } from "../lib/store";
import { cn } from "../lib/utils";
import { BLOCKS, blockCount, isHidden, type BlockId } from "../site/models/blocks";
import { MODEL_BLOCKS } from "../site/models/modelBlocks";
import { fixedBlocks, fullOrder, linkedBlocks } from "../site/models/order";
import { Toggle } from "./ui";

/**
 * Blocos de um modelo com estrutura própria: o que o modelo desenha, o que entra como bloco extra no visual dele,
 * o que está vazio e onde cadastrar. A pessoa liga ou desliga cada bloco e muda a ordem (setas ou arrastando).
 */
export function ModelBlocks() {
  const { portfolio: p, update } = useStore();
  const tpl = templateById(p.site.templateId);
  const native = new Set(MODEL_BLOCKS[tpl.id]);
  const fixed = new Set(fixedBlocks(tpl.id));
  const order = fullOrder(p.site.blockOrder);
  const [dragging, setDragging] = useState<BlockId | null>(null);

  const toggle = (id: BlockId, on: boolean) => update((x) => {
    const hidden = new Set(x.site.hidden ?? []);
    if (on) hidden.delete(id); else hidden.add(id);
    x.site.hidden = BLOCKS.map((b) => b.id).filter((b) => hidden.has(b));
    return x;
  });
  const place = (id: BlockId, to: number) => update((x) => {
    const current = fullOrder(x.site.blockOrder);
    const group = new Set([id, ...linkedBlocks(x.site.templateId, id)]);
    const moving = current.filter((item) => group.has(item));
    const next = current.filter((item) => !group.has(item));
    let adjusted = to;
    if (moving.length > 1) {
      const down = to > current.indexOf(id);
      let target = to;
      while (target >= 0 && target < current.length && group.has(current[target])) target += down ? 1 : -1;
      adjusted = target < 0 ? 0 : target >= current.length ? next.length : next.indexOf(current[target]) + (down ? 1 : 0);
    }
    next.splice(adjusted, 0, ...moving);
    x.site.blockOrder = next;
    return x;
  });
  const fixedRow = (label: string, hint: string) => (
    <li className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
      <Lock size={16} className="text-slate-400" />
      <span className="flex-1"><b className="block text-sm">{label}</b><span className="text-xs text-slate-500">{hint}</span></span>
      <span className="text-xs font-medium text-slate-500">Sempre visível</span>
    </li>
  );
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="font-display text-2xl font-bold text-plum-900">Blocos do site</h2>
      <p className="mt-1 text-sm text-slate-500">O modelo <b>{tpl.name}</b> define o visual. Ligue ou desligue cada bloco e mude a ordem arrastando ou pelas setas; os vazios aparecem quando você cadastra o conteúdo.</p>
      {!!p.site.blockOrder?.length && <button type="button" onClick={() => update((x) => { x.site.blockOrder = undefined; return x; })}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700"><RotateCcw size={13} /> Voltar à ordem do modelo</button>}
      <ul className="mt-5 space-y-2">
        {fixedRow("Apresentação", "Nome, título, foto e bio (Meu perfil).")}
        {order.map((id, index) => {
          const block = BLOCKS.find((b) => b.id === id)!;
          const count = blockCount(p, id);
          const on = !isHidden(p, id);
          const locked = fixed.has(id);
          const linked = linkedBlocks(p.site.templateId, id);
          return (
            <li key={id} draggable={!locked} onDragStart={() => setDragging(id)} onDragEnd={() => setDragging(null)}
              onDragOver={(event) => { if (dragging && dragging !== id) event.preventDefault(); }}
              onDrop={(event) => { event.preventDefault(); if (dragging && dragging !== id) place(dragging, index); setDragging(null); }}
              className={cn("rounded-2xl border p-3", on && count ? "border-slate-200" : "border-dashed border-slate-300 bg-slate-50", dragging === id && "opacity-50")}>
              <div className="flex items-center gap-3">
                {locked ? <Lock size={16} className="shrink-0 text-slate-300" aria-label="Posição fixa neste modelo" />
                  : <GripVertical size={16} className="shrink-0 cursor-grab text-slate-400" aria-hidden />}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2"><b className="text-sm">{block.label}</b>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", native.has(id) ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700")}>
                      {native.has(id) ? "Do modelo" : "Extra no estilo do modelo"}</span></span>
                  <span className="block text-xs text-slate-500">{count ? `${count} ${count === 1 ? "item" : "itens"}` : "Vazio: não aparece no site"}{!on && count ? " · desligado" : ""}{locked ? " · fica no topo deste modelo" : ""}{linked.length ? ` · move junto com ${linked.map((other) => BLOCKS.find((b) => b.id === other)!.label).join(", ")}` : ""}</span>
                </span>
                {!locked && <span className="flex shrink-0 flex-col">
                  <button type="button" aria-label={`Subir ${block.label}`} disabled={index === 0} onClick={() => place(id, index - 1)} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button type="button" aria-label={`Descer ${block.label}`} disabled={index === order.length - 1} onClick={() => place(id, index + 1)} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"><ArrowDown size={14} /></button>
                </span>}
                <Toggle checked={on} onChange={(value) => toggle(id, value)} label={`Mostrar ${block.label}`} />
              </div>
              {!count && <Link to={block.to} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700"><Plus size={14} /> {block.action}</Link>}
              {!!count && <Link to={block.to} className="mt-2 inline-block text-xs font-medium text-slate-500 hover:text-brand-700">Editar conteúdo →</Link>}
            </li>
          );
        })}
        {fixedRow("Contato", "E-mail, WhatsApp e redes (Meu perfil).")}
      </ul>
      <Link to="/app/modelos" className="mt-4 inline-block text-sm font-semibold text-brand-700">Trocar de modelo →</Link>
    </section>
  );
}
