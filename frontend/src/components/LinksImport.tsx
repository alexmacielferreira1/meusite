import { Link2, Loader2 } from "lucide-react";
import { useState } from "react";
import { DEMO_MODE } from "../config/app";
import { api } from "../lib/api";
import { extractUrls, localPreview, previewToWork, ROLE_KIND, sameLink, type LinkPreview } from "../lib/linkWorks";
import { WORK_KINDS } from "../lib/workSpreadsheet";
import { useStore } from "../lib/store";
import type { WorkKind } from "../types/portfolio";
import { Button, Field, Input, Textarea } from "./ui";

const MAX_LINKS = 60;
type Item = LinkPreview & { selected: boolean; duplicate: boolean };

/**
 * Adiciona vários trabalhos colando links (YouTube, Vimeo, Spotify, Behance, matérias...).
 * Busca título e capa de cada link; a pessoa confere e escolhe o que entra no acervo.
 */
export function LinksImport({ open = false }: { open?: boolean }) {
  const { portfolio: p, update, flush } = useStore();
  const [text, setText] = useState("");
  const [role, setRole] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function search() {
    const urls = extractUrls(text);
    if (!urls.length) { setMessage("Nenhum link encontrado. Cole endereços que comecem com http, https ou www."); return; }
    setBusy(true); setMessage(""); setItems([]);
    const list = urls.slice(0, MAX_LINKS);
    let previews: LinkPreview[] = [];
    if (DEMO_MODE) previews = list.map(localPreview);
    else {
      for (let start = 0; start < list.length; start += 10) {
        const batch = list.slice(start, start + 10);
        previews.push(...await api.previewLinks(batch).catch(() => batch.map(localPreview)));
      }
    }
    const kindFallback = ROLE_KIND[p.profile.roleId];
    setItems(previews.map((item) => {
      const duplicate = p.works.some((work) => sameLink(work.mediaUrl, item.url));
      // Link sem formato reconhecido (página comum) segue o formato da profissão quando ela não é de texto.
      const kind = item.kind === "article" && !item.ok && kindFallback !== "article" ? kindFallback : item.kind;
      return { ...item, kind, selected: !duplicate, duplicate };
    }));
    const skipped = urls.length - list.length;
    const missing = previews.filter((item) => !item.title).length;
    setMessage([`${previews.length} link(s) lidos.`, missing && `${missing} sem título: escreva abaixo.`, skipped && `${skipped} ficaram de fora (limite de ${MAX_LINKS} por vez).`].filter(Boolean).join(" "));
    setBusy(false);
  }

  const edit = (index: number, patch: Partial<Item>) => setItems((list) => list.map((item, i) => i === index ? { ...item, ...patch } : item));
  const chosen = items.filter((item) => item.selected);

  async function add() {
    const works = chosen.map((item) => previewToWork(item, role));
    update((current) => ({ ...current, works: [...works, ...current.works].slice(0, 250) }));
    setItems([]); setText(""); setBusy(true);
    try { await flush(); setMessage(`${works.length} trabalho(s) adicionados. Abra cada um para completar ano, descrição e softwares.`); }
    catch { setMessage("Trabalhos adicionados ao rascunho. O servidor ainda não salvou a alteração."); }
    finally { setBusy(false); }
  }

  return (
    <details id="colar-links" open={open} className="mb-5 rounded-2xl border border-brand-100 bg-white p-4">
      <summary className="flex cursor-pointer items-center gap-2 font-semibold"><Link2 size={18} /> Adicionar trabalhos colando links</summary>
      <p className="mt-2 text-sm text-slate-600">Sem planilha: cole os links do YouTube, Vimeo, Spotify, SoundCloud, Behance, Instagram ou de matérias publicadas. Buscamos título e capa de cada um.</p>
      <fieldset disabled={busy} className="mt-3 grid gap-3">
        <Textarea aria-label="Links dos trabalhos" rows={4} placeholder={"https://www.youtube.com/watch?v=...\nhttps://vimeo.com/...\nhttps://jornal.com.br/sua-materia"} value={text} onChange={(event) => setText(event.target.value)} />
        <Field label="Sua função nesses trabalhos" hint="Vale para todos; dá para mudar depois em cada trabalho.">
          <Input value={role} maxLength={120} placeholder="Ex.: Edição e finalização" onChange={(event) => setRole(event.target.value)} />
        </Field>
        <div><Button type="button" disabled={!text.trim()} onClick={() => void search()}>{busy ? <Loader2 size={16} className="animate-spin" /> : null} Buscar títulos e capas</Button></div>
      </fieldset>
      {message && <p role="status" className="mt-3 text-sm text-plum-900">{message}</p>}
      {!!items.length && (
        <div className="mt-3 grid gap-2">
          {items.map((item, index) => (
            <div key={item.url + index} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-2">
              <input type="checkbox" aria-label={`Incluir ${item.url}`} checked={item.selected} onChange={(event) => edit(index, { selected: event.target.checked })} />
              <span className="h-12 w-20 shrink-0 rounded-lg bg-slate-100 bg-cover bg-center" style={item.cover ? { backgroundImage: `url(${item.cover})` } : undefined} />
              <div className="grid min-w-0 flex-1 gap-1">
                <input aria-label={`Título de ${item.url}`} value={item.title} maxLength={160} placeholder="Título do trabalho"
                  className="rounded border border-slate-200 px-2 py-1 text-sm" onChange={(event) => edit(index, { title: event.target.value })} />
                <span className="truncate text-xs text-slate-500">{item.duplicate ? "Já está no acervo · " : ""}{item.author ? `${item.author} · ` : ""}{item.url}</span>
              </div>
              <select aria-label={`Formato de ${item.url}`} value={item.kind} className="rounded border p-1 text-sm" onChange={(event) => edit(index, { kind: event.target.value as WorkKind })}>
                {Object.entries(WORK_KINDS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!chosen.length || busy} onClick={() => void add()}>Adicionar {chosen.length} trabalho(s)</Button>
            <Button type="button" variant="ghost" onClick={() => { setItems([]); setMessage(""); }}>Cancelar</Button>
          </div>
        </div>
      )}
    </details>
  );
}
