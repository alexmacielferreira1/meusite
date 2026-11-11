import {OpportunityManager} from "../../components/OpportunityManager";
import { Check, Copy, ExternalLink, Globe, Lock, Radio, Users } from "lucide-react";
import { QrCard } from "../../components/QrCard";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { PageHeader } from "../../components/layout/AppShell";
import { Badge, Button, Input, Toggle } from "../../components/ui";
import { APP_DOMAIN, DEMO_MODE } from "../../config/app";
import { roleById } from "../../data/roles";
import { useStore } from "../../lib/store";
import { portfolioPath, validPublicSlug } from "../../config/publicPaths";
import { slugify } from "../../lib/utils";

function Row({ icon, title, text, children }: { icon: React.ReactNode; title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-4 py-5">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
      <div className="min-w-48 flex-1"><p className="font-semibold text-slate-900">{title}</p><p className="text-sm text-slate-500">{text}</p></div>
      {children}
    </div>
  );
}

export default function Publish() {
  const { portfolio: p, update, setPublication, publishedSlug } = useStore();
  const [slug, setSlug] = useState(p.site.slug);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const href = portfolioPath(publishedSlug ?? p.site.slug);
  const validSlug = validPublicSlug(slug);
  async function publish(on: boolean) {
    setBusy(true); setMessage("");
    try { await setPublication(on); setMessage(on ? "Versão publicada." : "Site retirado do ar."); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Falha na publicação."); }
    finally { setBusy(false); }
  }
  const pro = p.plan === "essencial";
  const [locked, setLocked] = useState<boolean | null>(null);
  const [visitPassword, setVisitPassword] = useState("");
  useEffect(() => { if (!DEMO_MODE) void api.visitPassword().then((r) => setLocked(r.protected)).catch(() => setLocked(null)); }, []);
  async function savePassword(value: string | null) {
    setBusy(true); setMessage("");
    try { const r = await api.setVisitPassword(value); setLocked(r.protected); setVisitPassword(""); setMessage(r.protected ? "Senha de visita ativada." : "Senha de visita removida."); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Não foi possível salvar a senha."); }
    finally { setBusy(false); }
  }
  const url = DEMO_MODE ? `https://${APP_DOMAIN}${portfolioPath(p.site.slug)}` : new URL(href, window.location.origin).href;

  return (
    <div className="mx-auto max-w-5xl p-5 sm:p-8">
      <PageHeader title="Publicação" subtitle="Seu endereço, quem pode ver e como compartilhar." />
      {message && <p role="status" className="mb-4 text-sm">{message}</p>}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-3xl border border-slate-200 bg-white px-6">
          <Row icon={<Radio size={20} />} title="Site no ar" text={p.site.published ? "Qualquer pessoa com o link pode ver." : "Rascunho: só você vê pela Prévia."}>
            <div className="flex items-center gap-3">{p.site.published ? <Badge tone="green">Publicado</Badge> : <Badge tone="amber">Rascunho</Badge>}
              {DEMO_MODE ? <Toggle label="Publicar" checked={p.site.published} onChange={(v) => void publish(v)} /> : <Button disabled={busy || !validSlug || slug !== p.site.slug} onClick={() => void publish(true)}>{p.site.published ? "Republicar" : "Publicar site"}</Button>}</div>
          </Row>
          <div className="border-t border-slate-100" />
          <Row icon={<Globe size={20} />} title="Endereço" text="Salve o endereço no rascunho e publique para ativar.">
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <span className="shrink-0 text-sm text-slate-500">{APP_DOMAIN}/</span>
              <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value).slice(0, 64).replace(/-$/, ""))} className="sm:w-44" aria-label="Endereço" />
              {!validSlug && slug && <span role="alert" className="text-xs text-red-700">Endereço reservado ou inválido. Escolha outro nome.</span>}
              {validSlug && slug !== p.site.slug && <button onClick={() => update((x) => { x.site.slug = slug; return x; })} className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white">Salvar</button>}
            </div>
          </Row>
          <div className="border-t border-slate-100" />
          {!DEMO_MODE && p.site.published && <Row icon={<Radio size={20} />} title="Retirar site do ar" text="O rascunho será preservado."><Button variant="secondary" disabled={busy} onClick={() => void publish(false)}>Despublicar</Button></Row>}
          {!DEMO_MODE && locked !== null && <>
          <div className="border-t border-slate-100" />
          <Row icon={<Lock size={20} />} title="Senha de visita" text={locked ? "Ativa: quem abrir o link precisa digitar a senha. O site sai do diretório." : "Opcional: peça uma senha para abrir o site publicado."}>
            <form className="flex w-full items-center gap-2 sm:w-auto" onSubmit={(e) => { e.preventDefault(); void savePassword(visitPassword); }}>
              <Input type="password" aria-label="Nova senha de visita" placeholder={locked ? "Trocar senha" : "Mínimo 4 caracteres"} minLength={4} maxLength={128} value={visitPassword} onChange={(e) => setVisitPassword(e.target.value)} className="sm:w-44" />
              <Button disabled={busy || visitPassword.length < 4}>Salvar</Button>
              {locked && <Button type="button" variant="secondary" disabled={busy} onClick={() => void savePassword(null)}>Remover</Button>}
            </form>
          </Row>
          </>}
          {DEMO_MODE && <>
          <Row icon={<Globe size={20} />} title="Domínio próprio" text="Ex.: www.seunome.com.br — o SSL é automático.">
            {pro ? <Input placeholder="www.seunome.com.br" className="sm:w-56" /> : <Badge tone="brand">Plano Essencial</Badge>}
          </Row>
          <div className="border-t border-slate-100" />
          <Row icon={<Lock size={20} />} title="Portfólio privado por senha" text="Para mandar uma versão só a um cliente.">
            {pro ? <Toggle label="Senha" checked={p.site.passwordProtected} onChange={(v) => update((x) => { x.site.passwordProtected = v; return x; })} /> : <Badge tone="brand">Plano Essencial</Badge>}
          </Row>
          <div className="border-t border-slate-100" />
          <Row icon={<Globe size={20} />} title="Site em português e inglês" text="A IA traduz seus textos e o visitante troca o idioma.">
            <Toggle label="Bilíngue" checked={p.site.bilingual} onChange={(v) => update((x) => { x.site.bilingual = v; return x; })} />
          </Row>
          <div className="border-t border-slate-100" />
          </>}
          <Row icon={<Users size={20} />} title="Aparecer no diretório" text="Produtoras e agências encontram você por função e cidade.">
            <Toggle label="Diretório" checked={DEMO_MODE ? p.profile.inDirectory !== false : !!p.profile.inDirectory} onChange={(v) => update((x) => { x.profile.inDirectory = v; return x; })} />
          </Row>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Seu link</p>
            <p className="mt-1 break-all font-mono text-sm text-plum-900">{url}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button disabled={!DEMO_MODE && !publishedSlug} onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setMessage("Selecione o endereço acima e copie manualmente."); } }} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 py-2 text-sm hover:bg-slate-50">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copiado" : "Copiar"}</button>
              {(DEMO_MODE || publishedSlug) && <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 py-2 text-sm hover:bg-slate-50"><ExternalLink size={15} /> Abrir</a>}
            </div>
          </div>
          {(DEMO_MODE || publishedSlug) && <QrCard url={url} name={p.profile.name} subtitle={`${roleById(p.profile.roleId).short} · ${p.profile.city}`} fileName={publishedSlug ?? p.site.slug} />}
        </aside>
      </div>
      {!DEMO_MODE&&<OpportunityManager/>}
    </div>
  );
}

