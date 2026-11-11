# Fluxo rápido em duas passagens

Esta regra vale para a Base V1, para o 002, para o 003 e para todos os novos SaaS criados a partir desta Base. O 001 já está pronto e não deve ser alterado por esta mudança.

## Passagem 1 — colocar o SaaS básico em funcionamento

Prioridade: construir rapidamente os fluxos essenciais, com interface e dados reais, até o SaaS estar básico e utilizável de ponta a ponta.

### Layout primeiro

Antes de aprofundar todos os marcos, colocar o layout principal no ar: identidade visual, navegação, dashboard e telas essenciais responsivas. As telas podem começar com estados de demonstração claramente identificados, sem apresentar números fictícios como dados reais. Depois conectar progressivamente às APIs e ao banco. O proprietário deve conseguir abrir e avaliar visualmente o SaaS cedo.

- Marcos são o mapa do produto, mas não bloqueiam o avanço para a funcionalidade ou projeto seguinte.
- Rodar testes focados somente na área alterada.
- Priorizar uma primeira versão navegável do frontend antes das validações extensas de cada marco.
- Manter PostgreSQL, Redis e Mailpit ligados; preservar volumes e cache.
- Reconstruir no Docker apenas o serviço alterado (`backend`, `worker` ou `frontend`).
- Não usar rebuild completo ou `--no-cache` sem necessidade comprovada.
- Suíte integral, banco vazio, todos os smokes e relatórios extensos ficam para checkpoints.
- Atualizar a documentação ao pausar, mudar de fase ou tomar decisão importante.

## Segurança mínima obrigatória desde o início

A rapidez muda a ordem das validações, mas não permite atalhos perigosos:

- não alterar exemplos, backups e referências;
- não copiar segredos, `.git`, bancos, uploads, caches ou dependências instaladas;
- preservar autenticação, autorização, CSRF e validação de entradas;
- preservar isolamento por empresa, RLS e relações tenant-safe nos dados implementados;
- proteger senhas e tokens e reduzir dados pessoais ao necessário;
- usar migrations incrementais sem apagar dados reais;
- não declarar o produto pronto para produção nesta passagem.

## Passagem 2 — completar e consolidar os marcos

Depois que os projetos básicos prioritários estiverem funcionando, retornar aos marcos para completar recursos avançados e executar suíte integral, banco vazio, rollback, rebuild completo, smokes, segurança aprofundada, LGPD, acessibilidade, paridade e documentação final. MFA e fornecedores reais continuam obrigatórios antes da produção.

## Regra para Codex e Claude

Primeiro identifique a passagem atual. Na Passagem 1, priorize produto básico funcionando, Docker incremental e validação proporcional. Registre separadamente o que foi implementado, o que recebeu teste focado e o que aguarda consolidação na Passagem 2.
