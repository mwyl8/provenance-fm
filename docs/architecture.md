# Architecture

A short engineering reference for the v1 build of provenance.fm.

## Threat model and privacy guarantees

Two parties:

- **The artist** — wants to know whether their work has been used to train
  an AI music model, or appears as a derivative in its outputs. Holds
  audio. Trusts the service less than they trust the AI company.
- **The service (us)** — operates the watchdog and the matching engine.
  Should not learn anything about an artist's catalog beyond what's
  required to run the comparison.

The privacy claim we make to artists:

> Your audio is fingerprinted in your browser via the Web Audio API.
> Only landmark hashes and chromagram features are transmitted. The
> server stores those fingerprints and never has access to the audio
> bytes. You can verify the claim by reading
> [`frontend/src/fingerprint/`](../frontend/src/fingerprint/).

We deliberately do **not** run MERT in the browser — it's a 400MB model
that's impractical to ship to a tab. MERT runs server-side on the AI-output
corpus only. Artist tracks are matched against AI tracks using the two
features both sides share (landmark + chroma). MERT participates only when
the *investigate* flow runs server-side on a freshly-uploaded AI track.

Future v2 work: client-side MERT via ONNX Runtime Web (~300MB download,
slow inference, but real). Tracked in `paper-outline.md` §6.

## Fingerprint ensemble

Three independent fingerprint families per track:

| Fingerprint | What it catches | Where computed | Storage cost |
|---|---|---|---|
| Landmark hash | Direct regurgitation; sample-level reuse | Both client (artist) and server (corpus) | ~10–30 KB |
| Chromagram | Cover versions, MIDI re-renderings, melodic reuse | Both client and server | ~5–10 KB |
| MERT embedding | Semantic similarity; AI re-generation | Server only (corpus + investigate uploads) | 3 KB |

Ensemble rule (`backend/provenance/ensemble.py`):
- Compute each independent similarity in [0, 1].
- Match declared only when ≥ `ENSEMBLE_MIN_AGREE = 2` features clear the LOW threshold.
- Output score is the **median** of the available features. Robust to one bad signal.
- Confidence tier from the median: HIGH ≥ 0.92, MEDIUM ≥ 0.75, LOW ≥ 0.50, else NONE.

This is the precision-driver. Single-feature systems get fooled by adversarial inputs constantly; agreement across three independent measures is rare absent a real match.

## Backend services

```
FastAPI
├─ /artist*               artist + track CRUD
├─ /investigate           full server-side fingerprint of uploaded AI track
├─ /watchdog/scrape       pull Suno/Udio URL → corpus
├─ /audit/run             run all artist tracks vs corpus → signed receipt
└─ /receipt/{id}          public receipt fetch

Storage: SQLite v1 (single-file). Postgres + pgvector for production.
Vector index: linear scan v1; FAISS HNSW once corpus > 10K items.
```

## Receipt protocol

Every audit produces a signed transcript. Mechanism:

```
payload = {
  id, ts, requester, corpus_root, matches[], note, version
}
signature = Ed25519(SigningKey, canonical_json(payload))
receipt = payload | { signature, public_key }
```

- `corpus_root` is a SHA-256 Merkle root over the corpus item hashes at
  audit time. This pins the audit to a specific corpus snapshot — the
  same audit can be replayed later and reach the same conclusion.
- `signature` is Ed25519. Anyone with `public_key` verifies it offline.
  No service involvement required for verification.

A receipt is **not** a legal judgment. It's forensic evidence: cryptographic
proof that *at time T, on corpus snapshot R, the service computed match M
between artist track A and corpus item C with score S*. What you do with
that evidence is between you and your lawyer.

## Watchdog

The scraper polls public AI music platforms. Suno and Udio both host
generated tracks publicly. We pull a curated stream of those URLs, run
yt-dlp to grab audio, fingerprint with the full ensemble (landmark +
chroma + MERT), and add to the corpus.

The corpus is plaintext — these are public outputs, no privacy concern.
The corpus's Merkle root is what gets pinned in audit receipts so the
state is auditable.

v1 cadence: manual / scripted. v2: scheduled job pulling 100–1000 tracks/day.

## Out of scope for v1

- Client-side MERT (v2)
- Cooperative-mode protocol where AI companies commit their training-set
  Merkle root and artists run encrypted set-intersection — see `paper-outline.md`
- Bulk-CLI for label onboarding (v2)
- Webhook delivery / email alerts (v2)
- Real authentication / multi-tenancy (v2)
