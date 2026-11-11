import base64
import binascii
import json
import re
import time
from html import unescape
from html.parser import HTMLParser
from io import BytesIO
from typing import Literal
from urllib.parse import urlsplit
from uuid import UUID, uuid4

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from pypdf import PdfReader
from pypdf.errors import PyPdfError
from sqlalchemy import text

from app.db import engine

from . import ai, jobfetch
from .auth import rate_limit, user_from_session

router = APIRouter(prefix="/resumes")
MAX_PDF_BYTES = 2 * 1024 * 1024


class Resume(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    kind: Literal["base", "vaga"] = "base"
    content: str = Field(min_length=1, max_length=12000)
    letter: str = Field(default="", max_length=5000)
    job_title: str = Field(default="", max_length=120)
    job_url: str = Field(default="", max_length=2000)
    brief: str = Field(default="", max_length=5000)


class ImportPdf(BaseModel):
    data: str = Field(min_length=1, max_length=4 * ((MAX_PDF_BYTES + 2) // 3))


def page_text(page):
    """Texto da página. PDFs do Google Docs e do Word às vezes saem com uma palavra por linha;
    nesse caso o modo "layout" do pypdf reconstrói as linhas."""
    plain = (page.extract_text() or "").strip()
    lines = [line.strip() for line in plain.splitlines() if line.strip()]
    if len(lines) >= 20 and sum(len(line.split()) <= 1 for line in lines) / len(lines) > 0.4:
        layout = page.extract_text(extraction_mode="layout") or ""
        rebuilt = "\n".join(re.sub(r"[ \t]+", " ", line).strip() for line in layout.splitlines())
        return re.sub(r"\n{3,}", "\n\n", rebuilt).strip()
    return plain


LINKEDIN_HEADINGS = {
    "principais competências",
    "top skills",
    "experiência",
    "experience",
    "formação acadêmica",
    "education",
    "resumo",
    "summary",
    "contato",
    "contact",
    "languages",
    "idiomas",
    "certifications",
}


def is_linkedin(content):
    """O PDF do LinkedIn ("Salvar como PDF") traz o link do perfil e títulos de seção fixos."""
    lowered = content.lower()
    headings = sum(1 for line in lowered.splitlines() if line.strip() in LINKEDIN_HEADINGS)
    return "linkedin.com/in/" in lowered and (
        headings >= 3 or bool(re.search(r"(page|página) \d+ (of|de) \d+", lowered))
    )


def resume_result(content):
    content = content.strip()
    if not content:
        raise HTTPException(422, "O PDF não tem texto selecionável. Cole o texto do currículo.")
    if len(content) > 12000:
        raise HTTPException(
            422,
            "O texto ultrapassa 12.000 caracteres. Importe uma versão mais curta ou cole o texto revisado.",
        )
    return {"content": content, "source": "linkedin" if is_linkedin(content) else "curriculo"}


@router.post("/import-pdf")
def import_pdf(body: ImportPdf, request: Request, user=Depends(user_from_session)):
    rate_limit(request, "resume-pdf", 20)
    try:
        raw = base64.b64decode(body.data, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(422, "Use um PDF de até 2 MB e 10 páginas, sem senha.") from None
    return pdf_text(raw)


DRIVE_HOSTS = ("google.com", "googleusercontent.com")
DRIVE_FILE = re.compile(
    r"https://(?:drive|docs)\.google\.com/(?:file/d/|open\?id=|uc\?(?:[^#]*&)?id=)([\w-]{20,})"
)
DRIVE_DOC = re.compile(r"https://docs\.google\.com/document/d/([\w-]{20,})")
SHARE_HINT = 'Não foi possível abrir o arquivo do Drive. No Drive, clique em Compartilhar e escolha "Qualquer pessoa com o link"; ou baixe o PDF e envie do computador.'


class DriveLink(BaseModel):
    url: str = Field(min_length=1, max_length=2000)


def drive_download(url):
    """Baixa um arquivo público do Google Drive/Docs. Só segue redirecionamentos para hosts do Google, até 2 MB."""
    for _ in range(5):
        host = (urlsplit(url).hostname or "").lower()
        if not url.startswith("https://") or not any(
            host == h or host.endswith("." + h) for h in DRIVE_HOSTS
        ):
            raise ValueError("host")
        if host == "accounts.google.com":
            raise ValueError("login")
        with httpx.stream("GET", url, follow_redirects=False, timeout=10) as response:
            if response.is_redirect and response.headers.get("location"):
                url = str(httpx.URL(url).join(response.headers["location"]))
                continue
            response.raise_for_status()
            kind = response.headers.get("content-type", "").split(";")[0].strip().lower()
            payload = bytearray()
            for chunk in response.iter_bytes(chunk_size=16384):
                if len(payload) + len(chunk) > MAX_PDF_BYTES:
                    raise ValueError("size")
                payload.extend(chunk)
            return bytes(payload), kind
    raise ValueError("redirects")


@router.post("/import-drive")
def import_drive(body: DriveLink, request: Request, user=Depends(user_from_session)):
    """Currículo compartilhado no Google Drive (PDF) ou no Google Docs (exportado como texto)."""
    rate_limit(request, "resume-drive", 20)
    url = body.url.strip()
    doc, file = DRIVE_DOC.match(url), DRIVE_FILE.match(url)
    if not doc and not file:
        raise HTTPException(422, "Use um link do Google Drive ou do Google Docs.")
    target = (
        f"https://docs.google.com/document/d/{doc.group(1)}/export?format=txt"
        if doc
        else f"https://drive.google.com/uc?export=download&id={file.group(1)}"
    )
    try:
        raw, kind = drive_download(target)
    except (httpx.HTTPError, ValueError):
        raise HTTPException(502, SHARE_HINT) from None
    if doc and kind == "text/plain":
        return resume_result(raw.decode("utf-8-sig", errors="replace"))
    if raw.startswith(b"%PDF-"):
        return pdf_text(raw)
    raise HTTPException(
        422,
        SHARE_HINT
        if kind == "text/html"
        else "O arquivo do Drive precisa ser PDF ou documento do Google Docs.",
    )


def pdf_text(raw):
    try:
        if len(raw) > MAX_PDF_BYTES or not raw.startswith(b"%PDF-"):
            raise ValueError
        reader = PdfReader(BytesIO(raw))
        if reader.is_encrypted or len(reader.pages) > 10:
            raise ValueError
        parts = []
        length = 0
        for page in reader.pages:
            part = page_text(page)
            length += len(part) + 2
            if length > 12002:
                raise HTTPException(
                    422,
                    "O texto ultrapassa 12.000 caracteres. Importe uma versão mais curta ou cole o texto revisado.",
                )
            parts.append(part)
        content = "\n\n".join(parts).strip()
    except (PyPdfError, ValueError, TypeError, KeyError, OverflowError, RecursionError):
        raise HTTPException(422, "Use um PDF de até 2 MB e 10 páginas, sem senha.") from None
    return resume_result(content)


class ProfileText(BaseModel):
    content: str = Field(min_length=20, max_length=12000)
    source: Literal["linkedin", "curriculo"] = "curriculo"


@router.post("/extract-profile")
def extract_profile(body: ProfileText, request: Request, user=Depends(user_from_session)):
    """Organiza o texto do currículo em campos do perfil com a IA (1 crédito, devolvido se falhar)."""
    ai.require_provider("curriculo")
    rate_limit(request, "resume-profile", 10)
    profile, credits = ai.extract_profile(user, body.content, body.source)
    return {"profile": profile, "credits": credits}


class ResumeFile(BaseModel):
    data: str = Field(min_length=1, max_length=4 * ((MAX_PDF_BYTES + 2) // 3))
    media_type: Literal["application/pdf", "image/png", "image/jpeg", "image/webp"] = (
        "application/pdf"
    )
    source: Literal["linkedin", "curriculo"] = "curriculo"


IMAGE_MAGIC = {"image/png": b"\x89PNG", "image/jpeg": b"\xff\xd8\xff", "image/webp": b"RIFF"}


def checked_pdf(raw):
    """Texto do PDF quando houver (para guardar o currículo-base); PDF escaneado ou com texto em curva volta vazio."""
    try:
        return pdf_text(raw)
    except HTTPException:
        if raw.startswith(b"%PDF-"):
            try:
                reader = PdfReader(BytesIO(raw))
                if not reader.is_encrypted and 0 < len(reader.pages) <= 10:
                    return {"content": "", "source": "curriculo"}
            except (PyPdfError, ValueError, TypeError, KeyError, OverflowError, RecursionError):
                pass
        raise


@router.post("/read-file")
def read_file(body: ResumeFile, request: Request, user=Depends(user_from_session)):
    """A IA lê o arquivo original do currículo (PDF ou imagem), inclusive com colunas e arte. 1 crédito, devolvido se falhar."""
    ai.require_provider("curriculo")
    rate_limit(request, "resume-ai-file", 10)
    try:
        raw = base64.b64decode(body.data, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(422, "Use um PDF ou imagem de até 2 MB.") from None
    if len(raw) > MAX_PDF_BYTES:
        raise HTTPException(422, "Use um PDF ou imagem de até 2 MB.")
    found = {"content": "", "source": body.source}
    if body.media_type == "application/pdf":
        found = checked_pdf(raw)
    elif not raw.startswith(IMAGE_MAGIC[body.media_type]):
        raise HTTPException(422, "Use um PDF ou imagem de até 2 MB.")
    source = (
        "linkedin" if body.source == "linkedin" or found["source"] == "linkedin" else "curriculo"
    )
    profile, credits = ai.extract_profile(
        user, found["content"], source, {"media_type": body.media_type, "data": body.data}
    )
    return {"profile": profile, "credits": credits, "content": found["content"], "source": source}


class JobLink(BaseModel):
    url: str = Field(min_length=1, max_length=2000)


class JobDescription(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in {"p", "br", "li", "div", "h1", "h2", "h3", "h4"}:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        self.handle_starttag(tag, [])

    def handle_data(self, data):
        self.parts.append(data)


def import_generic(url):
    """Qualquer página pública: lê dados estruturados da vaga (JSON-LD) ou o texto visível."""
    try:
        page, kind = jobfetch.fetch_public(url)
        title, description = jobfetch.extract_job(page, kind)
    except jobfetch.FetchError as error:
        if str(error) in {"url", "port", "private", "host"}:
            raise HTTPException(422, "Use um link público de vaga (http ou https).") from None
        raise HTTPException(
            502, "Não foi possível ler esta página. Cole a descrição ou envie um print da vaga."
        ) from None
    except (httpx.HTTPError, ValueError, UnicodeError):
        raise HTTPException(
            502, "Não foi possível ler esta página. Cole a descrição ou envie um print da vaga."
        ) from None
    if len(description) < 120:
        raise HTTPException(
            502,
            "A página não mostrou o texto da vaga (alguns sites exigem login). Cole a descrição ou envie um print.",
        )
    return {"title": title[:120], "brief": description[:5000], "truncated": len(description) > 5000}


@router.post("/import-job")
def import_job(body: JobLink, request: Request, user=Depends(user_from_session)):
    rate_limit(request, "resume-job-import", 20)
    # Greenhouse tem API própria (texto mais limpo); os demais sites passam pela leitura protegida.
    match = re.fullmatch(
        r"https://(?:boards|job-boards)\.greenhouse\.io/([A-Za-z0-9_-]{1,100})/jobs/([0-9]{1,20})/?(?:[?#][^\s]*)?",
        body.url.strip(),
        re.IGNORECASE,
    )
    if not match:
        return import_generic(body.url.strip())
    board, job_id = match.groups()
    endpoint = f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs/{job_id}"
    try:
        with (
            jobfetch.external_slot(),
            httpx.stream("GET", endpoint, follow_redirects=False, timeout=6) as response,
        ):
            if response.status_code == 404:
                raise HTTPException(
                    404, "A vaga não está disponível. Cole a descrição se tiver uma cópia."
                )
            response.raise_for_status()
            deadline = time.monotonic() + jobfetch.TOTAL_SECONDS
            payload = jobfetch.read_body(response, 512 * 1024, deadline)
        job = json.loads(payload)
        parser = JobDescription()
        parser.feed(unescape(job["content"]))
        description = "\n".join(
            line.strip() for line in "".join(parser.parts).splitlines() if line.strip()
        )
        title = job["title"].strip()
        if not description or not title:
            raise ValueError("empty job")
    except (httpx.HTTPError, ValueError, TypeError, KeyError, AttributeError):
        raise HTTPException(
            502, "Não foi possível ler esta vaga. Cole a descrição para continuar."
        ) from None
    return {"title": title[:120], "brief": description[:5000], "truncated": len(description) > 5000}


MAX_IMAGE_BYTES = 4 * 1024 * 1024
IMAGE_MAGIC = {
    "image/png": (b"\x89PNG",),
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/webp": (b"RIFF",),
}


class JobImage(BaseModel):
    data: str = Field(min_length=1, max_length=4 * ((MAX_IMAGE_BYTES + 2) // 3))
    media_type: Literal["image/png", "image/jpeg", "image/webp"]


@router.post("/import-job-image")
def import_job_image(body: JobImage, request: Request, user=Depends(user_from_session)):
    ai.require_provider("vaga_imagem")
    try:
        raw = base64.b64decode(body.data, validate=True)
    except (binascii.Error, ValueError):
        raw = b""
    if not raw or len(raw) > MAX_IMAGE_BYTES or not raw.startswith(IMAGE_MAGIC[body.media_type]):
        raise HTTPException(422, "Envie uma imagem PNG, JPG ou WEBP de até 4 MB.")
    rate_limit(request, "resume-job-image", 10)
    title, description, credits = ai.read_job_image(user, body.data, body.media_type)
    return {
        "title": title[:120],
        "brief": description[:5000],
        "truncated": len(description) > 5000,
        "credits": credits,
    }


@router.get("")
def list_resumes(user=Depends(user_from_session)):
    with engine.connect() as conn:
        rows = conn.execute(
            text("""SELECT id, document FROM resumes WHERE account_id = :id
            ORDER BY updated_at DESC, id LIMIT 50"""),
            user,
        )
        return [{"id": row.id, **json.loads(row.document)} for row in rows]


def serialize(body: Resume):
    document = {key: value.strip() for key, value in body.model_dump().items()}
    if not document["name"] or not document["content"]:
        raise HTTPException(422, "Informe o nome e o texto do currículo.")
    if document["job_url"]:
        try:
            url = urlsplit(document["job_url"])
            if url.scheme not in {"http", "https"} or not url.hostname:
                raise ValueError
        except ValueError:
            raise HTTPException(422, "Informe um link de vaga com http ou https.") from None
    return document


@router.post("", status_code=201)
def create_resume(body: Resume, request: Request, user=Depends(user_from_session)):
    rate_limit(request, "resume-write", 50)
    document = serialize(body)
    resume_id = str(uuid4())
    with engine.begin() as conn:
        # Serializa o limite por conta, inclusive para requisições simultâneas.
        conn.execute(text("UPDATE accounts SET id = id WHERE id = :id"), user)
        count = conn.execute(
            text("SELECT COUNT(*) FROM resumes WHERE account_id = :id"), user
        ).scalar_one()
        if count >= 50:
            raise HTTPException(409, "Exclua um currículo para abrir espaço para outra versão.")
        conn.execute(
            text(
                "INSERT INTO resumes (id, account_id, updated_at, document) VALUES (:id, :owner, :now, :document)"
            ),
            {
                "id": resume_id,
                "owner": user["id"],
                "now": time.time_ns(),
                "document": json.dumps(document, ensure_ascii=False),
            },
        )
    return {"id": resume_id, **document}


@router.put("/{resume_id}")
def update_resume(resume_id: UUID, body: Resume, user=Depends(user_from_session)):
    document = serialize(body)
    with engine.begin() as conn:
        result = conn.execute(
            text("""UPDATE resumes SET document = :document, updated_at = :now
            WHERE id = :id AND account_id = :owner"""),
            {
                "id": str(resume_id),
                "owner": user["id"],
                "now": time.time_ns(),
                "document": json.dumps(document, ensure_ascii=False),
            },
        )
        if not result.rowcount:
            raise HTTPException(404, "Currículo não encontrado.")
    return {"id": str(resume_id), **document}


@router.delete("/{resume_id}")
def delete_resume(resume_id: UUID, user=Depends(user_from_session)):
    with engine.begin() as conn:
        result = conn.execute(
            text("DELETE FROM resumes WHERE id = :id AND account_id = :owner"),
            {"id": str(resume_id), "owner": user["id"]},
        )
        if not result.rowcount:
            raise HTTPException(404, "Currículo não encontrado.")
    return {"ok": True}
