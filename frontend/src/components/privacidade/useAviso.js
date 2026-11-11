// Kit _kit_privacidade 0.1.0: busca o aviso público uma vez (página de privacidade e termos).
import { useEffect, useState } from "react";

export function useAviso(api) {
  const [estado, setEstado] = useState({ aviso: null, erro: null, carregando: true });

  useEffect(() => {
    let ativo = true;
    api
      .aviso()
      .then((aviso) => ativo && setEstado({ aviso, erro: null, carregando: false }))
      .catch((erro) => ativo && setEstado({ aviso: null, erro: erro.message, carregando: false }));
    return () => {
      ativo = false;
    };
  }, [api]);

  return estado;
}
