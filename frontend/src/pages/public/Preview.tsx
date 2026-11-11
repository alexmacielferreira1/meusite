import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { DEMO_MODE } from "../../config/app";
import { useStore } from "../../lib/store";
import { api } from "../../lib/api";
import { demoPortfolio } from "../../data/seed";
import { PortfolioSite } from "../../site/PortfolioSite";
import type { Portfolio } from "../../types/portfolio";

/** Página carregada dentro do iframe do editor; recebe o rascunho por postMessage. */
export default function Preview() {
  const { user, ready, portfolio } = useStore();
  const [received, setReceived] = useState(false);
  const [p, setP] = useState<Portfolio>(() => api.loadPortfolio() ?? demoPortfolio());
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source === window.parent && e.origin === window.location.origin && e.data?.type === "meusite:preview") { setP(e.data.portfolio); setReceived(true); }
    };
    window.addEventListener("message", onMsg);
    window.parent?.postMessage({ type: "meusite:preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMsg);
  }, []);
  if (!DEMO_MODE && !ready) return <p className="p-8">Carregando prévia…</p>;
  if (!DEMO_MODE && !user) return <Navigate to="/entrar" replace />;
  return <PortfolioSite portfolio={DEMO_MODE || received ? p : portfolio} />;
}
