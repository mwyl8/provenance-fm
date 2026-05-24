"""Central configuration for the provenance.fm backend."""

from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT / "backend" / "data"
CORPUS_DIR = ROOT / "backend" / "corpus"
CACHE_DIR = ROOT / "backend" / "cache"

# Fingerprint config
MERT_MODEL_ID = os.environ.get("PROVENANCE_MERT_MODEL", "m-a-p/MERT-v1-95M")
SAMPLE_RATE = 24000  # MERT expects 24 kHz
EMBED_DIM = 768

# Landmark hash config (Shazam-style constellation)
LANDMARK_N_PEAKS = 30           # peaks per second of audio
LANDMARK_FAN_VALUE = 5          # how many peaks to pair each anchor with
LANDMARK_MIN_TIME_DELTA = 0     # minimum time delta between paired peaks
LANDMARK_MAX_TIME_DELTA = 200   # maximum time delta between paired peaks (frames)

# Chroma config
CHROMA_HOP = 512
CHROMA_N_FFT = 4096

# Matching thresholds (calibrated; will tune with adversarial test set)
THRESHOLD_HIGH = 0.92
THRESHOLD_MEDIUM = 0.75
THRESHOLD_LOW = 0.50

# Ensemble agreement requirement
ENSEMBLE_MIN_AGREE = 2   # at least 2 of {landmark, chroma, mert} must clear LOW

# Storage
DB_PATH = DATA_DIR / "provenance.db"
INDEX_PATH = DATA_DIR / "corpus.faiss"

# Receipt signing
RECEIPT_KEY_PATH = DATA_DIR / "receipt_signing_key"


def ensure_dirs() -> None:
    """Create runtime dirs if missing."""
    for d in (DATA_DIR, CORPUS_DIR, CACHE_DIR):
        d.mkdir(parents=True, exist_ok=True)
