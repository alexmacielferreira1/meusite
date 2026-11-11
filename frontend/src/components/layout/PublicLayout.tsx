import { Link, NavLink, Outlet } from "react-router-dom";
import { APP_NAME } from "../../config/app";
import { useStore } from "../../lib/store";
import { Logo } from "./Logo";

export function PublicLayout() {
  const { user } = useStore();
  const nav = "text-sm text-slate-600 hover:text-slate-900";
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            <a href="/#funcoes" className={nav}>Para quem</a>
            <a href="/#modelos" className={nav}>Modelos</a>
            <a href="/#planos" className={nav}>Planos</a>
            <NavLink to="/diretorio" className={nav}>Diretório</NavLink>
          </nav>
          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            {user ? (
              <Link to="/app" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Meu painel</Link>
            ) : (
              <>
                <Link to="/entrar" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Entrar</Link>
                <Link to="/cadastro" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Criar grátis</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-slate-100 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} {APP_NAME} · Portfólios para profissionais de comunicação</p>
          <nav aria-label="Políticas" className="flex gap-4">
            <Link to="/privacidade" className="hover:text-slate-800">Privacidade</Link>
            <Link to="/termos" className="hover:text-slate-800">Termos de uso</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
