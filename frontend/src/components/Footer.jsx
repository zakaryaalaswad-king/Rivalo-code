import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import COMPANY from "../config/company";
import { Shield, FileText, RefreshCw, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="shell border-t mt-24 py-12 relative z-10" style={{ borderColor: "var(--shell-hairline)" }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Logo size={22} />
            <span className="font-display text-lg text-white">{COMPANY.brandName}</span>
          </div>
          <p className="text-slate text-xs leading-relaxed">
            {COMPANY.tagline} {COMPANY.legalName} · {COMPANY.businessAddress}
          </p>
          <div className="mt-3 text-[10px] text-slate/80">Payments processed by Stripe.</div>
        </div>
        <FooterCol title="Explore" links={[
          ["/browse", "Browse briefs"],
          ["/how-it-works", "How it works"],
          ["/pricing", "Pricing"],
          ["/post", "Post a brief"],
        ]} />
        <FooterCol title="Account" links={[
          ["/profile", "Profile management"],
          ["/dashboard", "Dashboard"],
          ["/login", "Sign in"],
        ]} />
        <div>
          <div className="text-xs tracking-widest uppercase text-slate mb-3 font-mono">Legal &amp; Contact</div>
          <ul className="space-y-2 text-white/85">
            <li><FooterLink to="/privacy" icon={Shield} testid="footer-privacy">Privacy Policy</FooterLink></li>
            <li><FooterLink to="/terms" icon={FileText} testid="footer-terms">Terms of Service</FooterLink></li>
            <li><FooterLink to="/refund-policy" icon={RefreshCw} testid="footer-refund">Refund Policy</FooterLink></li>
            <li><FooterLink to="/contact" icon={Mail} testid="footer-contact">Contact</FooterLink></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 md:px-10 mt-10 pt-6 border-t flex flex-wrap items-center justify-between gap-3 text-xs text-slate" style={{ borderColor: "var(--shell-hairline)" }}>
        <div>© {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.</div>
        <div className="flex items-center gap-3">
          <span>Built for the open arena</span>
          <span>·</span>
          <span>{COMPANY.country}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div className="text-xs tracking-widest uppercase text-slate mb-3 font-mono">{title}</div>
      <ul className="space-y-2 text-white/85">
        {links.map(([to, label]) => (
          <li key={to}><Link to={to} className="hover:text-white">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}

function FooterLink({ to, icon: I, testid, children }) {
  return (
    <Link to={to} className="hover:text-white inline-flex items-center gap-1.5" data-testid={testid}>
      <I size={12} /> {children}
    </Link>
  );
}
