# Contexto atual

Produto independente MeuSite, repositório alexmacielferreira1/meusite. Python 3.12, FastAPI, PostgreSQL, SQLAlchemy Core, Alembic, JWT e React/Vite/TypeScript. 105 modelos, editor empresarial, publicação por snapshot e pedidos reais persistidos. Um site por conta.

Preservar UI e fluxos existentes. Não reiniciar o produto a partir de um template. Referências Base SaaS V1 e Central são de leitura, não dependências de runtime. Nenhum banco ou segredo compartilhado com Folios/Central.

O alinhamento ao HUB é incremental e ainda não representa paridade integral com Base V1. Consultar REQUIREMENTS_MATRIX.md. JWT foi solicitado explicitamente pelo usuário; manter cookie HttpOnly e revogação persistida. CSRF separado e vinculado à sessão; Argon2 com migração transparente dos hashes scrypt antigos.

Para a retomada do Folios, consultar no repositório Folios docs/RETOMADA_CORRECOES_FOLIOS.md; não misturar esse trabalho ao MeuSite.
