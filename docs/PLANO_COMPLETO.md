# MeuSite — plano concreto do produto

Versão inicial de 11/11/2026. Nome escolhido por Alex: **MeuSite — meusite.id**. Aplicação independente, usando Folios como ponto de partida técnico. Domínio não registrado/configurado nesta entrega.

## 1. Objetivo e público

Permitir que um pequeno negócio publique um site bonito e útil sem programar. O objetivo do site é definido antes da composição: apresentar catálogo, receber pedido, receber orçamento ou solicitar horário. O produto precisa adaptar conteúdo e jornada ao segmento, não apenas trocar cores de um portfólio.

Primeiros pilotos recomendados: pizzaria de bairro, prestador de serviços e imobiliária. Eles cobrem venda simples, atendimento e coleção de imóveis. Outros segmentos aproveitam esses módulos com campos e composições próprias.

## 2. O que é entregue nesta versão

| Área | Comportamento implementado |
|---|---|
| Plataforma | Landing MeuSite, catálogo público de modelos, exemplos e dez pranchas navegáveis |
| Conta | Cadastro, login, sessão, saída e editor por proprietário |
| Conteúdo | Nome, segmento, apresentação, CTA, contato, endereço, cidade, horários e imagem principal |
| Catálogo | Produtos, serviços e imóveis; categorias, preço em centavos, descrição, imagem, disponibilidade, destaque |
| Alimentação | Carrinho, quantidades, adicionais, meia-meia por item, regra maior sabor/média, retirada/entrega, taxa, mínimo e restrição por prefixos de CEP |
| Imóveis | Ficha com preço, área, quartos, localização e link HTTPS para visita virtual real |
| Atendimento | Solicitação de orçamento e horário desejado, com protocolo e confirmação manual |
| Operação | Caixa privada de solicitações; mudança de status e link para responder pelo WhatsApp |
| Publicação | Rascunho/revisão/snapshot público, republicação e retirada do ar |
| Aparência | Modelo, cores, fonte, cantos, intensidade de movimento e controles herdados compatíveis |
| Artes | Editor básico herdado: ajustes rápidos e canvas de camadas, original e versões; não é paridade completa com MediaMind |
| IA textual | Sugestão de apresentação mediante provedor configurado; revisão antes de aplicar; consumo de crédito no servidor |
| Separação | Banco exclusivo, chaves próprias, namespace do navegador e proteção de identidade do banco |

Pedidos são recebidos para confirmação. Não há cobrança online, garantia de disponibilidade, envio automático de mensagem, roteamento de entregador, agenda em tempo real ou reserva instantânea. Esses comportamentos não são simulados como concluídos.

## 3. Catálogo: 75 + 30

Os **75 modelos da base** são renderizadores de composição reaproveitados, com adaptação de vocabulário e conteúdo. A entidade de negócio alimenta suas galerias através de um adaptador; currículo, formação e hotsite de vaga não fazem parte da experiência MeuSite.

Os **30 novos modelos**, derivados das dez pranchas de negócios, usam 12 famílias de composição: split, poster, overlap, editorial, mosaic, horizontal, cinematic, portrait, stage, minimal, cards e story. Cada modelo tem identidade, segmento recomendado, exemplo e ação. Família compartilhada não significa 30 implementações inteiramente distintas.

O catálogo lista **105 modelos**, permite busca, grupos, prévia em iframe e aplicação ao rascunho. As miniaturas são capturas dos sites implementados. Os 75 foram verificados com conteúdo de negócio em 1280 e 390 px; os 30 seguem a mesma verificação. Isso verifica renderização, imagens, erros JS e largura; não equivale a auditoria manual de todos os detalhes de cada composição.

As dez novas pranchas estão em `docs/pranchas/prancha-11.jpg` a `prancha-20.jpg` e nas rotas `/pranchas/11` a `/pranchas/20`. São capturas das implementações inspiradas nos conceitos da conversa, não reprodução idêntica das antigas artes geradas por IA.

