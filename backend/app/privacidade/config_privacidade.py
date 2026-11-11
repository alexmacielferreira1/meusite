"""Configuração única de privacidade do app. Kit ``_kit_privacidade`` 0.1.1.

Não edite este arquivo no app: a mudança volta para o kit, e o app recebe a versão nova.

Um arquivo ``privacidade.toml`` por app (modelo em ``privacidade.modelo.toml``) alimenta tudo: o
aviso público (``GET /api/v1/privacidade/aviso``), as páginas ``/privacidade`` e ``/termos``, o
texto de cada consentimento (versão + hash) e o rascunho do ROPA.

Regras (``_documentacao/padroes/PRIVACIDADE.md``):

1. **A página só afirma o que o código faz.** Campo vazio ou ``[A PREENCHER]`` aparece como
   ``em definição``, nunca como valor inventado.
2. **Sem promessa que o código não garante** ("em conformidade", "100% seguro"...): o carregamento
   recusa o arquivo.
3. **Base legal de cada finalidade** sai de uma lista fechada (LGPD art. 7º e 11). Finalidade por
   consentimento traz o texto e a versão que o titular vê (art. 8º §§ 1º e 6º).
4. **Operador fora do Brasil** declara o mecanismo do art. 33 (pode ficar ``[A PREENCHER]``, que
   aparece como ``em definição``).
5. **Comércio eletrônico** (opcional): identificação do fornecedor e atendimento (Decreto
   7.962/2013 art. 2º e 4º) e arrependimento de no mínimo 7 dias (CDC art. 49; Decreto art. 5º).

Base legal: LGPD art. 9º, 37, 41; Decreto 7.962/2013 art. 2º.
"""

from __future__ import annotations

import hashlib
import tomllib
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

VERSAO_KIT = "0.1.1"
A_PREENCHER = "[A PREENCHER]"
EM_DEFINICAO = "em definição"
PRAZO_RESPOSTA_DIAS = 15  # LGPD art. 19 II
ALERTA_RESPOSTA_DIAS = 10
ARREPENDIMENTO_MINIMO_DIAS = 7  # CDC art. 49

# Frases que a página não pode conter (PRIVACIDADE.md, "Regras de texto"). Comparação sem caixa.
PROMESSAS_PROIBIDAS = (
    "em conformidade",
    "100% seguro",
    "100% segura",
    "totalmente seguro",
    "totalmente segura",
    "garantimos a segurança",
    "segurança garantida",
    "inviolável",
    "nunca compartilhamos",
    "risco zero",
)

BASES_LEGAIS = {
    "consentimento": "Consentimento (LGPD art. 7º I)",
    "obrigacao_legal": "Cumprimento de obrigação legal ou regulatória (LGPD art. 7º II)",
    "politicas_publicas": "Execução de políticas públicas (LGPD art. 7º III)",
    "estudos": "Realização de estudos por órgão de pesquisa (LGPD art. 7º IV)",
    "execucao_contrato": "Execução de contrato ou procedimentos preliminares (LGPD art. 7º V)",
    "exercicio_direitos": "Exercício regular de direitos (LGPD art. 7º VI)",
    "protecao_vida": "Proteção da vida ou da incolumidade física (LGPD art. 7º VII)",
    "tutela_saude": "Tutela da saúde (LGPD art. 7º VIII e 11 II f)",
    "legitimo_interesse": "Legítimo interesse (LGPD art. 7º IX)",
    "protecao_credito": "Proteção do crédito (LGPD art. 7º X)",
    "consentimento_sensivel": "Consentimento específico e destacado (LGPD art. 11 I)",
    "obrigacao_legal_sensivel": "Obrigação legal ou regulatória (LGPD art. 11 II a)",
}
COMO_TELA = "Pela tela Meus dados, na sua conta, ou pelo canal do encarregado."
COMO_CANAL = "Pelo canal do encarregado, nesta página."
# App sem formulário de pedidos (sem envio de e-mail): o pedido vai por e-mail ao encarregado.
COMO_EMAIL = "Por e-mail ao encarregado, no endereço desta página."
BASES_POR_CONSENTIMENTO = {"consentimento", "consentimento_sensivel"}
PAPEIS = {"controlador", "operador"}

