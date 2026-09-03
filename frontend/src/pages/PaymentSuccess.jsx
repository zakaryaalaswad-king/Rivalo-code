import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../lib/api";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const sid = params.get("session_id");
  const pid = params.get("project_id");
  const [status, setStatus] = useState("checking");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sid) { setStatus("error"); return; }
    let cancelled = false;
    let count = 0;
    const tick = async () => {
      if (cancelled) return;
      count += 1;
      try {
        const { data } = await api.get(`/payments/status/${sid}`);
        setAttempts(count);
        if (data.payment_status === "paid") setStatus("paid");
        else if (data.status === "expired") setStatus("expired");
        else if (count >= 12) setStatus("timeout");
        else setTimeout(tick, 2500);
      } catch {
        if (count >= 12) setStatus("timeout"); else setTimeout(tick, 2500);
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [sid]);

  return (
    <div className="shell min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full card p-10 text-center" data-testid="payment-success-page">
        {status === "checking" && (
          <>
            <Loader2 className="mx-auto text-[var(--cobalt)] animate-spin" size={32} />
            <div className="font-display text-3xl mt-4 text-graphite">Confirming payment…</div>
            <div className="text-sm text-slate mt-2">Verifying with Stripe ({attempts}/12)</div>
          </>
        )}
        {status === "paid" && (
          <>
            <CheckCircle2 className="mx-auto" size={42} style={{ color: "var(--volt-ink)", background: "var(--volt)", borderRadius: "9999px", padding: 4 }} />
            <div className="font-display text-3xl mt-4 text-graphite">Brief is live</div>
            <p className="text-slate mt-3">Bounty funded and held in escrow. Freelancers can now apply.</p>
            <div className="mt-8 flex gap-3 justify-center">
              <Link to={`/projects/${pid}`} className="btn-primary" data-testid="view-project-btn">View brief</Link>
              <Link to="/dashboard" className="btn-ghost">Dashboard</Link>
            </div>
          </>
        )}
        {(status === "expired" || status === "timeout" || status === "error") && (
          <>
            <div className="font-display text-3xl mt-4 text-graphite">Payment not confirmed</div>
            <p className="text-slate mt-3">{status === "expired" ? "The Stripe session expired." : "We couldn't confirm payment yet. Try refreshing your dashboard in a minute."}</p>
            <button onClick={() => nav("/dashboard")} className="btn-ghost mt-6">Go to dashboard</button>
          </>
        )}
      </div>
    </div>
  );
}
