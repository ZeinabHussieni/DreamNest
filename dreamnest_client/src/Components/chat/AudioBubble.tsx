import React from "react";

type Props = {
  src: string;
  transcript?: string | null;
  mine?: boolean;
};

export default function AudioBubble({ src, transcript, mine }: Props) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [ready, setReady] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const [dur, setDur] = React.useState(0);
  const [showTx, setShowTx] = React.useState(false);

  const fmt = (s: number) => {
    if (!Number.isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  const computeReady = (el: HTMLAudioElement) => {
    const d = el.duration;
    const ok = Number.isFinite(d) && d > 0;
    setDur(ok ? d : 0);
    setReady(ok);
  };

  const nudgeIfNeeded = (el: HTMLAudioElement) => {
    if (!Number.isFinite(el.duration) || el.duration === 0) {
      const prev = el.currentTime || 0;
      const onTU = () => {
        el.removeEventListener("timeupdate", onTU);
        try { el.currentTime = prev; } catch {}
        computeReady(el);
      };
      el.addEventListener("timeupdate", onTU, { once: true });
      try { el.currentTime = 1e101; } catch {}
    }
  };

  const onLoaded = () => {
    const el = audioRef.current;
    if (!el) return;
    computeReady(el);
    if (!ready) nudgeIfNeeded(el);
  };

  const onDurationChange = () => {
    const el = audioRef.current;
    if (!el) return;
    computeReady(el);
  };

  const onTime = () => {
    const el = audioRef.current;
    if (!el) return;
    setTime(el.currentTime || 0);
  };

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  const onPlay = () => setPlaying(true);
  const onPause = () => setPlaying(false);
  const onEnded = () => { setPlaying(false); setTime(0); };

  const pct = dur ? Math.min(100, (time / dur) * 100) : 0;

  const seek = (val: number) => {
    const el = audioRef.current;
    if (!el) return;
    if (!dur || !Number.isFinite(dur)) return;      
    const newTime = (val / 100) * dur;
    if (Number.isFinite(newTime)) el.currentTime = newTime;
  };

  return (
    <div className={`audio-bubble ${mine ? "mine" : ""}`}>
      <div className="ab-row">
        <button
          type="button"
          className={`ab-btn ${playing ? "pause" : "play"}`}
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          disabled={!ready}
        />
        <input
          className="ab-range"
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={ready ? pct : 0}
          onChange={(e) => seek(Number(e.target.value))}
          disabled={!ready}
        />
        <div className="ab-time">
          <span style={{ opacity: 0.8 }}>{fmt(time)} / {ready ? fmt(dur) : "--:--"}</span>
        </div>
      </div>

      {transcript ? (
        <>
          <button
            type="button"
            className="ab-transcript-toggle"
            onClick={() => setShowTx((v) => !v)}
          >
            {showTx ? "Hide transcript" : "Show transcript"}
          </button>
          {showTx && <div className="ab-transcript">{transcript}</div>}
        </>
      ) : null}

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={onLoaded}
        onDurationChange={onDurationChange}
        onTimeUpdate={onTime}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
      />
    </div>
  );
}
