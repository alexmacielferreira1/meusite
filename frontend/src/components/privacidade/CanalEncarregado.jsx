// Kit _kit_privacidade 0.1.0: canal do encarregado (LGPD art. 41 §1º e §2º I).
// Mostra quem é o encarregado e abre um pedido do titular sem login: o pedido só vale depois que a
// pessoa clicar no link enviado ao e-mail (POST /api/v1/privacidade/pedidos/publico).
import { useState } from "react";
import { apiPrivacidade } from "./privacidadeApi";
import { TIPOS_PEDIDO, exibir } from "./textosPrivacidade";

export default function CanalEncarregado({ encarregado, api = apiPrivacidade, className = "" }) {
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState("acesso");
  const [detalhe, setDetalhe] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [erro, setErro] = useState(null);

  async function enviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await api.pedidoPublico({ email, tipo, detalhe });
      setMensagem(resposta.mensagem);
      setDetalhe("");
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setEnviando(false);
    }
  }

  const contato = encarregado || {};
  return (
    <section className={className} aria-labelledby="kit-encarregado">
      <h2 id="kit-encarregado">Encarregado de dados (canal de privacidade)</h2>
      <p>
        Encarregado: <strong>{exibir(contato.nome)}</strong>. E-mail: <strong>{exibir(contato.email)}</strong>.
        {contato.canal ? ` ${contato.canal}.` : ""}
      </p>
      <p>Respondemos em até 15 dias. Para pedidos sem login, confirmamos por um link no seu e-mail.</p>
      {mensagem ? (
        <p role="status">{mensagem}</p>
      ) : (
        <form onSubmit={enviar}>
          <label>
            Seu e-mail
            <input type="email" required maxLength={320} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            O que você precisa
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS_PEDIDO.map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>
          <label>
            Detalhes (opcional; não envie documentos nem dados sensíveis)
            <textarea maxLength={2000} value={detalhe} onChange={(e) => setDetalhe(e.target.value)} />
          </label>
          {erro && <p role="alert">{erro}</p>}
          <button type="submit" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar pedido"}
          </button>
        </form>
      )}
    </section>
  );
}
