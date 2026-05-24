"""Bulk-ingest a folder of audio files into the corpus.

Usage:
    python -m backend.scripts.ingest_corpus /path/to/fma/audio --source fma --run-mert

Fingerprints each track with the full ensemble (landmark + chroma; MERT
optional via --run-mert) and writes to the SQLite corpus.
"""

from __future__ import annotations

import argparse
import hashlib
import logging
import pickle
import sys
import uuid
from pathlib import Path

import librosa
import numpy as np

# Make backend/ importable when running as a script.
_HERE = Path(__file__).resolve()
sys.path.insert(0, str(_HERE.parent.parent.parent))

from backend.provenance.config import SAMPLE_RATE, ensure_dirs
from backend.provenance.fingerprint.chroma import chroma_fingerprint
from backend.provenance.fingerprint.landmark import landmark_hash
from backend.provenance.storage import StoredCorpusItem, add_corpus_item

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("ingest")


def ingest_file(path: Path, source: str, run_mert: bool) -> bool:
    try:
        audio, sr = librosa.load(str(path), sr=SAMPLE_RATE, mono=True)
    except Exception as e:
        log.warning("failed to load %s: %s", path, e)
        return False

    lm = landmark_hash(audio, sr=sr)
    ch = chroma_fingerprint(audio, sr=sr)
    mert_blob = None
    if run_mert:
        from backend.provenance.fingerprint.mert import mert_embed
        emb = mert_embed(audio, sr=sr)
        mert_blob = pickle.dumps(emb)

    item_hash = hashlib.sha256(
        pickle.dumps(lm) + pickle.dumps(ch) + (mert_blob or b"")
    ).hexdigest()
    item = StoredCorpusItem(
        id=str(uuid.uuid4()),
        source=source,
        source_url=None,
        title=path.stem,
        landmark=lm,
        chroma=ch,
        mert=mert_blob,
        item_hash=item_hash,
    )
    add_corpus_item(item)
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path", type=str, help="folder of audio files")
    ap.add_argument("--source", type=str, required=True, help="tag (fma / mtat / maestro / suno / udio)")
    ap.add_argument("--run-mert", action="store_true", help="also compute MERT embedding (slow)")
    ap.add_argument("--limit", type=int, default=0, help="stop after N files (0 = all)")
    args = ap.parse_args()

    ensure_dirs()
    root = Path(args.path)
    exts = {".mp3", ".wav", ".flac", ".m4a", ".ogg"}
    files = sorted(p for p in root.rglob("*") if p.suffix.lower() in exts)
    if args.limit:
        files = files[: args.limit]

    log.info("ingesting %d files from %s as %s", len(files), root, args.source)
    n_ok = 0
    for i, p in enumerate(files, 1):
        if ingest_file(p, args.source, args.run_mert):
            n_ok += 1
        if i % 10 == 0:
            log.info("  %d/%d done (%d ok)", i, len(files), n_ok)
    log.info("finished: %d/%d ingested", n_ok, len(files))


if __name__ == "__main__":
    main()
