# Pitches

Two pitches as requested. Use these as the spine of the landing page,
investor decks, label sales emails, and fund outreach.

---

## Pitch 1 — to artists, labels, and rights organizations

> *"Was your music used to train AI? We can tell you — with cryptographic evidence."*

**The problem.** AI music generators released tens of millions of tracks
in the past year. They were trained on something. Spotify is paying
royalties to AI tracks slipping into its catalog under fake artist
names — some of those tracks sound a lot like specific real artists.
There are multiple major lawsuits in flight, but artists currently have
no way to even prove their work was involved.

**The wall.** AI companies won't disclose their training data. Existing
"AI music detection" is a single-classifier acoustic system that
produces confident false positives. There's no neutral protocol that
gives an artist verifiable evidence.

**What we do.** provenance.fm continuously watchdogs the public outputs
of Suno, Udio, and other AI music platforms. We fingerprint everything
they generate, and match it against the catalogs of artists who register
with us. Matches come with three independent confidence signals and a
cryptographically signed receipt that holds up as forensic evidence —
the kind of thing a takedown notice or a class-action lawyer can use.

**What makes it credible.**

1. **Ensemble matching.** Three independent fingerprints (landmark hash,
   chromagram, neural embedding). Two must agree before we declare a
   match. False positives in any single feature are common; agreement
   across three is rare.
2. **Honest scope.** We detect direct regurgitation and close
   derivatives. We do not claim to detect "style learning" — no current
   technology can without watermarking, and we won't pretend otherwise.
3. **Signed audit receipts.** Every match produces an Ed25519-signed
   transcript pinned to a Merkle-rooted corpus snapshot. Anyone can
   verify the signature offline, including a judge.
4. **Audio never leaves your device.** Fingerprinting runs in your
   browser via the Web Audio API. We never see your audio — only the
   resulting hashes. Open-source code; you can verify the claim.

**Who benefits.**

- **Individual artists** — register your catalog free during beta, get
  alerts when AI platforms output something close to your work.
- **Labels and publishers** — catalog-wide audits, prioritized reports,
  evidence packs for legal.
- **Rights organizations (ASCAP, BMI, PRS, etc.)** — neutral attribution
  infrastructure for the era of AI-generated music.

**The ask (to artists, free).** Register your catalog. We start watchdogging it tonight.

**The ask (to labels and rights orgs).** A pilot on a sample of your catalog. We run the audit, you decide whether the evidence we surface is worth scaling up.

---

## Pitch 2 — to music funds and rights acquirers (Pitchfork's investor-DD angle)

> *"Pre-acquisition due diligence on encrypted music catalogs. Find the AI-generated tracks and derivative-work risk before the deal closes."*

**The problem.** Music-rights funds — Hipgnosis-style buyers, royalty
ETFs, family offices — are increasingly bidding on catalogs they
can't fully audit. AI-generated tracks are infiltrating publishing
deals, sometimes deliberately disguised under fake artist names.
Once you own them, you inherit their royalty-clawback risk and their
litigation exposure.

**The wall.** Catalogs come in encrypted or NDA-bound. There's no
clean way to ask "how much of this is AI" or "how much of this is
derivative of flagged AI training data" without either revealing your
bid strategy or trusting the seller's representations.

**What we do.** provenance.fm provides a pre-acquisition catalog audit.
The seller's catalog fingerprints (encrypted under their key) come to
us. We score them against our AI-output corpus and our database of
registered originals. You get a report:

- **% likely AI-generated** — tracks whose ensemble fingerprint matches
  Suno / Udio outputs at high confidence.
- **% derivative risk** — tracks that match registered original artists
  at medium-or-better confidence.
- **Royalty-clawback exposure** — projected loss if a DSP flags these
  tracks post-acquisition.
- **Cross-fund overlap** (optional) — under privacy, whether this
  catalog overlaps with one you (or a co-investor) already hold.

Every finding comes with a signed transcript. Re-auditable from the
corpus Merkle root.

**Why we exist where Pitchfork's intelligence layer pointed.**
The studio identified two structural gaps in alternative-data DD:
*Annotagent* fixes research-paper data extraction; *Zombieslayer*
defends datasets against adversarial inputs. **provenance.fm** is the
encryption-layer play — schema-free audit infrastructure for the
catalogs that are increasingly the unit of music-IP investment.

**Why we make a credible forensic claim.** Same as the artist side:
ensemble matching, honest scope, signed receipts, open-source
fingerprinting code. Plus a privacy story tailored to fund operations:
nothing leaks across deals, every report is encrypted under your key,
corpus-snapshot Merkle roots make re-audit trivial.

**Who buys it.**

- Music-rights funds at pre-LOI stage on $5M+ catalog deals.
- Family offices doing their first encrypted-catalog acquisition.
- Royalty ETFs and securitization vehicles for batch quality audits.
- Music-publishing M&A advisors as a value-add for their clients.

**Pricing posture (beta).** Per-engagement during beta. Scales with
catalog size and turnaround. Pilot pricing for indie music funds and
family offices doing their first deal in this space.

**The ask.** A pilot on an upcoming deal in your pipeline. We can audit
a sample catalog in 72 hours and show you the kind of evidence pack
you'd get on a real engagement.

---

## Notes on tone

- Both pitches lead with the *audience's problem*, not our tech.
- The artist pitch leans emotional ("your music"); the fund pitch leans
  on risk and quantifiable exposure.
- Both end with a concrete ask.
- Neither claims style-learning detection. That honesty IS the brand.
- "Forensic, not legal" — repeat this often. It both insulates us from
  overclaim risk and signals technical credibility.
