# Matriz de alinhamento ao HUB

Fonte de evidência: código e testes locais, referências preservadas em docs_referencias/INTEGRIDADE.json. Esta primeira passagem mantém o produto existente; não declara adoção integral da Base V1.

| Requisito | Estado e evidência |
|---|---|
| Backend Python/FastAPI, PostgreSQL/SQLAlchemy/Alembic | Implementado; backend/app, backend/migrations. Python 3.12, SQLAlchemy Core síncrono; diferenças frente à Base 3.14/async preservadas para migração posterior. |
| React/Vite/TypeScript | Implementado; frontend com build, testes e typecheck. |
| JWT solicitado por Alex | Implementado HS256, claims obrigatórias, cookie HttpOnly, consulta de sessão e revogação no banco. Exceção explícita à sessão opaca da Base. Sem token em localStorage. |
| CSRF separado | Implementado cookie/header e hash associado à sessão, validação de origem; teste de logout recusado sem token. |
| Argon2 | Implementado; login migra hash scrypt válido. Concorrência de hash limitada. |
| Contrato Central | Manifesto público e health/readiness/version de serviço protegidos por token, audiência, identidade e escopo hub:observe. Administração remota não anunciada. Conexão em produção depende de configuração externa. |
| Observabilidade e erros | Correlation ID, formato estruturado com detail compatível, readiness sem vazar erro de banco. |
| Isolamento | Propriedade por account_id e snapshots públicos separados logicamente; guard de identidade MeuSite impede reutilizar banco de outro produto. Não equivale a RLS. |
| RLS forçado/roles de banco separadas | Pendente. Hoje migrações e runtime usam DATABASE_URL. Não anunciar conformidade integral de multitenancy. |
| Organizações/membros/RBAC | Pendente. Hoje um site por conta, propriedade validada no servidor. |
| Auditoria imutável completa | Pendente. Logs/erros atuais não substituem trilha append-only. |
| Redis, fila e e-mail/Mailpit | Não integrados nesta entrega. Sem botões fictícios anunciando operação. |
| Poetry/async e gates completos Base | Pendente. Deploy usa requirements fixados; ferramentas atuais estão no pyproject.toml. |
| Documentação do derivado | AGENTS, CLAUDE, AI_CONTEXT, índice, progresso, matriz e proveniência preservados. |
| Deploy ShardCloud | Código, frontend compilado e ZIPs preparados; não foi confirmado deploy na hospedagem. |

Próxima passagem HUB: separar papel de migração/runtime, implementar tenant/RLS com teste de fuga e estratégia de publicação anônima; organizações/RBAC; auditoria; operação e gates. Não criar políticas genéricas sem adaptar pedidos públicos e snapshots.
