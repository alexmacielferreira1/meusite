// Kit _kit_privacidade 0.1.0: textos e regras comuns das páginas de privacidade e termos.
// Não edite no app: a mudança volta para o kit (PRIVACIDADE.md, "Regras de texto").

export const EM_DEFINICAO = "em definição";

// Mesma lista do backend (config_privacidade.PROMESSAS_PROIBIDAS).
export const PROMESSAS_PROIBIDAS = [
  "em conformidade",
  "100% seguro",
  "100% segura",
  "totalmente seguro",
  "totalmente segura",
  "garantimos a segurança",
  "segurança garantida",
  "inviolável",
  "nunca compartilhamos",
  "risco zero",
];

export const TIPOS_PEDIDO = [
  ["acesso", "Ver os meus dados"],
  ["correcao", "Corrigir dados"],
  ["eliminacao", "Eliminar os meus dados"],
  ["anonimizacao", "Anonimizar ou bloquear dados"],
  ["portabilidade", "Levar os meus dados a outro serviço"],
  ["compartilhamento", "Saber com quem os dados são compartilhados"],
  ["revogacao", "Revogar um consentimento"],
  ["duvida", "Falar com o encarregado"],
];

export const AVISO_TEXTO_BASE =
  "Texto-base: ainda passa por revisão jurídica. O que não foi definido aparece como “em definição”.";

export function exibir(valor) {
  if (valor === null || valor === undefined) return EM_DEFINICAO;
  const texto = String(valor).trim();
  if (!texto || texto.toLowerCase().includes("[a preencher]")) return EM_DEFINICAO;
  return texto;
}

export function promessasEm(texto) {
  const baixo = String(texto).toLowerCase();
  return PROMESSAS_PROIBIDAS.filter((p) => baixo.includes(p));
}
