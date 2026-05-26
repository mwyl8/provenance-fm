# HANDOFF.md — most-recent session state

Append-only. New entries on top. Archive old entries into
`docs/handoffs/YYYY-MM-DD-tag.md` when this file gets long.

See [CLAUDE.md §11](../CLAUDE.md) for the handoff protocol.

---

## 2026-05-24 · v1 merged · action-layer brief locked

### What just happened
- PR #1 (v1 foundation) merged to `main` via squash. Branch `v1-foundation` deleted locally and remotely.
- End-to-end test plan passed on the user's M4 Pro:
  - Privacy claim verified in DevTools (track upload was JSON hashes only, no audio bytes)
  - Corpus ingested from macOS system sounds (`/System/Library/Sounds/*.aiff`)
  - Audit ran cleanly, produced a signed receipt
  - Receipt verified offline; tampered version correctly failed verification
  - HIGH-tier match observed (1.00 median) on a self-match test
- Two patch commits landed during testing:
  - Makefile: accept `PYTHON=` override + `make doctor` (user was on 3.14)
  - `pipeline.js`: await `landmarkHashFromMagnitudes` (was returning a Promise)
  - `ingest_corpus.py`: accept `.aiff`/`.aif`/`.opus` extensions
- v1.1 action-layer scope locked with the user:
  - Platforms: Spotify + Suno only
  - Audience: solo artist self-serve
  - Loop: money recovery (royalty estimator + takedown automation)
  - Scope: individual actions, no class coordination
- This session's commit: `CLAUDE.md` + `docs/HANDOFF.md` on `docs/claude-md` branch

### In-progress work
- **v1.1 action-layer PR not yet started.** Scope written into the previous chat (not yet a doc); paste into a brief if reopening cold.
- 5 pending questions to user answered: Spotify/Suno, solo artist, money, individual. Two remain open (separate-key signing default, royalty range display).

### Blocked on user
- Q1–Q4 in [CLAUDE.md §8](../CLAUDE.md#8-pending-decisions-open-until-user-answers) — defaults are in the file but user should confirm before action-layer PR ships.
- User to ask Dongfang Zhao about light advisor + co-author role on the short paper (in ~3 weeks, in person).

### Branch state
- `main` — has PR #1's squashed commit (`00dd1a2`)
- `docs/claude-md` — this branch; carries `CLAUDE.md` + this file; not yet pushed at time of writing
- No other open PRs

### Servers / processes
- User has terminated `uvicorn` and `vite` per "can i terminate running processes" earlier in chat.
- To resume work: `make backend` (T1), `make frontend` (T2), scratch terminal as T3.
- SQLite at `backend/data/provenance.db` persists artist registrations + corpus + receipts from the v1 test run.

### Known issues (non-blocking)
- **Landmark peak clustering** — all `anchor_times` came out as `[7, 7, 7, ...]` on one observed upload. Suggests the JS peak-picker is greedy and clusters in one time frame. v1.1 ticket: fix peak distribution. Not merge-blocking; chroma carries the matching signal.
- **`brew install cmake/python` is broken on this machine** — bottles unavailable, brew tries to compile from source (>20 min). Workarounds: `uv` for Python, direct tarball for Node (already done). Documented in CLAUDE.md §10.

### Next session opening move
> Confirm Q1–Q4 with the user. Then start `v1.1-action-layer` branch: scaffold `backend/provenance/actions/` (Spotify + Suno modules, royalty estimator, action-receipts with separate signing key). The brief is the back-half of the previous chat — search "What goes in the PR" for the file-by-file table.

---

*Future entries above this line.*
