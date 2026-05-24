"""Signed audit receipts.

Every audit query the system runs produces a transcript:

  - the artist (or label / fund) that ran it
  - the timestamp
  - the corpus snapshot identifier (a Merkle root over the AI-output
    corpus at audit time — guarantees the audit is replayable)
  - the matches with their ensemble scores
  - an Ed25519 signature over the canonical JSON

Receipts are public — anyone can verify a signature without our
permission — but they're useful only to the artist who ran the audit.
They serve as forensic evidence in a takedown, royalty claim, or
lawsuit, and they prevent us (the service) from quietly walking back a
result later.
"""

from __future__ import annotations

import hashlib
import json
import logging
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List

from nacl import signing
from nacl.encoding import HexEncoder

from .config import RECEIPT_KEY_PATH

log = logging.getLogger(__name__)


def _load_or_create_key() -> signing.SigningKey:
    p = Path(RECEIPT_KEY_PATH)
    p.parent.mkdir(parents=True, exist_ok=True)
    if p.exists():
        return signing.SigningKey(p.read_bytes())
    key = signing.SigningKey.generate()
    p.write_bytes(key.encode())
    log.info("generated new receipt signing key at %s", p)
    return key


def canonical_json(payload: dict) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()


def make_receipt(
    requester: str,
    matches: Iterable[dict],
    corpus_root: str,
    note: str = "",
) -> dict:
    body = {
        "id": uuid.uuid4().hex,
        "ts": int(time.time()),
        "requester": requester,
        "corpus_root": corpus_root,
        "matches": list(matches),
        "note": note,
        "version": 1,
    }
    key = _load_or_create_key()
    sig = key.sign(canonical_json(body)).signature
    body["signature"] = sig.hex()
    body["public_key"] = key.verify_key.encode(encoder=HexEncoder).decode()
    return body


def verify_receipt(receipt: dict) -> bool:
    """Public verification — anyone can run this without the signing key."""
    body = {k: v for k, v in receipt.items() if k not in ("signature", "public_key")}
    try:
        vk = signing.VerifyKey(receipt["public_key"], encoder=HexEncoder)
        vk.verify(canonical_json(body), bytes.fromhex(receipt["signature"]))
        return True
    except Exception:
        return False


def corpus_merkle_root(item_hashes: List[str]) -> str:
    """A simple Merkle root over the corpus state at audit time.

    Each item's hash should be a deterministic digest of its fingerprint
    blob. The root pins the audit to a corpus snapshot — if we later
    change the corpus, prior receipts still resolve unambiguously.
    """
    if not item_hashes:
        return hashlib.sha256(b"empty").hexdigest()
    layer = list(item_hashes)
    while len(layer) > 1:
        if len(layer) % 2 == 1:
            layer.append(layer[-1])
        layer = [
            hashlib.sha256((layer[i] + layer[i + 1]).encode()).hexdigest()
            for i in range(0, len(layer), 2)
        ]
    return layer[0]
