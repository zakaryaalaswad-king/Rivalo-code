import { useEffect, useRef, useState } from "react";

// Toggles `is-visible` every time the element enters/leaves the viewport.
// Fires on both scroll-down AND scroll-up — not a one-shot reveal.
export function useReveal(opts = {}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => setShown(e.isIntersecting));
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12, ...opts }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

// direction: "up" (default) | "down" | "left" | "right" | "scale"
export function Reveal({ children, delay = 0, direction = "up", as: Tag = "div", className = "", ...rest }) {
  const { ref, shown } = useReveal();
  const variant = `reveal-${direction}`;
  return (
    <Tag
      ref={ref}
      className={`${className} reveal-on-scroll ${variant} ${shown ? "is-visible" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
