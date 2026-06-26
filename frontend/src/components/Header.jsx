import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import Logo from "./Logo";
import { LogOut, LayoutDashboard, PlusCircle, Compass, ChevronDown, User } from "lucide-react";
import NotificationBell from "./NotificationBell";

function Avatar({ user, size = 36 }) {
  if (user.avatar_url) {
    const token = sessionStorage.getItem("ab_token") || "";
    const url = user.avatar_url.startsWith("http") ? user.avatar_url : `${process.env.REACT_APP_BACKEND_URL}${user.avatar_url}${user.avatar_url.includes("?") ? "&" : "?"}auth=${token}`;
    return <img src={url} alt={user.name} style={{ width: size, height: size }} className="rounded-full object-cover" />;
  }
  const initial = (user.name || user.email || "?")[0].toUpperCase();
  return (
    <div style={{ width: size, height: size }} className="rounded-full bg-gradient-to-br from-[#3B82F6] to-[#22C55E] flex items-center justify-center text-white font-semibold">
      {initial}
    </div>
  );
}

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
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0F172A]/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" data-testid="header-logo">
          <Logo size={28} animated />
          <span className="font-display text-2xl tracking-tight">Rival<span className="text-[#3B82F6]">o</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-7">
          <Link to="/browse" className="text-sm text-slate-300 hover:text-white" data-testid="nav-browse"><Compass size={14} className="inline mr-1.5" />Browse</Link>
          <Link to="/how-it-works" className="text-sm text-slate-300 hover:text-white" data-testid="nav-how">How it works</Link>
          {user && user !== false && (
            <Link to="/dashboard" className="text-sm text-slate-300 hover:text-white" data-testid="nav-dashboard"><LayoutDashboard size={14} className="inline mr-1.5" />Dashboard</Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {user && user !== false ? (
            <>
              <Link to="/post" className="hidden sm:inline-flex items-center gap-2 btn-primary text-sm" data-testid="header-post-project-btn">
                <PlusCircle size={16} /> Post project
              </Link>
              <NotificationBell />
              <div className="relative" ref={ref}>
                <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 pl-3 border-l border-white/10 hover:opacity-90" data-testid="avatar-menu-btn">
                  <Avatar user={user} />
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
                {open && (
                  <div className="absolute right-0 mt-2 w-64 card shadow-2xl overflow-hidden" data-testid="avatar-menu-dropdown">
                    <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                      <Avatar user={user} size={42} />
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{user.name}</div>
                        <div className="text-xs text-muted truncate">{user.email}</div>
                        <div className="mt-1 inline-flex items-center gap-1 text-[10px]">
                          <span className="chip" data-testid="header-trust-chip">Trust {user.trust_points || 0}/100</span>
                          {!user.email_verified && <span className="chip chip-amber">Unverified</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { setOpen(false); nav("/profile"); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 flex items-center gap-2" data-testid="menu-profile-management">
                      <User size={14} /> Profile management
                    </button>
                    <Link to="/dashboard" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-white/5"><LayoutDashboard size={14} className="inline mr-2" />Dashboard</Link>
                    <Link to="/post" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-white/5"><PlusCircle size={14} className="inline mr-2" />Post a brief</Link>
                    <div className="border-t border-white/5" />
                    <button onClick={async () => { setOpen(false); await logout(); nav("/"); }} className="w-full text-left px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10 flex items-center gap-2" data-testid="menu-logout">
                      <LogOut size={14} /> Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-300 hover:text-white" data-testid="nav-login">Log in</Link>
              <Link to="/register" className="btn-primary text-sm" data-testid="nav-register">Join Rivalo</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
