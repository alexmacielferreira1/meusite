import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../../components/layout/Logo";
import { Button, Field, Input } from "../../components/ui";
import { DEMO_MODE } from "../../config/app";
import { api } from "../../lib/api";
import { useStore } from "../../lib/store";

function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-plum-900 p-10 text-white lg:flex">
        <Logo dark />
        <div>
          <p className="font-display text-4xl font-bold leading-tight">Seu negócio, com uma presença que faz acontecer.</p>
          <p className="mt-4 text-white/60">Escolha um modelo, personalize e comece a receber contatos.</p>
        </div>
        <p className="text-sm text-white/40">Sites para pequenos negócios</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Login() {
  const { setUser } = useStore();
  const nav = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(DEMO_MODE ? "marina@exemplo.com" : "");
  const [pass, setPass] = useState(DEMO_MODE ? "demo1234" : "");
  return (
    <AuthCard title="Entrar" subtitle="Bem-vindo de volta.">
      <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setError(""); try { await setUser(await api.login(email, pass)); nav("/app"); } catch (err) { setError(err instanceof Error ? err.message : "Falha ao entrar."); } finally { setBusy(false); } }}>
        <Field label="E-mail"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Senha"><Input type="password" required value={pass} onChange={(e) => setPass(e.target.value)} /></Field>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <Button disabled={busy} className="w-full" size="lg">Entrar</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">Não tem conta? <Link to="/cadastro" className="font-medium text-brand-700">Criar grátis</Link> · <Link to="/privacidade">Privacidade</Link></p>
    </AuthCard>
  );
}

export function Signup() {
  const { setUser } = useStore();
  const nav = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  return (
    <AuthCard title="Crie o site do seu negócio" subtitle="Comece com seu cadastro e personalize no seu ritmo.">
      <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setError(""); try { await setUser(await api.register(name, email, pass)); nav("/app/negocio"); } catch (err) { setError(err instanceof Error ? err.message : "Falha no cadastro."); } finally { setBusy(false); } }}>
        <Field label="Nome completo"><Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Como quer aparecer no site" /></Field>
        <Field label="E-mail"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Senha" hint="Mínimo de 8 caracteres"><Input type="password" minLength={8} required value={pass} onChange={(e) => setPass(e.target.value)} /></Field>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <Button disabled={busy} className="w-full" size="lg">Criar conta</Button>
        <p className="text-xs text-slate-500">Ao criar a conta, você concorda com os <Link to="/termos" className="underline">termos de uso</Link>. Se chegou por um anúncio, grupo ou parceiro, guardamos de qual link veio para medir nossa divulgação (<Link to="/privacidade" className="underline">privacidade</Link>).</p>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">Já tem conta? <Link to="/entrar" className="font-medium text-brand-700">Entrar</Link></p>
    </AuthCard>
  );
}
