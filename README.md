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
backend/provenance/
  app.py                   FastAPI service
  fingerprint/
    mert.py                MERT embedding (server-side)
    landmark.py            Shazam-style landmark hash
    chroma.py              Chromagram feature
  ensemble.py              Multi-fingerprint match aggregation
  matching.py              Fuzzy matching + confidence tiers
  receipts.py              Signed audit transcripts
  scraper.py               Suno / Udio watchdog scraper
  index.py                 Vector index (FAISS / pgvector)
frontend/src/
  pages/Landing.jsx        Artist-hook landing page
  pages/Artist.jsx         Catalog registration
  pages/Investigate.jsx    AI-track lookup
  pages/Receipt.jsx        Signed audit receipts
  fingerprint/             Browser-side landmark + chroma (Web Audio)
docs/
  architecture.md
  paper-outline.md
  licensing.md             Dataset licensing map
  pitches.md               Artist pitch + investor-DD pitch
```

