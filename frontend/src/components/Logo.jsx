// Rivalo logo — a "versus" mark: two opposing chevrons inside a sharp square,
// gold vs purple, suggesting two rivals facing off in the arena.
export default function Logo({ size = 28, animated = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={animated ? "rivalo-logo-anim" : ""}
      aria-label="Rivalo"
    >
      <defs>
        <linearGradient id="riv-g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F3E5AB" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
        <linearGradient id="riv-g2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#6B21A8" />
        </linearGradient>
      </defs>
      {/* outer sharp frame */}
      <rect x="2" y="2" width="44" height="44" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      {/* gold chevron from left */}
      <path d="M6 6 L24 24 L6 42 Z" fill="url(#riv-g1)" />
      {/* purple chevron from right */}
      <path d="M42 6 L24 24 L42 42 Z" fill="url(#riv-g2)" />
      {/* center spark */}
      <circle cx="24" cy="24" r="2.2" fill="#F8FAFC" />
    </svg>
  );
}
