import { Lock, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Input } from "../../../components/ui";
import { api, type AdminAdmins } from "../../../lib/api";
import { useStore } from "../../../lib/store";
import { date } from "./format";
import { PasswordNotice } from "./Users";

/** Quem acessa a Administração. Os de ADMIN_EMAILS (servidor) são fixos; os demais entram e saem por aqui. */
export default function Admins() {
  const { user } = useStore();
  const [data, setData] = useState<AdminAdmins | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ email: string; password: string } | null>(null);
  useEffect(() => { api.adminAdmins().then(setData).catch((e: Error) => setMessage(e.message)); }, []);

  async function run(action: () => Promise<AdminAdmins>, done: string) {
    setBusy(true); setMessage("");
    let ok = true;
    try { setData(await action()); setMessage(done); } catch (error) { ok = false; setMessage((error as Error).message); }
    setBusy(false);
    return ok;
  }

  return (
    <div className="max-w-3xl space-y-6">
      {notice && <PasswordNotice {...notice} onClose={() => setNotice(null)} />}
      {message && <p role="status" className="rounded-xl bg-slate-50 p-3 text-sm text-plum-900">{message}</p>}
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-plum-900">Adicionar administrador</h2>
        <p className="mt-1 text-sm text-slate-600">A pessoa cria a conta no Folios primeiro. Ao adicionar, a conta recebe uma senha provisória e as sessões abertas são encerradas: entregue a senha direto à pessoa (o cadastro não confirma o e-mail).</p>
        <form className="mt-4 flex flex-wrap gap-2" onSubmit={(e) => {
          e.preventDefault();
          const value = email.trim();
          void run(async () => {
            const { password, ...admins } = await api.adminAddAdmin(value);
            setNotice({ email: value, password });
            return admins;
          }, `${value} agora é administrador.`).then((ok) => { if (ok) setEmail(""); });
        }}>
          <Input type="email" aria-label="E-mail do novo administrador" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="min-w-60 flex-1" />
          <Button type="submit" disabled={busy || !email.trim()}><Plus size={16} /> Adicionar</Button>
        </form>
      </section>

      {data && <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-plum-900">Administradores</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {data.fixed.map((item) => (
            <li key={item} className="flex items-center gap-3 py-3 text-sm">
              <Lock size={15} className="text-slate-400" /><span className="flex-1">{item}</span>
              <span className="text-xs text-slate-500">Fixo (ADMIN_EMAILS no servidor)</span>
            </li>))}
          {data.added.map((item) => (
            <li key={item.email} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span className="min-w-0 flex-1"><b className="block">{item.name ?? "Ainda sem conta"}</b><span className="text-slate-500">{item.email}</span></span>
              <span className="text-xs text-slate-500">Adicionado por {item.added_by} em {date(item.added_at)}</span>
              {item.email !== user?.email && <Button variant="ghost" size="sm" disabled={busy} aria-label={`Remover ${item.email}`} onClick={() => {
                if (!window.confirm(`Tirar o acesso de ${item.email} à Administração?`)) return;
                void run(() => api.adminRemoveAdmin(item.email), `${item.email} não é mais administrador.`);
              }}><Trash2 size={14} /> Remover</Button>}
            </li>))}
        </ul>
      </section>}
    </div>
  );
}
