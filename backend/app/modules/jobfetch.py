"""Leitura de vagas publicadas em páginas comuns.

Protege o servidor contra pedidos para a rede interna (SSRF): só http/https nas portas 80 e 443,
o nome é resolvido antes e todos os endereços precisam ser públicos, a conexão usa o IP já
verificado (sem nova consulta de DNS) e cada redirecionamento passa pela mesma checagem.

Contra travar o servidor (S-02 da auditoria de 08/11): cada busca tem prazo total (TOTAL_SECONDS,
somando redirecionamentos e a leitura do corpo) e no máximo FETCH_SLOTS buscas externas rodam juntas.
"""

import ipaddress
import json
import socket
import threading
import time
from contextlib import contextmanager
from html import unescape
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, urlunsplit

import httpx

MAX_BYTES = 1024 * 1024
MAX_REDIRECTS = 3
TOTAL_SECONDS = 10
STEP_SECONDS = 5  # prazo de cada conexão/leitura (o total acima vale para tudo)
FETCH_SLOTS = threading.BoundedSemaphore(4)
SLOT_WAIT = 5
SKIP = {"script", "style", "noscript", "nav", "header", "footer", "svg", "form", "button"}
BLOCK = {
    "p",
    "br",
    "li",
    "div",
    "section",
    "article",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "tr",
    "ul",
    "ol",
}


class FetchError(ValueError):
    pass


@contextmanager
def external_slot():
    """Uma das FETCH_SLOTS vagas de busca externa; sem vaga em SLOT_WAIT s, desiste ("busy")."""
    if not FETCH_SLOTS.acquire(timeout=SLOT_WAIT):
        raise FetchError("busy")
    try:
        yield
    finally:
        FETCH_SLOTS.release()


def read_body(response, limit, deadline):
    """Lê o corpo em blocos, com limite de bytes e prazo final (time.monotonic)."""
    payload = bytearray()
    # Sem chunk_size: cada bloco chega assim que é lido (com chunk_size o httpx junta até encher).
    for chunk in response.iter_bytes():
        if time.monotonic() > deadline:
            raise FetchError("timeout")
        if len(payload) + len(chunk) > limit:
            raise FetchError("size")
        payload.extend(chunk)
    return bytes(payload)


def resolve_public(host, port):
    try:
        infos = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except (socket.gaierror, UnicodeError):
        raise FetchError("host") from None
    addresses = sorted({info[4][0] for info in infos})
    if not addresses or any(not ipaddress.ip_address(a.split("%")[0]).is_global for a in addresses):
        raise FetchError("private")
    return addresses[0]


def fetch_public(url):
    with external_slot():
        return fetch_steps(url, time.monotonic() + TOTAL_SECONDS)


def fetch_steps(url, deadline):
    for _ in range(MAX_REDIRECTS + 1):
        if time.monotonic() > deadline:
            raise FetchError("timeout")
        parts = urlsplit(url)
        if (
            parts.scheme not in {"http", "https"}
            or not parts.hostname
            or parts.username
            or parts.password
        ):
            raise FetchError("url")
        try:
            port = parts.port or (443 if parts.scheme == "https" else 80)
        except ValueError:
            raise FetchError("port") from None
        if port not in {80, 443}:
            raise FetchError("port")
        ip = resolve_public(parts.hostname, port)
        netloc = (f"[{ip}]" if ":" in ip else ip) + f":{port}"
        target = urlunsplit((parts.scheme, netloc, parts.path or "/", parts.query, ""))
        headers = {
            "Host": parts.hostname if parts.port in {None, 80, 443} else f"{parts.hostname}:{port}",
            "User-Agent": "Folios/1.0 (leitura de vaga a pedido do usuario)",
            "Accept": "text/html,application/xhtml+xml,text/plain;q=0.8",
        }
        # extensions (SNI com o nome original) só existe em Client.stream, não no atalho httpx.stream
        with (
            httpx.Client(timeout=STEP_SECONDS) as client,
            client.stream(
                "GET",
                target,
                headers=headers,
                follow_redirects=False,
                extensions={"sni_hostname": parts.hostname},
            ) as response,
        ):
            if response.is_redirect and response.headers.get("location"):
                url = urljoin(url, response.headers["location"])
                continue
            response.raise_for_status()
            kind = response.headers.get("content-type", "").split(";")[0].strip().lower()
            if kind not in {"text/html", "application/xhtml+xml", "text/plain"}:
                raise FetchError("type")
            payload = read_body(response, MAX_BYTES, deadline)
            return payload.decode(response.encoding or "utf-8", errors="replace"), kind
    raise FetchError("redirects")


