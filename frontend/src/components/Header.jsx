import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Trophy, LogOut, LayoutDashboard, PlusCircle, Compass } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const linkCls = ({ isActive }) =>
    `text-sm tracking-wide transition-colors ${isActive ? "text-[#D4AF37]" : "text-slate-300 hover:text-white"}`;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#050614]/70 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" data-testid="header-logo">
          <Trophy className="text-[#D4AF37]" size={22} />
          <span className="font-display text-2xl tracking-tight">Arena<span className="text-[#D4AF37]">Bid</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/browse" className={linkCls} data-testid="nav-browse"><span className="inline-flex items-center gap-2"><Compass size={14} /> Browse</span></NavLink>
          <NavLink to="/how-it-works" className={linkCls} data-testid="nav-how">How it works</NavLink>
          {user && user !== false && (
            <NavLink to="/dashboard" className={linkCls} data-testid="nav-dashboard"><span className="inline-flex items-center gap-2"><LayoutDashboard size={14} /> Dashboard</span></NavLink>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {user && user !== false ? (
            <>
              <Link to="/post" className="hidden sm:inline-flex items-center gap-2 bg-[#D4AF37] text-black px-5 py-2 font-semibold hover:bg-[#F3E5AB] transition-colors" data-testid="header-post-project-btn">
                <PlusCircle size={16} /> Post project
              </Link>
              <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                <div className="hidden sm:block text-right leading-tight">
                  <div className="text-sm">{user.name}</div>
                  <div className="text-xs text-slate-400">{user.email}</div>
                </div>
                <button onClick={async () => { await logout(); nav("/"); }} className="text-slate-300 hover:text-white p-2" data-testid="header-logout-btn" title="Log out">
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-300 hover:text-white" data-testid="nav-login">Log in</Link>
              <Link to="/register" className="bg-[#D4AF37] text-black px-5 py-2 font-semibold hover:bg-[#F3E5AB] transition-colors text-sm" data-testid="nav-register">Join arena</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
