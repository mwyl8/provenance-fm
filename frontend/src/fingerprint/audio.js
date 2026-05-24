// Naïve STFT magnitude spectrogram in pure JS.
// We use a real FFT on each windowed frame. For an MVP this is fine —
// a v2 should swap in something like fft.js or a WASM kernel.

function hann(n) {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  return w;
}

// Cooley–Tukey radix-2 in-place FFT on (real, imag) arrays of length n (power of 2).
function fftRadix2(real, imag) {
  const n = real.length;
  // Bit reversal
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wlenR = Math.cos(ang);
    const wlenI = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wR = 1;
      let wI = 0;
      for (let k = 0; k < len / 2; k++) {
        const uR = real[i + k];
        const uI = imag[i + k];
        const vR = real[i + k + len / 2] * wR - imag[i + k + len / 2] * wI;
        const vI = real[i + k + len / 2] * wI + imag[i + k + len / 2] * wR;
        real[i + k] = uR + vR;
        imag[i + k] = uI + vI;
        real[i + k + len / 2] = uR - vR;
        imag[i + k + len / 2] = uI - vI;
        const nwR = wR * wlenR - wI * wlenI;
        wI = wR * wlenI + wI * wlenR;
        wR = nwR;
      }
    }
  }
}

export function computeMagnitudeSpectrogram(signal, opts = {}) {
  const nFft = opts.nFft || 2048;
  const hop = opts.hop || 512;
  const win = hann(nFft);
  const nFrames = Math.max(0, Math.floor((signal.length - nFft) / hop) + 1);
  const nBins = nFft / 2 + 1;
  const mags = new Float32Array(nBins * nFrames);
  const re = new Float32Array(nFft);
  const im = new Float32Array(nFft);
  for (let f = 0; f < nFrames; f++) {
    const off = f * hop;
    for (let i = 0; i < nFft; i++) {
      re[i] = signal[off + i] * win[i];
      im[i] = 0;
    }
    fftRadix2(re, im);
    for (let b = 0; b < nBins; b++) {
      const v = Math.sqrt(re[b] * re[b] + im[b] * im[b]);
      mags[b * nFrames + f] = Math.log1p(v);
    }
  }
  return { magnitudes: mags, nFrames, nBins, hop, nFft };
}
