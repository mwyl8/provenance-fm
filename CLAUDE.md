# CLAUDE.md — persistent context for provenance.fm

This file is the source of truth for any AI assistant (or returning human)
picking up work on this project. **Read it first.** Update it when locked
decisions change — never let it drift behind reality.

If you're about to lose context (session end, expected compaction), write
a session handoff into `docs/HANDOFF.md` before stopping. See §11 for the
handoff protocol.

---

## 1. What this project is

**provenance.fm** — cryptographic provenance for music in AI training data.

A watchdog + audit system that tells **solo artists** when their work
shows up in Suno / Udio / similar AI music outputs, and gives them
forensic-grade evidence (signed receipts) plus one-click paths to take
action (file Spotify or Suno takedowns, recover royalties).

The product layer is the action layer. The technical substrate is
ensemble audio fingerprinting + Ed25519-signed audit receipts + a
Merkle-rooted corpus snapshot for replayable audits.

A [Pitchfork Innovation](https://usepitchfork.com) studio project.

**One-line pitch to artists:**
> *"Was your music used to train AI? Get it taken down. Recover the royalties."*

---

## 2. Where things live

| Where | What |
|---|---|
| `/Users/williamwang/provenance-fm` | this repo (local) |
| `mwyl8/provenance-fm` (GitHub, private) | this repo (remote) |
| `/Users/williamwang/atomic-reblock` | **sibling project**, not this — Atomic Reblock (AHE schema migration). Different product. Do not conflate. |
| `mwyl8/atomic-reblock` (GitHub, private) | sibling remote |
| `~/.local/node` | Node 22.11.0 (brew was building cmake from source; tarball install instead) |
| `.venv/` | Python 3.12 venv. **Do not use the system 3.14** — torch / numpy / scipy don't ship 3.13+ wheels yet. |

---

## 3. Build / run

```bash
make install PYTHON=python3.12     # one-time
make backend                       # uvicorn on :5050  (T1)
make frontend                      # vite on :5173     (T2)
make test                          # ensemble unit tests
make doctor                        # list available python interpreters
```

Three terminals: **T1** backend, **T2** frontend, **T3** scratch
(curl, ingest scripts, signature checks).

Backend serves API on `:5050`; frontend dev server proxies `/api/*` → `:5050`.
Vite binds IPv6 — use `localhost:5173`, not `127.0.0.1:5173`, from curl.

---

## 4. Architecture

### High level

```
Artist's browser ──fingerprints locally──┐
                                          ↓
                            POST /artist/{id}/track
                                          ↓
                    SQLite ─ artists / artist_tracks
                                          ↑
            Watchdog scraper (Suno/Udio) ─┘
                                          ↓
                    SQLite ─ corpus_items (AI outputs)
                                          ↓
            Audit ─ ensemble matching ─ Ed25519 receipt
                                          ↓
            Action layer (planned v1.1)
            - Stream-count scrape
            - Spotify takedown pre-fill
            - Suno DMCA mailto: payload
            - SoundExchange claim packet
            - Action receipts (separate signing key)
```

### Ensemble fingerprinting — the precision driver

Three independent fingerprint families per track. **A match requires
≥2 families to agree above LOW threshold.** Median across the available
families is the headline score. False positives in one family are common;
correlated false positives across three are rare.

| Family | Catches | Where computed | Cost |
|---|---|---|---|
| Landmark hash (Shazam-style constellation) | direct regurgitation | browser + server | ~10–30 KB |
| Chromagram (12-dim pitch energy) | cover versions, remixes | browser + server | ~5–10 KB |
| MERT (`m-a-p/MERT-v1-95M`) | AI re-generation, semantic similarity | **server only** | 3 KB |

Confidence tiers (median-based): HIGH ≥ 0.92, MEDIUM ≥ 0.75, LOW ≥ 0.50, NONE.

### Receipts

Ed25519 signed transcript pinned to a SHA-256 Merkle root over the corpus
snapshot at audit time. Verifiable offline by anyone with the public key.
Re-audits are reproducible because the root pins the corpus state.

---

## 5. Privacy posture (LOAD-BEARING — never break this)

The privacy claim on the landing page is real and must remain so:

> *"Audio is fingerprinted in your browser via the Web Audio API. Only
> landmark hashes and chromagram features are transmitted. Audio bytes
> never leave your device."*

This means:
- **MERT MUST NOT run client-side.** It only runs server-side on the
  AI-output corpus (which is public; no privacy issue). Adding browser-side
  MERT silently breaks the claim — model download + inference would force
  audio into a workflow that touches the network.
- Artist-side fingerprints (landmark + chroma) are computed entirely in
  `frontend/src/fingerprint/`. Verify in DevTools Network tab: any
  artist track upload should be tens of KB of JSON hashes/floats, never
  megabytes of audio.
- Server-side fingerprinting of AI tracks (in `/investigate`) is fine —
  the user is uploading an AI-generated track, not their own protected work.

If a PR appears to upload audio from the artist flow, **stop and ask**.
Don't merge silently.

---

## 6. Honest scope (the brand discipline)

Three things this product detects:

| Case | What | Status |
|---|---|---|
| A. Direct regurgitation | AI outputs near-bit-identical to a training track | ✅ we catch this |
| B. Close derivative | Same melody / progression / feel, different surface | ✅ we catch this |
| C. Style learning | Model learned an artist's style, no specific copy | ❌ **out of scope** |

**Never claim case C.** Style learning is not detectable with current
technology absent watermarking or training-set cooperation. The landing
page explicitly disclaims it; marketing, paper copy, and pitches must
match. This honesty is a moat, not a weakness — anyone overselling
will be the one in the lawsuit.

Similarly: receipts are **forensic evidence**, not legal judgments. We
report audio-feature similarity. The artist + their lawyer + the court
decide what it means. Forensic, not prosecutorial. Repeat often.

---

## 7. Locked decisions (do not relitigate)

These are settled. If you think one should change, raise it explicitly
with the user before assuming.

| # | Decision |
|---|---|
| L1 | Primary embedding: **MERT (`m-a-p/MERT-v1-95M`)**, MPS-accelerated on Apple Silicon |
| L2 | Match fuzziness: covers / remixes / pitch ± tempo shifts. Case-C style-learning is OUT. |
| L3 | Operating mode v1: **watchdog** (scrape AI outputs, match against artists). Cooperative-mode PSI is future paper work. |
| L4 | Privacy posture: client-side fingerprinting for artists (landmark + chroma only). MERT server-side, corpus-only. |
| L5 | Audiences: artists + labels + funds, three doors on one landing |
| L6 | v1.1 platforms: **Spotify + Suno only**. YouTube / Apple / TikTok deferred. |
| L7 | v1.1 audience: **solo artist self-serve** (not label-mediated, not class-action) |
| L8 | v1.1 satisfying loop: **money recovery** (royalties + takedowns), not punishment |
| L9 | Action scope v1.1: **individual artist actions**, not class coordination |
| L10 | Receipt signing: Ed25519. Action receipts (v1.1) use a **separate** signing key from audit receipts. |
| L11 | Paper venue target: **ISMIR Late-Breaking Demos** first (system + demo paper). PoPETs / NeurIPS workshops as later options. |
| L12 | Mentor (Dongfang Zhao): **light advisor** only, ~2-month window starting ~3 weeks from project start. Ask in person, not via email. |
| L13 | Brand: **provenance.fm**. Domain matters. |
| L14 | Landing hero: artist hook ("Was your music used to train AI?"), updated to add money angle in v1.1 |

---

## 8. Pending decisions (open until user answers)

The v1.1 action-layer PR is waiting on:

| Q | Topic | Default if user silent |
|---|---|---|
| Q1 | Stream-count source for royalty estimate | Spotify only in v1.1; Apple + YouTube deferred |
| Q2 | Royalty estimate display | Single number with hover-disclaimer showing range |
| Q3 | Auto-poll platform responses | Manual marking in v1.1 (artist tags "responded") |
| Q4 | DMCA penalty-of-perjury checkbox | **Required** — legal requirement, not optional |

Don't ship the action PR until these are confirmed.

---

## 9. Style / conventions

### Python

- Type hints on public functions; `from __future__ import annotations` at top of every module.
- Pydantic v2 for request/response models. FastAPI dependency-injection style.
- Module docstrings explain *why*, not what. The why explains the design choice that isn't obvious from the code.
- Lazy imports for heavy deps (torch, transformers, librosa) — never import at module level.
- SQLite for v1; the storage layer (`storage.py`) is the abstraction. Postgres + pgvector is the v2 swap.
- Tests live in `backend/tests/`, named `test_*.py`, runnable with `make test`.

### JavaScript / React

- Functional components only. Hooks for state. No class components.
- Tailwind utility classes; no `.module.css` except for the global `index.css`.
- No state-management library. Component-local state + `useEffect` + lifting up. If we ever need it, prefer Zustand over Redux.
- API calls go through `src/api.js`. Don't `fetch` directly from components.
- Browser-side fingerprinting code lives in `src/fingerprint/`. Keep it pure JS / Web Audio; no React.
- Async functions: **always await**. The v1 build had a silent bug where `landmarkHashFromMagnitudes` (async) was treated as sync and returned a Promise. The lint will catch most of these; if it doesn't, your reviewer will.

### Naming

- Snake_case for Python, camelCase for JS.
- Schemas use the noun-form (`Artist`, `CorpusItem`, `Match`, `Receipt`).
- API routes are plural for collections (`/artists`), singular for one resource (`/artist/{id}`).

### Commits + PRs

- Conventional-ish prefix when it sharpens the meaning (`fix:`, `feat:`, `docs:`), but full prose for substantive commits.
- Co-authored-by line on AI-assisted commits.
- PR bodies: summary first, then file-by-file table, then test plan checklist. (See PR #1 for the template.)
- Squash-merge to `main`. Delete feature branches after merge.

---

## 10. Things NOT to do

- **Do not** introduce client-side MERT or any path that uploads artist audio. Breaks the privacy claim.
- **Do not** claim style-learning detection in any copy. See §6.
- **Do not** lower the ensemble agreement floor below 2. Single-feature matching produces too many false positives.
- **Do not** auto-submit DMCA takedowns. False filings expose the artist to § 512(f) counter-suits. We pre-fill; the artist submits.
- **Do not** rebase shared branches. Squash-merge is the merge style; feature branches are linear.
- **Do not** install dependencies via `brew install python` blindly on this machine — brew has been compiling from source. Use `uv` for Python or direct downloads. Same for Node (already installed via tarball at `~/.local/node`).
- **Do not** add a database migration without a backup of `backend/data/provenance.db`. The artist + receipt history lives there; losing it loses the demo's continuity.

---

## 11. Handoff protocol

When a session ends in a non-trivial state (in-progress feature, pending
review, blocked on user input), write a handoff into
`docs/HANDOFF.md`. The next session — human or AI — reads it before
doing anything else.

### What goes in a handoff

1. **Date + session tag** at the top
2. **What just happened** — 3–5 bullets of the last session's outcome
3. **In-progress work** — file paths, what's half-done, what's the next concrete step
4. **Blocked-on-user** — questions, decisions awaited
5. **Branch state** — which branch is checked out, which PRs are open, what's on `main`
6. **Servers / processes** — what should be running, what was left in dev mode
7. **Known issues** — non-blocking but worth surfacing
8. **Next session opening move** — a one-line "first thing to do"

Keep handoff entries dated and append-only — don't overwrite history.
When `docs/HANDOFF.md` gets long, archive old entries into
`docs/handoffs/YYYY-MM-DD-tag.md` and keep only the most recent in the
main file.

### When to write a handoff

- End of a focused work session (≥ 1 hour of real progress)
- Before a expected long break (overnight, weekend, busy week ahead)
- After landing a PR that changes architecture or locked decisions
- When the conversation is approaching context-window pressure
- Whenever the user says "we're stopping for now"

### When NOT to write a handoff

- After trivial changes (one-line fixes, doc typos)
- Mid-session when you're about to keep working
- For exploratory / brainstorming chats that don't change repo state

---

## 12. Pitchfork context

- Pitchfork Innovation is the studio. Two friends + the user; the user
  is a new employee / applicant level role.
- Studio tagline: *"Turning alternative datasets into shipped projects.
  Our studio builds the tools that our intelligence layer identifies as
  missing market links."*
- Sibling projects:
  - **Annotagent** — AI-assisted annotation of research papers
  - **Zombieslayer** — adversarial robustness for datasets
- Provenance.fm is the encryption / IP-defense play, but the brand is
  agnostic enough to expand into voice cloning / images / code if the
  music wedge stays narrow. (Tracked as future-direction options in
  brainstorming notes; not committed.)

---

## 13. User context (Will)

- Entering undergrad at Columbia in the fall, intending CS / applied math.
- Hours/week: 12 baseline, up to 20 if free time allows.
- Piano performance background — domain expertise for the music wedge,
  underused asset for the team.
- Prior preprint: *Balancing Privacy and Efficiency: Music Information
  Retrieval via Additive Homomorphic Encryption* (arxiv:2508.07044) with
  Dongfang Zhao. provenance.fm extends that line.
- Goal: resume-grade short paper + shippable product, both completed
  before / during early Columbia. Not aiming at a top-tier theory venue.
- Comfortable with iteration; not allergic to honest scope. Push back
  when an idea is weak (he did this on Atomic Reblock and was right).

---

*Last updated: 2026-05-24. Update when L-decisions or pending Q's change.*
