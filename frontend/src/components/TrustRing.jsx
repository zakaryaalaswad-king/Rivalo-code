export default function TrustRing({ points = 0, size = 80, stroke = 8 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, points)) / 100;
  const dash = c * pct;
  const color = points >= 80 ? "#22C55E" : points >= 50 ? "#3B82F6" : points >= 25 ? "#F59E0B" : "#94A3B8";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} data-testid="trust-ring">
      <svg width={size} height={size} className="trust-ring">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(148,163,184,0.18)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none"
          strokeDasharray={`${dash} ${c - dash}`} style={{ transition: "stroke-dasharray 0.6s ease, stroke 0.4s" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-xl font-semibold" style={{ color }}>{points}</div>
        <div className="text-[9px] tracking-widest text-muted uppercase">trust</div>
      </div>
    </div>
  );
}
