import { useState } from "react";
import { api } from "../api";
import AudioDropzone from "../components/AudioDropzone";
import ConfidenceBadge from "../components/ConfidenceBadge";

export default function Investigate() {
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState(null);
  const [err, setErr] = useState(null);

  async function handle(file) {
    setBusy(true);
    setErr(null);
    setResults(null);
    try {
      const r = await api.investigate(file);
      setResults(r);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-serif text-3xl font-medium text-ink-900">
        Investigate an AI music track
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-600">
        Upload an AI-generated audio file. We'll fingerprint it server-side
        (all three families: landmark, chromagram, MERT embedding) and return
        ranked similarity to registered original artists. Used by labels and
        funds running catalog due diligence.
      </p>

      <div className="mt-6 rounded-lg border border-ink-100 bg-white p-5 shadow-card">
        <AudioDropzone onFile={handle} disabled={busy} label="Drop the AI track" />
        {busy && <div className="mt-3 rounded-md bg-ink-50 px-3 py-2 text-xs text-ink-600">Fingerprinting + matching… this may take 5–15 seconds.</div>}
        {err && <div className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{err}</div>}
      </div>

      {results && (
        <div className="mt-6 rounded-lg border border-ink-100 bg-white p-5 shadow-card">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-ink-900">
              {results.matches.length} match{results.matches.length === 1 ? "" : "es"} above LOW
            </h2>
            <span className="text-xs text-ink-400">across all registered artists</span>
          </div>
          {results.matches.length === 0 ? (
            <div className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Clean. This track does not match any registered original above the low-confidence threshold.
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-ink-100 text-sm">
              {results.matches.map((m, i) => (
                <li key={i} className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium text-ink-900">{m.title}</div>
                    <div className="text-xs text-ink-400 mono-hash">artist {m.artist_id}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-600">
                    <span>L {m.score.landmark}</span>
                    <span>C {m.score.chroma}</span>
                    <span>M {m.score.mert ?? "—"}</span>
                    <ConfidenceBadge tier={m.score.tier} score={m.score.median} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
