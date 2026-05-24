"""Watchdog scraper for AI music platforms.

v1 targets:
  - Suno's public Explore page (suno.com/explore)
  - Udio's public feed

Both platforms host publicly shareable AI-generated tracks. We pull
those URLs, download the audio via yt-dlp (which handles many of these
sites), fingerprint, and add to the corpus.

This is a stub for v1 — the actual scrape endpoints change frequently
and we want to keep the run loop testable without hitting live sites.
The interface is what matters: ``scrape_one(url)`` → fingerprint
everything → ``add_corpus_item`` into storage.
"""

from __future__ import annotations

import hashlib
import logging
import pickle
import subprocess
import tempfile
import time
import uuid
from pathlib import Path
from typing import Iterable, Optional

import numpy as np

from .config import CORPUS_DIR, SAMPLE_RATE
from .fingerprint.chroma import chroma_fingerprint
from .fingerprint.landmark import landmark_hash
from .storage import StoredCorpusItem, add_corpus_item

log = logging.getLogger(__name__)


def _ytdlp_download(url: str, out_dir: Path) -> Optional[Path]:
    """Use yt-dlp to grab audio from a URL. Returns the file path or None."""
    out_template = str(out_dir / "%(id)s.%(ext)s")
    try:
        subprocess.run(
            ["yt-dlp", "-x", "--audio-format", "wav", "-o", out_template, url],
            check=True,
            capture_output=True,
            timeout=120,
        )
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError) as e:
        log.warning("yt-dlp failed for %s: %s", url, e)
        return None
    files = list(out_dir.glob("*.wav"))
    return files[0] if files else None


def scrape_one(url: str, source: str, run_mert: bool = False) -> Optional[StoredCorpusItem]:
    """Pull an audio URL, fingerprint it, add to the corpus.

    Args:
        url: source URL (Suno, Udio, YouTube, direct mp3, etc.)
        source: tag for the corpus row (suno / udio / fma / mtat)
        run_mert: also compute the MERT embedding. Slower but enables the
            third leg of the ensemble for this item.
    """
    import librosa
    with tempfile.TemporaryDirectory(dir=str(CORPUS_DIR)) as tmp:
        path = _ytdlp_download(url, Path(tmp))
        if path is None:
            return None
        audio, sr = librosa.load(str(path), sr=SAMPLE_RATE, mono=True)

    landmark = landmark_hash(audio, sr=sr)
    chroma = chroma_fingerprint(audio, sr=sr)
    mert_blob: Optional[bytes] = None
    if run_mert:
        from .fingerprint.mert import mert_embed
        emb = mert_embed(audio, sr=sr)
        mert_blob = pickle.dumps(emb)

    item_hash = hashlib.sha256(
        pickle.dumps(landmark) + pickle.dumps(chroma) + (mert_blob or b"")
    ).hexdigest()
    item = StoredCorpusItem(
        id=str(uuid.uuid4()),
        source=source,
        source_url=url,
        title=Path(path).stem if path else None,
        landmark=landmark,
        chroma=chroma,
        mert=mert_blob,
        item_hash=item_hash,
    )
    add_corpus_item(item)
    return item


def scrape_batch(urls: Iterable[str], source: str, run_mert: bool = False) -> list:
    out = []
    for u in urls:
        item = scrape_one(u, source, run_mert=run_mert)
        if item is None:
            log.warning("skipped %s", u)
            continue
        out.append(item)
        time.sleep(1)  # be polite
    return out