# Direitos do art. 18. "automatico" só quando o app tem a tela "Meus dados" (tela_meus_dados).
DIREITOS = (
    ("confirmacao", "Confirmar se tratamos dados seus", "art. 18 I", True),
    ("acesso", "Acessar os seus dados", "art. 18 II", True),
    ("correcao", "Corrigir dados incompletos, inexatos ou desatualizados", "art. 18 III", False),
    ("anonimizacao", "Anonimizar, bloquear ou eliminar dados desnecessários", "art. 18 IV", False),
    ("portabilidade", "Levar os seus dados a outro fornecedor", "art. 18 V", True),
    ("eliminacao", "Eliminar dados tratados com o seu consentimento", "art. 18 VI", False),
    ("compartilhamento", "Saber com quem compartilhamos os seus dados", "art. 18 VII", True),
    ("nao_consentir", "Saber o que acontece se você não consentir", "art. 18 VIII", True),
    ("revogacao", "Revogar o consentimento", "art. 18 IX", True),
)


class ConfigInvalida(ValueError):
    """O ``privacidade.toml`` tem erro: corrija antes de publicar."""


def preenchido(valor: Any) -> bool:
    """``False`` para vazio, ``None`` ou o marcador ``[A PREENCHER]``."""
    if valor is None:
        return False
    texto = str(valor).strip()
    return bool(texto) and A_PREENCHER.lower() not in texto.lower()


def exibir(valor: Any) -> str:
    """Valor para a página: o próprio valor, ou ``em definição``."""
    return str(valor).strip() if preenchido(valor) else EM_DEFINICAO


def hash_texto(texto: str) -> str:
    """SHA-256 do texto aceito (espaços das pontas não contam). Prova do art. 8º §2º."""
    return hashlib.sha256(texto.strip().encode()).hexdigest()


def promessas_em(texto: str) -> list[str]:
    baixo = texto.lower()
    return [p for p in PROMESSAS_PROIBIDAS if p in baixo]


def _lista(valor: Any, onde: str) -> list[str]:
    if valor is None:
        return []
    if not isinstance(valor, list) or not all(isinstance(v, str) for v in valor):
        raise ConfigInvalida(f"{onde}: use uma lista de textos")
    return list(valor)


@dataclass(frozen=True)
class Pessoa:
    nome: str = A_PREENCHER
    documento: str = A_PREENCHER  # CNPJ ou CPF (Decreto 7.962 art. 2º I)
    endereco: str = A_PREENCHER
    email: str = A_PREENCHER
    telefone: str = ""
    canal: str = ""


@dataclass(frozen=True)
class Finalidade:
    chave: str
    nome: str
    dados: list[str]
    base_legal: str
    prazo: str = A_PREENCHER
    titulares: str = A_PREENCHER
    consentimento: bool = False
    texto: str = ""
    versao_texto: str = ""

    @property
    def hash_texto(self) -> str:
        return hash_texto(self.texto)


def _fora_do_brasil(pais: str) -> bool:
    # País ainda "[A PREENCHER]": a página diz "em definição" e não afirma transferência.
    return preenchido(pais) and pais.strip().lower() not in {"brasil", "br"}


@dataclass(frozen=True)
class Operador:
    nome: str
    servico: str
    pais: str
    dados: list[str]
    mecanismo: str = "não se aplica"

    @property
    def internacional(self) -> bool:
        return _fora_do_brasil(self.pais)


@dataclass(frozen=True)
class Armazenamento:
    nome: str
    tipo: str  # cookie, localStorage, sessionStorage
    finalidade: str
    essencial: bool
    prazo: str = A_PREENCHER


@dataclass(frozen=True)
class Comercio:
    razao_social: str = A_PREENCHER
    cnpj: str = A_PREENCHER
    endereco: str = A_PREENCHER
    email_atendimento: str = A_PREENCHER
    telefone: str = ""
    prazo_arrependimento_dias: int = ARREPENDIMENTO_MINIMO_DIAS
    prazo_resposta_atendimento_dias: int = 5  # Decreto 7.962 art. 4º parágrafo único