class PageText(HTMLParser):
    """Texto visível, título e blocos JSON-LD de uma página."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.ld, self.title = [], [], ""
        self.skip = 0
        self.in_ld = self.in_title = False
        self.og_title = ""

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "script" and (attrs.get("type") or "").lower() == "application/ld+json":
            self.in_ld = True
            self.ld.append("")
            return
        if tag == "meta" and attrs.get("property") == "og:title":
            self.og_title = attrs.get("content") or ""
        if tag == "title":
            self.in_title = True
        if tag in SKIP:
            self.skip += 1
        elif tag in BLOCK:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag == "script" and self.in_ld:
            self.in_ld = False
            return
        if tag == "title":
            self.in_title = False
        if tag in SKIP:
            self.skip = max(0, self.skip - 1)
        elif tag in BLOCK:
            self.parts.append("\n")

    def handle_data(self, data):
        if self.in_ld:
            self.ld[-1] += data
        elif self.in_title:
            self.title += data
        elif not self.skip:
            self.parts.append(data)


def html_to_text(fragment):
    parser = PageText()
    parser.feed(unescape(fragment))
    return clean("".join(parser.parts))


def clean(text):
    return "\n".join(" ".join(line.split()) for line in text.splitlines() if line.strip())


def job_postings(node):
    if isinstance(node, list):
        for item in node:
            yield from job_postings(item)
    elif isinstance(node, dict):
        kind = node.get("@type")
        if kind == "JobPosting" or (isinstance(kind, list) and "JobPosting" in kind):
            yield node
        for value in node.values():
            if isinstance(value, (dict, list)):
                yield from job_postings(value)


class MainContent(HTMLParser):
    """Prioriza main/article sem capturar navegação, cookies ou rodapé."""

    VOID = {
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
    }

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.parser = PageText()

    def handle_starttag(self, tag, attrs):
        attrs_map = dict(attrs)
        active = (
            any(mark for _, mark in self.stack)
            or tag in {"main", "article"}
            or attrs_map.get("role") == "main"
        )
        if tag not in self.VOID:
            self.stack.append((tag, active))
        if active:
            self.parser.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if any(mark for _, mark in self.stack):
            self.parser.handle_endtag(tag)
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        if any(mark for _, mark in self.stack):
            self.parser.handle_data(data)


def structured_text(value):
    if isinstance(value, str):
        return html_to_text(value)
    if isinstance(value, list):
        return "\n".join(filter(None, (structured_text(item) for item in value)))
    if isinstance(value, dict):
        return ", ".join(
            str(value[k])
            for k in ("name", "addressLocality", "addressRegion", "addressCountry")
            if isinstance(value.get(k), str)
        ) or structured_text(value.get("address", ""))
    return ""


def extract_job(page, kind="text/html"):
    if kind == "text/plain":
        text = clean(page)
        return text.splitlines()[0][:120] if text else "", text
    parser = PageText()
    parser.feed(page)
    for raw in parser.ld:
        try:
            data = json.loads(raw)
        except ValueError:
            continue
        for job in job_postings(data):
            title = clean(str(job.get("title") or ""))
            description = html_to_text(str(job.get("description") or ""))
            company = job.get("hiringOrganization")
            company = company.get("name") if isinstance(company, dict) else ""
            if title and description:
                details = []
                for key, label in (
                    ("responsibilities", "Responsabilidades"),
                    ("qualifications", "Qualificações"),
                    ("skills", "Competências"),
                    ("experienceRequirements", "Experiência"),
                    ("educationRequirements", "Formação"),
                    ("employmentType", "Contratação"),
                    ("jobLocation", "Local"),
                    ("jobLocationType", "Modalidade"),
                    ("validThrough", "Prazo"),
                ):
                    value = structured_text(job.get(key))
                    if value and value not in description:
                        details.append(f"{label}: {value}")
                return title, "\n".join(
                    filter(None, [f"Empresa: {company}" if company else "", description, *details])
                )
    title = clean(parser.og_title or parser.title)
    focused = MainContent()
    focused.feed(page)
    main = clean("".join(focused.parser.parts))
    return title.splitlines()[0] if title else "", main if len(main) >= 120 else clean(
        "".join(parser.parts)
    )
