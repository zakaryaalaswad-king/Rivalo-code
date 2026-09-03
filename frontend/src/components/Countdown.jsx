import { useEffect, useState, useRef } from "react";

function diff(deadline) {
  const t = new Date(deadline).getTime() - Date.now();
  if (t <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
  return {
    d: Math.floor(t / 86400000),
    h: Math.floor((t % 86400000) / 3600000),
    m: Math.floor((t % 3600000) / 60000),
    s: Math.floor((t % 60000) / 1000),
    done: false,
  };
}

/**
 * 3D split-flap countdown. `variant`:
 *   - "ember" (default): dark cell, ember digits — for urgency panels
 *   - "canvas": light cell, graphite digits — for use on the warm canvas surface
 */
export default function Countdown({ deadline, size = "md", variant = "ember" }) {
  const [t, setT] = useState(() => diff(deadline));
  useEffect(() => {
    const id = setInterval(() => setT(diff(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (t.done)
    return (
      <span className="pill pill-ember uppercase tracking-widest text-xs" data-testid="countdown-ended">
        Deadline passed
      </span>
    );

  const cells = [
    ["DAYS", t.d],
    ["HRS", t.h],
    ["MIN", t.m],
    ["SEC", t.s],
  ];

  return (
    <div className="flex gap-2 items-end" data-testid="countdown">
      {cells.map(([label, value]) => (
        <div key={label} className="flex flex-col items-center gap-1.5">
          <FlipCell value={value} size={size} variant={variant} />
          <div className="text-[10px] tracking-widest uppercase text-slate font-mono">{label}</div>
        </div>
      ))}
    </div>
  );
}

function FlipCell({ value, size, variant }) {
  const display = String(value).padStart(2, "0");
  const prevRef = useRef(display);
  const [prev, setPrev] = useState(display);
  const [flipKey, setFlipKey] = useState(0);

  useEffect(() => {
    if (prevRef.current !== display) {
      setPrev(prevRef.current);
      setFlipKey((k) => k + 1);
      prevRef.current = display;
    }
  }, [display]);

  const cellClasses = `flip-cell ${size === "lg" ? "lg" : ""} ${variant === "canvas" ? "canvas-tone" : ""}`;

  return (
    <div className={cellClasses}>
      {/* Static back — new value */}
      <div className="flip-static">{display}</div>
      {/* Top half flips down showing previous, then bottom half swings up with new value */}
      <div key={`t-${flipKey}`} className="flip-top">{prev}</div>
      <div key={`b-${flipKey}`} className="flip-bottom">{display}</div>
    </div>
  );
}
