# MeuSite — instruções do projeto independente

- Fonte de verdade: código, docs/ESTADO_DA_ENTREGA.md e docs/PLANO_COMPLETO.md.
- Não conectar ao banco, segredos, contas ou domínio do Folios.
- React/Vite/TypeScript e FastAPI/PostgreSQL. Preservar autenticação, revisão e snapshot.
- Business é a fonte de conteúdo empresarial; adapter.ts traduz para as 75 composições herdadas.
- Pedidos são confirmados manualmente. Não simular pagamento, agenda, IA ou tour não integrado.
- Validar propriedade e valores no servidor; dados da caixa nunca entram no snapshot público.
- Build de produção: VITE_API_URL=. npm --prefix frontend run build.
- Testes: pytest backend/tests -q; npm --prefix frontend test; npm --prefix frontend run typecheck.
- Pacotes: python scripts/empacotar.py. Sem .env, banco, node_modules ou credenciais.
- Atualizar plano e evidências após mudanças. Movimento e canvas evoluem por família, com aceites reais.
