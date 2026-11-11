"""Prévia de links de trabalhos: título, capa, autor e formato.

YouTube, Vimeo, Spotify e SoundCloud respondem pelo oEmbed oficial (endereços fixos). Os demais
links passam pela leitura protegida de `jobfetch.fetch_public` (sem acesso à rede interna) e usam
as etiquetas Open Graph da página.
"""

import re
import time
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit

import httpx
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from . import jobfetch
from .auth import rate_limit, user_from_session

router = APIRouter(prefix="/links")
YOUTUBE = re.compile(r"(?:youtu\.be/|[?&]v=|/shorts/|/embed/|/live/)([\w-]{11})(?=$|[?&#/])")
OEMBED = {
    "vimeo.com": ("https://vimeo.com/api/oembed.json", "video"),
    "open.spotify.com": ("https://open.spotify.com/oembed", "audio"),
    "soundcloud.com": ("https://soundcloud.com/oembed", "audio"),
}
IMAGE_SITES = (
    "behance.net",
    "dribbble.com",
    "instagram.com",
    "pinterest.",
    "flickr.com",
    "artstation.com",
)
MAX_URLS = 10
REQUEST_SECONDS = 20  # prazo do pedido inteiro; os links que sobrarem voltam sem prévia
AUDIO_SITES = ("anchor.fm", "podcasters.spotify.com", "deezer.com", "castbox.fm")
VIDEO_SITES = ("tiktok.com", "dailymotion.com", "globoplay.globo.com", "twitch.tv")


class Links(BaseModel):
    urls: list[str] = Field(min_length=1, max_length=MAX_URLS)


def host_of(url):
    host = (urlsplit(url).hostname or "").lower()
    return host[4:] if host.startswith("www.") else host


def kind_of(url):
    host = host_of(url)
    if YOUTUBE.search(url) or host.endswith(VIDEO_SITES) or host == "vimeo.com":
        return "video"
    if host.endswith(("spotify.com", "soundcloud.com")) or host.endswith(AUDIO_SITES):
        return "audio"
    if any(site in host for site in IMAGE_SITES) or re.search(
        r"\.(png|jpe?g|webp|gif)(\?|$)", url, re.I
    ):
        return "image"
    return "article"


def text_of(value, limit):
    return " ".join(str(value or "").split())[:limit]


def oembed(endpoint, url):
    with jobfetch.external_slot():
        response = httpx.get(
            endpoint, params={"url": url, "format": "json"}, timeout=6, follow_redirects=False
        )
    response.raise_for_status()
    if len(response.content) > 200_000:
        raise ValueError("oembed too large")
    data = response.json()
    return (
        text_of(data.get("title"), 160),
        text_of(data.get("thumbnail_url"), 600),
        text_of(data.get("author_name"), 120),
    )


class PageMeta(HTMLParser):
    """Título e imagem de compartilhamento (Open Graph / Twitter) de uma página."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta, self.title, self.in_title = {}, "", False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta":
            key = (attrs.get("property") or attrs.get("name") or "").lower()
            if key and key not in self.meta:
                self.meta[key] = attrs.get("content") or ""
        self.in_title = tag == "title" and not self.title

    def handle_endtag(self, tag):
        self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def page_preview(url):
    page, _ = jobfetch.fetch_public(url)
    parser = PageMeta()
    parser.feed(page)
    meta = parser.meta
    title = meta.get("og:title") or meta.get("twitter:title") or parser.title
    cover = meta.get("og:image") or meta.get("twitter:image") or ""
    cover = urljoin(url, cover) if cover else ""
    author = meta.get("og:site_name") or meta.get("author") or ""
    return (
        text_of(title, 160),
        text_of(cover if cover.startswith(("http://", "https://")) else "", 600),
        text_of(author, 120),
    )


def empty_item(url):
    return {"url": url, "kind": "article", "title": "", "cover": "", "author": "", "ok": False}


def preview(url):
    url = url.strip()
    item = empty_item(url)
    if not re.match(r"^https?://[^\s]+$", url, re.I) or len(url) > 2000:
        return item
    item["kind"] = kind_of(url)
    video = YOUTUBE.search(url)
    try:
        if video:
            canonical = f"https://www.youtube.com/watch?v={video.group(1)}"
            item["url"] = canonical
            item["cover"] = f"https://i.ytimg.com/vi/{video.group(1)}/hqdefault.jpg"
            title, _, author = oembed("https://www.youtube.com/oembed", canonical)
        elif host_of(url) in OEMBED:
            endpoint, item["kind"] = OEMBED[host_of(url)]
            title, item["cover"], author = oembed(endpoint, url)
        else:
            title, item["cover"], author = page_preview(url)
        item.update(title=title, author=author, ok=bool(title))
    except (httpx.HTTPError, ValueError, UnicodeError, AttributeError):
        pass
    return item


@router.post("/preview")
def preview_links(body: Links, request: Request, user=Depends(user_from_session)):
    rate_limit(request, "link-preview", 30)
    deadline = time.monotonic() + REQUEST_SECONDS
    return [
        preview(url) if time.monotonic() < deadline else empty_item(url.strip())
        for url in body.urls
    ]
