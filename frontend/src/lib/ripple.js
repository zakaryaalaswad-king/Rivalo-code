// Tracks click coordinates on every button so the ripple radial gradient
// originates from the actual press point. Registered once globally.
export function installRipple() {
  if (typeof document === "undefined" || document.__rivalozRippleInstalled) return;
  document.__rivalozRippleInstalled = true;
  document.addEventListener("pointerdown", (e) => {
    const el = e.target.closest("button, .btn-primary, .btn-accent, .btn-ghost, .nav-glass");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--ripple-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--ripple-y", `${e.clientY - rect.top}px`);
  }, { passive: true });
}
