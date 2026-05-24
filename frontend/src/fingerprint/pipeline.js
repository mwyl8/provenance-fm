// Top-level helper: take a File from a drop or input, decode it via the
// Web Audio API, compute landmark + chroma fingerprints in pure JS.
// The audio bytes are processed entirely in this browser tab — nothing
// is uploaded.

import { landmarkHashFromMagnitudes } from "./landmark";
import { chromaFingerprintFromMagnitudes } from "./chroma";
import { computeMagnitudeSpectrogram } from "./audio";

const TARGET_SR = 24000;

async function decodeFileToMonoPCM(file) {
  const arr = await file.arrayBuffer();
  const ctx = new (window.OfflineAudioContext ||
    window.webkitOfflineAudioContext)(1, 44100, 44100);
  const decoded = await ctx.decodeAudioData(arr.slice(0));
  // Mix down to mono.
  const channels = decoded.numberOfChannels;
  const length = decoded.length;
  const mono = new Float32Array(length);
  for (let c = 0; c < channels; c++) {
    const data = decoded.getChannelData(c);
    for (let i = 0; i < length; i++) mono[i] += data[i] / channels;
  }
  // Resample to TARGET_SR using a fresh OfflineAudioContext.
  const targetLen = Math.round((length * TARGET_SR) / decoded.sampleRate);
  const re = new (window.OfflineAudioContext ||
    window.webkitOfflineAudioContext)(1, targetLen, TARGET_SR);
  const src = re.createBufferSource();
  const buf = re.createBuffer(1, length, decoded.sampleRate);
  buf.copyToChannel(mono, 0);
  src.buffer = buf;
  src.connect(re.destination);
  src.start();
  const rendered = await re.startRendering();
  return { audio: rendered.getChannelData(0), sr: TARGET_SR };
}

export async function fingerprintAudioFile(file) {
  const { audio, sr } = await decodeFileToMonoPCM(file);
  // Both fingerprints work over the same magnitude spectrogram, so compute once.
  const { magnitudes, hop, nFft } = computeMagnitudeSpectrogram(audio, {
    nFft: 2048,
    hop: 512,
  });
  const landmark = await landmarkHashFromMagnitudes(magnitudes);
  const chroma = chromaFingerprintFromMagnitudes(magnitudes, { sr, nFft });
  // chroma is { pooled: Float32Array(12), frames: Float32Array(12, T) flat }
  // Convert frames into the [12][T] shape the API expects (list of lists).
  const T = chroma.frames.length / 12;
  const framesShape = [];
  for (let r = 0; r < 12; r++) {
    const row = new Array(T);
    for (let t = 0; t < T; t++) row[t] = chroma.frames[r * T + t];
    framesShape.push(row);
  }
  return {
    landmark,
    chroma: { pooled: Array.from(chroma.pooled), frames: framesShape },
  };
}
