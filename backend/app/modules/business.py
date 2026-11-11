"""MeuSite: conteúdo de negócio, pedidos e solicitações independentes do Folios."""

import hashlib
import json
import re
import time
from datetime import datetime
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.db import engine

from .auth import rate_limit, user_from_session

router = APIRouter()


class Option(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=100)
    priceCents: int = Field(ge=0, le=100000000)


class Item(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=180)
    description: str = Field(default="", max_length=4000)
    category: str = Field(default="", max_length=100)
    priceCents: int = Field(default=0, ge=0, le=100000000)
    image: str = Field(default="", max_length=2800000)
    available: bool = True
    kind: Literal["product", "service", "property"] = "product"
    unit: str = Field(default="", max_length=60)
    featured: bool = False
    options: list[Option] = Field(default_factory=list, max_length=20)
    areaM2: float | None = Field(default=None, ge=0, le=1000000)
    bedrooms: int | None = Field(default=None, ge=0, le=100)
    address: str = Field(default="", max_length=300)
    tourUrl: str = Field(default="", max_length=2000)
    gallery: list[str] = Field(default_factory=list, max_length=12)
    allowHalf: bool = False

    @field_validator("tourUrl")
    @classmethod
    def safe_link(cls, value):
        if value and not value.startswith("https://"):
            raise ValueError("Use um endereço https para a visita virtual.")
        return value

    @field_validator("image")
    @classmethod
    def safe_image(cls, value):
        local = bool(re.fullmatch(r"/demos/[a-zA-Z0-9_-]+\.jpg", value))
        if (
            value
            and not local
            and not value.startswith(
                (
                    "https://",
                    "data:image/jpeg;base64,",
                    "data:image/png;base64,",
                    "data:image/webp;base64,",
                )
            )
        ):
            raise ValueError("Use uma imagem enviada ou endereço https.")
        return value


class Faq(BaseModel):
    question: str = Field(max_length=300)
    answer: str = Field(max_length=2000)


class Member(BaseModel):
    name: str = Field(max_length=100)
    role: str = Field(max_length=100)
    photo: str = Field(default="", max_length=2000)


class Business(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schemaVersion: Literal[1] = 1
    segment: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=160)
    headline: str = Field(default="", max_length=240)
    description: str = Field(default="", max_length=6000)
    email: str = Field(default="", max_length=254)
    phone: str = Field(default="", max_length=30)
    instagram: str = Field(default="", max_length=150)
    address: str = Field(default="", max_length=300)
    city: str = Field(default="", max_length=100)
    hours: str = Field(default="", max_length=500)
    heroImage: str = Field(default="", max_length=2800000)
    cta: str = Field(default="Conhecer", max_length=60)
    orderMode: Literal["catalog", "order", "quote", "booking"] = "quote"
    deliveryFeeCents: int = Field(default=0, ge=0, le=1000000)
    minimumOrderCents: int = Field(default=0, ge=0, le=100000000)
    deliveryAreas: str = Field(default="", max_length=1000)
    deliveryPostalPrefixes: str = Field(default="", max_length=500)
    openForOrders: bool = True
    halfPizza: bool = False
    halfRule: Literal["max", "average"] = "max"
    items: list[Item] = Field(default_factory=list, max_length=250)
    faq: list[Faq] = Field(default_factory=list, max_length=30)
    team: list[Member] = Field(default_factory=list, max_length=40)

    @field_validator("heroImage")
    @classmethod
    def image(cls, value):
        return Item.safe_image(value)

    @field_validator("items")
    @classmethod
    def unique(cls, value):
        if len({x.id for x in value}) != len(value):
            raise ValueError("Cada item precisa de um identificador único.")
        for x in value:
            if len({o.id for o in x.options}) != len(x.options):
                raise ValueError("Adicionais não podem ter identificadores repetidos.")
        return value


class CartLine(BaseModel):
    model_config = ConfigDict(extra="forbid")
    itemId: str = Field(min_length=1, max_length=100)
    quantity: int = Field(ge=1, le=50)
    options: list[str] = Field(default_factory=list, max_length=20)
    halfItemId: str = Field(default="", max_length=100)


class Submission(BaseModel):
    model_config = ConfigDict(extra="forbid")
    clientToken: str = Field(min_length=16, max_length=80, pattern=r"^[a-zA-Z0-9-]+$")
    kind: Literal["order", "quote", "booking"]
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=8, max_length=30)
    address: str = Field(default="", max_length=500)
    postalCode: str = Field(default="", max_length=12)
    fulfillment: Literal["pickup", "delivery"] = "pickup"
    message: str = Field(default="", max_length=3000)
    date: str = Field(default="", max_length=40)
    items: list[CartLine] = Field(default_factory=list, max_length=50)
    consent: Literal[True]


def load_public(conn, slug):
    row = (
        conn.execute(
            text(
                "SELECT account_id, published FROM sites WHERE slug=:slug AND published IS NOT NULL"
            ),
            {"slug": slug},
        )
        .mappings()
        .first()
    )
    if not row:
        raise HTTPException(404, "Site não publicado.")
    public = json.loads(row["published"])
    if not public.get("site", {}).get("published") or not public.get("business"):
        raise HTTPException(404, "Negócio não publicado.")
    return row["account_id"], Business.model_validate(public["business"])


