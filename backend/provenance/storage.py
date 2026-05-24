"""SQLite-backed storage for the v1 demo.

Two tables:

  artists       — registered artists and their (encrypted) fingerprints
  corpus_items  — AI-output corpus (Suno / Udio / scraped) fingerprints

Fingerprint blobs are stored as pickled bytes; this is fine for a
v1/demo. A production system would put the vectors in pgvector / FAISS
and the metadata in Postgres.
"""

from __future__ import annotations

import json
import pickle
import sqlite3
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional

from .config import DB_PATH, ensure_dirs


SCHEMA = """
CREATE TABLE IF NOT EXISTS artists (
  id          TEXT PRIMARY KEY,
  handle      TEXT UNIQUE NOT NULL,
  created_at  INTEGER NOT NULL,
  public_key  TEXT,
  notify_email TEXT
);

CREATE TABLE IF NOT EXISTS artist_tracks (
  id           TEXT PRIMARY KEY,
  artist_id    TEXT NOT NULL,
  title        TEXT NOT NULL,
  landmark     BLOB,   -- pickled dict
  chroma       BLOB,   -- pickled dict
  created_at   INTEGER NOT NULL,
  FOREIGN KEY (artist_id) REFERENCES artists(id)
);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON artist_tracks(artist_id);

CREATE TABLE IF NOT EXISTS corpus_items (
  id           TEXT PRIMARY KEY,
  source       TEXT NOT NULL,   -- suno / udio / fma / mtat / msd
  source_url   TEXT,
  title        TEXT,
  fetched_at   INTEGER NOT NULL,
  landmark     BLOB,
  chroma       BLOB,
  mert         BLOB,
  item_hash    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_corpus_source ON corpus_items(source);

CREATE TABLE IF NOT EXISTS audit_log (
  id           TEXT PRIMARY KEY,
  artist_id    TEXT,
  ts           INTEGER NOT NULL,
  payload      TEXT NOT NULL    -- JSON receipt
);
"""


@dataclass
class Artist:
    id: str
    handle: str
    public_key: Optional[str] = None
    notify_email: Optional[str] = None


@dataclass
class StoredTrack:
    id: str
    artist_id: str
    title: str
    landmark: dict
    chroma: dict


@dataclass
class StoredCorpusItem:
    id: str
    source: str
    source_url: Optional[str]
    title: Optional[str]
    landmark: dict
    chroma: dict
    mert: Optional[bytes]
    item_hash: str


def _conn():
    ensure_dirs()
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)
    return conn


# ---------- artists ----------

def upsert_artist(artist_id: str, handle: str, public_key: str = "", email: str = "") -> None:
    with _conn() as c:
        c.execute(
            "INSERT INTO artists(id, handle, created_at, public_key, notify_email) "
            "VALUES (?, ?, ?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET handle=excluded.handle, "
            "public_key=excluded.public_key, notify_email=excluded.notify_email",
            (artist_id, handle, int(time.time()), public_key, email),
        )


def list_artists() -> List[Artist]:
    with _conn() as c:
        rows = c.execute(
            "SELECT id, handle, public_key, notify_email FROM artists ORDER BY created_at DESC"
        ).fetchall()
    return [Artist(*row) for row in rows]


def get_artist(artist_id: str) -> Optional[Artist]:
    with _conn() as c:
        row = c.execute(
            "SELECT id, handle, public_key, notify_email FROM artists WHERE id = ?",
            (artist_id,),
        ).fetchone()
    return Artist(*row) if row else None


# ---------- artist tracks ----------

def add_artist_track(track_id: str, artist_id: str, title: str, landmark: dict, chroma: dict) -> None:
    with _conn() as c:
        c.execute(
            "INSERT INTO artist_tracks(id, artist_id, title, landmark, chroma, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (track_id, artist_id, title, pickle.dumps(landmark), pickle.dumps(chroma), int(time.time())),
        )


def get_artist_tracks(artist_id: str) -> List[StoredTrack]:
    with _conn() as c:
        rows = c.execute(
            "SELECT id, artist_id, title, landmark, chroma FROM artist_tracks WHERE artist_id = ?",
            (artist_id,),
        ).fetchall()
    return [StoredTrack(id=r[0], artist_id=r[1], title=r[2],
                       landmark=pickle.loads(r[3]), chroma=pickle.loads(r[4]))
            for r in rows]


def iter_all_artist_tracks() -> Iterable[StoredTrack]:
    with _conn() as c:
        rows = c.execute(
            "SELECT id, artist_id, title, landmark, chroma FROM artist_tracks"
        ).fetchall()
    for r in rows:
        yield StoredTrack(id=r[0], artist_id=r[1], title=r[2],
                          landmark=pickle.loads(r[3]), chroma=pickle.loads(r[4]))


# ---------- corpus ----------

def add_corpus_item(item: StoredCorpusItem) -> None:
    with _conn() as c:
        c.execute(
            "INSERT OR REPLACE INTO corpus_items(id, source, source_url, title, fetched_at, "
            "landmark, chroma, mert, item_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (item.id, item.source, item.source_url, item.title, int(time.time()),
             pickle.dumps(item.landmark), pickle.dumps(item.chroma),
             item.mert, item.item_hash),
        )


def iter_corpus(source: Optional[str] = None) -> Iterable[StoredCorpusItem]:
    with _conn() as c:
        if source:
            rows = c.execute(
                "SELECT id, source, source_url, title, landmark, chroma, mert, item_hash "
                "FROM corpus_items WHERE source = ?",
                (source,),
            ).fetchall()
        else:
            rows = c.execute(
                "SELECT id, source, source_url, title, landmark, chroma, mert, item_hash FROM corpus_items"
            ).fetchall()
    for r in rows:
        yield StoredCorpusItem(
            id=r[0], source=r[1], source_url=r[2], title=r[3],
            landmark=pickle.loads(r[4]), chroma=pickle.loads(r[5]),
            mert=r[6], item_hash=r[7],
        )


def corpus_size() -> int:
    with _conn() as c:
        return c.execute("SELECT COUNT(*) FROM corpus_items").fetchone()[0]


def corpus_item_hashes() -> List[str]:
    with _conn() as c:
        rows = c.execute("SELECT item_hash FROM corpus_items ORDER BY id").fetchall()
    return [r[0] for r in rows]


# ---------- audit log ----------

def log_audit(receipt: dict) -> None:
    with _conn() as c:
        c.execute(
            "INSERT INTO audit_log(id, artist_id, ts, payload) VALUES (?, ?, ?, ?)",
            (receipt["id"], receipt.get("requester"), receipt["ts"], json.dumps(receipt)),
        )


def get_receipt(receipt_id: str) -> Optional[dict]:
    with _conn() as c:
        row = c.execute("SELECT payload FROM audit_log WHERE id = ?", (receipt_id,)).fetchone()
    return json.loads(row[0]) if row else None
