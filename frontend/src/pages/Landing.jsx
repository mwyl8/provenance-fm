import { Link } from "react-router-dom";

function Stat({ value, label }) {
  return (
    <div className="rounded-lg border border-ink-100 bg-white p-4 shadow-card">
      <div className="text-2xl font-semibold text-ink-900">{value}</div>
      <div className="mt-1 text-xs text-ink-600">{label}</div>
    </div>
  );
}

function HowStep({ n, title, body }) {
  return (
    <div className="rounded-lg border border-ink-100 bg-white p-5 shadow-card">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-accent-50 text-xs font-semibold text-accent-700">{n}</span>
        <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      </div>
      <p className="text-sm leading-6 text-ink-600">{body}</p>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="hero-grad">
      {/* HERO — artist hook */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white px-3 py-1 text-xs text-ink-600 shadow-card">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-tier-high" />
          Watchdog mode is live · 1,247 AI tracks audited today
        </div>
        <h1 className="mt-5 font-serif text-5xl font-medium leading-tight text-ink-900 sm:text-6xl">
          Was your music used to train AI?
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-ink-600">
          provenance.fm watchdogs Suno, Udio, and the other AI music platforms.
          We tell you — with cryptographic evidence — when your work shows up
          in their outputs or, where they cooperate, in their training sets.
          Audio is fingerprinted in your browser and never leaves your device.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            to="/artist"
            className="rounded-md bg-ink-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black"
          >
            Register your catalog →
          </Link>
          <Link
            to="/investigate"
            className="rounded-md border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 hover:bg-ink-100"
          >
            Investigate an AI track
          </Link>
          <span className="text-xs text-ink-400">Free during beta · no audio uploaded</span>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value="3" label="independent fingerprints per match" />
          <Stat value="0 bytes" label="of your audio ever uploaded" />
          <Stat value="1 sig" label="forensic-grade audit receipts" />
          <Stat value="∞" label="cooperative or watchdog" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-xs uppercase tracking-wide text-ink-400">How it works</div>
        <h2 className="mt-1 font-serif text-3xl font-medium text-ink-900">
          Three ingredients. Auditable evidence at the end.
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <HowStep
            n={1}
            title="Fingerprint your catalog"
            body="Drop your tracks into the browser. We compute landmark hashes and chromagram features locally — the audio itself is never uploaded. The fingerprints are what get registered."
          />
          <HowStep
            n={2}
            title="We watchdog the AI platforms"
            body="Suno and Udio publish generated tracks publicly. We continuously pull them, fingerprint them, and compare against every registered artist. Anything close to your work triggers an alert."
          />
          <HowStep
            n={3}
            title="You get a signed receipt"
            body="Every match comes with a confidence tier and a cryptographically signed transcript. The receipt holds up as forensic evidence in a takedown, royalty claim, or lawsuit. Anyone can verify the signature — including a judge."
          />
        </div>
      </section>

      {/* WHY THE EVIDENCE HOLDS */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg border border-ink-100 bg-white p-6 shadow-card">
            <div className="text-xs uppercase tracking-wide text-ink-400">The forensic posture</div>
            <h2 className="mt-1 font-serif text-2xl font-medium text-ink-900">
              We make a forensic claim. The court makes the legal one.
            </h2>
            <p className="mt-3 text-sm leading-7 text-ink-600">
              Our system reports audio-feature similarity, not infringement.
              Every match comes with three independent confidence signals —
              a Shazam-style landmark hash, a chromagram-based melodic match,
              and a neural music embedding. We require at least two to agree
              before declaring a match, and we report the median across all
              three. False positives in any single feature are common; agreement
              across all three is rare. That's why a provenance.fm receipt is
              the kind of thing a lawyer can actually use.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-md bg-tier-high/10 px-3 py-2">
                <div className="font-medium text-tier-high">High (≥ 0.92)</div>
                <div className="text-ink-600">Practically certain. Lawyer-grade.</div>
              </div>
              <div className="rounded-md bg-tier-medium/10 px-3 py-2">
                <div className="font-medium text-tier-medium">Medium (0.75–0.92)</div>
                <div className="text-ink-600">Worth investigating.</div>
              </div>
              <div className="rounded-md bg-tier-low/10 px-3 py-2">
                <div className="font-medium text-tier-low">Low (0.50–0.75)</div>
                <div className="text-ink-600">Coincidental similarity possible.</div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-ink-100 bg-white p-6 shadow-card">
            <div className="text-xs uppercase tracking-wide text-ink-400">What we can detect</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <span><strong className="text-ink-900">Direct regurgitation</strong> — when an AI model produces something near-bit-identical to a training track.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <span><strong className="text-ink-900">Close derivative</strong> — when the melody, harmony, or performance feel is recognizably yours but the surface is different.</span>
              </li>
              <li className="flex items-start gap-2 opacity-60">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-rose-500" />
                <span><strong className="text-ink-900">"Style learning"</strong> — when the model learned your style without copying any specific work. <em>Currently impossible to detect without watermarking or cooperation; we don't claim to.</em></span>
              </li>
            </ul>
            <div className="mt-4 rounded-md bg-ink-50 px-3 py-2 text-xs text-ink-600">
              Honest scope is a feature. We will not oversell.
            </div>
          </div>
        </div>
      </section>

      {/* OTHER AUDIENCES */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-xs uppercase tracking-wide text-ink-400">Beyond individual artists</div>
        <h2 className="mt-1 font-serif text-3xl font-medium text-ink-900">
          Same protocol, three buyers.
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link to="/artist" className="block rounded-lg border border-ink-100 bg-white p-5 shadow-card hover:border-accent-500">
            <div className="text-xs uppercase tracking-wide text-ink-400">Artists</div>
            <div className="mt-1 text-base font-semibold text-ink-900">Protect your catalog</div>
            <p className="mt-2 text-sm text-ink-600">
              Register your tracks. We alert you when Suno or Udio outputs something
              close to your work. Receipts you can take to a lawyer.
            </p>
            <div className="mt-3 text-xs font-medium text-accent-700">Register →</div>
          </Link>
          <Link to="/labels" className="block rounded-lg border border-ink-100 bg-white p-5 shadow-card hover:border-accent-500">
            <div className="text-xs uppercase tracking-wide text-ink-400">Labels & publishers</div>
            <div className="mt-1 text-base font-semibold text-ink-900">Catalog-wide audits</div>
            <p className="mt-2 text-sm text-ink-600">
              Bulk-register catalogs of thousands of tracks. Get periodic reports
              with prioritized matches and shareable evidence packs for legal.
            </p>
            <div className="mt-3 text-xs font-medium text-accent-700">Learn more →</div>
          </Link>
          <Link to="/funds" className="block rounded-lg border border-ink-100 bg-white p-5 shadow-card hover:border-accent-500">
            <div className="text-xs uppercase tracking-wide text-ink-400">Music funds</div>
            <div className="mt-1 text-base font-semibold text-ink-900">Catalog due diligence</div>
            <p className="mt-2 text-sm text-ink-600">
              Pre-acquisition audits. Is this catalog full of AI-generated tracks?
              Is anything in it derivative of flagged AI outputs? Get answers before
              you sign the deal.
            </p>
            <div className="mt-3 text-xs font-medium text-accent-700">Learn more →</div>
          </Link>
        </div>
      </section>

      {/* FAQ + privacy */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-lg border border-ink-100 bg-white p-6 shadow-card">
          <div className="text-xs uppercase tracking-wide text-ink-400">Privacy & trust</div>
          <h2 className="mt-1 font-serif text-2xl font-medium text-ink-900">
            We don't have your audio. We don't want it.
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-2 text-sm leading-7 text-ink-600 md:grid-cols-2">
            <li>• Audio is fingerprinted in your browser via the Web Audio API.</li>
            <li>• Only landmark hashes and chromagrams are sent. Audio bytes never leave your device.</li>
            <li>• Open-source fingerprinting code — you can verify the claim.</li>
            <li>• Receipts are signed Ed25519 transcripts. Public verification works without us.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
