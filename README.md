# provenance.fm

Cryptographic provenance for music in AI training data.

A protocol and a watchdog service that tells artists when their work has
been used to train AI music generators — or appears as a near-derivative
in the models' outputs. Audits are forensic-grade, run on encrypted
fingerprints, and produce signed receipts that hold up as evidence.

## What it does

- **Artists** register their catalogs. Audio is fingerprinted client-side
  and never leaves the device. We continuously watchdog AI music
  platforms (Suno, Udio, others) and alert when something close to the
  artist's work shows up.
- **Labels & rights organizations** get bulk audit reports across whole
  catalogs.
- **Music funds** use it as pre-acquisition due diligence: is this
  catalog full of AI-generated tracks? Is anything in it derivative of
  flagged AI outputs?

## Technical core

- **Ensemble fingerprinting** — MERT (server-side, AI corpus only) +
  landmark hash + chromagram. Requires multi-fingerprint agreement to
  declare a match. Drives precision up.
- **Client-side fingerprinting for artists** — landmark + chromagram
  run in the browser via Web Audio API. Audio never uploaded.
- **Confidence tiers** — every match comes with high / medium / low
  confidence. Forensic claim, not legal judgment.
- **Cryptographic receipts** — every audit produces a signed,
  timestamped transcript. Holds up as evidence.

## Status

- v1 scaffold + watchdog + landing — see `docs/architecture.md`.
- Cooperative-mode protocol (where AI companies commit their training
  sets and artists run encrypted set intersection against them) is
  future work — see `docs/paper-outline.md` §6.
- A short system paper accompanies the build — see `docs/paper-outline.md`.

## Quickstart

```bash
# Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.provenance.app:app --reload --port 5050

# Frontend
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

## Layout
```
backend/
  requirements.txt
  provenance/
    app.py                 FastAPI service (HTTP endpoints; wires the modules together)
    config.py              settings: sample rate, confidence thresholds, paths
    storage.py             persistence — SQLite (artists, tracks, corpus, audit log)
    ensemble.py            multi-fingerprint aggregation (median + "2-of-3 must agree")
    matching.py            fuzzy matching + confidence tiers (linear scan over corpus)
    receipts.py            signed audit transcripts (Ed25519 + corpus Merkle root)
    scraper.py             Suno / Udio watchdog scraper (yt-dlp; v1)
    fingerprint/
      mert.py              MERT embedding (server-side): style/vibe signal
      landmark.py          Shazam-style landmark hash: exact-recording identity
      chroma.py            chromagram: harmony/melody (12 pitch classes)
  scripts/
    ingest_corpus.py       bulk-fingerprint a corpus of AI tracks
    run_watchdog.py        run the scraper/watchdog loop
  tests/
    test_matching.py       unit tests for the matcher
frontend/src/
  pages/Landing.jsx        Artist-hook landing page
  pages/Artist.jsx         Catalog registration (client-side fingerprinting)
  pages/Investigate.jsx    AI-track lookup
  pages/Receipt.jsx        Signed audit receipts
  pages/Labels.jsx         Record-label customer view
  pages/Funds.jsx          Music-fund customer view
  components/              AudioDropzone, ConfidenceBadge
  fingerprint/             Browser-side landmark + chroma (Web Audio; audio never leaves device)
docs/
  architecture.md
  paper-outline.md
  licensing.md             Dataset licensing map
  pitches.md               Artist pitch + investor-DD pitch
```

> **Storage / scale note:** v1 stores fingerprints in SQLite and matches with a linear
> scan, which is fine at demo scale. The production path is a vector index
> (FAISS or pgvector) as a candidate-generation stage in front of the ensemble —
> planned, not yet implemented.
