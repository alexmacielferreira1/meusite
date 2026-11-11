import { DEMO_MODE } from "../config/app";
import { api } from "./api";

/**
 * Envia erros do navegador (falha de script, promessa rejeitada sem tratamento) para a aba Erros da Administração.
 * No máximo 5 por página e sem repetir a mesma mensagem. Na demonstração não envia nada.
 */
export function installErrorReport(target: Window = window, limit = 5) {
  if (DEMO_MODE) return () => {};
  const sent = new Set<string>();
  const send = (message: string, detail = "") => {
    message = message.trim().slice(0, 500) || "Erro sem mensagem";
    if (sent.has(message) || sent.size >= limit) return;
    sent.add(message);
    void api.reportError({ message, path: target.location.pathname.slice(0, 300), detail: detail.slice(0, 4000) }).catch(() => {});
  };
  const onError = (event: ErrorEvent) => send(event.message || String(event.error), event.error instanceof Error ? event.error.stack ?? "" : `${event.filename}:${event.lineno}`);
  const onRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    send(reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason), reason instanceof Error ? reason.stack ?? "" : "");
  };
  target.addEventListener("error", onError);
  target.addEventListener("unhandledrejection", onRejection);
  return () => {
    target.removeEventListener("error", onError);
    target.removeEventListener("unhandledrejection", onRejection);
  };
}
