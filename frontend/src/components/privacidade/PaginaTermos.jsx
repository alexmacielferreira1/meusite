// Kit _kit_privacidade 0.1.0: página pública /termos, a partir de GET /api/v1/privacidade/aviso.
// Bloco de comércio eletrônico só quando a configuração tem [comercio] ativo: identificação do
// fornecedor e atendimento (Decreto 7.962/2013 art. 2º e 4º) e arrependimento (CDC art. 49;
// Decreto 7.962 art. 5º). Cláusulas próprias do app entram por `clausulas` ({titulo, texto}).
import { apiPrivacidade } from "./privacidadeApi";
import { AVISO_TEXTO_BASE, exibir } from "./textosPrivacidade";
import { useAviso } from "./useAviso";

function Comercio({ comercio }) {
  return (
    <>
      <section aria-labelledby="kit-fornecedor">
        <h2 id="kit-fornecedor">Quem vende</h2>
        <p>
          {exibir(comercio.razao_social)}, CNPJ {exibir(comercio.cnpj)}, endereço {exibir(comercio.endereco)}, e-mail{" "}
          {exibir(comercio.email_atendimento)}
          {comercio.telefone ? `, telefone ${comercio.telefone}` : ""}.
        </p>
      </section>
      <section aria-labelledby="kit-atendimento">
        <h2 id="kit-atendimento">Atendimento</h2>
        <p>
          Dúvidas, reclamações, suspensão ou cancelamento de contrato pelo e-mail {exibir(comercio.email_atendimento)}.
          Respondemos em até {comercio.prazo_resposta_atendimento_dias} dias.
        </p>
      </section>
      <section aria-labelledby="kit-arrependimento">
        <h2 id="kit-arrependimento">Direito de arrependimento</h2>
        <p>
          Você pode desistir da compra em até {comercio.prazo_arrependimento_dias} dias, contados da contratação ou do
          recebimento do produto ou serviço (CDC art. 49), pelo mesmo meio da compra ou pelo e-mail de atendimento.
          Devolvemos os valores pagos, atualizados, e avisamos a operadora do cartão ou do pagamento para não
          lançar ou estornar a cobrança (Decreto 7.962/2013 art. 5º).
        </p>
      </section>
    </>
  );
}

export default function PaginaTermos({ api = apiPrivacidade, clausulas = [], className = "" }) {
  const { aviso, erro, carregando } = useAviso(api);

  if (carregando) return <main className={className}>Carregando...</main>;
  if (erro || !aviso) {
    return (
      <main className={className}>
        <h1>Termos de uso</h1>
        <p role="alert">Não foi possível carregar a página agora. Tente de novo em instantes.</p>
      </main>
    );
  }

  const { controlador } = aviso;
  return (
    <main className={className}>
      <h1>Termos de uso do {aviso.app}</h1>
      <p>
        Versão {aviso.versao}, atualizada em {exibir(aviso.atualizado_em)}. {AVISO_TEXTO_BASE}
      </p>
      <section aria-labelledby="kit-quem">
        <h2 id="kit-quem">Quem oferece o serviço</h2>
        <p>
          {exibir(controlador.nome)} (documento: {exibir(controlador.documento)}), endereço:{" "}
          {exibir(controlador.endereco)}, e-mail: {exibir(controlador.email)}.
        </p>
      </section>
      <section aria-labelledby="kit-uso">
        <h2 id="kit-uso">Uso do app</h2>
        <p>
          A conta é pessoal: guarde a sua senha e avise-nos se perceber acesso que não foi seu. Não use o app para
          atividade ilegal nem para tratar dados de outras pessoas sem base legal.
        </p>
      </section>
      {clausulas.map((c) => (
        <section key={c.titulo}>
          <h2>{c.titulo}</h2>
          <p>{c.texto}</p>
        </section>
      ))}
      {aviso.comercio && <Comercio comercio={aviso.comercio} />}
      <section aria-labelledby="kit-privacidade">
        <h2 id="kit-privacidade">Privacidade</h2>
        <p>
          Como tratamos os seus dados e como exercer os seus direitos: <a href="/privacidade">página de privacidade</a>.
        </p>
      </section>
      <section aria-labelledby="kit-mudancas">
        <h2 id="kit-mudancas">Mudanças nestes termos</h2>
        <p>A versão e a data no topo desta página mostram a última mudança.</p>
      </section>
    </main>
  );
}
