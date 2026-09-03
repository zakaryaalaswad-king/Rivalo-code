import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { formatApiError } from "../lib/api";
import Logo from "../components/Logo";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, password);
      const to = loc.state?.from || "/dashboard";
      nav(to, { replace: true });
    } catch (e2) {
      setErr(formatApiError(e2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block"><Logo size={42} /></div>
          <h1 className="font-display text-4xl mt-4 text-white">Welcome back to Rivaloz</h1>
          <p className="text-slate mt-2 text-sm">Pick up where the arena left you.</p>
        </div>
        <form onSubmit={onSubmit} className="shell-card p-8 space-y-5" data-testid="login-form">
          <div>
            <label className="text-xs tracking-widest uppercase text-slate font-mono">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              className="w-full mt-2 px-4 py-3"
              data-testid="login-email-input"
            />
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase text-slate font-mono">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              className="w-full mt-2 px-4 py-3"
              data-testid="login-password-input"
            />
          </div>
          {err && <div className="text-ember text-sm" data-testid="login-error">{err}</div>}
          <button
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
            data-testid="login-submit-btn"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <div className="text-sm text-slate text-center">
            New here?{" "}
            <Link to="/register" className="text-[var(--volt)] hover:underline">Create an account</Link>
          </div>
          <div
            className="text-xs text-slate text-center pt-4"
            style={{ borderTop: "1px solid var(--shell-hairline)" }}
          >
            Demo: <span className="font-mono">client@demo.com</span> / <span className="font-mono">demo1234</span>
          </div>
        </form>
      </div>
    </div>
  );
}
