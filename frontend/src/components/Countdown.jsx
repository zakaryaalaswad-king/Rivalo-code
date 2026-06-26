import { useEffect, useState } from "react";

function diff(deadline) {
  const t = new Date(deadline).getTime() - Date.now();
  if (t <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
  const d = Math.floor(t / 86400000);
  const h = Math.floor((t % 86400000) / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  const s = Math.floor((t % 60000) / 1000);
  return { d, h, m, s, done: false };
}

export default function Countdown({ deadline, size = "md" }) {
  const [t, setT] = useState(() => diff(deadline));
  useEffect(() => {
    const id = setInterval(() => setT(diff(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline]);
  const cellBase = size === "lg" ? "min-w-[64px] p-3" : "min-w-[48px] p-2";
  const num = size === "lg" ? "text-3xl" : "text-xl";
  if (t.done) return <span className="text-red-400 uppercase tracking-widest text-sm" data-testid="countdown-ended">Deadline passed</span>;
  return (
    <div className="flex gap-2 font-mono" data-testid="countdown">
      {[["DAYS", t.d], ["HRS", t.h], ["MIN", t.m], ["SEC", t.s]].map(([l, v]) => (
        <div key={l} className={`bg-[#101230] border border-[#3B82F6]/30 ${cellBase} text-center`}>
          <div className={`${num} text-[#3B82F6] leading-none`}>{String(v).padStart(2, "0")}</div>
          <div className="text-[10px] text-slate-400 tracking-widest mt-1">{l}</div>
        </div>
      ))}
    </div>
  );
}
