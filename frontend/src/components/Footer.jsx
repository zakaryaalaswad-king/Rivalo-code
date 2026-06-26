import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { Shield, FileText } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-20 py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-3"><Logo size={22} /><span className="font-display text-lg">Rivalo</span></div>
          <p className="text-muted text-xs leading-relaxed">The competitive marketplace for freelancers. Clients post briefs, talent competes head-to-head, the best work wins.</p>
        </div>
        <div>
          <div className="text-xs tracking-widest uppercase text-muted mb-3">Explore</div>
          <ul className="space-y-2 text-slate-300">
            <li><Link to="/browse" className="hover:text-white">Browse briefs</Link></li>
            <li><Link to="/how-it-works" className="hover:text-white">How it works</Link></li>
            <li><Link to="/post" className="hover:text-white">Post a brief</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs tracking-widest uppercase text-muted mb-3">Account</div>
          <ul className="space-y-2 text-slate-300">
            <li><Link to="/profile" className="hover:text-white">Profile management</Link></li>
            <li><Link to="/dashboard" className="hover:text-white">Dashboard</Link></li>
            <li><Link to="/login" className="hover:text-white">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs tracking-widest uppercase text-muted mb-3">Legal</div>
          <ul className="space-y-2 text-slate-300">
            <li><Link to="/privacy" className="hover:text-white inline-flex items-center gap-1.5" data-testid="footer-privacy"><Shield size={12} /> Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-white inline-flex items-center gap-1.5" data-testid="footer-terms"><FileText size={12} /> Terms of Use</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 md:px-10 mt-10 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <div>© {new Date().getFullYear()} Rivalo. All rights reserved.</div>
        <div className="flex items-center gap-3">
          <span>Payments via Stripe</span>
          <span>·</span>
          <span>Made for the open arena</span>
        </div>
      </div>
    </footer>
  );
}
