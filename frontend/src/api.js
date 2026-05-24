const BASE = "/api";

async function call(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: opts.body instanceof FormData ? {} : { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

export const api = {
  health: () => call("/health"),
  registerArtist: (handle, notify_email) =>
    call("/artist", {
      method: "POST",
      body: JSON.stringify({ handle, notify_email }),
    }),
  getArtist: (id) => call(`/artist/${id}`),
  uploadTrack: (artistId, { title, landmark, chroma }) =>
    call(`/artist/${artistId}/track`, {
      method: "POST",
      body: JSON.stringify({ title, landmark, chroma }),
    }),
  listTracks: (artistId) => call(`/artist/${artistId}/tracks`),
  runAudit: (artist_id, min_tier = "low", top_k = 25) =>
    call("/audit/run", {
      method: "POST",
      body: JSON.stringify({ artist_id, min_tier, top_k }),
    }),
  getReceipt: (id) => call(`/receipt/${id}`),
  corpusStats: () => call("/corpus/stats"),
  investigate: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("top_k", 10);
    return call("/investigate", { method: "POST", body: fd });
  },
};