def quote_order(business, data):
    if business.orderMode != data.kind or not business.openForOrders:
        raise HTTPException(409, "O negócio não está recebendo este tipo de solicitação.")
    if not any(c.isdigit() for c in data.phone) or sum(c.isdigit() for c in data.phone) < 8:
        raise HTTPException(422, "Confira o telefone de contato.")
    if data.kind == "booking":
        try:
            when = datetime.fromisoformat(data.date)
            if when.date() < datetime.now().date():
                raise ValueError()
        except ValueError:
            raise HTTPException(422, "Informe uma data futura para solicitar horário.") from None
    items = {x.id: x for x in business.items}
    lines, subtotal = [], 0
    if data.kind == "order" and not data.items:
        raise HTTPException(422, "Adicione um item ao pedido.")
    for line in data.items:
        item = items.get(line.itemId)
        if not item or not item.available:
            raise HTTPException(409, "Um dos itens está indisponível. Atualize o catálogo.")
        options = {x.id: x for x in item.options}
        if len(set(line.options)) != len(line.options) or any(
            o not in options for o in line.options
        ):
            raise HTTPException(422, "Confira os adicionais do item.")
        price, name = item.priceCents, item.name
        if line.halfItemId:
            half = items.get(line.halfItemId)
            if (
                not business.halfPizza
                or not item.allowHalf
                or not half
                or not half.allowHalf
                or not half.available
                or half.category != item.category
            ):
                raise HTTPException(422, "Estes itens não permitem meia-meia.")
            price = (
                max(price, half.priceCents)
                if business.halfRule == "max"
                else (price + half.priceCents + 1) // 2
            )
            name = f"Meia {item.name} / meia {half.name}"
        price += sum(options[o].priceCents for o in line.options)
        if data.kind == "order" and price <= 0:
            raise HTTPException(409, "Um item está sob consulta e precisa de orçamento.")
        subtotal += price * line.quantity
        lines.append(
            {
                "name": name,
                "quantity": line.quantity,
                "unitCents": price,
                "optionNames": [options[o].name for o in line.options],
            }
        )
    fee = 0
    if data.kind == "order":
        if subtotal < business.minimumOrderCents:
            raise HTTPException(422, "O pedido não atingiu o valor mínimo configurado.")
        if data.fulfillment == "delivery":
            cep = "".join(c for c in data.postalCode if c.isdigit())
            if len(data.address.strip()) < 8 or len(cep) != 8:
                raise HTTPException(422, "Informe endereço e CEP completos para entrega.")
            prefixes = [s.strip() for s in business.deliveryPostalPrefixes.split(",") if s.strip()]
            if prefixes and not any(cep.startswith(p) for p in prefixes):
                raise HTTPException(422, "Este CEP está fora da área de entrega configurada.")
            fee = business.deliveryFeeCents
    payload = data.model_dump(exclude={"clientToken", "consent"})
    payload["items"] = lines
    payload["subtotalCents"], payload["deliveryFeeCents"] = subtotal, fee
    return payload, subtotal + fee if data.kind == "order" else 0


@router.post("/business/{slug}/requests", status_code=201)
def submit(slug: str, data: Submission, request: Request):
    rate_limit(request, "business-submit", 20)
    hashed = hashlib.sha256(data.model_dump_json().encode()).hexdigest()
    with engine.begin() as conn:
        owner, business = load_public(conn, slug)
        previous = (
            conn.execute(
                text(
                    "SELECT id,total_cents,payload_hash FROM business_requests WHERE account_id=:owner AND client_token=:token"
                ),
                {"owner": owner, "token": data.clientToken},
            )
            .mappings()
            .first()
        )
        if previous:
            if previous["payload_hash"] != hashed:
                raise HTTPException(
                    409, "Esta tentativa já foi usada. Inicie uma nova solicitação."
                )
            return {
                "id": previous["id"],
                "status": "received",
                "totalCents": previous["total_cents"],
                "duplicate": True,
            }
        payload, total = quote_order(business, data)
        rid = uuid4().hex[:16]
        try:
            with conn.begin_nested():
                conn.execute(
                    text(
                        "INSERT INTO business_requests(id,account_id,kind,status,created_at,total_cents,payload,client_token,payload_hash) VALUES(:id,:owner,:kind,'received',:now,:total,:payload,:token,:hash)"
                    ),
                    {
                        "id": rid,
                        "owner": owner,
                        "kind": data.kind,
                        "now": int(time.time()),
                        "total": total,
                        "payload": json.dumps(payload),
                        "token": data.clientToken,
                        "hash": hashed,
                    },
                )
        except IntegrityError:
            raise HTTPException(
                409, "A solicitação já está em processamento. Tente novamente."
            ) from None
    return {"id": rid, "status": "received", "totalCents": total, "duplicate": False}


@router.get("/business/me/requests")
def inbox(user=Depends(user_from_session)):
    with engine.connect() as conn:
        rows = (
            conn.execute(
                text(
                    "SELECT id,kind,status,created_at,total_cents,payload FROM business_requests WHERE account_id=:owner ORDER BY created_at DESC LIMIT 200"
                ),
                {"owner": user["id"]},
            )
            .mappings()
            .all()
        )
    return [{**dict(row), "payload": json.loads(row["payload"])} for row in rows]


class Status(BaseModel):
    status: Literal["received", "confirmed", "preparing", "delivering", "completed", "cancelled"]


@router.patch("/business/me/requests/{rid}")
def change_status(rid: str, data: Status, user=Depends(user_from_session)):
    with engine.begin() as conn:
        row = conn.execute(
            text(
                "UPDATE business_requests SET status=:status WHERE id=:id AND account_id=:owner RETURNING id"
            ),
            {"status": data.status, "id": rid, "owner": user["id"]},
        ).first()
        if not row:
            raise HTTPException(404, "Solicitação não encontrada.")
    return {"ok": True}
