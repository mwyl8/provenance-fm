import { Link } from "react-router-dom";

export default function Funds() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-10">
      <header>
        <div className="text-xs uppercase tracking-wide text-ink-400">For music funds & rights acquirers</div>
        <h1 className="mt-1 font-serif text-4xl font-medium text-ink-900">
          Pre-acquisition due diligence on encrypted catalogs.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-600">
          Music-rights funds — Hipgnosis-style buyers, family offices, royalty
          ETFs — are increasingly bidding on encrypted catalogs they can't
          fully audit. We tell you, before the deal closes: how much of this
          catalog is likely AI-generated, what fraction overlaps with flagged
          AI training data, and which tracks carry undisclosed derivative-work
          risk.
        </p>
      </header>

      <section className="rounded-lg border border-ink-100 bg-white p-6 shadow-card">
        <h2 className="text-sm font-semibold text-ink-900">The DD questions we answer</h2>
        <ul className="mt-3 space-y-3 text-sm leading-7 text-ink-600">
          <li>
            <strong className="text-ink-900">Is this catalog full of AI-generated tracks?</strong>{" "}
            Catalogs sold by anonymous publishers increasingly include AI tracks
            mass-uploaded under fake artist names. Royalty risk: those streams
            get clawed back if a DSP later flags them.
          </li>
          <li>
            <strong className="text-ink-900">
              Is anything in this catalog derivative of a flagged AI output?
            </strong>{" "}
            If a track in your acquisition target is provably close to a Suno or
            Udio output, you inherit the litigation risk.
          </li>
          <li>
            <strong className="text-ink-900">
              Does this catalog overlap with one you (or a co-investor) already own?
            </strong>{" "}
            Catalog M&A often involves multiple potential acquirers. Cross-fund
            overlap analysis under privacy lets you check without revealing your
            bid strategy.
          </li>
        </ul>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink-900">How a DD engagement runs</h2>
          <ol className="mt-3 space-y-2 text-sm text-ink-600">
            <li>1. Seller's data room shares encrypted catalog fingerprints.</li>
            <li>2. We score them against our AI-output corpus and registered originals.</li>
            <li>3. You get a private report: AI-generated %, derivative risk %, top-risk tracks.</li>
            <li>4. Signed evidence transcripts for anything you escalate.</li>
            <li>5. Repeat at close — corpus snapshot pinned by Merkle root.</li>
          </ol>
        </div>
        <div className="rounded-lg border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink-900">Why this stays private</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-600">
            <li>• Fingerprints arrive client-side encrypted; we never see the audio.</li>
            <li>• Reports are encrypted under your key.</li>
            <li>• No cross-deal information leakage between funds.</li>
            <li>• Snapshot Merkle roots mean a future re-audit is reproducible.</li>
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-ink-100 bg-white p-6 shadow-card">
        <h2 className="text-sm font-semibold text-ink-900">Pricing posture (beta)</h2>
        <p className="mt-3 text-sm text-ink-600">
          Per-catalog engagements during beta. Pricing scales with catalog size
          and turnaround time. Pilots welcome — particularly indie music funds
          and family offices doing their first encrypted-catalog deal.
        </p>
        <a
          href="mailto:hello@provenance.fm"
          className="mt-4 inline-block rounded-md bg-ink-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black"
        >
          Talk to us about a DD pilot →
        </a>
      </section>

      <section className="text-xs text-ink-400">
        Built by Pitchfork Innovation — the studio that previously shipped{" "}
        <a className="underline" href="#">Annotagent</a> (AI annotation of research papers) and{" "}
        <a className="underline" href="#">Zombieslayer</a> (adversarial robustness for datasets).{" "}
        <Link to="/" className="underline">About provenance.fm</Link>.
      </section>
    </div>
  );
}
