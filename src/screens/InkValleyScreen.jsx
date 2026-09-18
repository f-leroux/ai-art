import React, { useEffect, useRef, useState } from "https://esm.sh/react@18";
import { createValley } from "../ink/valley.js";

const SPEEDS = [0.5, 1, 3, 8];

const InkValleyScreen = () => {
  const canvasRef = useRef(null);
  const valleyRef = useRef(null);
  const scrubbing = useRef(false);
  const pointer = useRef(null);
  const [state, setState] = useState({ year: 0, playing: true, speed: 1, season: "spring dawn", planted: 0, houses: 0, trees: 0, done: false });

  useEffect(() => {
    const valley = createValley(canvasRef.current, { onState: setState });
    valleyRef.current = valley;
    const onKey = (e) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        valley.toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      valley.destroy();
    };
  }, []);

  const onPointerDown = (e) => {
    pointer.current = { moved: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!pointer.current) return;
    pointer.current.moved += Math.abs(e.movementX) + Math.abs(e.movementY);
    valleyRef.current.stirWind(e.movementX * (1280 / e.currentTarget.clientWidth));
  };
  const onPointerUp = (e) => {
    if (pointer.current && pointer.current.moved < 6) valleyRef.current.plantAt(e.clientX, e.clientY);
    pointer.current = null;
  };

  return (
    <section className="valley-screen">
      <div className="valley-hero">
        <h1>A Century in Ink</h1>
        <p>
          A hand-drawn valley that lives for a hundred years. Nothing here is an image: every hill, tree, villager, raindrop
          and numeral is an ink stroke computed on the fly. One year is one day. Spring is dawn, summer is noon, autumn is
          dusk, winter is night.
        </p>
      </div>

      <div className="valley-frame">
        <canvas
          ref={canvasRef}
          className="valley-canvas"
          width={1280}
          height={720}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (pointer.current = null)}
        />
      </div>

      <div className="valley-controls">
        <button className="valley-button" onClick={() => valleyRef.current.toggle()}>
          {state.playing ? "Pause" : state.done ? "Again" : "Play"}
        </button>
        <div className="valley-speeds">
          {SPEEDS.map((s) => (
            <button
              key={s}
              className={`valley-button small ${state.speed === s ? "active" : ""}`}
              onClick={() => valleyRef.current.setSpeed(s)}
            >
              {s}×
            </button>
          ))}
        </div>
        <input
          className="valley-slider"
          type="range"
          min="0"
          max="100"
          step="0.01"
          value={state.year}
          onPointerDown={() => (scrubbing.current = true)}
          onPointerUp={() => (scrubbing.current = false)}
          onChange={(e) => valleyRef.current.setYear(Number(e.target.value))}
          aria-label="Year"
        />
        <div className="valley-readout">
          <span className="valley-year">year {Math.floor(state.year)}</span>
          <span className="valley-season">{state.season}</span>
        </div>
        <button className="valley-button" onClick={() => valleyRef.current.regenerate()}>
          New valley
        </button>
      </div>

      <div className="valley-notes">
        <div>
          <strong>Drag</strong> across the scene to raise the wind.
        </div>
        <div>
          <strong>Click</strong> the ground to plant a tree, then scrub the century to watch it grow old.
        </div>
        <div>
          <strong>Space</strong> pauses. {state.houses} houses · {state.trees} living trees
          {state.planted ? ` · ${state.planted} planted by you` : ""}
        </div>
      </div>
    </section>
  );
};

export default InkValleyScreen;
