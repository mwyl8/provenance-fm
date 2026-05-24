import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import ConfidenceBadge from "../components/ConfidenceBadge";

export default function Receipt() {
  const { id } = useParams();
  const [r, setR] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.getReceipt(id).then(setR).catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <div className="mx-auto max-w-3xl px-6 py-12 text-sm text-rose-700">{err}</div>;
  if (!r) return <div className="mx-auto max-w-3xl px-6 py-12 text-sm text-ink-400">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="text-xs uppercase tracking-wide text-ink-400">Signed audit receipt</div>
      <h1 className="mt-1 font-serif text-3xl font-medium text-ink-900">
        Audit {r.id.slice(0, 8)}…
      </h1>
      <div className="mt-3 text-xs text-ink-600">
        Issued <span className="font-mono">{new Date(r.ts * 1000).toLocaleString()}</span> ·
        requester <span className="font-mono">{r.requester}</span>
      </div>

      <section className="mt-6 grid grid-cols-1 gap-3 rounded-lg border border-ink-100 bg-white p-5 shadow-card md:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-ink-400">Corpus root</div>
          <div className="mono-hash mt-1">{r.corpus_root}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-ink-400">Public key</div>
          <div className="mono-hash mt-1">{r.public_key}</div>
        </div>
        <div className="md:col-span-2">
          <div className="text-xs uppercase tracking-wide text-ink-400">Signature</div>
          <div className="mono-hash mt-1">{r.signature}</div>
        </div>
      </section>

      <section className="mt-4">
        <div className="text-xs uppercase tracking-wide text-ink-400">Matches</div>
        {r.matches.length === 0 ? (
          <div className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            No matches above threshold.
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-ink-100 text-sm">
            {r.matches.map((m, i) => (
              <li key={i} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-ink-900">{m.artist_track_title}</div>
                  <div className="text-xs text-ink-400">vs {m.corpus_title}</div>
                </div>
                <ConfidenceBadge tier={m.score.tier} score={m.score.median} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-ink-100 bg-ink-50 px-5 py-4 text-xs text-ink-600">
        This receipt is an Ed25519 signature over a canonical JSON encoding of
        the audit transcript. Anyone with the public key (above) can verify
        the signature without involving provenance.fm. The corpus root pins
        this audit to a specific snapshot of the AI-output corpus, so the
        result is reproducible later.
      </section>
    </div>
  );
}
