"""Match an incoming query fingerprint against a corpus.

Two flows:

- **Artist→corpus**: artist has registered (landmark + chroma) for each
  of their tracks. For each scraped AI-output track in the corpus, we
  score the artist's tracks against it using the ensemble (landmark,
  chroma; MERT only present on the AI side, so the artist-side
  comparison is two-feature with the MERT score skipped).

- **Investigate**: a user uploads an AI track. We compute its full
  fingerprint (all three), then return the top-K artist tracks by
  ensemble similarity. Used by labels and funds to investigate
  suspicious AI outputs.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from typing import Iterable, List, Optional

from .ensemble import EnsembleScore, Tier, ensemble_score
from .fingerprint.chroma import chroma_similarity
from .fingerprint.landmark import landmark_similarity
from .fingerprint.mert import mert_similarity

log = logging.getLogger(__name__)


@dataclass
class CorpusItem:
    id: str
    title: str
    landmark: dict
    chroma: dict
    mert: Optional[object] = None   # np.ndarray when present


@dataclass
class Match:
    item_id: str
    title: str
    score: EnsembleScore

    def to_dict(self) -> dict:
        return {
            "id": self.item_id,
            "title": self.title,
            "score": self.score.to_dict(),
        }


def match_one(
    query_landmark: dict,
    query_chroma: dict,
    query_mert,
    corpus_item: CorpusItem,
    have_mert_on_query: bool = True,
    have_mert_on_corpus: bool = True,
) -> EnsembleScore:
    """Score a query against one corpus item, returning the ensemble."""
    lm = landmark_similarity(query_landmark, corpus_item.landmark)
    ch = chroma_similarity(query_chroma, corpus_item.chroma)
    mr = None
    if have_mert_on_query and have_mert_on_corpus and corpus_item.mert is not None:
        mr = mert_similarity(query_mert, corpus_item.mert)
    return ensemble_score(lm, ch, mr)


def match_against_corpus(
    query_landmark: dict,
    query_chroma: dict,
    query_mert,
    corpus: Iterable[CorpusItem],
    top_k: int = 10,
    min_tier: Tier = Tier.LOW,
    have_mert_on_query: bool = True,
) -> List[Match]:
    """Rank a query against every corpus item; return top_k above min_tier."""
    t0 = time.perf_counter()
    matches: List[Match] = []
    for item in corpus:
        score = match_one(
            query_landmark,
            query_chroma,
            query_mert,
            item,
            have_mert_on_query=have_mert_on_query,
            have_mert_on_corpus=item.mert is not None,
        )
        # Skip "none" tier unless caller wants them.
        if Tier(score.tier) == Tier.NONE and min_tier != Tier.NONE:
            continue
        matches.append(Match(item_id=item.id, title=item.title, score=score))
    matches.sort(key=lambda m: -m.score.median)
    log.info("scored %d candidates in %.2f ms", len(matches), (time.perf_counter() - t0) * 1000)
    return matches[:top_k]
