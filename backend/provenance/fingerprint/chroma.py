"""Chromagram fingerprint.

A chromagram is a 12-dim representation of pitch-class energy over time.
We compute a smoothed, normalized chromagram and treat it as a low-rate
embedding — robust to instrumentation and timbre changes (so it survives
covers, remixes, MIDI re-renderings) but sensitive to melodic / harmonic
content.

Comparison: cosine similarity over the mean-pooled, L2-normalized chroma.
For longer tracks we also compute a short sliding-window comparison —
this catches partial matches (sample borrowing, intro reuse).
"""

from __future__ import annotations

import numpy as np
import librosa

from ..config import CHROMA_HOP, CHROMA_N_FFT, SAMPLE_RATE


def chroma_fingerprint(audio: np.ndarray, sr: int = SAMPLE_RATE) -> dict:
    """Compute a chromagram-based fingerprint.

    Returns:
        {
          "pooled": np.ndarray (12,),     # mean-pooled, L2-normalized
          "frames": np.ndarray (12, T),   # full chroma, downsampled
        }
    """
    if audio.ndim > 1:
        audio = audio.mean(axis=0)
    chroma = librosa.feature.chroma_stft(
        y=audio,
        sr=sr,
        n_fft=CHROMA_N_FFT,
        hop_length=CHROMA_HOP,
    )
    # Smooth via median filter across time.
    if chroma.shape[1] > 5:
        chroma = librosa.decompose.nn_filter(
            chroma, aggregate=np.median, metric="cosine", width=5
        )
    pooled = chroma.mean(axis=1)
    n = np.linalg.norm(pooled)
    if n > 0:
        pooled = pooled / n
    # Downsample frames to keep storage modest.
    keep_every = max(1, chroma.shape[1] // 200)
    frames = chroma[:, ::keep_every]
    frames_norm = np.linalg.norm(frames, axis=0, keepdims=True)
    frames = np.divide(frames, frames_norm, out=np.zeros_like(frames), where=frames_norm > 0)
    return {"pooled": pooled.astype(np.float32), "frames": frames.astype(np.float32)}


def chroma_similarity(a: dict, b: dict) -> float:
    """Combined cosine similarity: pooled + best-window."""
    pooled_sim = float(np.dot(a["pooled"], b["pooled"]))

    # Sliding-window match on the frame-level chroma. We find the
    # longest contiguous span of high cosine and return its average.
    fa, fb = a["frames"], b["frames"]
    if fa.shape[1] == 0 or fb.shape[1] == 0:
        return pooled_sim
    if fa.shape[1] > fb.shape[1]:
        fa, fb = fb, fa
    # Cross-cosine matrix
    cross = fa.T @ fb           # (Ta, Tb)
    # Best diagonal-segment average
    n_align = min(fa.shape[1], fb.shape[1])
    diag_means = []
    for offset in range(-fb.shape[1] + 1, fa.shape[1]):
        diag = cross.diagonal(offset=offset)
        if diag.size > 0:
            diag_means.append(diag.mean())
    win_sim = float(max(diag_means)) if diag_means else 0.0
    # Weighted blend — pooled handles global similarity, win catches local borrowing.
    return max(pooled_sim, 0.7 * pooled_sim + 0.3 * win_sim)


def chroma_from_path(path: str) -> dict:
    import librosa as _librosa
    audio, sr = _librosa.load(path, sr=SAMPLE_RATE, mono=True)
    return chroma_fingerprint(audio, sr)
