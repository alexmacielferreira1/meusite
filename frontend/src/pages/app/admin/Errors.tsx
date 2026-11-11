import { CheckCircle2, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Button } from "../../../components/ui";
import { api, type AdminError } from "../../../lib/api";
import { date } from "./format";

const STATUS = [["abertos", "Abertos"], ["resolvidos", "Resolvidos"], ["todos", "Todos"]] as const;

/** Erros do servidor e do navegador, agrupados (mesma mensagem no mesmo lugar). Voltou a acontecer, reabre sozinho. */
export default function Errors() {
  const [status, setStatus] = useState("abertos");
  const [errors, setErrors] = useState<AdminError[] | null>(null);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    setErrors(null);
    api.adminErrors(status).then((r) => setErrors(r.errors)).catch((e: Error) => setMessage(e.message));
  }, [status]);

  async function mark(item: AdminError, resolved: boolean) {
    setMessage("");
    try {
      await api.adminResolveError(item.id, resolved);
      setErrors((list) => list && (status === "todos" ? list.map((e) => (e.id === item.id ? { ...e, resolved } : e)) : list.filter((e) => e.id !== item.id)));
    } catch (error) { setMessage((error as Error).message); }
  }

  return (
    <div>
      {message && <p role="alert" className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-plum-900">{message}</p>}
      <div role="group" aria-label="Situação" className="mb-4 inline-flex rounded-xl border border-slate-200 bg-white p-1">
        {STATUS.map(([id, label]) => (
          <button key={id} aria-pressed={status === id} onClick={() => setStatus(id)}
            className={`rounded-lg px-3 py-1.5 text-sm ${status === id ? "bg-brand-100 font-semibold text-brand-700" : "text-slate-600"}`}>{label}</button>))}
      </div>
      {!errors ? <p className="text-sm text-slate-500">Carregando…</p> : !errors.length ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">{status === "abertos" ? "Nenhum erro aberto." : "Nada por aqui."}</p>
      ) : (
        <ul className="space-y-3">{errors.map((e) => (
          <li key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start gap-3">
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <Badge tone={e.source === "api" ? "brand" : "amber"}>{e.source === "api" ? "Servidor" : "Navegador"}</Badge>
                  {e.resolved && <Badge tone="green">Resolvido</Badge>}
                  <code className="text-xs text-slate-500">{e.path || "—"}</code>
                </span>
                <b className="mt-1 block break-words">{e.message}</b>
                <span className="text-xs text-slate-500">{e.hits}× · primeira vez {date(e.first_at, true)} · última {date(e.last_at, true)}{e.email && ` · ${e.email}`}</span>
              </span>
              <span className="flex gap-2">
                {e.detail && <Button variant="ghost" size="sm" onClick={() => setOpen(open === e.id ? null : e.id)}>{open === e.id ? "Ocultar detalhes" : "Detalhes"}</Button>}
                {e.resolved
                  ? <Button variant="secondary" size="sm" onClick={() => void mark(e, false)}><RotateCcw size={14} /> Reabrir</Button>
                  : <Button variant="secondary" size="sm" onClick={() => void mark(e, true)}><CheckCircle2 size={14} /> Resolvido</Button>}
              </span>
            </div>
            {open === e.id && <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">{e.detail}</pre>}
          </li>))}</ul>
      )}
    </div>
  );
}
