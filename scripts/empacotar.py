"""Gera ZIP de execução ShardCloud e ZIP do projeto MeuSite, sem dados/segredos."""

import hashlib
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "pacotes"
SKIP = {
    ".git",
    "node_modules",
    ".venv",
    "__pycache__",
    ".pytest_cache",
    ".ruff_cache",
    "pacotes",
    "coverage",
    ".runtime",
}
ROOT_FILES = {
    "run.py",
    "main.py",
    "requirements.txt",
    "requirements-dev.txt",
    "env.example",
    ".shardcloud",
    "README.md",
    ".gitignore",
    ".dockerignore",
    "Dockerfile",
    "pyproject.toml",
    "AGENTS.md",
    "VERSION",
}


def safe(path):
    rel = path.relative_to(ROOT)
    return (
        not any(p in SKIP for p in rel.parts)
        and path.name != ".env"
        and not path.name.startswith(".env.")
        and path.suffix not in {".db", ".sqlite", ".sqlite3", ".pyc", ".log", ".tsbuildinfo"}
        and not path.is_symlink()
    )


def write_zip(name, files):
    target = OUT / name
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(set(files)):
            if not safe(path):
                raise RuntimeError(f"Arquivo proibido no pacote: {path.name}")
            archive.write(path, path.relative_to(ROOT).as_posix())
    return {
        "file": name,
        "bytes": target.stat().st_size,
        "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
    }


def main():
    if not (ROOT / "frontend/dist/index.html").is_file():
        raise SystemExit("Compile primeiro: VITE_API_URL=. npm --prefix frontend run build")
    OUT.mkdir(exist_ok=True)
    runtime = [
        ROOT / p
        for p in [
            "run.py",
            "main.py",
            "requirements.txt",
            "backend/requirements.txt",
            "backend/alembic.ini",
            ".shardcloud",
            "env.example",
            "README.md",
            "docs/PUBLICAR_SHARDCLOUD.md",
        ]
    ]
    for folder in ["backend/app", "backend/migrations", "frontend/dist"]:
        runtime.extend(p for p in (ROOT / folder).rglob("*") if p.is_file() and safe(p))
    source = [p for p in ROOT.iterdir() if p.is_file() and p.name in ROOT_FILES]
    for folder in ["frontend", "backend", "docs", "scripts"]:
        source.extend(
            p
            for p in (ROOT / folder).rglob("*")
            if p.is_file() and safe(p) and "dist" not in p.relative_to(ROOT).parts
        )
    result = [
        write_zip("meusite-shardcloud.zip", runtime),
        write_zip("meusite-projeto-completo.zip", source),
    ]
    (OUT / "SHA256.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