@dataclass(frozen=True)
class ConfigPrivacidade:
    app: str
    url: str = A_PREENCHER
    papel: str = "controlador"
    versao: str = "1.0"
    atualizado_em: str = A_PREENCHER
    tela_meus_dados: bool = False
    registro_acesso: bool = True
    pedidos_online: bool = True  # formulário de pedidos do titular (precisa de envio de e-mail)
    controlador: Pessoa = field(default_factory=Pessoa)
    encarregado: Pessoa = field(default_factory=Pessoa)
    finalidades: list[Finalidade] = field(default_factory=list)
    operadores: list[Operador] = field(default_factory=list)
    armazenamento: list[Armazenamento] = field(default_factory=list)
    comercio: Comercio | None = None

    def finalidade(self, chave: str) -> Finalidade | None:
        return next((f for f in self.finalidades if f.chave == chave), None)

    @property
    def finalidades_por_consentimento(self) -> list[Finalidade]:
        return [f for f in self.finalidades if f.consentimento]


def _construir(classe, dados: dict, onde: str):
    try:
        return classe(**dados)
    except TypeError as erro:
        raise ConfigInvalida(f"[{onde}]: campo faltando ou desconhecido") from erro


def _pessoa(dados: dict, onde: str) -> Pessoa:
    campos = {"nome", "documento", "endereco", "email", "telefone", "canal"}
    sobra = set(dados) - campos
    if sobra:
        raise ConfigInvalida(f"[{onde}]: campo desconhecido {sorted(sobra)}")
    return Pessoa(**{k: str(v) for k, v in dados.items()})


def _finalidade(dados: dict) -> Finalidade:
    for obrigatorio in ("chave", "nome", "base_legal"):
        if not preenchido(dados.get(obrigatorio)):
            raise ConfigInvalida(f"[[finalidades]]: falta '{obrigatorio}'")
    chave = dados["chave"]
    base = dados["base_legal"]
    if base not in BASES_LEGAIS:
        raise ConfigInvalida(f"finalidade {chave}: base legal desconhecida '{base}'")
    consentimento = bool(dados.get("consentimento", False))
    if consentimento != (base in BASES_POR_CONSENTIMENTO):
        raise ConfigInvalida(
            f"finalidade {chave}: 'consentimento = true' só com base legal de consentimento"
        )
    texto = str(dados.get("texto", ""))
    versao = str(dados.get("versao_texto", ""))
    if consentimento and not (texto.strip() and versao.strip()):
        raise ConfigInvalida(
            f"finalidade {chave}: consentimento precisa de 'texto' e 'versao_texto'"
        )
    return Finalidade(
        chave=chave,
        nome=dados["nome"],
        dados=_lista(dados.get("dados"), f"finalidade {chave}.dados"),
        base_legal=base,
        prazo=str(dados.get("prazo", A_PREENCHER)),
        titulares=str(dados.get("titulares", A_PREENCHER)),
        consentimento=consentimento,
        texto=texto,
        versao_texto=versao,
    )


def _operador(dados: dict) -> Operador:
    for obrigatorio in ("nome", "servico", "pais"):
        if not str(dados.get(obrigatorio, "")).strip():
            raise ConfigInvalida(f"[[operadores]]: falta '{obrigatorio}'")
    operador = Operador(
        nome=dados["nome"],
        servico=dados["servico"],
        pais=dados["pais"],
        dados=_lista(dados.get("dados"), f"operador {dados['nome']}.dados"),
        mecanismo=str(
            dados.get("mecanismo", "" if _fora_do_brasil(dados["pais"]) else "não se aplica")
        ),
    )
    if operador.internacional and not operador.mecanismo.strip():
        raise ConfigInvalida(
            f"operador {operador.nome}: fora do Brasil, declare 'mecanismo' (LGPD art. 33)"
        )
    return operador


