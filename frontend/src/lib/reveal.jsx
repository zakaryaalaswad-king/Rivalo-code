import { useEffect, useRef, useState } from "react";

// Reveals children once they intersect the viewport.
export function useReveal(opts = {}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12, ...opts }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

export function Reveal({ children, delay = 0, as: Tag = "div", className = "", ...rest }) {
  const { ref, shown } = useReveal();
  return (
    <Tag
      ref={ref}
      className={`${className} reveal-on-scroll ${shown ? "is-visible" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
