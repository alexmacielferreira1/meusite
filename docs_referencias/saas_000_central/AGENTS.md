# Instruções de central

Ordem de leitura: `AGENTS.md` → `../_documentacao/HUB_PLATFORM_STANDARD.md` → `docs/ARCHITECTURE.md` → `docs/PROJECT_STATUS.md`/`project-status.json` → `docs/CODEX_BACKLOG.md` → `docs/CODEX_HANDOFF.md` → fontes históricas.

A Central é o segundo produto e o plano de controle do HUB. Deve herdar a infraestrutura validada no MediaMind sem copiar seu domínio audiovisual, banco, dados ou interface. A comunicação ocorre por contratos/API; nenhum SaaS acessa diretamente o banco interno de outro.

Leia README.md, docs/ARCHITECTURE.md, docs/DEVELOPMENT_WORKFLOW.md, docs/PROJECT_STATUS.md e project-status.json.
Trabalhe no marco atual. Não avance com Quality Gate falhando.
Preserve frontend, rotas, SDK e funcionalidades Base44; não fazer redesign nem converter domínio em M0.
Banco e Git independentes. Nunca acessar banco ou código interno de outro SaaS.
Sem secrets versionados. GitHub/Render/Neon só podem ser configurados com autorização explícita e alvos confirmados.
Não apagar arquivos do usuário. Originais na pasta do HUB são somente referência.
Testar mudanças relevantes, registrar dependências e evidências reais. Não declarar paridade pela presença de telas.
Documentos históricos e AGENTS do export descrevem a origem; o roteiro atual é FastAPI/PostgreSQL local.

## Revisão de qualidade e segurança

- Roteiro padrão do HUB: `docs/REVISAO_QUALIDADE.md`. Rodar antes de publicar, ao fechar marco e após blocos que mexam em auth, permissões, dados de empresas, uploads, integrações, IA ou cobrança.
- Skills do projeto em `.claude/skills/`; plugins de segurança (Trail of Bits) declarados em `.claude/settings.json`. Outros agentes seguem o mesmo roteiro pelo documento.
- Relatórios de auditoria ficam em `docs/AUDITORIA_QUALIDADE_<data>.md`. Correções seguem a rotina de testes deste arquivo: teste que falha, correção, teste que passa, um item por vez.

## Kit de IA (Copiloto e MCP interno)

- Copiados de `HUB_SAAS/_kit_ia` (kit 0.5.0), não alterar aqui: `backend/app/ia/*`, `backend/tests/test_ia_motor.py`, `test_ia_ferramentas.py`, `test_ia_rotas.py` e `frontend/src/components/ia/*`. Melhorias voltam ao kit (`scripts/levar_kit.py --trazer`).
- Da Central: `backend/app/ia_adaptador.py` (perfis, tenant do servidor, trava por tenant, cifra, ferramenta `apps.listar`), `backend/app/models/ia.py` + migração `0016_ia_kit` (`ia_config`, `ia_eventos`, por `tenant_id`), registro em `api/v1/router.py`, `PublicError` em `core/errors.py`, `frontend/src/lib/iaCentral.js`, o `<Copiloto>` em `components/AdminLayout.jsx` e a seção "Inteligência artificial" em `pages/Configurations.jsx`. Testes: `backend/tests/test_ia_central.py`, `AdminLayout.copiloto.test.jsx`, `Configurations.ia.test.jsx`, `lib/iaCentral.test.js`.
- Decisão D1: a Central não guarda chaves dos outros SaaS; as conexões servem só ao Copiloto da própria Central. `AI_SECRET_KEY` é obrigatória em production.
