import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import Logo from "./Logo";
import TrustRing from "./TrustRing";
import { LogOut, LayoutDashboard, PlusCircle, ChevronDown, User } from "lucide-react";
import NotificationBell from "./NotificationBell";

function Avatar({ user, size = 34 }) {
  if (user.avatar_url) {
    const token = sessionStorage.getItem("ab_token") || "";
    const url = user.avatar_url.startsWith("http")
      ? user.avatar_url
      : `${process.env.REACT_APP_BACKEND_URL}${user.avatar_url}${user.avatar_url.includes("?") ? "&" : "?"}auth=${token}`;
    return <img src={url} alt={user.name} style={{ width: size, height: size }} className="rounded-full object-cover" />;
  }
  const initial = (user.name || user.email || "?")[0].toUpperCase();
  return (
    <div
      style={{ width: size, height: size, background: "var(--cobalt)" }}
      className="rounded-full flex items-center justify-center text-white font-semibold"
    >
      {initial}
    </div>
  );
}

const NAV_LINKS = [
  { to: "/browse", label: "Browse" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="shell sticky top-0 z-40 border-b" style={{ borderColor: "var(--shell-hairline)" }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0" data-testid="header-logo">
          <Logo size={26} />
          <span className="font-display text-xl tracking-tight text-white">Rivaloz</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `nav-link text-sm ${isActive ? "active" : ""}`}
              data-testid={`nav-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {l.label}
            </NavLink>
          ))}
          {user && user !== false && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link text-sm inline-flex items-center gap-1.5 ${isActive ? "active" : ""}`}
              data-testid="nav-dashboard"
            >
              <LayoutDashboard size={14} /> Dashboard
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user && user !== false ? (
            <>
              <Link to="/post" className="hidden sm:inline-flex items-center gap-2 btn-primary text-sm" data-testid="header-post-project-btn">
                <PlusCircle size={16} /> Post brief
              </Link>
              <NotificationBell />
              <div className="relative" ref={ref}>
                <button
                  onClick={() => setOpen((o) => !o)}
                  className="flex items-center gap-2 pl-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                  data-testid="avatar-menu-btn"
                >
                  <Avatar user={user} />
                  <ChevronDown size={14} className="text-slate" />
                </button>
                {open && (
                  <div className="shell-card absolute right-0 mt-2 w-72 shadow-2xl overflow-hidden" data-testid="avatar-menu-dropdown">
                    <div className="px-4 py-4 flex items-start gap-3" style={{ borderBottom: "1px solid var(--shell-hairline)" }}>
                      <Avatar user={user} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate text-white">{user.name}</div>
                        <div className="text-xs text-slate truncate">{user.email}</div>
                        {!user.email_verified && <span className="pill pill-ember mt-1.5 inline-block">Unverified</span>}
                      </div>
                      <button
                        onClick={() => { setOpen(false); nav("/profile"); }}
                        title="Open profile management"
                        className="!p-0 !bg-transparent hover:scale-105 transition-transform"
                        data-testid="header-trust-ring-btn"
                      >
                        <TrustRing points={user.trust_points || 0} size={48} stroke={5} />
                      </button>
                    </div>
                    <MenuButton onClick={() => { setOpen(false); nav("/profile"); }} icon={User} label="Profile management" testid="menu-profile-management" />
                    <MenuButton onClick={() => { setOpen(false); nav("/dashboard"); }} icon={LayoutDashboard} label="Dashboard" />
                    <MenuButton onClick={() => { setOpen(false); nav("/post"); }} icon={PlusCircle} label="Post a brief" />
                    <div style={{ borderTop: "1px solid var(--shell-hairline)" }} />
                    <button
                      onClick={async () => { setOpen(false); await logout(); nav("/"); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#FF9985] hover:bg-[#FF6B4A]/10 flex items-center gap-2"
                      data-testid="menu-logout"
                    >
                      <LogOut size={14} /> Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link text-sm" data-testid="nav-login">Log in</Link>
              <Link to="/register" className="btn-primary text-sm" data-testid="nav-register">Join Rivaloz</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuButton({ onClick, icon: I, label, testid }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
      data-testid={testid}
    >
      <I size={14} /> {label}
    </button>
  );
}
