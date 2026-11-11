import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { validPublicSlug } from "../../config/publicPaths";
import { DEMO_MODE } from "../../config/app";
import { api, ApiError } from "../../lib/api";
import { useStore } from "../../lib/store";
import { PortfolioSite } from "../../site/PortfolioSite";
import { demoPortfolio } from "../../data/seed";
import type { Portfolio } from "../../types/portfolio";

function PublishedSite({ slug, opportunity }: { slug: string; opportunity: boolean }) {
  const [data, setData] = useState<{ portfolio: Portfolio; title?: string }>();
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [tries, setTries] = useState(0);
  useEffect(() => {
    let current = true;
    const load = opportunity ? api.opportunity(slug) : api.publicSite(slug, tries ? password : undefined).then((portfolio) => ({ portfolio }));
    load.then((value) => { if (current) { setData(value); setLocked(false); } })
      .catch((err: Error) => { if (!current) return; if (err instanceof ApiError && err.status === 401) { setLocked(true); setError(tries ? err.message : ""); } else setError(err.message); });
    return () => { current = false; };
  // A senha só é enviada ao confirmar o formulário (tries), não a cada tecla.
  }, [slug, opportunity, tries]);
  // Mesmo título que a API põe no index.html para os robôs (backend/app/modules/share.py).
  useEffect(() => {
    if (!data) return;
    const before = document.title;
    const { name, headline } = data.portfolio.profile;
    const who = headline ? `${name} · ${headline}` : name;
    document.title = data.title ? `Seleção para ${data.title} · ${name} | Folios` : `${who} | Folios`;
    return () => { document.title = before; };
  }, [data]);
  if (data) return <PortfolioSite portfolio={data.portfolio} opportunityTitle={data.title} trackSlug={opportunity ? undefined : slug} />;
  if (locked) return <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
    <form className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center" onSubmit={(e) => { e.preventDefault(); setTries((n) => n + 1); }}>
      <h1 className="font-display text-xl font-bold">Portfólio protegido</h1>
      <p className="mt-1 text-sm text-slate-500">Digite a senha que você recebeu.</p>
      <input type="password" aria-label="Senha do portfólio" value={password} onChange={(e) => setPassword(e.target.value)} required
        className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-2.5" />
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      <button className="mt-4 w-full rounded-xl bg-brand-600 py-2.5 font-semibold text-white">Abrir portfólio</button>
    </form>
  </main>;
  return <main className="grid min-h-screen place-items-center p-6 text-center">
    <div><h1 className="font-display text-2xl font-bold">{error || "Carregando portfólio…"}</h1>
      {error && <Link to="/" className="mt-4 inline-block text-brand-700">Ir para a página inicial</Link>}</div>
  </main>;
}

export default function PublicPortfolio({ opportunity = false }: { opportunity?: boolean }) {
  const { slug = "" } = useParams();
  const location = useLocation();
  const { portfolio } = useStore();
  if (!opportunity && !validPublicSlug(slug) && !location.pathname.startsWith("/p/")) return <main className="p-8">Portfólio não encontrado</main>;
  if (!DEMO_MODE) return <PublishedSite key={slug} slug={slug} opportunity={opportunity} />;
  if (!opportunity && slug === portfolio.site.slug) return <PortfolioSite portfolio={portfolio} />;
  if (!opportunity && slug === "marinaduarte") return <PortfolioSite portfolio={demoPortfolio()} />;
  return <main className="grid min-h-screen place-items-center p-6 text-center"><h1 className="font-display text-2xl font-bold">Portfólio não encontrado</h1></main>;
}
