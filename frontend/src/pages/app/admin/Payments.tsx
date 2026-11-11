import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Field, Input } from "../../../components/ui";
import { api, type AdminPayment, type AdminPlan, type AdminUser } from "../../../lib/api";
import { date, fromDateInput, money, parseMoney, toDateInput } from "./format";

const select = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm";
const today = () => toDateInput(Math.floor(Date.now() / 1000));

/**
 * Pagamentos registrados à mão (Pix, cartão, boleto…), enquanto não há meio de pagamento integrado.
 * Ao registrar, dá para já mudar o plano e o prazo da conta.
 */
export default function Payments() {
  const [payments, setPayments] = useState<AdminPayment[] | null>(null);
  const [methods, setMethods] = useState<Record<string, string>>({});
  const [plans, setPlans] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const blank = { account_id: "", amount: "", method: "pix", paid: today(), note: "", plan: "" as AdminPlan | "", until: "" };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    api.adminPayments().then((r) => { setPayments(r.payments); setMethods(r.methods); setPlans(r.plans); }).catch((e: Error) => setMessage(e.message));
    api.adminUsers().then((r) => setUsers(r.users)).catch(() => {});
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true); setMessage("");
    try { await action(); } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  }
  const amount = parseMoney(form.amount);
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
  const monthTotal = (payments ?? []).filter((p) => p.paid_at * 1000 >= month.getTime()).reduce((sum, p) => sum + p.amount_cents, 0);

  return (
    <div className="space-y-6">
      {message && <p role="alert" className="rounded-xl bg-slate-50 p-3 text-sm text-plum-900">{message}</p>}
      <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Ainda não há meio de pagamento ligado ao Folios. Registre aqui o que receber (Pix, cartão, boleto) e ajuste o plano da conta.</p>

      <section aria-label="Planejamento de planos" className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-plum-900">Planos — planejamento interno</h2>
        <p className="mt-2 text-sm text-slate-600">Fase piloto: somente o gratuito está disponível. Contratação de planos pagos e extras desativada. Os valores abaixo são proposta, sem cobrança automática.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[{ name: "Gratuito", price: "R$ 0", detail: "Disponível no piloto · vídeos por link e limite atual do rascunho." }, { name: "Essencial", price: "R$ 19,90/mês", detail: "Proposta: 2 GB e 50 créditos/mês. Indisponível para contratação." }, { name: "Pro", price: "R$ 39,90/mês", detail: "Proposta: 10 GB e 150 créditos/mês. Indisponível para contratação." }].map((plan) => <div key={plan.name} className="rounded-xl bg-slate-50 p-4"><h3 className="font-bold">{plan.name}</h3><p className="mt-1 font-semibold text-brand-700">{plan.price}</p><p className="mt-2 text-xs text-slate-500">{plan.detail}</p></div>)}
        </div>
        <p className="mt-3 text-xs text-slate-500">Franquias futuras dependem do armazenamento de objetos e da medição de custos de IA. Não representam limites atuais nem oferta pública.</p>
      </section>
      <section aria-label="Registrar pagamento" className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-plum-900">Registrar pagamento</h2>
        <fieldset disabled={busy} className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3"><Field label="Conta"><select aria-label="Conta" className={select} value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
            <option value="">Escolha a conta…</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.email}</option>)}</select></Field></div>
          <Field label="Valor (R$)"><Input inputMode="decimal" placeholder="29,90" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
          <Field label="Forma"><select aria-label="Forma de pagamento" className={select} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
            {Object.entries(methods).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Field>
          <Field label="Pago em"><Input type="date" aria-label="Pago em" value={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.value })} /></Field>
          <Field label="Mudar plano para"><select aria-label="Mudar plano para" className={select} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as AdminPlan | "" })}>
            <option value="">Não mudar</option>
            {Object.entries(plans).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Field>
          <Field label="Plano válido até"><Input type="date" aria-label="Plano válido até" disabled={!form.plan} value={form.until} onChange={(e) => setForm({ ...form, until: e.target.value })} /></Field>
          <Field label="Observação"><Input maxLength={500} placeholder="Ex.: mensalidade de novembro" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
        </fieldset>
        <Button className="mt-5" disabled={busy || !payments || !form.account_id || !amount || !form.paid} onClick={() => void run(async () => {
          const saved = await api.adminCreatePayment({ account_id: form.account_id, amount_cents: amount, method: form.method, paid_at: fromDateInput(form.paid)!,
            note: form.note, plan: form.plan || null, plan_until: form.plan ? fromDateInput(form.until) : null });
          setPayments((list) => [saved, ...list!].sort((a, b) => b.paid_at - a.paid_at));
          setForm(blank);
          setMessage(`Pagamento de ${money(saved.amount_cents)} de ${saved.email} registrado.`);
        })}><Plus size={16} /> Registrar</Button>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-plum-900">Pagamentos</h2>
          <span className="text-sm text-slate-500">No mês: <b className="text-plum-900">{money(monthTotal)}</b></span>
        </div>
        {!payments ? <p className="mt-4 text-sm text-slate-500">Carregando…</p> : !payments.length ? (
          <p className="mt-4 text-sm text-slate-500">Nenhum pagamento registrado.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">{payments.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span className="w-24 text-slate-500">{date(p.paid_at)}</span>
              <span className="min-w-0 flex-1"><b className="block truncate">{p.name}</b><span className="text-slate-500">{p.email}{p.note && ` · ${p.note}`}</span></span>
              <span className="text-slate-500">{methods[p.method] ?? p.method}</span>
              <b className="w-28 text-right">{money(p.amount_cents)}</b>
              <Button variant="ghost" size="sm" aria-label={`Apagar pagamento de ${p.email}`} disabled={busy} onClick={() => {
                if (!window.confirm(`Apagar o registro de ${money(p.amount_cents)} de ${p.email}? O plano da conta não muda.`)) return;
                void run(async () => { await api.adminDeletePayment(p.id); setPayments((list) => list && list.filter((x) => x.id !== p.id)); });
              }}><Trash2 size={14} /></Button>
            </li>))}</ul>
        )}
      </section>
    </div>
  );
}
