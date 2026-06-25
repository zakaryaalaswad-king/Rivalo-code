import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { formatApiError } from "../lib/api";
import { Trophy } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try { await register(form.email, form.password, form.name); nav("/dashboard"); }
    catch (e2) { setErr(formatApiError(e2)); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Trophy size={32} className="text-[#D4AF37] mx-auto" />
          <h1 className="font-display text-4xl mt-4">Join the arena</h1>
          <p className="text-slate-400 mt-2 text-sm">One account · post projects or compete for them.</p>
        </div>
        <form onSubmit={onSubmit} className="bg-[#0A0C22] border border-white/10 p-8 space-y-5" data-testid="register-form">
          <div>
            <label className="text-xs tracking-widest uppercase text-slate-400">Name</label>
            <input value={form.name} onChange={onChange("name")} required className="w-full mt-2 px-4 py-3" data-testid="register-name-input" />
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase text-slate-400">Email</label>
            <input value={form.email} onChange={onChange("email")} required type="email" className="w-full mt-2 px-4 py-3" data-testid="register-email-input" />
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase text-slate-400">Password</label>
            <input value={form.password} onChange={onChange("password")} required type="password" minLength={6} className="w-full mt-2 px-4 py-3" data-testid="register-password-input" />
          </div>
          {err && <div className="text-red-400 text-sm" data-testid="register-error">{err}</div>}
          <button disabled={loading} className="w-full bg-[#D4AF37] text-black py-3 font-semibold hover:bg-[#F3E5AB] transition-colors disabled:opacity-50" data-testid="register-submit-btn">
            {loading ? "Creating…" : "Create account"}
          </button>
          <div className="text-sm text-slate-400 text-center">
            Already in? <Link to="/login" className="text-[#D4AF37] hover:underline">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
