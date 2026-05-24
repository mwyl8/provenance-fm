import { Link } from "react-router-dom";

function Stat({ value, label }) {
  return (
    <div className="rounded-lg border border-ink-100 bg-white p-4 shadow-card">
      <div className="text-2xl font-semibold text-ink-900">{value}</div>
      <div className="mt-1 text-xs text-ink-600">{label}</div>
    </div>
  );
}

export default function Labels() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-10">
      <header>
        <div className="text-xs uppercase tracking-wide text-ink-400">For labels & publishers</div>
        <h1 className="mt-1 font-serif text-4xl font-medium text-ink-900">
          Bulk audits over your entire catalog. Evidence packs your legal team can use.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-600">
          You hold tens of thousands of tracks. AI music generators are flooding
          streaming services. Spotify already pays royalties to AI tracks under
          false artist names — some of which sound a lot like your catalog.
          We fingerprint your catalog client-side, watchdog every public AI
          platform, and ship you a prioritized report.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value="3" label="ensemble fingerprints" />
        <Stat value="0 bytes" label="of your audio uploaded" />
        <Stat value="Daily" label="watchdog cadence" />
        <Stat value="Ed25519" label="signed evidence" />
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink-900">Onboarding</h2>
          <ol className="mt-3 space-y-2 text-sm text-ink-600">
            <li>1. We ship a small CLI tool that fingerprints your catalog on your servers.</li>
            <li>2. Fingerprints (not audio) come to us encrypted under your key.</li>
            <li>3. We register them against our watchdog corpus.</li>
            <li>4. You get a weekly report. Critical matches escalate same-day.</li>
          </ol>
        </div>
        <div className="rounded-lg border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink-900">Evidence pack</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-600">
            <li>• Signed audit transcript per match</li>
            <li>• Side-by-side audio + fingerprint visualizations</li>
            <li>• Public-key signature your counsel or a court can verify</li>
            <li>• Corpus snapshot root (Merkle) — auditable & replayable</li>
            <li>• Confidence tiers calibrated against an adversarial test set</li>
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-ink-100 bg-white p-6 shadow-card">
        <h2 className="text-sm font-semibold text-ink-900">What's actually different about this</h2>
        <p className="mt-3 text-sm leading-7 text-ink-600">
          Most "AI music detection" tools today are single-classifier acoustic
          systems trained on a closed test set. They fail badly on adversarial
          inputs and produce confident false positives. Our system uses three
          independent fingerprints and requires at least two to agree — driving
          false-positive rate down at the cost of some sensitivity. The number
          we report is not a guess; it's the median agreement of three independent
          measures, and the receipt holds up as forensic evidence.
        </p>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <Link to="/artist" className="rounded-md bg-ink-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black">
          Start with one artist →
        </Link>
        <a
          href="mailto:hello@provenance.fm"
          className="rounded-md border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 hover:bg-ink-100"
        >
          Talk to us about a catalog pilot
        </a>
      </section>
    </div>
  );
}
