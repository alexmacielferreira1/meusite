"""Cria a conta de um administrador, ou redefine a senha dela, direto no banco.

O cadastro pela tela recusa e-mails de administrador: sem confirmação de e-mail, quem cadastrasse
primeiro um deles viraria admin. Vale para e-mails de ADMIN_EMAILS e da aba Administradores.
Uso: powershell -File scripts\\criar_admin.ps1 <e-mail> (a senha é pedida sem aparecer na tela).
"""

import argparse
import getpass
import sys
import time
from uuid import uuid4

from sqlalchemy import text

from app.db import engine
from app.modules.auth import is_admin_email, make_password, release_login


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("email")
    parser.add_argument("--nome", default="Administração")
    args = parser.parse_args(argv)
    email = args.email.strip().lower()
    if not is_admin_email(email):
        print(
            f"{email} não é administrador: ponha em ADMIN_EMAILS antes. Nada foi alterado.",
            file=sys.stderr,
        )
        return 1
    senha = getpass.getpass("Senha nova (8 a 128 caracteres): ")
    if not 8 <= len(senha) <= 128 or senha != getpass.getpass("Repita a senha: "):
        print(
            "Senha fora do tamanho ou diferente na repetição. Nada foi alterado.", file=sys.stderr
        )
        return 1
    guardada = make_password(senha)
    with engine.begin() as conn:
        conta = conn.execute(
            text("UPDATE accounts SET password_hash = :p WHERE email = :e RETURNING id"),
            {"p": guardada, "e": email},
        ).scalar()
        if conta:
            # Senha nova encerra as sessões abertas com a antiga.
            conn.execute(text("DELETE FROM sessions WHERE account_id = :id"), {"id": conta})
            release_login(email)
            print(f"Senha redefinida para {email}.")
        else:
            conn.execute(
                text("""INSERT INTO accounts (id, name, email, password_hash, created_at)
                VALUES (:id, :name, :email, :password, :now)"""),
                {
                    "id": str(uuid4()),
                    "name": args.nome.strip() or "Administração",
                    "email": email,
                    "password": guardada,
                    "now": int(time.time()),
                },
            )
            print(f"Conta criada para {email}. Entre pela tela com essa senha.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
