"""
Modalità DEMO per far provare il sito allo stand.

Attivazione  -> copia di sicurezza di tutto il database.
Da quel momento chiunque può aggiungere, modificare, cancellare: è tutto vero ma temporaneo.
Disattivazione (o "Ripristina") -> il database torna esattamente com'era all'attivazione.

Durante la demo le email NON vengono inviate (vedi demo_is_active() in send_mail).
"""
import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException

PREFIX = "demo_backup__"
STATE_COLL = "demo_state"
STATE_ID = "demo"
MAX_DATA_MB = 220          # il piano gratuito di Atlas ha 512 MB: la copia raddoppia lo spazio usato
BATCH = 200

_cache = {"t": 0.0, "active": False}


def _now():
    return datetime.now(timezone.utc).isoformat()


async def _live_collections(db):
    names = await db.list_collection_names()
    return sorted(n for n in names if not n.startswith("system.") and not n.startswith(PREFIX) and n != STATE_COLL)


async def _copy(db, src, dst):
    """Copia tutti i documenti (con gli stessi _id) da src a dst. Ritorna quanti."""
    n, batch = 0, []
    async for d in db[src].find({}):
        batch.append(d)
        if len(batch) >= BATCH:
            await db[dst].insert_many(batch)
            n += len(batch)
            batch = []
    if batch:
        await db[dst].insert_many(batch)
        n += len(batch)
    return n


async def get_state(db):
    return await db[STATE_COLL].find_one({"_id": STATE_ID}) or {"active": False}


async def demo_is_active(db) -> bool:
    """Veloce (cache 5 s): usata da send_mail e dal banner."""
    if time.time() - _cache["t"] > 5:
        try:
            _cache["active"] = bool((await get_state(db)).get("active"))
        except Exception:
            pass
        _cache["t"] = time.time()
    return _cache["active"]


def _set_cache(active: bool):
    _cache["active"] = active
    _cache["t"] = time.time()


async def snapshot(db):
    stats = await db.command("dbStats")
    data_mb = (stats.get("dataSize") or 0) / 1_000_000
    if data_mb > MAX_DATA_MB:
        raise HTTPException(
            status_code=400,
            detail=f"Il database è troppo grande per la copia di sicurezza ({data_mb:.0f} MB, massimo {MAX_DATA_MB} MB).")
    names = await _live_collections(db)
    # pulizia di eventuali copie vecchie
    for n in await db.list_collection_names():
        if n.startswith(PREFIX):
            await db[n].drop()
    counts = {}
    for n in names:
        counts[n] = await _copy(db, n, PREFIX + n)
    return counts


async def restore(db):
    """Rimette il database come nella copia. Non cancella la copia."""
    st = await get_state(db)
    counts = st.get("collections") or {}
    live = await _live_collections(db)
    # collezioni create durante la demo: svuotate
    for n in live:
        if n not in counts:
            await db[n].delete_many({})
    for n in counts:
        await db[n].delete_many({})
        if counts[n]:
            await _copy(db, PREFIX + n, n)


async def _keep_admin(db, me, sessions):
    """Dopo il ripristino l'admin che ha premuto il pulsante deve poter restare collegato."""
    if me and not await db.users.find_one({"user_id": me.get("user_id")}):
        me = dict(me)
        me.pop("_id", None)
        await db.users.insert_one(me)
    for s in sessions or []:
        if not await db.user_sessions.find_one({"session_token": s.get("session_token")}):
            s = dict(s)
            s.pop("_id", None)
            await db.user_sessions.insert_one(s)


def build_router(db, require_admin):
    r = APIRouter(prefix="/demo")

    @r.get("/status")
    async def status():
        st = await get_state(db)
        _set_cache(bool(st.get("active")))
        return {"active": bool(st.get("active")), "since": st.get("since"), "by": st.get("by_name")}

    @r.post("/enable")
    async def enable(admin: dict = Depends(require_admin)):
        st = await get_state(db)
        if st.get("active"):
            raise HTTPException(status_code=409, detail="La modalità demo è già attiva")
        counts = await snapshot(db)
        await db[STATE_COLL].replace_one(
            {"_id": STATE_ID},
            {"_id": STATE_ID, "active": True, "since": _now(), "by": admin.get("user_id"),
             "by_name": admin.get("name"), "collections": counts},
            upsert=True)
        _set_cache(True)
        return {"active": True, "collections": len(counts), "documents": sum(counts.values())}

    async def _restore_keeping_admin(admin):
        sessions = [s async for s in db.user_sessions.find({"user_id": admin.get("user_id")})]
        await restore(db)
        await _keep_admin(db, admin, sessions)

    @r.post("/reset")
    async def reset(admin: dict = Depends(require_admin)):
        st = await get_state(db)
        if not st.get("active"):
            raise HTTPException(status_code=409, detail="La modalità demo non è attiva")
        await _restore_keeping_admin(admin)
        return {"active": True, "restored": True}

    @r.post("/disable")
    async def disable(admin: dict = Depends(require_admin)):
        st = await get_state(db)
        if not st.get("active"):
            raise HTTPException(status_code=409, detail="La modalità demo non è attiva")
        await _restore_keeping_admin(admin)          # se fallisce, la demo resta attiva e la copia intatta
        for n in await db.list_collection_names():
            if n.startswith(PREFIX):
                await db[n].drop()
        await db[STATE_COLL].replace_one({"_id": STATE_ID}, {"_id": STATE_ID, "active": False, "ended": _now()}, upsert=True)
        _set_cache(False)
        return {"active": False, "restored": True}

    return r
