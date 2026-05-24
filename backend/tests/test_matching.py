"""Sanity tests on the ensemble logic.

Doesn't load MERT or any heavy deps — just verifies the score combining,
tier assignment, and agreement floor behave as documented.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.provenance.ensemble import Tier, ensemble_score


def test_all_high_with_mert():
    s = ensemble_score(landmark=0.95, chroma=0.93, mert=0.94)
    assert s.tier == Tier.HIGH
    assert s.agreement == 3


def test_two_agree_without_mert():
    s = ensemble_score(landmark=0.88, chroma=0.82, mert=None)
    # Median of [.88, .82] = .85; in MEDIUM tier; agreement = 2.
    assert s.tier == Tier.MEDIUM
    assert s.agreement == 2


def test_one_feature_strong_blocked_by_agreement():
    # Landmark alone is huge, chroma + mert miss.
    s = ensemble_score(landmark=0.99, chroma=0.10, mert=0.05)
    assert s.agreement == 1
    assert s.tier == Tier.NONE  # single-feature can't promote


def test_borderline_low():
    s = ensemble_score(landmark=0.55, chroma=0.52, mert=0.51)
    assert s.tier == Tier.LOW


def test_none_floor():
    s = ensemble_score(landmark=0.10, chroma=0.10, mert=0.10)
    assert s.tier == Tier.NONE


if __name__ == "__main__":
    # Manual smoke run if pytest isn't installed.
    for fn in (
        test_all_high_with_mert,
        test_two_agree_without_mert,
        test_one_feature_strong_blocked_by_agreement,
        test_borderline_low,
        test_none_floor,
    ):
        fn()
        print(f"ok  {fn.__name__}")
    print("all sanity tests passed")
