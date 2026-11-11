import { useEffect } from "react";
import { Link } from "react-router-dom";
import { API_URL, DEMO_MODE } from "../../config/app";
import { criarApiPrivacidade } from "../../components/privacidade/privacidadeApi";
import PaginaPrivacidade from "../../components/privacidade/PaginaPrivacidade";
import PaginaTermos from "../../components/privacidade/PaginaTermos";

// Páginas do _kit_privacidade 0.1.1 (texto vem de GET /api/v1/privacidade/aviso). O app só passa
// o estilo: o conteúdo é do kit e da configuração backend/app/privacidade/privacidade.toml.
const ESTILO = [
  "mx-auto max-w-3xl px-4 py-12 text-slate-700",
  "[&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-plum-900",
  "[&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-plum-900",
  "[&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6",
].join(" ");

const api = criarApiPrivacidade((API_URL === "." ? "" : API_URL.replace(/\/$/, "")) + "/api/v1/privacidade");

export default function Legal({ tipo }: { tipo: "privacidade" | "termos" }) {
  useEffect(() => {
    const antes = document.title;
    document.title = `${tipo === "privacidade" ? "Privacidade" : "Termos de uso"} | MeuSite`;
    return () => { document.title = antes; };
  }, [tipo]);
  if (DEMO_MODE) {
    return <main className={ESTILO}>
      <h1>{tipo === "privacidade" ? "Privacidade" : "Termos de uso"}</h1>
      <p>Esta é a demonstração, sem servidor. O texto completo fica no site conectado, em /{tipo}.</p>
      <p><Link to="/" className="text-brand-700">Voltar para o início</Link></p>
    </main>;
  }
  return tipo === "privacidade" ? <PaginaPrivacidade api={api} className={ESTILO} /> : <PaginaTermos api={api} className={ESTILO} />;
}
