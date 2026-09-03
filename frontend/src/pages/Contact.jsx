import { useState } from "react";
import { Link } from "react-router-dom";
import api, { formatApiError } from "../lib/api";
import COMPANY from "../config/company";
import { Mail, MapPin, Clock, MessageCircle, CheckCircle2, Send } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", honeypot: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await api.post("/contact", form);
      setDone(true);
    } catch (e2) { setErr(formatApiError(e2)); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-16">
      <div className="text-center">
        <span className="pill">Talk to us</span>
        <h1 className="font-display text-4xl lg:text-6xl mt-5">We answer fast.</h1>
        <p className="text-muted mt-3 max-w-xl mx-auto">Questions, sales, partnerships, or just feedback — we read every message and reply within {COMPANY.responseTimeSLA}.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {done ? (
            <div className="card p-10 text-center" data-testid="contact-success">
              <CheckCircle2 className="text-[var(--volt-ink)] mx-auto" size={42} />
              <h2 className="font-display text-3xl mt-4">Message received</h2>
              <p className="text-muted mt-2 text-sm">Thanks {form.name || "friend"} — we'll reply to <strong>{form.email}</strong> within {COMPANY.responseTimeSLA}.</p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Link to="/" className="btn-ghost text-sm">Back to home</Link>
                <button onClick={() => { setDone(false); setForm({ name: "", email: "", subject: "", message: "", honeypot: "" }); }} className="btn-primary text-sm">Send another</button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="card p-8 space-y-4" data-testid="contact-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Name"><input required minLength={1} value={form.name} onChange={set("name")} className="w-full px-4 py-3" data-testid="contact-name" /></Field>
                <Field label="Email"><input required type="email" value={form.email} onChange={set("email")} className="w-full px-4 py-3" data-testid="contact-email" /></Field>
              </div>
              <Field label="Subject">
                <select value={form.subject} onChange={set("subject")} required className="w-full px-4 py-3" data-testid="contact-subject">
                  <option value="">Choose a topic…</option>
                  <option>Sales / Business plan</option>
                  <option>Billing & subscriptions</option>
                  <option>Refund request</option>
                  <option>Bug report</option>
                  <option>Trust & safety</option>
                  <option>Partnerships / press</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Message">
                <textarea required minLength={10} maxLength={5000} rows={6} value={form.message} onChange={set("message")} placeholder="Tell us what's going on…" className="w-full px-4 py-3" data-testid="contact-message" />
                <div className="text-xs text-muted mt-1">{form.message.length} / 5000</div>
              </Field>
              {/* honeypot — bots fill it, humans don't */}
              <input type="text" value={form.honeypot} onChange={set("honeypot")} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              {err && <div className="text-ember text-sm">{err}</div>}
              <button disabled={busy} className="btn-primary w-full inline-flex items-center justify-center gap-2" data-testid="contact-submit">
                <Send size={14} /> {busy ? "Sending…" : "Send message"}
              </button>
              <div className="text-[11px] text-muted pt-2 border-t border-white/5">
                By submitting you accept our <Link to="/privacy" className="underline">Privacy Policy</Link>. We never share your message outside the team.
              </div>
            </form>
          )}
        </div>

        <div className="space-y-4">
          <InfoCard icon={Mail} label="Support" value={COMPANY.emails.support} href={`mailto:${COMPANY.emails.support}`} />
          <InfoCard icon={Mail} label="Sales" value={COMPANY.emails.contact} href={`mailto:${COMPANY.emails.contact}`} />
          <InfoCard icon={Mail} label="Legal" value={COMPANY.emails.legal} href={`mailto:${COMPANY.emails.legal}`} />
          <InfoCard icon={MapPin} label="Address" value={COMPANY.businessAddress} />
          <InfoCard icon={Clock} label="Hours" value={COMPANY.businessHours} />
          <InfoCard icon={MessageCircle} label="Or chat" value="Open the floating Rivaloz Coach for instant guidance." />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (<div><label className="text-xs text-muted">{label}</label><div className="mt-1">{children}</div></div>);
}
function InfoCard({ icon: Icon, label, value, href }) {
  const body = (
    <div className="card p-4 flex items-start gap-3">
      <Icon size={16} className="text-[var(--cobalt)] mt-0.5" />
      <div>
        <div className="text-[10px] tracking-widest uppercase text-muted">{label}</div>
        <div className="text-sm mt-0.5 break-words">{value}</div>
      </div>
    </div>
  );
  return href ? <a href={href} className="block hover:opacity-95">{body}</a> : body;
}
