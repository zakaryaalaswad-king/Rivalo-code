import { useState } from "react";
import api, { formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Mail, X } from "lucide-react";

export default function VerifyEmailModal({ onClose, onVerified }) {
  const { refresh } = useAuth();
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  const send = async () => {
    setErr(""); setSending(true);
    try { await api.post("/auth/send-verification"); setSent(true); }
    catch (e) { setErr(formatApiError(e)); }
    finally { setSending(false); }
  };
  const verify = async (e) => {
    e.preventDefault();
    setErr(""); setVerifying(true);
    try {
      await api.post("/auth/verify-email", { code: code.trim() });
      await refresh();
      onVerified?.();
      onClose?.();
    } catch (e2) { setErr(formatApiError(e2)); }
    finally { setVerifying(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" data-testid="verify-email-modal">
      <div className="card p-8 max-w-md w-full relative reveal">
        <button onClick={onClose} className="absolute top-3 right-3 text-slate hover:text-white p-1" data-testid="verify-modal-close"><X size={18} /></button>
        <Mail className="text-[var(--cobalt)]" size={28} />
        <h2 className="font-display text-2xl mt-3">Verify your email</h2>
        <p className="text-sm text-muted mt-2">We sent a 6-digit code to your inbox. It expires in 15 minutes.</p>
        <form onSubmit={verify} className="mt-5 space-y-3">
          <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} placeholder="123456"
            className="w-full px-4 py-3 text-center font-mono text-2xl tracking-[0.5em]" data-testid="verify-code-input" />
          {err && <div className="text-ember text-sm">{err}</div>}
          <button type="submit" disabled={verifying || code.length < 4} className="w-full btn-primary" data-testid="verify-submit-btn">
            {verifying ? "Verifying…" : "Verify"}
          </button>
          <button type="button" onClick={send} disabled={sending} className="w-full text-sm text-slate hover:text-white py-2" data-testid="verify-resend-btn">
            {sending ? "Sending…" : sent ? "Resend code" : "Send / resend code"}
          </button>
        </form>
        <div className="mt-4 text-xs text-muted">Tip: in this demo environment, the code is also printed in the backend log if email delivery fails.</div>
      </div>
    </div>
  );
}
