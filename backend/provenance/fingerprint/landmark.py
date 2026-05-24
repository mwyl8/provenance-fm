"""Shazam-style landmark constellation fingerprint.

We pick local spectral peaks, pair each anchor peak with a fan of nearby
peaks, and hash (freq_anchor, freq_target, time_delta) tuples. The set of
hashes is the fingerprint; matching two tracks is set intersection plus a
time-alignment vote.

This is the fingerprint that catches *direct regurgitation* — the case
where an AI model spits back near-bit-perfect training audio. The
combinatorial structure of constellation pairs makes it robust to noise
and small distortions while being unforgiving of unrelated content.

Implementation: pure-Python over a STFT magnitude spectrogram. Same
shape can be re-implemented in browser JS using the Web Audio API —
that's what the artist-side flow does.

References:
- Wang, "An Industrial-Strength Audio Search Algorithm" (ISMIR 2003).
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Iterable, List, Tuple

import numpy as np
import librosa

from ..config import (
    LANDMARK_FAN_VALUE,
    LANDMARK_MAX_TIME_DELTA,
    LANDMARK_MIN_TIME_DELTA,
    LANDMARK_N_PEAKS,
    SAMPLE_RATE,
)


@dataclass(frozen=True)
class Peak:
    time_frame: int
    freq_bin: int


def _spectral_peaks(spec: np.ndarray, peaks_per_sec: int, hop_length: int, sr: int) -> List[Peak]:
    """Greedy peak picking: take the loudest bins per local time window."""
    n_frames = spec.shape[1]
    duration_sec = n_frames * hop_length / sr
    target_total = max(50, int(peaks_per_sec * max(duration_sec, 1.0)))

    # Flatten with indices, take the top-N magnitudes.
    flat = spec.flatten()
    if flat.size == 0:
        return []
    idx = np.argpartition(flat, -target_total)[-target_total:]
    coords = [(i // n_frames, i % n_frames) for i in idx if flat[i] > 0]
    # Each coord is (freq_bin, time_frame) but argpartition order is irregular —
    # rebuild via direct row/col.
    rows, cols = np.unravel_index(idx, spec.shape)
    peaks = [Peak(time_frame=int(c), freq_bin=int(r)) for r, c in zip(rows, cols)]
    peaks.sort(key=lambda p: p.time_frame)
    return peaks


def _hash_pair(anchor: Peak, target: Peak) -> str:
    """Hash (f_anchor, f_target, dt) — 64-bit truncated SHA-256 as hex."""
    dt = target.time_frame - anchor.time_frame
    blob = f"{anchor.freq_bin}:{target.freq_bin}:{dt}".encode()
    return hashlib.sha256(blob).hexdigest()[:16]


def landmark_hash(audio: np.ndarray, sr: int = SAMPLE_RATE) -> dict:
    """Compute the landmark fingerprint for a mono audio array.

    Returns a dict suitable for storage:
        {"hashes": [hex, ...], "anchor_times": [frame_idx, ...]}
    """
    if audio.ndim > 1:
        audio = audio.mean(axis=0)
    n_fft = 2048
    hop = 512
    spec = np.abs(librosa.stft(audio, n_fft=n_fft, hop_length=hop))
    # Log-magnitude is the canonical landmark input.
    spec = np.log1p(spec)
    peaks = _spectral_peaks(spec, LANDMARK_N_PEAKS, hop, sr)

    hashes: List[str] = []
    anchor_times: List[int] = []
    for i, anchor in enumerate(peaks):
        # Pair anchor with the next FAN_VALUE peaks inside the time window.
        for target in peaks[i + 1 : i + 1 + LANDMARK_FAN_VALUE * 3]:
            dt = target.time_frame - anchor.time_frame
            if dt <= LANDMARK_MIN_TIME_DELTA:
                continue
            if dt > LANDMARK_MAX_TIME_DELTA:
                break
            hashes.append(_hash_pair(anchor, target))
            anchor_times.append(anchor.time_frame)
            if len(hashes) % LANDMARK_FAN_VALUE == 0:
                break

    return {"hashes": hashes, "anchor_times": anchor_times}


def landmark_similarity(a: dict, b: dict) -> float:
    """Aligned-pair count over hash intersection, normalized to [0, 1].

    Time-alignment vote: for each shared hash, compute the time delta
    between the two tracks' anchors. The mode of those deltas is the
    inferred alignment; the count of shared hashes that agree with the
    mode is the match strength. Robust to time-shifted matches.
    """
    if not a["hashes"] or not b["hashes"]:
        return 0.0

    # Map hash -> anchor_time on each side.
    a_map: dict[str, List[int]] = {}
    for h, t in zip(a["hashes"], a["anchor_times"]):
        a_map.setdefault(h, []).append(t)
    b_map: dict[str, List[int]] = {}
    for h, t in zip(b["hashes"], b["anchor_times"]):
        b_map.setdefault(h, []).append(t)

    shared = set(a_map) & set(b_map)
    if not shared:
        return 0.0

    deltas: list[int] = []
    for h in shared:
        for ta in a_map[h]:
            for tb in b_map[h]:
                deltas.append(tb - ta)
    if not deltas:
        return 0.0

    # Mode of deltas.
    values, counts = np.unique(np.array(deltas), return_counts=True)
    best = int(counts.max())
    denom = max(min(len(a["hashes"]), len(b["hashes"])), 1)
    return min(1.0, best / denom * 4.0)  # 4x scaling — aligned-hash fraction is small even on perfect matches


def landmark_from_path(path: str) -> dict:
    audio, sr = librosa.load(path, sr=SAMPLE_RATE, mono=True)
    return landmark_hash(audio, sr)
