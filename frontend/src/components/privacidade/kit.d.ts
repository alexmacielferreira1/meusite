// Tipos mínimos das páginas do _kit_privacidade (os arquivos do kit são .js/.jsx e não são
// editados no app). Só o que o MeuSite usa.
declare module "*/privacidade/privacidadeApi" {
  export interface ApiPrivacidade {
    aviso: () => Promise<unknown>;
    pedidoPublico: (pedido: { email: string; tipo: string; detalhe?: string }) => Promise<unknown>;
    confirmarPedido: (token: string) => Promise<unknown>;
  }
  export function criarApiPrivacidade(base?: string, fetcher?: typeof fetch): ApiPrivacidade;
  export const apiPrivacidade: ApiPrivacidade;
}

declare module "*/privacidade/PaginaPrivacidade" {
  import type { ApiPrivacidade } from "*/privacidade/privacidadeApi";
  export default function PaginaPrivacidade(props: { api?: ApiPrivacidade; className?: string }): JSX.Element;
}

declare module "*/privacidade/PaginaTermos" {
  import type { ApiPrivacidade } from "*/privacidade/privacidadeApi";
  export default function PaginaTermos(props: { api?: ApiPrivacidade; className?: string; clausulas?: { titulo: string; texto: string }[] }): JSX.Element;
}
