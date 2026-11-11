import { CheckCircle2, KeyRound, Pencil, PlugZap, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "../../components/layout/AppShell";
import { Button, Field, Input, Toggle } from "../../components/ui";
import { DEMO_MODE } from "../../config/app";
import { api, type AiAdmin, type AiProvider, type AiProviderInput } from "../../lib/api";
import { useStore } from "../../lib/store";

/** Modelos sugeridos (o campo aceita qualquer nome de modelo do provedor). */
const MODELS = ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5", "claude-fable-5-1"];
const EMPTY: AiProviderInput = { name: "", provider: "anthropic", model: MODELS[0], api_key: "", features: [], enabled: true };

/**
 * Administração da IA do site: provedores cadastrados e os recursos que cada um atende.
 * Aba IA da Administração (só administradores). A chave é cifrada no servidor e nunca volta para a tela.
 */
export default function AdminAi({ embedded = false }: { embedded?: boolean }) {
  const { user } = useStore();
  const [data, setData] = useState<AiAdmin | null>(null);
  const [form, setForm] = useState<AiProviderInput | null>(null);
  const [editing, setEditing] = useState<AiProvider | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!DEMO_MODE && user?.admin) api.aiAdmin().then(setData).catch((error: Error) => setMessage(error.message));
  }, [user?.admin]);

  if (DEMO_MODE) return <div className="p-8"><PageHeader title="Administração da IA" subtitle="Disponível só com o servidor conectado." /></div>;
  if (!user?.admin) return <div className="p-8"><PageHeader title="Área restrita" subtitle="Esta página é só para a administração do site." /></div>;

  async function run(action: () => Promise<void>) {
    setBusy(true); setMessage("");
    try { await action(); }
    catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  const replace = (item: AiProvider) => setData((current) => current && { ...current, providers: [...current.providers.filter((p) => p.id !== item.id), item].sort((a, b) => a.name.localeCompare(b.name)) });

  function open(item?: AiProvider) {
    setEditing(item ?? null);
    setForm(item ? { name: item.name, provider: item.provider, model: item.model, api_key: "", features: item.features, enabled: item.enabled } : { ...EMPTY, features: Object.keys(data!.features) });
  }
  async function save() {
    const saved = editing ? await api.updateAiProvider(editing.id, form!) : await api.createAiProvider(form!);
    replace(saved);
    setForm(null); setEditing(null);
    setMessage(`"${saved.name}" salvo.`);
  }
  const toggleFeature = (key: string) => setForm((current) => current && { ...current, features: current.features.includes(key) ? current.features.filter((f) => f !== key) : [...current.features, key] });

  // Quem atende cada recurso: o primeiro provedor ativo (por nome) que o tem marcado.
  const owner = (feature: string) => data?.providers.find((p) => p.enabled && p.features.includes(feature));

  return (
    <div className={embedded ? "" : "mx-auto max-w-5xl p-5 sm:p-8"}>
      {embedded
        ? <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><p className="text-slate-500">Cadastre provedores de IA e escolha quais recursos do site cada um atende.</p>
          <Button onClick={() => open()} disabled={!data}><Plus size={16} /> Cadastrar IA</Button></div>
        : <PageHeader title="Administração da IA" subtitle="Cadastre provedores de IA e escolha quais recursos do site cada um atende."
          action={<Button onClick={() => open()} disabled={!data}><Plus size={16} /> Cadastrar IA</Button>} />}
      {message && <p role="status" className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-plum-900">{message}</p>}
      {data && !data.secret_ready && <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Para guardar chaves, defina <b>AI_KEYS_SECRET</b> (16 caracteres ou mais) nas variáveis do servidor e reinicie. Sem ele, o cadastro não salva a chave.</p>}

      {data && <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-plum-900"><ShieldCheck size={20} /> Recursos do site</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">{Object.entries(data.features).map(([key, label]) => {
          const by = owner(key);
          return <li key={key} className="rounded-2xl border border-slate-200 p-3 text-sm">
            <b className="block">{label}</b>
            <span className={by ? "text-emerald-700" : "text-slate-500"}>{by ? `Atendido por ${by.name} (${by.model})` : "Sem provedor: usa a chave do .env, se houver"}</span>
          </li>;
        })}</ul>
      </section>}

      {data && <section className="space-y-3">
        {!data.providers.length && <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">Nenhuma IA cadastrada ainda.</p>}
        {data.providers.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="min-w-0 flex-1"><b className="block">{item.name}</b>
                <span className="text-sm text-slate-500">Anthropic · {item.model} · <KeyRound size={13} className="inline" /> ••••{item.key_hint}</span></span>
              <Toggle checked={item.enabled} label={`Ativar ${item.name}`} onChange={(enabled) => void run(async () => {
                replace(await api.updateAiProvider(item.id, { name: item.name, provider: item.provider, model: item.model, api_key: "", features: item.features, enabled }));
              })} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">{item.features.map((f) => <span key={f} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{data.features[f]}</span>)}
              {!item.features.length && <span className="text-xs text-slate-500">Nenhum recurso marcado</span>}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" disabled={busy} onClick={() => open(item)}><Pencil size={15} /> Editar</Button>
              <Button variant="secondary" disabled={busy} onClick={() => void run(async () => {
                const result = await api.testAiProvider(item.id);
                setMessage(`Conexão com ${item.name} funcionando (${result.model}).`);
              })}><PlugZap size={15} /> Testar conexão</Button>
              <Button variant="ghost" disabled={busy} onClick={() => {
                if (!window.confirm(`Remover "${item.name}"? Os recursos dele passam para outro provedor ou para o .env.`)) return;
                void run(async () => {
                  await api.deleteAiProvider(item.id);
                  setData((current) => current && { ...current, providers: current.providers.filter((p) => p.id !== item.id) });
                  setMessage(`"${item.name}" removido.`);
                });
              }}><Trash2 size={15} /> Remover</Button>
            </div>
          </article>
        ))}
      </section>}

      {form && data && <section aria-label="Cadastro de IA" className="mt-6 rounded-3xl border border-brand-200 bg-white p-6">
        <h2 className="font-display text-xl font-bold text-plum-900">{editing ? `Editar ${editing.name}` : "Cadastrar IA"}</h2>
        <fieldset disabled={busy} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nome"><Input value={form.name} maxLength={80} placeholder="Ex.: Claude principal" onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Provedor">
            <select aria-label="Provedor" value={form.provider} disabled className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm">
              <option value="anthropic">Anthropic (Claude)</option>
            </select></Field>
          <Field label="Modelo" hint="Nome exato do modelo na API.">
            <Input list="ai-models" value={form.model} maxLength={120} onChange={(e) => setForm({ ...form, model: e.target.value.trim() })} />
            <datalist id="ai-models">{MODELS.map((m) => <option key={m} value={m} />)}</datalist></Field>
          <Field label="Chave da API" hint={editing ? `Deixe em branco para manter a atual (••••${editing.key_hint}).` : "Fica cifrada no servidor e não aparece de novo."}>
            <Input type="password" autoComplete="off" value={form.api_key} maxLength={400} onChange={(e) => setForm({ ...form, api_key: e.target.value })} /></Field>
          <div className="sm:col-span-2"><p className="text-sm font-medium text-slate-700">Recursos que esta IA atende</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">{Object.entries(data.features).map(([key, label]) => (
              <label key={key} className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                <input type="checkbox" checked={form.features.includes(key)} onChange={() => toggleFeature(key)} className="mt-0.5" />{label}</label>))}</div></div>
          <label className="flex items-center gap-2 text-sm"><Toggle checked={form.enabled} label="Ativa" onChange={(enabled) => setForm({ ...form, enabled })} /> Ativa</label>
        </fieldset>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button disabled={busy || !form.name.trim() || !form.model || (!editing && !form.api_key.trim())} onClick={() => void run(save)}><CheckCircle2 size={16} /> Salvar</Button>
          <Button variant="ghost" onClick={() => { setForm(null); setEditing(null); }}>Cancelar</Button>
        </div>
      </section>}
    </div>
  );
}
