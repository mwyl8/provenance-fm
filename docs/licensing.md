# Dataset licensing map

What you can use, where, for what. Status as of v1 build.

## The corpora

### FMA (Free Music Archive)

- **License**: Tracks under Creative Commons (varies per track — CC-BY,
  CC-BY-NC, CC-BY-NC-SA, CC-BY-NC-ND).
- **Usable for**:
  - Research evaluation ✓
  - Local fingerprinting for our adversarial test set ✓
  - Production "registered artist" stand-ins for the demo ✓ (with
    attribution)
- **Not usable for**: Anything that strips attribution. We have to keep
  the per-track license metadata when we display these in the demo.
- **Practical move**: pull FMA-small (8,000 tracks). Attach a per-track
  license field in storage. UI shows attribution when displaying.

### MagnaTagATune (MTAT)

- **License**: "Research use" only — annotations CC-BY-NC-SA, audio
  derived from Magnatune. Magnatune's commercial license terms apply
  for non-research use.
- **Usable for**:
  - Research evaluation ✓
  - Reporting numbers in the paper ✓
- **Not usable for**:
  - Production demo where the audio is heard or implied to be ours
  - Anything that monetizes
- **Practical move**: use only for the paper's evaluation. Don't ship
  in the public demo corpus. If you've already pulled MTAT, gate it
  behind a `DEV_ONLY` flag.

### Million Song Dataset (MSD)

- **License**: MSD metadata + features are openly available. The raw
  audio is **not** distributed — only 30-second previews, and even
  those have embargo terms.
- **Usable for**:
  - Metadata-level analyses ✓
  - 30-second-preview-based fingerprinting evaluation ✓ (with care)
- **Not usable for**: Anything implying we hold the full audio.
- **Practical move**: probably skip for v1. Comes back into play if we
  ever want a metadata-rich label-side corpus.

### Suno / Udio public outputs

- **License**: User-uploaded tracks are licensed to the platform; some
  are made public. Their Terms of Service prohibit scraping in a
  blanket way.
- **Reality check**: web scraping of public outputs is a contested area.
  Generally legally permissible for personal research; large-scale
  commercial use is riskier.
- **Practical move for v1**:
  - Pull modest volumes (≤ 1,000 tracks total for the v1 demo).
  - Store fingerprints, not audio. Discard raw audio after fingerprinting.
  - Label clearly in our corpus that these are derived from public Suno/Udio outputs.
  - If we get a C&D or platform pushback, we have a clean fallback:
    pivot the v1 corpus to FMA-only and reframe as a controlled benchmark.

### MAESTRO (piano!)

- **License**: CC-BY-NC-SA.
- **Usable for**:
  - Research evaluation ✓
  - The "piano expertise" angle for the paper: use MAESTRO performances
    as registered-artist stand-ins, generate AI piano covers via Suno's
    public output, run the eval.
- **Not usable for**: Commercial demo.
- **Practical move**: this is the canonical piano-music research dataset.
  Use it for the piano-specific evaluation section in the paper.

## Recommendation for v1

The corpus, by source:

| Source | Use |
|---|---|
| FMA-small | Public demo corpus + "registered artist" stand-ins |
| MAESTRO | Paper evaluation only (piano) |
| MagnaTagATune | Paper evaluation only |
| MSD | Skip |
| Suno/Udio scrape | ≤ 1,000 tracks for v1 demo |

Storage rule: keep license metadata as a column on `corpus_items`. The
UI surfaces attribution when displaying. The demo never claims license-
restricted audio as our own.

## What goes in the LICENSE file at repo root

For provenance.fm code itself: probably Apache 2.0 or MIT — keep it
permissive so the protocol can be adopted broadly. Audio assets are
explicitly excluded from the code license; they retain their own terms.

## Open question

If/when we move into the "labels & funds" SaaS tier, customer-supplied
catalogs will be the audit subject. That changes the licensing story
entirely: we operate under the customer's license to their audio, with
contractual protections. v1 doesn't need to solve this yet — but the
sales pitch on the Labels and Funds pages already implies it.
