import { portfolioPath } from "../../../config/publicPaths";
import { Copy, KeyRound, Pause, Play, Plus, Search, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Button, Field, Input, Modal, Textarea, Toggle } from "../../../components/ui";
import { api, type AdminPlan, type AdminUser } from "../../../lib/api";
import { useStore } from "../../../lib/store";
import { date, fromDateInput, toDateInput } from "./format";

const PLANS: Record<AdminPlan, string> = { gratuito: "Gratuito", teste: "Teste", pro: "Pro" };
const FILTERS = [["todos", "Todos"], ["testes", "Contas de teste"], ["suspensos", "Suspensos"], ["admins", "Administradores"]] as const;
const select = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm";
type EditForm = Pick<AdminUser, "name" | "plan" | "plan_until" | "ai_credits" | "tester"> & { admin_note: string };

/** Senha provisória: aparece uma vez, para a administração repassar à pessoa. */
export function PasswordNotice({ email, password, onClose }: { email: string; password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div role="status" className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <p>Senha provisória de <b>{email}</b> (aparece só agora; peça para a pessoa trocar depois de entrar):</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="rounded-lg bg-white px-3 py-1.5 text-base">{password}</code>
        <Button variant="secondary" size="sm" onClick={() => { void navigator.clipboard?.writeText(`${email} / ${password}`); setCopied(true); }}><Copy size={14} /> {copied ? "Copiado" : "Copiar"}</Button>
        <Button variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
      </div>
    </div>
  );
}

