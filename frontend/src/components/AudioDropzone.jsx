import { useRef, useState } from "react";

export default function AudioDropzone({ onFile, disabled = false, label = "Drop an audio file" }) {
  const [drag, setDrag] = useState(false);
  const inp = useRef(null);

  function pick(e) {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  }
  function drop(e) {
    e.preventDefault();
    setDrag(false);
    if (disabled) return;
    const f = e.dataTransfer?.files?.[0];
    if (f) onFile(f);
  }

  return (
    <div
      onClick={() => !disabled && inp.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={drop}
      className={`flex cursor-pointer items-center justify-center rounded-md border-2 border-dashed px-6 py-10 text-center text-sm transition ${
        drag
          ? "border-accent-500 bg-accent-50/50"
          : "border-ink-200 bg-ink-50 hover:border-ink-400"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <div>
        <div className="text-ink-900">{label}</div>
        <div className="mt-1 text-xs text-ink-400">mp3, wav, flac, m4a · stays in your browser</div>
      </div>
      <input
        ref={inp}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={pick}
        disabled={disabled}
      />
    </div>
  );
}