def _comercio(dados: dict) -> Comercio | None:
    if not dados or not dados.get("ativo", False):
        return None
    dados = {k: v for k, v in dados.items() if k != "ativo"}
    comercio = _construir(Comercio, dados, "comercio")
    if comercio.prazo_arrependimento_dias < ARREPENDIMENTO_MINIMO_DIAS:
        raise ConfigInvalida("comercio: arrependimento mínimo de 7 dias (CDC art. 49)")
    return comercio


def _textos(config: ConfigPrivacidade) -> list[str]:
    textos = [config.app]
    for f in config.finalidades:
        textos += [f.nome, f.texto, f.prazo, *f.dados]
    for o in config.operadores:
        textos += [o.servico, o.mecanismo, *o.dados]
    for a in config.armazenamento:
        textos += [a.finalidade, a.prazo]
    return textos


def montar_config(dados: dict) -> ConfigPrivacidade:
    """Valida o conteúdo do TOML (já lido como ``dict``) e devolve a configuração."""
    app = dados.get("app", {})
    if not preenchido(app.get("nome")):
        raise ConfigInvalida("[app]: falta 'nome'")
    papel = app.get("papel", "controlador")
    if papel not in PAPEIS:
        raise ConfigInvalida("[app]: 'papel' é controlador ou operador")
    finalidades = [_finalidade(f) for f in dados.get("finalidades", [])]
    chaves = [f.chave for f in finalidades]
    if len(chaves) != len(set(chaves)):
        raise ConfigInvalida("[[finalidades]]: chave repetida")
    config = ConfigPrivacidade(
        app=app["nome"],
        url=str(app.get("url", A_PREENCHER)),
        papel=papel,
        versao=str(dados.get("versao", "1.0")),
        atualizado_em=str(dados.get("atualizado_em", A_PREENCHER)),
        tela_meus_dados=bool(app.get("tela_meus_dados", False)),
        registro_acesso=bool(app.get("registro_acesso", True)),
        pedidos_online=bool(app.get("pedidos_online", True)),
        controlador=_pessoa(dados.get("controlador", {}), "controlador"),
        encarregado=_pessoa(dados.get("encarregado", {}), "encarregado"),
        finalidades=finalidades,
        operadores=[_operador(o) for o in dados.get("operadores", [])],
        armazenamento=[
            _construir(Armazenamento, a, "armazenamento") for a in dados.get("armazenamento", [])
        ],
        comercio=_comercio(dados.get("comercio", {})),
    )
    proibidas = sorted({p for t in _textos(config) for p in promessas_em(t)})
    if proibidas:
        raise ConfigInvalida(f"promessa proibida no texto: {proibidas}")
    return config


def carregar_config(caminho: str | Path) -> ConfigPrivacidade:
    with open(caminho, "rb") as arquivo:
        return montar_config(tomllib.load(arquivo))


def _pessoa_publica(p: Pessoa) -> dict:
    return {
        "nome": exibir(p.nome),
        "documento": exibir(p.documento),
        "endereco": exibir(p.endereco),
        "email": exibir(p.email),
        "telefone": p.telefone.strip() or None,
        "canal": p.canal.strip() or None,
    }


