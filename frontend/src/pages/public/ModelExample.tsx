import { Navigate, useParams } from "react-router-dom";
import { demoFor } from "../../data/demoContent";
import { TEMPLATES } from "../../data/templates";
import { PortfolioSite } from "../../site/PortfolioSite";

/** Página inteira de um modelo com o conteúdo de exemplo: /exemplo/<id-do-modelo>. */
export default function ModelExample() {
  const { modelo = "" } = useParams();
  if (!TEMPLATES.some((t) => t.id === modelo)) return <Navigate to="/exemplo" replace />;
  return <PortfolioSite portfolio={demoFor(modelo)} />;
}
