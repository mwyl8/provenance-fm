import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import AudioDropzone from "../components/AudioDropzone";
import ConfidenceBadge from "../components/ConfidenceBadge";
import { fingerprintAudioFile } from "../fingerprint/pipeline";

function RegisterCard({ onCreate }) {
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function go(e) {
    e.preventDefault();
    if (!handle.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const a = await api.registerArtist(handle.trim(), email.trim() || null);
      onCreate(a);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={go} className="space-y-3 rounded-lg border border-ink-100 bg-white p-6 shadow-card">
      <div>
        <label className="text-xs uppercase tracking-wide text-ink-400">Artist handle</label>
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="lena-keys"
          className="mt-1 w-full rounded-md border border-ink-200 px-3 py-2 text-sm"
          required
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-ink-400">Notify email (optional)</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@domain.com"
          type="email"
          className="mt-1 w-full rounded-md border border-ink-200 px-3 py-2 text-sm"
        />
      </div>
      {err && <div className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{err}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-ink-900 px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create artist record"}
      </button>
      <p className="text-xs text-ink-400">
        We don't ask for your real name or rights documentation up front. Add those before
        a takedown.
      </p>
    </form>
  );
}

function RegisterTrackPanel({ artistId, onUploaded }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [err, setErr] = useState(null);

  async function handleFile(file) {
    setBusy(true);
    setErr(null);
    setStatus(`Fingerprinting ${file.name} locally…`);
    try {
      const { landmark, chroma } = await fingerprintAudioFile(file);
      setStatus(`Uploading fingerprints (${landmark.hashes.length} landmarks)…`);
      const r = await api.uploadTrack(artistId, {
        title: file.name.replace(/\.[^.]+$/, ""),
        landmark,
        chroma,
      });
      setStatus(`Registered: ${r.title}`);
      onUploaded(r);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <AudioDropzone onFile={handleFile} disabled={busy} />
      {status && <div className="rounded-md bg-ink-50 px-3 py-2 text-xs text-ink-600">{status}</div>}
      {err && <div className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{err}</div>}
      <p className="text-xs text-ink-400">
        Your audio is decoded in this browser via Web Audio. Only the resulting
        fingerprints are transmitted.
      </p>
    </div>
  );
}

function AuditPanel({ artistId }) {
  const [running, setRunning] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [err, setErr] = useState(null);
  const nav = useNavigate();

  async function runIt() {
    setRunning(true);
    setErr(null);
    try {
      const r = await api.runAudit(artistId, "low", 25);
      setReceipt(r);
    } catch (e) {
      setErr(e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={runIt}
        disabled={running}
        className="rounded-md bg-ink-900 px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
      >
        {running ? "Running audit…" : "Run audit against AI corpus"}
      </button>
      {err && <div className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{err}</div>}
      {receipt && (
        <div className="rounded-lg border border-ink-100 bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-ink-900">Receipt</div>
            <button
              onClick={() => nav(`/receipt/${receipt.id}`)}
              className="text-xs text-accent-700 hover:underline"
            >
              View signed receipt →
            </button>
          </div>
          <div className="mt-2 text-xs text-ink-600">
            {receipt.matches.length} potential matches at ≥ low tier · corpus root{" "}
            <span className="mono-hash">{receipt.corpus_root.slice(0, 16)}…</span>
          </div>
          {receipt.matches.length > 0 ? (
            <div className="mt-3 space-y-1.5">
              {receipt.matches.slice(0, 10).map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border border-ink-100 bg-ink-50 px-2.5 py-1.5 text-xs"
                >
                  <div>
                    <span className="font-medium text-ink-900">{m.artist_track_title}</span>{" "}
                    <span className="text-ink-400">vs</span>{" "}
                    <span className="text-ink-600">{m.corpus_title}</span>
                  </div>
                  <ConfidenceBadge tier={m.score.tier} score={m.score.median} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Nothing in the current AI corpus crosses the low-confidence threshold against your catalog.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Artist() {
  const { id: urlId } = useParams();
  const [artist, setArtist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (urlId) {
      api.getArtist(urlId).then(setArtist).catch((e) => setErr(e.message));
      api.listTracks(urlId).then((r) => setTracks(r.tracks)).catch(() => {});
    }
  }, [urlId]);

  async function refreshTracks() {
    if (!artist) return;
    const r = await api.listTracks(artist.id);
    setTracks(r.tracks);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-serif text-3xl font-medium text-ink-900">
        {artist ? `Catalog: ${artist.handle}` : "Register your catalog"}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-600">
        Drop tracks in. We fingerprint them in the browser via Web Audio and
        send only the resulting hashes to the server. Audio bytes never leave
        your device.
      </p>

      {err && <div className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.4fr]">
        <div>
          {!artist ? (
            <RegisterCard
              onCreate={(a) => {
                setArtist({ ...a, track_count: 0 });
                window.history.replaceState(null, "", `/artist/${a.id}`);
              }}
            />
          ) : (
            <div className="rounded-lg border border-ink-100 bg-white p-5 shadow-card">
              <div className="text-xs uppercase tracking-wide text-ink-400">Artist record</div>
              <div className="mt-1 text-base font-semibold text-ink-900">{artist.handle}</div>
              <div className="mt-1 text-xs text-ink-400 mono-hash">id {artist.id}</div>
              <div className="mt-3 text-xs text-ink-600">
                {tracks.length} track{tracks.length === 1 ? "" : "s"} registered.
              </div>
            </div>
          )}
        </div>
        <div className="space-y-5">
          {artist && (
            <>
              <div className="rounded-lg border border-ink-100 bg-white p-5 shadow-card">
                <div className="text-xs uppercase tracking-wide text-ink-400">Add a track</div>
                <div className="mt-3">
                  <RegisterTrackPanel artistId={artist.id} onUploaded={refreshTracks} />
                </div>
              </div>
              {tracks.length > 0 && (
                <div className="rounded-lg border border-ink-100 bg-white p-5 shadow-card">
                  <div className="text-xs uppercase tracking-wide text-ink-400">Your tracks</div>
                  <ul className="mt-2 divide-y divide-ink-100 text-sm">
                    {tracks.map((t) => (
                      <li key={t.id} className="flex items-center justify-between py-1.5">
                        <span className="text-ink-900">{t.title}</span>
                        <span className="text-xs text-ink-400 mono-hash">{t.id.slice(0, 8)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="rounded-lg border border-ink-100 bg-white p-5 shadow-card">
                <div className="text-xs uppercase tracking-wide text-ink-400">Run an audit</div>
                <div className="mt-3">
                  <AuditPanel artistId={artist.id} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