def aviso_publico(config: ConfigPrivacidade) -> dict:
    """Conteúdo do ``GET /api/v1/privacidade/aviso``: os itens do art. 9º e o resto da página."""
    aviso = {
        "versao_kit": VERSAO_KIT,
        "versao": config.versao,
        "atualizado_em": exibir(config.atualizado_em),
        "texto_base": True,
        "app": config.app,
        "url": exibir(config.url),
        "papel": config.papel,
        "controlador": _pessoa_publica(config.controlador),
        "encarregado": _pessoa_publica(config.encarregado),
        "finalidades": [
            {
                "chave": f.chave,
                "nome": f.nome,
                "dados": f.dados,
                "titulares": exibir(f.titulares),
                "base_legal": BASES_LEGAIS[f.base_legal],
                "prazo": exibir(f.prazo),
                "consentimento": f.consentimento,
                "texto": f.texto if f.consentimento else None,
                "versao_texto": f.versao_texto if f.consentimento else None,
            }
            for f in config.finalidades
        ],
        "operadores": [
            {
                "nome": exibir(o.nome),
                "servico": o.servico,
                "pais": exibir(o.pais),
                "internacional": o.internacional,
                "mecanismo": exibir(o.mecanismo),
                "dados": o.dados,
            }
            for o in config.operadores
        ],
        "armazenamento": [
            {
                "nome": a.nome,
                "tipo": a.tipo,
                "finalidade": a.finalidade,
                "essencial": a.essencial,
                "prazo": exibir(a.prazo),
            }
            for a in config.armazenamento
        ],
        "direitos": [
            {
                "chave": chave,
                "direito": nome,
                "artigo": artigo,
                "como": COMO_TELA
                if (automatico and config.tela_meus_dados)
                else (COMO_CANAL if config.pedidos_online else COMO_EMAIL),
            }
            for chave, nome, artigo, automatico in DIREITOS
        ],
        "prazo_resposta_dias": PRAZO_RESPOSTA_DIAS,
        "pedidos_online": config.pedidos_online,
        "registro_acesso": (
            {"prazo": "6 meses", "dados": ["data e hora (UTC)", "IP", "conta", "rota", "status"]}
            if config.registro_acesso
            else None
        ),
        "comercio": None,
    }
    if config.comercio:
        c = config.comercio
        aviso["comercio"] = {
            "razao_social": exibir(c.razao_social),
            "cnpj": exibir(c.cnpj),
            "endereco": exibir(c.endereco),
            "email_atendimento": exibir(c.email_atendimento),
            "telefone": c.telefone.strip() or None,
            "prazo_arrependimento_dias": c.prazo_arrependimento_dias,
            "prazo_resposta_atendimento_dias": c.prazo_resposta_atendimento_dias,
        }
    return aviso


def gerar_ropa(config: ConfigPrivacidade) -> str:
    """Rascunho do ROPA (LGPD art. 37) a partir da mesma configuração. Revisar antes de usar."""
    c, e = config.controlador, config.encarregado
    linhas = [
        f"# ROPA — {config.app} (rascunho gerado pelo _kit_privacidade {VERSAO_KIT})",
        "",
        f"**Papel**: {config.papel} | **Controlador**: {exibir(c.nome)} | "
        f"**Documento**: {exibir(c.documento)} | **Endereço**: {exibir(c.endereco)}",
        f"**Encarregado**: {exibir(e.nome)} | **Contato**: {exibir(e.email)}",
        f"**Versão da configuração**: {config.versao} | **Atualizado em**: "
        f"{exibir(config.atualizado_em)}",
        "",
        "> Texto-base: revisar com o encarregado e o jurídico antes de considerar final.",
        "",
    ]
    for i, f in enumerate(config.finalidades, start=1):
        operadores = ", ".join(
            exibir(o.nome) for o in config.operadores if set(o.dados) & set(f.dados)
        )
        internacionais = [
            o for o in config.operadores if o.internacional and set(o.dados) & set(f.dados)
        ]
        linhas += [
            f"## A{i:03d} — {f.nome}",
            "",
            "| Campo | Conteúdo |",
            "|---|---|",
            f"| Finalidade | {f.nome} |",
            f"| Base legal | {BASES_LEGAIS[f.base_legal]} |",
            f"| Titulares | {exibir(f.titulares)} |",
            f"| Dados | {', '.join(f.dados) or EM_DEFINICAO} |",
            f"| Operadores | {operadores or 'nenhum declarado'} |",
            "| Transferência internacional | "
            + (
                "; ".join(
                    f"{exibir(o.nome)} ({exibir(o.pais)}, {exibir(o.mecanismo)})"
                    for o in internacionais
                )
                or "não"
            )
            + " |",
            f"| Prazo de guarda | {exibir(f.prazo)} |",
            "| Medidas de segurança | ver `_kit_web` (cabeçalhos, limites, bloqueio de login) |",
            "",
        ]
    return "\n".join(linhas)
