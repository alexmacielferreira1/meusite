"""Início em produção (ShardCloud): confere o ambiente, migra o banco e sobe a API.

Substitui o ``start-shard.sh``. A API serve também as telas (``frontend/dist``). A porta vem de
``PORT`` (padrão 80, como a ShardCloud exige, em 0.0.0.0). ``APP_ORIGINS`` e ``COOKIE_SECURE``
ficam no painel; se faltarem, valem os mesmos padrões do ``start-shard.sh``.
"""

import importlib.util
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
# Sem banco, a API cairia no SQLite local e perderia os dados a cada reinício.
# LOGIN_HMAC_SECRET: chave do HMAC do e-mail no bloqueio de login (kit _kit_web).
REQUIRED = ("DATABASE_URL", "LOGIN_HMAC_SECRET", "JWT_SECRET")
DEFAULTS = {"APP_ORIGINS": "https://meusite.shardweb.app", "COOKIE_SECURE": "true"}
PACKAGES = (
    "fastapi",
    "uvicorn",
    "sqlalchemy",
    "alembic",
    "psycopg",
    "httpx",
    "pypdf",
    "cryptography",
    "jwt",
)


def log(message: str) -> None:
    print(f"[run.py] {message}", file=sys.stderr, flush=True)


def python_path() -> str:
    """Soma backend/ ao PYTHONPATH existente, sem apagá-lo.

    A ShardCloud instala as dependências em /app/.lib e aponta o PYTHONPATH para lá:
    substituir a variável faria o Alembic e o Uvicorn sumirem nos processos filhos.
    """
    current = [p for p in os.environ.get("PYTHONPATH", "").split(os.pathsep) if p]
    return os.pathsep.join([str(BACKEND), *current])


def missing_env() -> list[str]:
    return [name for name in REQUIRED if not os.environ.get(name, "").strip()]


def ensure_packages() -> bool:
    """Se a hospedagem não instalou o requirements.txt, instala agora."""
    missing = [p for p in PACKAGES if importlib.util.find_spec(p) is None]
    if not missing:
        return True
    log(f"Dependências ausentes ({', '.join(missing)}): instalando requirements.txt...")
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r", str(ROOT / "requirements.txt")],
        cwd=ROOT,
        check=False,
    )
    return result.returncode == 0


def validate_product_database() -> None:
    # Refuse a Folios database even if its schema happens to be compatible.
    if str(BACKEND) not in sys.path:
        sys.path.insert(0, str(BACKEND))
    from sqlalchemy import inspect, text

    from app.db import engine

    inspector = inspect(engine)
    with engine.connect() as conn:
        if inspector.has_table("product_identity"):
            name = conn.execute(text("SELECT name FROM product_identity WHERE id=1")).scalar()
            if name != "meusite":
                raise RuntimeError(
                    "Este banco pertence a outro produto. Use um banco exclusivo do MeuSite."
                )
        elif inspector.has_table("accounts"):
            raise RuntimeError(
                "Banco existente sem identidade MeuSite. Não use o banco do Folios; crie um banco vazio separado."
            )


def main() -> int:
    missing = missing_env()
    if missing:
        log("Faltam variáveis de ambiente no painel: " + ", ".join(missing))
        log("Veja o bloco 'Produção' em env.example. A API não foi iniciada.")
        return 2
    if len(os.environ.get("LOGIN_HMAC_SECRET", "")) < 32:
        log("LOGIN_HMAC_SECRET precisa ser um segredo novo com pelo menos 32 caracteres.")
        return 2
    if len(os.environ.get("JWT_SECRET", "")) < 32:
        log("JWT_SECRET precisa ser próprio do MeuSite com pelo menos 32 caracteres.")
        return 2
    if not ensure_packages():
        log("Falha ao instalar as dependências. A API não foi iniciada.")
        return 3
    try:
        validate_product_database()
    except Exception as exc:
        log(str(exc))
        return 4
    dist = ROOT / "frontend" / "dist"
    env = {**DEFAULTS, **os.environ, "PYTHONPATH": python_path()}
    env.setdefault("FRONTEND_DIST", str(dist))
    log("Aplicando migrações do banco...")
    migrate = subprocess.run(
        [sys.executable, "-m", "alembic", "-c", str(BACKEND / "alembic.ini"), "upgrade", "head"],
        cwd=ROOT,
        env=env,
        check=False,
    )
    if migrate.returncode != 0:
        log("Falha ao migrar o banco (confira DATABASE_URL e se o banco aceita conexões).")
        return migrate.returncode
    if not (dist / "index.html").is_file():
        log("Aviso: frontend/dist não encontrado; só a API vai responder.")
    port = os.environ.get("PORT", "80")
    log(f"Subindo em 0.0.0.0:{port}")
    command = [
        sys.executable, "-m", "uvicorn", "app.main:app", "--app-dir", str(BACKEND),
        "--no-access-log", "--no-proxy-headers", "--host", "0.0.0.0", "--port", port,
    ]  # fmt: skip
    return subprocess.run(command, cwd=ROOT, env=env, check=False).returncode


if __name__ == "__main__":
    raise SystemExit(main())
