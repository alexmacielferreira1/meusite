// Kit _kit_privacidade 0.1.0: chamadas públicas de /api/v1/privacidade (sem login).
// O token do link do e-mail vai no corpo (POST), nunca na URL do pedido.

async function lerJson(resposta) {
  let corpo = null;
  try {
    corpo = await resposta.json();
  } catch {
    corpo = null;
  }
  if (!resposta.ok) {
    const erro = new Error(corpo?.detail && typeof corpo.detail === "string" ? corpo.detail : "Não foi possível concluir. Tente de novo.");
    erro.status = resposta.status;
    throw erro;
  }
  return corpo;
}

export function criarApiPrivacidade(base = "/api/v1/privacidade", fetcher = (...args) => fetch(...args)) {
  const enviar = (caminho, corpo) =>
    fetcher(`${base}${caminho}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(corpo),
    }).then(lerJson);

  return {
    aviso: () => fetcher(`${base}/aviso`, { credentials: "same-origin" }).then(lerJson),
    pedidoPublico: ({ email, tipo, detalhe }) => enviar("/pedidos/publico", { email, tipo, detalhe: detalhe || null }),
    confirmarPedido: (token) => enviar("/pedidos/confirmar", { token }),
  };
}

export const apiPrivacidade = criarApiPrivacidade();
