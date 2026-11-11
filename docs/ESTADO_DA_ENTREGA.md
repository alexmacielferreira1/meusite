# Estado da primeira entrega — MeuSite

## Funcional verificado

- 105 exemplos: 75 composições da base e 30 empresariais; renderização em 1280/390 px, sem erros JS, sem imagens ausentes e sem overflow horizontal na bateria de navegador.
- Dez pranchas com três sites cada, capturadas das implementações após aguardar carregamento das páginas e imagens.
- Cadastro/login com JWT em cookie HttpOnly, revogação no logout, editor e publicação reais usando PostgreSQL isolado.
- Pedido público com adicional, valor calculado no servidor, protocolo, caixa privada e mudança de status.
- Rascunho alterado sem modificar o snapshot público.
- Proteção de propriedade na caixa, token contra duplicidade, itens/adicionais/CEP validados e recusa de banco sem identidade MeuSite.
- Build de produção, typecheck e testes próprios de frontend/backend.

Relatórios: `testes/modelos-navegador.json`, `testes/fluxo-navegador.json`, `testes/validacao-resumo.json`. As verificações usam contas e dados fictícios em banco de teste; nenhum dado do Folios foi importado.

## Implementado com configuração externa necessária

- IA textual: exige chave/modelo/provedor e saldo; nenhuma chamada real de IA foi cobrada durante os testes.
- Visita virtual: abre o link HTTPS real fornecido pelo negócio; não foi integrado um provedor de tours em produção.
- Publicação na ShardCloud: ZIP preparado; exige novo app, novo banco e variáveis do dono. Não foi publicado em uma conta de hospedagem durante esta entrega.

## Ainda não implementado

Pagamento online, assinatura automatizada da plataforma, estoque quantitativo, agenda com bloqueio de capacidade, notificações automáticas, confirmação instantânea, guia de IA em tour, reconstrução 3D, vídeo gerado, construtor de cenas completo, multisite/equipes e domínios próprios por cliente.

O canvas é a base manual reaproveitada, com ajustes rápidos/camadas/versões. A reconstrução integral de recursos do MediaMind não faz parte deste pacote. A regressão relatada por Alex no canvas Folios está registrada para revisão posterior do Folios.

## Limites

Um site por conta; até 250 itens; até 20 adicionais por item; formulário até 50 linhas e quantidade 50 por linha; documento até 8 MiB por gravação. Fotos de exemplo e fontes são locais. Dados comerciais e pessoais devem ser reais e autorizados antes de abrir atendimento.

## Próximo ciclo recomendado

Pilotar pizzaria, prestador e imobiliária; corrigir pontos de preenchimento/atendimento; implementar operação de agenda/estoque/notificações; então checkout e receitas cinematográficas por família. O plano completo registra dependências e aceites.
