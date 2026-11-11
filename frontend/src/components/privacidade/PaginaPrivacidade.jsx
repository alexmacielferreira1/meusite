// Kit _kit_privacidade 0.1.1: página pública /privacidade (LGPD art. 9º), montada só a partir de
// GET /api/v1/privacidade/aviso. A página só afirma o que está na configuração do app; campo vazio
// aparece como "em definição" (PRIVACIDADE.md).
import CanalEncarregado from "./CanalEncarregado";
import { apiPrivacidade } from "./privacidadeApi";
import { AVISO_TEXTO_BASE, exibir } from "./textosPrivacidade";
import { useAviso } from "./useAviso";

function Lista({ itens }) {
  return itens && itens.length ? itens.join(", ") : "nenhum declarado";
}

export default function PaginaPrivacidade({ api = apiPrivacidade, className = "" }) {
  const { aviso, erro, carregando } = useAviso(api);

  if (carregando) return <main className={className}>Carregando...</main>;
  if (erro || !aviso) {
    return (
      <main className={className}>
        <h1>Privacidade</h1>
        <p role="alert">Não foi possível carregar a página agora. Tente de novo em instantes.</p>
      </main>
    );
  }

  const { controlador, encarregado } = aviso;
  return (
    <main className={className}>
      <h1>Privacidade no {aviso.app}</h1>
      <p>
        Versão {aviso.versao}, atualizada em {exibir(aviso.atualizado_em)}. {AVISO_TEXTO_BASE}
      </p>

      <section aria-labelledby="kit-responsavel">
        <h2 id="kit-responsavel">Quem é o responsável</h2>
        <p>
          {exibir(controlador.nome)} (documento: {exibir(controlador.documento)}), endereço:{" "}
          {exibir(controlador.endereco)}, e-mail: {exibir(controlador.email)}.
        </p>
        {aviso.papel === "operador" && (
          <p>
            Para os dados que as empresas clientes colocam no app, a empresa é a controladora e nós tratamos os
            dados em nome dela, conforme o contrato.
          </p>
        )}
      </section>

      <section aria-labelledby="kit-finalidades">
        <h2 id="kit-finalidades">Quais dados tratamos e para quê</h2>
        <table>
          <thead>
            <tr>
              <th>Para quê</th>
              <th>Dados</th>
              <th>Base legal</th>
              <th>Por quanto tempo</th>
            </tr>
          </thead>
          <tbody>
            {aviso.finalidades.map((f) => (
              <tr key={f.chave}>
                <td>
                  {f.nome}
                  {f.consentimento && " (só com o seu consentimento, que pode ser revogado quando quiser)"}
                </td>
                <td>
                  <Lista itens={f.dados} />
                </td>
                <td>{f.base_legal}</td>
                <td>{exibir(f.prazo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="kit-operadores">
        <h2 id="kit-operadores">Com quem compartilhamos</h2>
        {aviso.operadores.length ? (
          <ul>
            {aviso.operadores.map((o) => (
              <li key={`${o.nome}-${o.servico}`} data-testid="operador">
                <strong>{exibir(o.nome)}</strong>: {o.servico} ({o.pais}). Dados: <Lista itens={o.dados} />.
                {o.internacional && ` Transferência internacional; garantia (LGPD art. 33): ${exibir(o.mecanismo)}.`}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum serviço de terceiros declarado.</p>
        )}
      </section>

      <section aria-labelledby="kit-navegador">
        <h2 id="kit-navegador">Cookies e armazenamento no navegador</h2>
        {aviso.armazenamento.length ? (
          <ul>
            {aviso.armazenamento.map((a) => (
              <li key={a.nome}>
                {a.nome} ({a.tipo}): {a.finalidade}. {a.essencial ? "Essencial." : "Opcional."} Prazo:{" "}
                {exibir(a.prazo)}.
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum declarado.</p>
        )}
      </section>

      {aviso.registro_acesso && (
        <section aria-labelledby="kit-registro">
          <h2 id="kit-registro">Registro de acesso</h2>
          <p>
            Por lei (Marco Civil da Internet, art. 15), guardamos por {aviso.registro_acesso.prazo}, sob sigilo:{" "}
            {aviso.registro_acesso.dados.join(", ")}. Depois desse prazo, apagamos, salvo pedido de autoridade.
          </p>
        </section>
      )}

      <section aria-labelledby="kit-direitos">
        <h2 id="kit-direitos">Seus direitos (LGPD art. 18)</h2>
        <ul>
          {aviso.direitos.map((d) => (
            <li key={d.chave}>
              {d.direito} ({d.artigo}). {d.como}
            </li>
          ))}
        </ul>
        <p>Respondemos em até {aviso.prazo_resposta_dias} dias. Você também pode reclamar à ANPD.</p>
      </section>

      {aviso.pedidos_online === false ? (
        <section aria-labelledby="kit-pedido">
          <h2 id="kit-pedido">Como fazer um pedido</h2>
          <p>
            Escreva para o encarregado ({exibir(encarregado.nome)}) no e-mail {exibir(encarregado.email)}, dizendo o que você
            quer (acesso, correção, eliminação ou outro direito). Respondemos em até {aviso.prazo_resposta_dias} dias.
          </p>
        </section>
      ) : (
        <CanalEncarregado encarregado={encarregado} api={api} />
      )}
    </main>
  );
}
