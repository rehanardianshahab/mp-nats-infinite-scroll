import asyncio
import json
import os
import time
from datetime import datetime, timezone
from typing import Optional

import nats
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from nats.js import JetStreamContext
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

# ---------------------------------------------------------------------------
# Mock Database
# ---------------------------------------------------------------------------
MOCK_DB: list[dict] = []
DB_LOCK = asyncio.Lock()
_ID_GEN = iter(range(1, 1_000_000))

def _next_id() -> int:
    return int(time.time() * 1_000_000) + next(_ID_GEN)

# ---------------------------------------------------------------------------
# NATS globals
# ---------------------------------------------------------------------------
nc: Optional[nats.NATS] = None
js: Optional[JetStreamContext] = None

# ---------------------------------------------------------------------------
# FastAPI
# ---------------------------------------------------------------------------
app = FastAPI(title="Notifikasi Real-time API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _safe_email(email: str) -> str:
    return email.replace("@", "_at_").replace(".", "_dot_")


# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup():
    global nc, js
    nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
    nc = await nats.connect(nats_url)
    js = nc.jetstream()
    try:
        await js.add_stream(name="NOTIFICATIONS", subjects=["notif.user.*"])
    except Exception:
        pass


@app.on_event("shutdown")
async def shutdown():
    if nc:
        await nc.drain()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class TriggerRequest(BaseModel):
    user_email: str
    sender_name: str
    type: str
    message: str


class NotificationOut(BaseModel):
    id: int
    user_email: str
    sender_name: str
    type: str
    message: str
    is_read: bool
    created_at: str


# ---------------------------------------------------------------------------
# REST Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/notifications/trigger")
async def trigger_notification(body: TriggerRequest):
    global nc, js
    now = datetime.now(timezone.utc).isoformat()

    notif_id = _next_id()
    record = {
        "id": notif_id,
        "user_email": body.user_email,
        "sender_name": body.sender_name,
        "type": body.type,
        "message": body.message,
        "is_read": False,
        "created_at": now,
    }

    async with DB_LOCK:
        MOCK_DB.append(record)

    subject = f"notif.user.{_safe_email(body.user_email)}"
    if js:
        await js.publish(subject, json.dumps(record).encode())

    return {"status": "ok", "id": notif_id}


@app.get("/api/notifications")
async def list_notifications(
    user_email: str = Query(..., description="Email penerima notifikasi"),
    page: int = Query(1, ge=1, description="Halaman"),
    limit: int = Query(5, ge=1, le=100, description="Item per halaman"),
):
    async with DB_LOCK:
        items = [n for n in MOCK_DB if n["user_email"] == user_email]
        items.sort(key=lambda x: x["id"], reverse=True)
        unread_count = sum(1 for n in items if not n["is_read"])
        total = len(items)
        start = (page - 1) * limit
        page_items = items[start : start + limit]
    return {
        "notifications": page_items,
        "unread_count": unread_count,
        "total": total,
        "page": page,
        "limit": limit,
    }


@app.patch("/api/notifications/{notif_id}/read")
async def read_notification(notif_id: int):
    async with DB_LOCK:
        for n in MOCK_DB:
            if n["id"] == notif_id:
                n["is_read"] = True
                break
    return {"status": "ok", "id": notif_id}


@app.patch("/api/notifications/read-all")
async def read_all_notifications(
    user_email: str = Query(..., description="Email penerima notifikasi"),
):
    async with DB_LOCK:
        for n in MOCK_DB:
            if n["user_email"] == user_email and not n["is_read"]:
                n["is_read"] = True
    return {"status": "ok", "unread_count": 0}


# ---------------------------------------------------------------------------
# SSE stream – bridge NATS JetStream -> EventSource
# ---------------------------------------------------------------------------
@app.get("/api/notifications/stream")
async def stream_notifications(
    user_email: str = Query(..., description="Email penerima notifikasi"),
):
    async def event_generator():
        safe = _safe_email(user_email)
        subject = f"notif.user.{safe}"

        sub = await js.subscribe(
            subject=subject,
            stream="NOTIFICATIONS",
            deliver_policy="new",
            durable=None,
        )

        try:
            while True:
                try:
                    msg = await sub.next_msg(timeout=30)
                    payload = json.loads(msg.data.decode())
                    yield {"event": "notification", "data": json.dumps(payload)}
                    await msg.ack()
                except asyncio.TimeoutError:
                    yield {"event": "ping", "data": "keep-alive"}
        except asyncio.CancelledError:
            pass
        finally:
            await sub.unsubscribe()

    return EventSourceResponse(event_generator())


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health():
    return {"status": "ok"}
