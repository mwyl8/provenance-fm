"""FastAPI service for provenance.fm.

Routes:

  GET  /health
  POST /artist                   register an artist
  GET  /artist/{id}              fetch artist record
  POST /artist/{id}/track        upload a track fingerprint (client-side computed)
  GET  /artist/{id}/tracks       list registered tracks
  POST /investigate              upload AI track audio, get ranked matches
  POST /watchdog/scrape          add a URL to the corpus
  GET  /corpus/stats             corpus size + sources
  GET  /receipt/{id}             fetch a signed receipt
  POST /audit/run                run an audit for an artist (returns receipt)
"""

from __future__ import annotations

import hashlib
import logging
import pickle
import time
import uuid
from typing import Optional

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import storage
from .config import SAMPLE_RATE, ensure_dirs
from .ensemble import Tier
from .matching import CorpusItem, match_against_corpus
from .receipts import corpus_merkle_root, make_receipt

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


app = FastAPI(title="provenance.fm", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- request / response models ----------

class ArtistCreate(BaseModel):
    handle: str
    notify_email: Optional[str] = None
    public_key: Optional[str] = None


class TrackUpload(BaseModel):
    """Fingerprints computed client-side. Audio never sent to server."""
    title: str
    landmark: dict     # {"hashes": [...], "anchor_times": [...]}
    chroma: dict       # {"pooled": [12 floats], "frames": [12xT floats]}


class AuditRequest(BaseModel):
    artist_id: str
    min_tier: str = "low"   # high | medium | low
    top_k: int = 25


# ---------- helpers ----------

def _coerce_chroma_from_json(c: dict) -> dict:
    """Client sends chroma as plain lists; convert back to numpy."""
    return {
        "pooled": np.asarray(c["pooled"], dtype=np.float32),
        "frames": np.asarray(c["frames"], dtype=np.float32),
    }


def _corpus_items_for_matching():
    """Iterate the stored corpus as CorpusItem objects."""
    for raw in storage.iter_corpus():
        mert = pickle.loads(raw.mert) if raw.mert else None
        yield CorpusItem(
            id=raw.id,
            title=raw.title or raw.id,
            landmark=raw.landmark,
            chroma=raw.chroma,
            mert=mert,
        )


# ---------- routes ----------

@app.get("/")
def root():
    return {
        "service": "provenance.fm",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"ok": True, "corpus": storage.corpus_size()}


@app.post("/artist")
def register_artist(payload: ArtistCreate):
    artist_id = uuid.uuid4().hex[:12]
    storage.upsert_artist(
        artist_id=artist_id,
        handle=payload.handle,
        public_key=payload.public_key or "",
        email=payload.notify_email or "",
    )
    return {"id": artist_id, "handle": payload.handle}


@app.get("/artist/{artist_id}")
def get_artist(artist_id: str):
    a = storage.get_artist(artist_id)
    if not a:
        raise HTTPException(404, "no such artist")
    tracks = storage.get_artist_tracks(artist_id)
    return {
        "id": a.id,
        "handle": a.handle,
        "track_count": len(tracks),
        "notify_email": a.notify_email,
    }


@app.post("/artist/{artist_id}/track")
def upload_track(artist_id: str, payload: TrackUpload):
    if not storage.get_artist(artist_id):
        raise HTTPException(404, "no such artist")
    track_id = uuid.uuid4().hex[:12]
    chroma = _coerce_chroma_from_json(payload.chroma)
    storage.add_artist_track(
        track_id=track_id,
        artist_id=artist_id,
        title=payload.title,
        landmark=payload.landmark,
        chroma=chroma,
    )
    return {"id": track_id, "title": payload.title}


@app.get("/artist/{artist_id}/tracks")
def list_tracks(artist_id: str):
    if not storage.get_artist(artist_id):
        raise HTTPException(404, "no such artist")
    return {
        "tracks": [
            {"id": t.id, "title": t.title}
            for t in storage.get_artist_tracks(artist_id)
        ],
    }


@app.post("/investigate")
async def investigate(file: UploadFile = File(...), top_k: int = Form(10)):
    """Upload an AI-generated track; get ranked matches against registered artists.

    This is the **investigate flow** for labels and funds. The uploaded
    audio is fingerprinted server-side (we run all three: landmark,
    chroma, MERT), then matched against every registered artist's track.
    """
    import librosa
    from .fingerprint.chroma import chroma_fingerprint
    from .fingerprint.landmark import landmark_hash
    try:
        from .fingerprint.mert import mert_embed
        mert_ok = True
    except Exception:
        mert_embed = None
        mert_ok = False

    audio_bytes = await file.read()
    import io
    audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=SAMPLE_RATE, mono=True)
    lm = landmark_hash(audio, sr=sr)
    ch = chroma_fingerprint(audio, sr=sr)
    mr = mert_embed(audio, sr=sr) if mert_ok else None

    # Iterate every registered artist track as a "corpus" for matching.
    matches = []
    for t in storage.iter_all_artist_tracks():
        item = CorpusItem(
            id=t.id, title=f"{t.artist_id}/{t.title}",
            landmark=t.landmark, chroma=t.chroma, mert=None,  # artist side has no MERT
        )
        from .matching import match_one
        score = match_one(lm, ch, mr, item, have_mert_on_query=mr is not None, have_mert_on_corpus=False)
        if score.tier != Tier.NONE:
            matches.append({"id": t.id, "title": t.title, "artist_id": t.artist_id, "score": score.to_dict()})
    matches.sort(key=lambda m: -m["score"]["median"])
    return {"matches": matches[:top_k]}


