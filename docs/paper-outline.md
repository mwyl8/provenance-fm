# Short paper — outline

A 6–8 page system-and-protocol paper accompanying the v1 launch. The
goal is *resume-building*: arxiv preprint + workshop submission, not a
top-tier venue. The contribution is the system, the ensemble matching,
and the audit-receipt protocol; cooperative-mode crypto is future work.

## Working title

> **Provenance.fm: Forensic Audits for Music in AI Training Data via Ensemble Fingerprinting and Signed Audit Receipts**

Alt:
- *"Watching the Watchers: A Detection System for AI-Generated Music That Derives From Original Works"*
- *"Ensemble Audio Fingerprinting for AI-Music Provenance"*

## Section sketch

### 1. Introduction (~3/4 page)

- Setup: AI music generators (Suno, Udio) released ~10M+ tracks in the
  past year. Spotify is unknowingly paying royalties to AI tracks.
  Lawsuits (UMG v. Suno, etc.) are in flight.
- Two unanswered questions: *Was my song trained on?* / *Is this AI
  track derivative of mine?*
- We focus on the **second**. The first requires cooperation from AI
  companies, which is the natural follow-up (and a paper of its own).
- Contributions:
  1. An open ensemble-fingerprinting system that uses three independent
     features (landmark, chroma, MERT) and requires ≥2 to agree.
  2. A privacy-preserving artist registration flow where audio is
     fingerprinted client-side and never uploaded.
  3. A signed-audit-receipt protocol that produces forensic evidence
     usable in royalty / takedown / litigation contexts.
  4. An evaluation on an adversarial test set including covers,
     pitch-shifts, tempo-shifts, and Suno-regenerated tracks.

### 2. Background (~1/2 page)

- AHE music IR (cite our own preprint [Wang & Zhao, 2025])
- Audio fingerprinting: Wang 2003 (Shazam landmark hash), AcoustID,
  modern neural embeddings (CLAP, MERT)
- AI training-data provenance work: C2PA, AI content credentials,
  Hashbash. None of these address the *derivative-output* case directly.

### 3. System (~1.5 pages)

- Architecture overview (figure: artist browser → fingerprint →
  encrypted upload → server matching against watchdog corpus → receipt).
- Three fingerprints in detail; rationale for each.
- Ensemble rule. Why median + agreement floor instead of weighted sum.
- Receipt structure: Ed25519 signature + Merkle-rooted corpus snapshot.

### 4. Privacy & threat analysis (~1 page)

- What the server learns from an artist (fingerprints, not audio).
- What an artist learns from an audit (yes/no/score against each corpus item).
- What does the corpus root commit to, and what's leaked from re-audits.
- Adversarial scenarios: server collusion with AI company, server lying about corpus state.

### 5. Evaluation (~1.5 pages)

- Adversarial test set construction: 30 originals × {original, cover,
  pitch-shift ±2 semitones, tempo-shift ±10%, Suno regeneration}.
- Single-feature precision / recall (baseline) vs ensemble.
- Confidence-tier calibration.
- Timing (per-track fingerprint, per-audit cost).
- Watchdog finding: report on N tracks scraped from Suno/Udio, show
  the matches discovered against a small registered artist set.

### 6. Cooperative-mode protocol (future work, ~1/2 page)

> If an AI company is willing to commit cryptographically to their
> training set, artists can run private-set-intersection (PSI) against
> the commitment without revealing their catalog. Outline:
>
> - AI company publishes a Merkle commitment over `H(fingerprint)` for
>   every training track.
> - Artist computes their fingerprints client-side (already implemented).
> - Artist + service run a PSI protocol (OPRF-based or HE-based) over
>   the encrypted artist fingerprints and the committed AI fingerprints.
> - Output: set of intersecting tracks. Neither side sees the other's
>   set.
>
> Open problems: fuzzy-PSI (training-track fingerprints don't have to
> *exactly* match query fingerprints — covers, remixes, etc.); leakage
> analysis on repeated audits; binding the commitment to actual model
> weights (otherwise the AI company can lie about what they committed).
>
> This is the natural sequel paper — a stronger cryptographic
> contribution, suitable for PoPETs.

### 7. Limitations & honesty (~1/2 page)

- We detect direct regurgitation and close derivatives. We do **not**
  detect "style learning" (a model that learned an artist's style
  without copying any specific work). No current technology can do
  this without watermarking or training-set cooperation.
- Watchdog mode catches only what's publicly posted. Closed-source AI
  outputs are invisible.
- Receipt evidence is forensic, not legal — the system reports audio
  similarity, not infringement.
- Fingerprint robustness has known failure cases (heavily processed
  audio, very short clips).

### 8. Conclusion + future work

- v2 client-side MERT; v3 cooperative-mode protocol; v4 watermark
  detection if/when watermarks become standard.

## Target venues, ranked

1. **ISMIR Late-Breaking Demos** — perfect fit. Music + system + demo. Low submission bar. Music-community visibility.
2. **PoPETs (Privacy Enhancing Technologies)** — fits if we lean into the privacy/receipt angle. Quarterly deadlines.
3. **NeurIPS Workshops** — the audio / responsible-AI ones. Year-end.
4. **ICML Workshops** — same shape.
5. **arXiv** — definitely. Cross-list cs.CR, cs.SD, cs.AI.

## Timeline (matches the 8-week build plan)

| Week | Paper milestone |
|---|---|
| 3 | Section headings, 2-sentence stubs per section |
| 4 | Background section drafted; figure of system architecture |
| 5 | Section 3 (System) drafted |
| 6 | Section 4 (Privacy) + Section 5 (Eval) drafted; experiments mostly run |
| 7 | Full draft; co-author review |
| 8 | arXiv upload; submit to LBD |
