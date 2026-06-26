import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Scrolls to top of viewport on every route change (or hash navigation).
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [pathname, hash]);
  return null;
}
