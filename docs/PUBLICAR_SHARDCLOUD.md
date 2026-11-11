# Publicar o MeuSite como uma nova aplicação

## Arquivo certo

**meusite-shardcloud.zip** é o pacote de execução: API + site já compilado. Ele deve ser enviado no novo aplicativo MeuSite. **Não substitua o app FolioCom/Folios.**

**meusite-projeto-completo.zip** é o código fonte, plano, pranchas e testes. Use para guardar, editar no VS Code ou iniciar um repositório independente. Não é necessário compilar o frontend antes de usar o pacote de execução.

## 1. Banco exclusivo

Crie um PostgreSQL novo e vazio, com banco e credenciais próprios. Não use a DATABASE_URL do Folios. A aplicação recusa um banco com tabelas de contas sem identificação MeuSite. O novo banco recebe as migrações e a identificação `product_identity = meusite`.

Pode ser outro banco no seu provedor PostgreSQL, sem copiar registros do banco anterior. O ZIP não contém banco, usuários nem segredos.

## 2. Novo app na ShardCloud

- Nome: MeuSite; runtime Python, versão recomendada com Python 3.12 ou superior.
- Envie `meusite-shardcloud.zip`.
- Mantenha `main.py`/`run.py` na raiz; não deixe o projeto dentro de uma pasta externa adicional.
- Comando: `python main.py` ou `python run.py`.
- `.shardcloud` sugere subdomínio `meusite`; a disponibilidade depende do painel. Use o endereço realmente atribuído.
- A API serve o React compilado, imagens, fontes e modelos pela mesma origem.

## 3. Variáveis do novo app

| Variável | Valor |
|---|---|
| DATABASE_URL | URL do PostgreSQL novo; se o provedor exigir SSL, use `?sslmode=require` |
| JWT_SECRET | Segredo exclusivo para assinar JWT, aleatório, com pelo menos 32 bytes |
| LOGIN_HMAC_SECRET | Segredo novo, aleatório, com pelo menos 32 bytes; não reutilizar o do Folios |
| APP_ORIGINS | URL exata do novo app, sem barra no fim, por exemplo `https://meusite.shardweb.app` |
| COOKIE_SECURE | `true` em HTTPS |
| TRUSTED_PROXY_HOPS | `2` na configuração ShardCloud usada pela base |
| PORT | `80`, salvo orientação diferente do painel |
| CSP_MODE | `relatorio` inicialmente; validar integrações antes de ativar bloqueio |
| ADMIN_EMAILS | Seu e-mail da conta administrativa |
| TZ | `America/Sao_Paulo` para horários locais |

Para gerar o segredo em um terminal de confiança:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Gere dois valores diferentes: um para JWT_SECRET e outro para LOGIN_HMAC_SECRET. Guarde os resultados apenas nas variáveis do painel. Não coloque em commits, ZIPs ou mensagens públicas. Para dois domínios, liste ambos em APP_ORIGINS separados por vírgula, sem espaços. Não inclua folios.id.

IA é opcional. Para ativar sugestões, configure `ANTHROPIC_API_KEY` e `ANTHROPIC_MODEL` ou cadastre o provedor no painel de IA da conta administrativa. Para guardar chaves pelo painel, defina `AI_KEYS_SECRET` próprio antes. Sem IA configurada, editor, modelos, pedidos e publicação funcionam.

## 4. Primeira inicialização

O início valida as variáveis e a identidade do banco, instala dependências se necessário, executa Alembic e inicia uma instância da API. Veja os logs se houver falha. Não troque o banco por SQLite nem desative a proteção de identidade para fazer a inicialização passar.

## 5. Conferência

1. `/health`: deve responder `status: ok`.
2. `/`: deve mostrar MeuSite, com identidade verde e título para negócios.
3. `/modelos`: deve listar 105 modelos e abrir exemplos em movimento.
4. `/pranchas/11` até `/pranchas/20`: três exemplos de cada grupo; capturas também estão no código fonte.
5. Criar conta, preencher negócio e catálogo, escolher modelo, abrir prévia e publicar.
6. Abrir o endereço publicado sem estar autenticado e enviar um pedido de teste.
7. Conferir no painel Pedidos e contatos; mudar o status e responder manualmente.
8. Alterar rascunho e confirmar que o público só muda após Republicar.

O pedido recebido não equivale a pagamento ou confirmação automática. Faça um teste com o dono do negócio antes de divulgar para clientes reais.

## Atualizações

Se configurar integração Git, use um repositório/branch exclusivo do MeuSite; jamais a main do Folios. O build compilado deve acompanhar as alterações. Ative Reiniciar após Deploy para atualizar a API. Um deploy de arquivos sem reinício pode deixar telas novas e API antiga.

Domínio próprio da plataforma pode ser adicionado depois, com DNS e HTTPS. Domínios próprios por cliente ainda não têm automação nesta versão.