## 4. Jornadas

### Dono do negócio

Criar conta → preencher negócio → escolher objetivo → cadastrar coleção → escolher modelo → ajustar aparência/artes → conferir prévia → publicar → receber/confirmar solicitações → republicar alterações.

Os dados de exemplo só entram quando a pessoa escolhe carregá-los. Cadastro de produção começa sem catálogo de demonstração. Trocar segmento ajusta o objetivo, preservando conteúdo; carregar exemplo pode substituir o rascunho com confirmação quando já há itens.

### Consumidor: pedido

Abrir site → filtrar catálogo → escolher adicionais/meia-meia → adicionar → conferir quantidades → informar nome/telefone → escolher retirada ou entrega → endereço/CEP se entrega → consentimento → enviar → receber protocolo → aguardar confirmação do negócio.

Preço e taxa são recalculados no servidor com o snapshot publicado. O cliente não envia o total. Duplicidade usa token de tentativa e hash do pedido. Mudança de preço no rascunho não altera um pedido vindo do snapshot antigo até a republicação.

### Consumidor: serviço ou imóvel

Explorar opções → ver ficha e visita virtual quando cadastrada → selecionar interesse → descrever necessidade → pedir orçamento ou sugerir data → receber protocolo → equipe confirma. Agendamento não bloqueia capacidade nesta versão; deve ser tratado como solicitação.

### Equipe do negócio

Entrar → abrir Pedidos e contatos → conferir itens, contato, endereço/data e observações → confirmar ou cancelar → atualizar preparo/entrega/conclusão quando aplicável → responder manualmente. Não há notificações automáticas: é preciso monitorar o painel.

## 5. Entidades e campos

### Business

`schemaVersion`, `segment`, `name`, `headline`, `description`, `email`, `phone`, `instagram`, `address`, `city`, `hours`, `heroImage`, `cta`, `orderMode`, `openForOrders`, `deliveryFeeCents`, `minimumOrderCents`, `deliveryAreas`, `deliveryPostalPrefixes`, `halfPizza`, `halfRule`, `items`, `faq`, `team`.

Horários são informativos; abertura para solicitações é controlada pelo proprietário. Prefixos de CEP são regra simples de área. Cálculo por distância, feriados e horários automáticos são posteriores.

### BusinessItem

Identificador, tipo produto/serviço/imóvel, nome, categoria, descrição, preço em centavos, imagem, disponibilidade, destaque, adicionais. Imóvel acrescenta área, quartos, localização e link HTTPS da visita. Galeria e equipe têm contrato de dados; o editor inicial concentra o cadastro de imagem principal e dos itens, FAQ e dados comerciais.

### BusinessRequest

ID, conta proprietária, tipo, situação, instante, total, payload privado, token e hash de tentativa. Payload contém contato, interesse/itens, endereço/data, observações e valores recalculados. Não faz parte do snapshot público.

### Compatibilidade consciente

O documento preserva internamente `profile`, `works` e `site` da base para reutilizar 75 composições, versões e publicação. A fonte de verdade do conteúdo empresarial é `business`, validada por Pydantic. `adaptBusiness` traduz para o contrato visual; o usuário não precisa preencher uma profissão de comunicação ou currículo.

A primeira versão permite **um negócio/site por conta**. Multisite, filiais, equipes com permissões e domínio próprio por cliente requerem evolução do schema, não um botão simulado.

## 6. Arquitetura e arquivos

