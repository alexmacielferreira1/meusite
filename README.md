# MeuSite — sites para pequenos negócios

Aplicação **independente** derivada da base técnica do Folios, sem seus usuários, banco, segredos ou domínio. React/Vite/TypeScript + FastAPI/PostgreSQL, publicação em snapshot e editor autenticado.

- **105 modelos**: 75 composições da base adaptadas ao conteúdo de negócios + 30 modelos dos segmentos das pranchas 11–20, organizados em 12 famílias de composição.
- Página de apresentação, catálogo público de modelos e editor de negócio/catálogo/aparência/artes.
- Produtos, serviços e imóveis; adicionais e meia-meia; recebimento de pedidos; solicitações de orçamento e horário; painel privado de atendimento.
- Rascunho separado do publicado. Preços calculados pelo servidor, proprietário validado, consentimento e proteção contra duplicidade.
- Fotos e fontes de demonstração locais; exemplos não representam produtos reais dos clientes.

## Subir hoje na ShardCloud

Use **meusite-shardcloud.zip** em um **NOVO aplicativo Python**, não no Folios. O ZIP já contém o frontend compilado e a API.

1. Crie um banco PostgreSQL **novo e vazio**, exclusivo deste produto.
2. Envie `meusite-shardcloud.zip` como arquivo da aplicação. Na raiz devem aparecer `run.py`, `main.py`, `backend/` e `frontend/dist/`.
3. Configure as variáveis do [guia de publicação](docs/PUBLICAR_SHARDCLOUD.md): `DATABASE_URL`, um `LOGIN_HMAC_SECRET` novo, `APP_ORIGINS` com a URL real do novo app e `COOKIE_SECURE=true`.
4. Inicie com `python main.py` (ou `python run.py`). A inicialização valida a identidade do banco e aplica migrações.
5. Confira `/health`, `/`, `/modelos`, cadastro, editor, publicação e envio de solicitação. Ative **Reiniciar após Deploy**.

O domínio `meusite.id` foi escolhido como nome do produto, mas não foi comprado nem configurado. A URL fornecida pela ShardCloud pode ser usada imediatamente. Nenhuma conta ou dado do Folios deve ser importado.

## Documentação

- [Plano concreto, arquitetura e fases](docs/PLANO_COMPLETO.md)
- [Modelos e dez pranchas](docs/CATALOGO_MODELOS.md)
- [Publicação passo a passo](docs/PUBLICAR_SHARDCLOUD.md)
- [Funcionamento e limites da primeira versão](docs/ESTADO_DA_ENTREGA.md)
- [Movimento por cenas e famílias](docs/SISTEMA_DE_MOVIMENTO.md)
- [Créditos das imagens](docs/CREDITOS_IMAGENS.md)
- Evidências em `docs/testes/` e capturas em `docs/pranchas/`.

## Desenvolvimento

```bash
python -m venv .venv
# Ative o ambiente de acordo com seu sistema operacional.
pip install -r requirements-dev.txt
npm --prefix frontend ci
# Configure um PostgreSQL separado e as variáveis de env.example.
python -m alembic -c backend/alembic.ini upgrade head
python -m uvicorn app.main:app --app-dir backend --port 8112
# Em outro terminal:
VITE_API_URL=. npm --prefix frontend run dev
```

No Windows, configure `$env:VITE_API_URL='.'` antes do comando npm. Sem `VITE_API_URL`, a interface usa somente demonstração local. Para build de produção, **sempre** `VITE_API_URL=.`.

```bash
pytest backend/tests -q
npm --prefix frontend run typecheck
VITE_API_URL=. npm --prefix frontend run build
python scripts/empacotar.py
```

O `vscode.dev` puro edita código, mas não compila nem executa o servidor. Use os ZIPs prontos para publicar sem Actions; para desenvolvimento no navegador com terminal, use um ambiente com execução.