/** Contas do MeuSite: busca, contas de teste, plano, créditos de IA, suspensão e nova senha. */
export default function Users() {
  const { user: me } = useStore();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [q, setQ] = useState("");
  const [show, setShow] = useState("todos");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ email: string; password: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", tester: true, plan: "teste" as AdminPlan, ai_credits: 10 });
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<EditForm>({ name: "", plan: "gratuito", plan_until: null, ai_credits: 0, tester: false, admin_note: "" });

  useEffect(() => {
    const timer = setTimeout(() => { api.adminUsers(q, show).then((r) => setUsers(r.users)).catch((e: Error) => setMessage(e.message)); }, 250);
    return () => clearTimeout(timer);
  }, [q, show]);

  async function run(action: () => Promise<void>) {
    setBusy(true); setMessage("");
    try { await action(); } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  }
  const replace = (item: AdminUser) => setUsers((list) => list && list.map((u) => (u.id === item.id ? item : u)));
  const open = (item: AdminUser) => { setEditing(item); setForm({ name: item.name, plan: item.plan, plan_until: item.plan_until, ai_credits: item.ai_credits, tester: item.tester, admin_note: item.admin_note ?? "" }); };

  return (
    <div>
      {notice && <PasswordNotice {...notice} onClose={() => setNotice(null)} />}
      {message && <p role="alert" className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-plum-900">{message}</p>}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative min-w-56 flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <Input aria-label="Buscar por nome ou e-mail" placeholder="Buscar por nome ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" /></label>
        <select aria-label="Filtrar contas" value={show} onChange={(e) => setShow(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
          {FILTERS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
        <Button disabled={!users} onClick={() => setCreating(true)}><UserPlus size={16} /> Adicionar pessoa</Button>
      </div>

      {!users ? <p className="text-sm text-slate-500">Carregando contas…</p> : !users.length ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">Nenhuma conta encontrada.</p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{users.map((u) => (
          <li key={u.id}>
            <button onClick={() => open(u)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
              <span className="min-w-0 flex-1"><b className="block truncate">{u.name}</b><span className="block truncate text-sm text-slate-500">{u.email}</span></span>
              <span className="flex flex-wrap gap-1.5">
                {u.admin && <Badge tone="brand">Admin</Badge>}
                {u.tester && <Badge tone="amber">Teste</Badge>}
                {u.disabled && <Badge>Suspensa</Badge>}
                <Badge tone={u.plan === "pro" ? "green" : "slate"}>{PLANS[u.plan]}{u.plan_until ? ` até ${date(u.plan_until)}` : ""}</Badge>
              </span>
              <span className="w-full text-xs text-slate-500 sm:w-60 sm:text-right">
                {u.published ? `Site no ar (${portfolioPath(u.slug ?? "")})` : "Sem site publicado"} · {u.visits} visitas · {u.ai_credits} créditos<br />
                Cadastro {date(u.created_at)} · último acesso {date(u.last_seen_at, true)}
              </span>
            </button>
          </li>))}</ul>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Adicionar pessoa">
        <p className="mb-4 text-sm text-slate-600">Cria a conta com uma senha provisória. Você repassa o e-mail e a senha para a pessoa entrar.</p>
        <fieldset disabled={busy} className="grid gap-4">
          <Field label="Nome"><Input value={draft.name} maxLength={120} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
          <Field label="E-mail"><Input type="email" value={draft.email} maxLength={254} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Plano"><select aria-label="Plano da nova conta" className={select} value={draft.plan} onChange={(e) => setDraft({ ...draft, plan: e.target.value as AdminPlan })}>
              {Object.entries(PLANS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Field>
            <Field label="Créditos de IA"><Input type="number" min={0} max={100000} value={draft.ai_credits} onChange={(e) => setDraft({ ...draft, ai_credits: Number(e.target.value) })} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><Toggle checked={draft.tester} label="Conta de teste" onChange={(tester) => setDraft({ ...draft, tester })} /> Conta de teste</label>
        </fieldset>
        <div className="mt-5 flex gap-2">
          <Button disabled={busy || !draft.name.trim() || !draft.email.trim()} onClick={() => void run(async () => {
            const { user: created, password } = await api.adminCreateUser(draft);
            setUsers((list) => [created, ...list!]);
            setNotice({ email: created.email, password });
            setCreating(false);
            setDraft({ name: "", email: "", tester: true, plan: "teste", ai_credits: 10 });
          })}><Plus size={16} /> Criar conta</Button>
          <Button variant="ghost" onClick={() => setCreating(false)}>Cancelar</Button>
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? editing.email : ""} wide>
        {editing && <>
          <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome"><Input value={form.name} maxLength={120} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Créditos de IA"><Input type="number" min={0} max={100000} value={form.ai_credits} onChange={(e) => setForm({ ...form, ai_credits: Number(e.target.value) })} /></Field>
            <Field label="Plano"><select aria-label="Plano" className={select} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as AdminPlan })}>
              {Object.entries(PLANS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Field>
            <Field label="Plano válido até" hint="Em branco: sem prazo."><Input type="date" aria-label="Plano válido até" value={toDateInput(form.plan_until)} onChange={(e) => setForm({ ...form, plan_until: fromDateInput(e.target.value) })} /></Field>
            <div className="sm:col-span-2"><Field label="Anotação interna"><Textarea rows={2} maxLength={1000} value={form.admin_note} onChange={(e) => setForm({ ...form, admin_note: e.target.value })} /></Field></div>
            <label className="flex items-center gap-2 text-sm"><Toggle checked={form.tester} label="Conta de teste" onChange={(tester) => setForm({ ...form, tester })} /> Conta de teste</label>
          </fieldset>
          <p className="mt-4 text-xs text-slate-500">
            {editing.published ? <>Site no ar: <a className="underline" href={portfolioPath(editing.slug ?? "")} target="_blank" rel="noreferrer">{portfolioPath(editing.slug ?? "")}</a></> : "Sem site publicado"} · {editing.hotsites} hotsites · {editing.visits} visitas · cadastro {date(editing.created_at)}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button disabled={busy || !form.name.trim()} onClick={() => void run(async () => {
              const saved = await api.adminUpdateUser(editing.id, form);
              replace(saved); setEditing(null); setMessage(`${saved.email} atualizado.`);
            })}>Salvar</Button>
            <Button variant="secondary" disabled={busy} onClick={() => {
              if (!window.confirm(`Gerar senha nova para ${editing.email}? A atual deixa de funcionar e as sessões abertas são encerradas.`)) return;
              void run(async () => { const { password } = await api.adminResetPassword(editing.id); setNotice({ email: editing.email, password }); setEditing(null); });
            }}><KeyRound size={15} /> Gerar senha nova</Button>
            {!editing.fixed_admin && editing.id !== me?.id && editing.email !== me?.email && (
              <Button variant="ghost" disabled={busy} onClick={() => {
                if (!editing.disabled && !window.confirm(`Suspender ${editing.email}? A pessoa sai na hora e não consegue entrar até você reativar. O site publicado continua no ar.`)) return;
                void run(async () => {
                  const saved = await api.adminUpdateUser(editing.id, { disabled: !editing.disabled });
                  replace(saved); setEditing(saved); setMessage(saved.disabled ? `${saved.email} suspensa.` : `${saved.email} reativada.`);
                });
              }}>{editing.disabled ? <><Play size={15} /> Reativar</> : <><Pause size={15} /> Suspender</>}</Button>
            )}
          </div>
        </>}
      </Modal>
    </div>
  );
}
