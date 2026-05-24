"""MERT embedding — server-side only.

MERT (Music undERstanding model with large-scale self-supervised
Training) is a 95M-parameter transformer trained on raw music audio.
It produces semantically meaningful embeddings that survive things
landmark hashes can't — pitch shifts, tempo changes, cover versions,
even some AI re-renderings.

We use MERT ONLY on the AI-output corpus (Suno/Udio scraped tracks).
Those tracks are public; no privacy concern. Artist tracks are
fingerprinted client-side using only landmark + chroma — MERT is never
run on artist audio.

This module is the heaviest dependency in the project (PyTorch +
transformers + ~400MB model checkpoint). Import lazily.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Optional

import numpy as np

from ..config import EMBED_DIM, MERT_MODEL_ID, SAMPLE_RATE

log = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _load_model():
    """Lazy-load MERT and its feature extractor. Cached for the process."""
    import torch  # noqa: F401  (lazy)
    from transformers import AutoModel, Wav2Vec2FeatureExtractor

    log.info("loading MERT (%s) — may take 30s on first run", MERT_MODEL_ID)
    extractor = Wav2Vec2FeatureExtractor.from_pretrained(MERT_MODEL_ID, trust_remote_code=True)
    model = AutoModel.from_pretrained(MERT_MODEL_ID, trust_remote_code=True)

    # Prefer MPS on Apple Silicon for ~5x speedup over CPU.
    import torch
    if torch.backends.mps.is_available():
        device = "mps"
    elif torch.cuda.is_available():
        device = "cuda"
    else:
        device = "cpu"
    model = model.to(device).eval()
    log.info("MERT loaded on %s", device)
    return extractor, model, device


def mert_embed(audio: np.ndarray, sr: int = SAMPLE_RATE) -> np.ndarray:
    """Run MERT on a mono audio array. Returns a single 768-dim embedding.

    We mean-pool the last hidden layer over time. Real production would
    likely use the weighted-layer-sum recommended by the MERT paper; for
    v1 the simpler mean-pool is good enough.
    """
    import torch
    extractor, model, device = _load_model()
    if audio.ndim > 1:
        audio = audio.mean(axis=0)
    if sr != SAMPLE_RATE:
        import librosa
        audio = librosa.resample(audio, orig_sr=sr, target_sr=SAMPLE_RATE)
    inputs = extractor(audio, sampling_rate=SAMPLE_RATE, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}
    with torch.no_grad():
        out = model(**inputs, output_hidden_states=False)
    # last_hidden_state: (1, T, D)
    pooled = out.last_hidden_state.mean(dim=1).squeeze(0).cpu().numpy()
    n = np.linalg.norm(pooled)
    if n > 0:
        pooled = pooled / n
    return pooled.astype(np.float32)


def mert_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between two MERT embeddings (both L2-normalized)."""
    if a is None or b is None or a.size == 0 or b.size == 0:
        return 0.0
    return float(np.dot(a, b))


def mert_from_path(path: str) -> np.ndarray:
    import librosa
    audio, sr = librosa.load(path, sr=SAMPLE_RATE, mono=True)
    return mert_embed(audio, sr)
