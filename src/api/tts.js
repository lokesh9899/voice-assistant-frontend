// src/api/tts.js

export async function fetchTTS(text) {
  // 1) Read via import.meta.env
  const raw = import.meta.env.VITE_BACKEND_URL;
  if (!raw) {
    throw new Error("VITE_BACKEND_URL is not defined");
  }

  // 2) Normalize: remove trailing slashes
  const base = raw.replace(/\/+$/, "");
  const url  = `${base}/tts?msg=${encodeURIComponent(text)}`;

  // 3) Fetch the TTS audio blob
  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`TTS error ${res.status}: ${errText}`);
  }

  // 4) Convert to an object URL for playback
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