```text
frontend/src/business/
  catalog.ts          30 segmentos, pranchas e famílias
  types.ts            documento empresarial e solicitações
  adapter.ts          negócio → contrato dos 75 modelos
  BusinessSite.tsx    renderização e composições dos 30 novos modelos
  Commerce.tsx        catálogo, carrinho e formulário real
  Panel.tsx           editor e operação do negócio
  Public.tsx          landing, modelos, pranchas, prévia e site público
  styles.css          composições, quadros e movimento
  panel.css           identidade da plataforma/editor
frontend/src/site/    75 composições da base e componentes compartilhados
frontend/src/components/ArtStudio.tsx e LayerStudio.tsx
backend/app/modules/
  auth.py             conta e sessão
  sites.py            documento, revisão e snapshot
  business.py         validação empresarial, pedidos e caixa privada
  ai.py / aiadmin.py  provedor textual, limites e créditos
backend/migrations/versions/0011_business.py
run.py               valida banco exclusivo, migra e inicia produção
scripts/empacotar.py  ZIP de execução e ZIP do projeto
```

As migrações anteriores preservam identificadores e algumas tabelas históricas por compatibilidade da base. Não há cópia dos registros do Folios. Rotas de oportunidades/currículos não estão conectadas ao aplicativo MeuSite. Antes de remover código legado adicional, rastrear consumidores do Estúdio, renderizadores e administração.

## 7. APIs novas e reaproveitadas

| Método e rota | Uso |
|---|---|
| POST `/api/v1/auth/register` e `/auth/login` | Conta e sessão |
| GET/PUT `/api/v1/sites/me` | Rascunho com revisão |
| POST `/api/v1/sites/me/publish` | Publicar snapshot |
| POST `/api/v1/sites/me/unpublish` | Retirar publicação |
| GET `/api/v1/public/sites/{slug}` | Conteúdo público filtrado |
| POST `/api/v1/business/{slug}/requests` | Pedido/orçamento/horário público |
| GET `/api/v1/business/me/requests` | Caixa do proprietário |
| PATCH `/api/v1/business/me/requests/{id}` | Atualizar situação com propriedade validada |
| POST `/api/v1/ai/suggest` | Sugestão textual com custo e revisão |

A publicação usa lista explícita de campos públicos. A caixa privada exige autenticação e filtra pelo proprietário. Entrada comercial tem limites, validação de valores, itens disponíveis, adicionais e CEP. Mídias aceitam imagens enviadas ou HTTPS; URLs de visita precisam ser HTTPS.

## 8. Sistema visual e dinâmico

A base atual tem enquadramento lento de fotos, parallax/resposta ao ponteiro, entradas por interseção e mudanças de composição. Não usa as bolinhas/rosquinhas 3D compartilhadas removidas a pedido de Alex. Movimento reduzido é respeitado.

A evolução deve ser um sistema de **cenas por família**, descrito em SISTEMA_DE_MOVIMENTO.md: trajetória, transição, duração, direção, mídia e alternativa no toque. Não aplicar o mesmo efeito a todos. O conteúdo e a compra devem continuar usáveis sem animação.

O editor de cenas completo, trilha visual, transições de câmera autorais, vídeos gerados, objetos 3D de clientes e tours próprios não estão implementados nesta versão inicial.

## 9. IA: função concreta por segmento

| Segmento | Próxima integração | Dados exigidos | Aceite |
|---|---|---|---|
| Alimentação | Assistente que encontra produtos e monta sugestão para revisão | Catálogo e regras publicados | Nunca inventar preço, ingrediente ou disponibilidade |
| Serviços | Organizar briefing e sugerir perguntas para orçamento | Serviços e área atendida | Orçamento final confirmado por pessoa |
| Imóveis | Guia de navegação em tour real e respostas sobre ficha | Panoramas/captura, planta e descrição autorizadas | Não inventar cômodos, metragem ou orientação espacial |
| Hospedagem | Recomendação de opções e roteiro | Inventário, datas e disponibilidade integrada | Reserva só após confirmação do sistema de estoque |
| Comércio | Busca e recomendação de itens | Catálogo, variantes e estoque real | Checkout usa valores do servidor |
| Beleza/saúde | Organizar procura e encaminhar agendamento | Serviços e agenda | Sem diagnóstico ou promessa clínica |