@app.post("/watchdog/scrape")
def watchdog_scrape(url: str = Form(...), source: str = Form("suno"), run_mert: bool = Form(False)):
    """Pull a URL into the AI-output corpus."""
    from .scraper import scrape_one
    item = scrape_one(url, source, run_mert=run_mert)
    if item is None:
        raise HTTPException(400, "download or fingerprint failed")
    return {"id": item.id, "source": item.source, "title": item.title}


@app.get("/corpus/stats")
def corpus_stats():
    items = list(storage.iter_corpus())
    by_source: dict[str, int] = {}
    for it in items:
        by_source[it.source] = by_source.get(it.source, 0) + 1
    return {"total": len(items), "by_source": by_source}


@app.post("/audit/run")
def run_audit(req: AuditRequest):
    """Run an audit for an artist: score every registered track against the AI corpus."""
    a = storage.get_artist(req.artist_id)
    if not a:
        raise HTTPException(404, "no such artist")
    tracks = storage.get_artist_tracks(req.artist_id)
    if not tracks:
        raise HTTPException(400, "artist has no registered tracks")

    corpus = list(_corpus_items_for_matching())
    if not corpus:
        raise HTTPException(400, "corpus is empty — run /watchdog/scrape first")

    tier_floor = Tier(req.min_tier) if req.min_tier in {"high", "medium", "low"} else Tier.LOW
    matches_payload = []
    for t in tracks:
        results = match_against_corpus(
            t.landmark, t.chroma, None, corpus,
            top_k=req.top_k, min_tier=tier_floor,
            have_mert_on_query=False,
        )
        for r in results:
            matches_payload.append({
                "artist_track_id": t.id,
                "artist_track_title": t.title,
                "corpus_item_id": r.item_id,
                "corpus_title": r.title,
                "score": r.score.to_dict(),
            })

    root = corpus_merkle_root([c.id for c in corpus])
    receipt = make_receipt(
        requester=a.handle,
        matches=matches_payload,
        corpus_root=root,
        note=f"audit run at {int(time.time())} over {len(corpus)} corpus items",
    )
    storage.log_audit(receipt)
    return receipt


@app.get("/receipt/{receipt_id}")
def get_receipt(receipt_id: str):
    r = storage.get_receipt(receipt_id)
    if not r:
        raise HTTPException(404, "no such receipt")
    return r


# ---------- startup ----------

@app.on_event("startup")
def startup():
    ensure_dirs()
    log.info("provenance.fm backend ready, corpus size = %d", storage.corpus_size())
