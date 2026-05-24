// Shazam-style landmark hash, browser side.
// Mirror of backend/provenance/fingerprint/landmark.py — keep the
// hashing scheme byte-identical or audits won't reconcile.

const FAN_VALUE = 5;
const MIN_DT = 0;
const MAX_DT = 200;
const PEAKS_PER_SEC = 30;

async function sha256Hex(s) {
  const enc = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function findPeaks(magsFlat, nBins, nFrames, targetTotal) {
  // Take indices of the top `targetTotal` magnitudes.
  const total = magsFlat.length;
  // Use a partial-sort by quickselect-ish heap. For MVP we just sort.
  const indexed = new Array(total);
  for (let i = 0; i < total; i++) indexed[i] = i;
  indexed.sort((a, b) => magsFlat[b] - magsFlat[a]);
  const top = indexed.slice(0, targetTotal);
  const peaks = top.map((idx) => ({
    binFreq: Math.floor(idx / nFrames),
    timeFrame: idx % nFrames,
  }));
  peaks.sort((a, b) => a.timeFrame - b.timeFrame);
  return peaks;
}

export async function landmarkHashFromMagnitudes(magsFlat) {
  // Reconstruct nBins/nFrames from the implicit shape — we encoded
  // mags as Float32Array(nBins*nFrames) in `audio.js`.
  // Heuristic: assume nBins from the first dimension via STFT nFft=2048 → 1025 bins.
  const N_BINS = 1025;
  const nFrames = magsFlat.length / N_BINS;
  if (!Number.isInteger(nFrames)) {
    throw new Error("magnitude buffer not aligned to 1025 bins");
  }
  const targetTotal = Math.max(50, Math.floor(PEAKS_PER_SEC * (nFrames * 512) / 24000));
  const peaks = findPeaks(magsFlat, N_BINS, nFrames, targetTotal);

  const hashes = [];
  const anchorTimes = [];
  for (let i = 0; i < peaks.length; i++) {
    const anchor = peaks[i];
    const horizon = Math.min(peaks.length, i + 1 + FAN_VALUE * 3);
    let added = 0;
    for (let j = i + 1; j < horizon; j++) {
      const target = peaks[j];
      const dt = target.timeFrame - anchor.timeFrame;
      if (dt <= MIN_DT) continue;
      if (dt > MAX_DT) break;
      const h = await sha256Hex(`${anchor.binFreq}:${target.binFreq}:${dt}`);
      hashes.push(h.slice(0, 16));
      anchorTimes.push(anchor.timeFrame);
      if (++added >= FAN_VALUE) break;
    }
  }
  return { hashes, anchor_times: anchorTimes };
}
