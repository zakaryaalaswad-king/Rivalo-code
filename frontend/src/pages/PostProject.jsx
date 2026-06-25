import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiError } from "../lib/api";
import { Trophy } from "lucide-react";

export default function PostProject() {
  const nav = useNavigate();
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState({
    title: "", description: "", category: "Graphic Design",
    budget: 250, duration_hours: 48, max_competitors: 3, deliverables: "", attachments: [],
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get("/categories").then((r) => { setCats(r.data); setForm((f) => ({ ...f, category: r.data[0] })); }); }, []);

  const onChange = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: ["budget", "duration_hours", "max_competitors"].includes(k) ? Number(v) : v }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const { data: project } = await api.post("/projects", form);
      // Initiate stripe checkout to fund the bounty
      const { data: co } = await api.post("/payments/checkout", { project_id: project.id, origin_url: window.location.origin });
      window.location.href = co.url;
    } catch (e2) {
      setErr(formatApiError(e2));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-12">
      <div className="text-center mb-10">
        <Trophy size={32} className="text-[#D4AF37] mx-auto" />
        <h1 className="font-display text-4xl mt-4">Post a brief</h1>
        <p className="text-slate-400 mt-2 text-sm">Set the rules. Three competitors will battle for your bounty.</p>
      </div>

      <form onSubmit={onSubmit} className="bg-[#0A0C22] border border-white/10 p-8 space-y-6" data-testid="post-project-form">
        <Field label="Title">
          <input value={form.title} onChange={onChange("title")} required minLength={3} placeholder="Brand identity for indie coffee roastery" className="w-full px-4 py-3" data-testid="post-title-input" />
        </Field>
        <Field label="Category">
          <select value={form.category} onChange={onChange("category")} className="w-full px-4 py-3" data-testid="post-category-select">
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Brief">
          <textarea value={form.description} onChange={onChange("description")} required minLength={10} rows={6} placeholder="Describe what you need, your style preferences, the audience..." className="w-full px-4 py-3" data-testid="post-description-input" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Bounty (USD)">
            <input type="number" min={5} step="1" value={form.budget} onChange={onChange("budget")} required className="w-full px-4 py-3" data-testid="post-budget-input" />
          </Field>
          <Field label="Window (hours · 2-120)">
            <input type="number" min={2} max={120} value={form.duration_hours} onChange={onChange("duration_hours")} required className="w-full px-4 py-3" data-testid="post-duration-input" />
          </Field>
          <Field label="Approved seats">
            <input type="number" min={1} max={10} value={form.max_competitors} onChange={onChange("max_competitors")} required className="w-full px-4 py-3" data-testid="post-competitors-input" />
          </Field>
        </div>
        <Field label="Deliverables (optional)">
          <textarea value={form.deliverables} onChange={onChange("deliverables")} rows={3} placeholder="Source files, logo on dark/light, social cover…" className="w-full px-4 py-3" data-testid="post-deliverables-input" />
        </Field>

        <div className="bg-[#101230] border border-[#D4AF37]/30 p-4 text-sm text-slate-300">
          <div className="text-[#D4AF37] uppercase tracking-widest text-[10px] mb-2">Escrow</div>
          The bounty (${form.budget}) is held by Stripe and released only when you pick a winner.
        </div>

        {err && <div className="text-red-400 text-sm" data-testid="post-error">{err}</div>}
        <div className="flex gap-3">
          <button type="button" onClick={() => nav(-1)} className="px-6 py-3 border border-white/20 hover:bg-white/5" data-testid="post-cancel-btn">Cancel</button>
          <button disabled={loading} className="flex-1 bg-[#D4AF37] text-black py-3 font-semibold hover:bg-[#F3E5AB] transition-colors disabled:opacity-50" data-testid="post-submit-btn">
            {loading ? "Preparing checkout…" : `Fund $${form.budget} & open the arena`}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs tracking-widest uppercase text-slate-400">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
