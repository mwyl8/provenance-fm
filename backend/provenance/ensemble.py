"""Ensemble matching — the precision-driver.

Each fingerprint family produces a similarity score in [0, 1]. We
combine them with two rules:

1. **Agreement requirement.** At least ENSEMBLE_MIN_AGREE families must
   independently clear the LOW threshold. A single embedding hitting
   high alone does NOT produce a match. False positives in one family
   are common; correlated false positives across three are rare.

2. **Tier assignment.** The ensemble score is the median of the three
   scores (after agreement passes). The tier is chosen by where the
   median sits relative to the configured thresholds.

The point: the system claims a match only when multiple independent
features agree. This is how we keep the legal-posture honest.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional

import numpy as np

from .config import (
    ENSEMBLE_MIN_AGREE,
    THRESHOLD_HIGH,
    THRESHOLD_LOW,
    THRESHOLD_MEDIUM,
)


class Tier(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    NONE = "none"


@dataclass
class EnsembleScore:
    landmark: float
    chroma: float
    mert: Optional[float]   # None if MERT not available for this pair
    median: float
    agreement: int
    tier: Tier

    def to_dict(self) -> dict:
        return {
            "landmark": round(self.landmark, 4),
            "chroma": round(self.chroma, 4),
            "mert": None if self.mert is None else round(self.mert, 4),
            "median": round(self.median, 4),
            "agreement": self.agreement,
            "tier": self.tier.value,
        }


def _tier_for(score: float) -> Tier:
    if score >= THRESHOLD_HIGH:
        return Tier.HIGH
    if score >= THRESHOLD_MEDIUM:
        return Tier.MEDIUM
    if score >= THRESHOLD_LOW:
        return Tier.LOW
    return Tier.NONE


def ensemble_score(
    landmark: float,
    chroma: float,
    mert: Optional[float] = None,
) -> EnsembleScore:
    """Combine independent similarity scores into a tiered ensemble result.

    landmark / chroma are always present (computed client-side for
    artists, server-side for the corpus). MERT is present when matching
    against the AI-output corpus, absent when matching artist↔artist or
    when the artist's side only carries the two browser-side features.
    """
    scores = [landmark, chroma]
    if mert is not None:
        scores.append(mert)
    agree = sum(1 for s in scores if s >= THRESHOLD_LOW)
    median = float(np.median(scores))
    tier = _tier_for(median) if agree >= ENSEMBLE_MIN_AGREE else Tier.NONE
    return EnsembleScore(
        landmark=float(landmark),
        chroma=float(chroma),
        mert=None if mert is None else float(mert),
        median=median,
        agreement=agree,
        tier=tier,
    )
