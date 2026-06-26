// Rivalo "R" + chevron mark — blue/green palette.
export default function Logo({ size = 28, animated = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"
      className={animated ? "rivalo-logo-anim" : ""} aria-label="Rivalo">
      <defs>
        <linearGradient id="riv-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="riv-green" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="10" stroke="rgba(148,163,184,0.25)" strokeWidth="1.5" />
      <path d="M8 8 L24 24 L8 40 Z" fill="url(#riv-blue)" />
      <path d="M40 8 L24 24 L40 40 Z" fill="url(#riv-green)" />
      <circle cx="24" cy="24" r="2.4" fill="#F8FAFC" />
    </svg>
  );
}