Reusar o padrão de provedor no servidor, saldo, custo e estorno. Não embutir chaves no navegador. Guardar sugestões separadas do publicado e exigir revisão. Medir taxa de erro e custo antes de liberar ações automáticas.

## 10. Execução em fases com critérios de aceite

### Fase 1 — pacote inicial e pilotos

Entregar esta base, configurar novo app/banco, validar três negócios reais e substituir exemplos. Aceites: cadastro/editor/publicação, 105 exemplos acessíveis, pedido recebido pela conta correta, total correto e rascunho separado do público. Registrar falhas e métricas de conversão.

### Fase 2 — operação de venda e agenda

Catálogo com variantes, disponibilidade por horário, estoque real, zonas de entrega, cupons, opção sem entrega, exportação e exclusão de contatos, retenção, notificações. Agenda por profissional/recurso, duração, capacidade, bloqueio transacional, fuso, cancelamento e lembretes. Aceite: duas pessoas não reservam a mesma capacidade; operações repetidas não duplicam pedido.

### Fase 3 — pagamento e monetização

Checkout com provedor escolhido, cobranças e webhooks autenticados/idempotentes, pagamento pendente/aprovado/recusado/reembolsado, cancelamento e reconciliação. Separar assinatura da plataforma das vendas dos lojistas; definir recebedor e taxas. Planos/limites, cobrança, faturas e inadimplência vêm com implementação real. Nada disso é preço oficial ativo nesta entrega.

### Fase 4 — imersão e modelos por família

Implementar representantes de alimentação, imóveis, serviços, beleza, pet, fitness, turismo e comércio. Para cada um, roteiro de entrada/scroll/mouse/toque e gravação comparativa. Aceite: experiências visualmente distintas, conteúdo acessível, movimento desligável e desempenho aceitável em celular intermediário.

### Fase 5 — tour e guia de IA

Começar com visita 360 externa real; depois panoramas próprios com hotspots/planta, caminhos de câmera e guia textual por ficha. Para 3D fiel, usar captura apropriada. Imagem gerada de decoração deve ser identificada como ilustrativa. Aceite: perguntas respondidas com fontes da ficha e navegação que corresponde aos ambientes capturados.

### Fase 6 — escala da plataforma

Multisite, filiais, permissões, biblioteca de marca, domínios por cliente, storage de objetos, limites por plano, processamento assíncrono de mídia, filas, monitoramento, backups e restauração testada. Validar isolamento em cada novo recurso.

## 11. Indicadores para decidir as próximas etapas

Publicação concluída, tempo de preenchimento, visitas → ação, pedidos válidos, orçamentos respondidos, solicitações confirmadas, falhas de envio, custo de IA por negócio, latência e erros. Metas de desempenho: LCP ≤2,5s, INP ≤200ms e CLS ≤0,1 no percentil 75 após haver dados reais; isso é meta, não medição já atingida.

## 12. Operação e limites atuais

- Banco PostgreSQL exclusivo, com backup e restauração a configurar no provedor.
- Imagens do cliente ficam no documento; limite herdado de 8 MiB por gravação. Storage/otimização por plano é etapa seguinte.
- Exemplos e fontes locais ficam no pacote; créditos das imagens são documentados.
- Dados de pedidos são privados, mas ainda não há automação de retenção/expurgo ou notificações.
- Agenda e pedidos têm confirmação manual; não há pagamento online.
- Tour é link real fornecido pelo negócio; guia de IA e reconstrução 3D não são simulados.
- Editor gráfico é a base manual, não a reconstrução completa do MediaMind.
- Antes de operar comercialmente, definir responsável, contato de privacidade e condições do negócio/plataforma.

## 13. Sequência imediatamente após o upload

Publicar em app novo → criar conta do dono → configurar identidade e catálogo real → testar em celular → publicar → fazer pedido de teste → confirmar no painel → só então divulgar. Em paralelo, priorizar fase 2 conforme o segmento piloto. O Folios continua como produto separado, com sua própria revisão de canvas e de cinematografia.
