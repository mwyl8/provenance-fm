"""Audio fingerprinting — ensemble of three independent signatures.

We deliberately do not rely on a single embedding. False positives are
catastrophic for the product's legal posture, so we require agreement
across at least two of the three:

  - MERT      — music-specific neural embedding (server-side only;
                used on the AI-output corpus)
  - landmark  — Shazam-style constellation hash; catches direct
                regurgitation surgically
  - chroma    — chromagram cosine similarity; robust to instrumentation

The three signals are computed independently and combined in
``ensemble.py``. Each module exposes a ``fingerprint(audio, sr) -> dict``
that returns its signature in a form the index can store.
"""

from .landmark import landmark_hash
from .chroma import chroma_fingerprint
from .mert import mert_embed  # noqa: F401  (heavy import; only run when MERT in use)

__all__ = ["landmark_hash", "chroma_fingerprint", "mert_embed"]
