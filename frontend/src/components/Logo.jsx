// Rivaloz mark — three converging chevrons forming an arena "R"
// Uses cobalt + volt tokens (via CSS vars) so it stays on-theme in both shells & canvas.
export default function Logo({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Rivaloz"
    >
      <rect x="2" y="2" width="44" height="44" rx="8" fill="var(--ink-2)" stroke="var(--shell-hairline, rgba(255,255,255,0.08))" strokeWidth="1" />
      {/* left wedge — cobalt */}
      <path d="M9 9 L24 24 L9 39 Z" fill="var(--cobalt)" />
      {/* right wedge — volt (win/success accent) */}
      <path d="M39 9 L24 24 L39 39 Z" fill="var(--volt)" />
      <circle cx="24" cy="24" r="2.2" fill="#F0EEE8" />
    </svg>
  );
}
