// 12-dim chromagram in pure JS.
// Maps each STFT bin to the nearest of 12 pitch classes, sums energy,
// L2-normalizes per frame, then mean-pools across time + downsamples.

const N_PITCH_CLASSES = 12;

function binToPitchClass(binIndex, nFft, sr) {
  // Frequency of this bin (Hz)
  const f = (binIndex * sr) / nFft;
  if (f < 27.5 || f > 8000) return -1;   // restrict to musical range
  const midi = 69 + 12 * Math.log2(f / 440);
  let pc = Math.round(midi) % 12;
  if (pc < 0) pc += 12;
  return pc;
}

function l2Normalize(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i] * arr[i];
  const n = Math.sqrt(sum);
  if (n > 0) for (let i = 0; i < arr.length; i++) arr[i] /= n;
  return arr;
}

export function chromaFingerprintFromMagnitudes(magsFlat, { sr, nFft }) {
  const N_BINS = nFft / 2 + 1;
  const nFrames = magsFlat.length / N_BINS;
  if (!Number.isInteger(nFrames)) {
    throw new Error(`magnitude buffer not aligned: total=${magsFlat.length} bins=${N_BINS}`);
  }

  const mapping = new Int8Array(N_BINS);
  for (let b = 0; b < N_BINS; b++) mapping[b] = binToPitchClass(b, nFft, sr);

  // Compute per-frame chroma.
  const chromaFrames = new Float32Array(N_PITCH_CLASSES * nFrames);
  for (let t = 0; t < nFrames; t++) {
    for (let b = 0; b < N_BINS; b++) {
      const pc = mapping[b];
      if (pc < 0) continue;
      chromaFrames[pc * nFrames + t] += magsFlat[b * nFrames + t];
    }
    // Normalize this frame's chroma column.
    const col = new Float32Array(N_PITCH_CLASSES);
    for (let r = 0; r < N_PITCH_CLASSES; r++) col[r] = chromaFrames[r * nFrames + t];
    l2Normalize(col);
    for (let r = 0; r < N_PITCH_CLASSES; r++) chromaFrames[r * nFrames + t] = col[r];
  }

  // Pooled = mean across time, L2-normalized.
  const pooled = new Float32Array(N_PITCH_CLASSES);
  for (let r = 0; r < N_PITCH_CLASSES; r++) {
    let s = 0;
    for (let t = 0; t < nFrames; t++) s += chromaFrames[r * nFrames + t];
    pooled[r] = nFrames > 0 ? s / nFrames : 0;
  }
  l2Normalize(pooled);

  // Downsample frames to ~200 columns to keep upload size modest.
  const keepEvery = Math.max(1, Math.floor(nFrames / 200));
  const tDown = Math.ceil(nFrames / keepEvery);
  const framesDown = new Float32Array(N_PITCH_CLASSES * tDown);
  for (let r = 0; r < N_PITCH_CLASSES; r++) {
    for (let t = 0; t < tDown; t++) {
      framesDown[r * tDown + t] = chromaFrames[r * nFrames + t * keepEvery];
    }
  }

  return { pooled, frames: framesDown };
}
