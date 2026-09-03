import { useState } from "react";
import api, { formatApiError } from "../../lib/api";
import { CheckCircle2, ExternalLink } from "lucide-react";

export default function ApplicantsPanel({ projectId, applications, maxApprove, reload }) {
  const [selected, setSelected] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const toggle = (id) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length >= maxApprove ? s : [...s, id]
    );

  const approve = async () => {
    setErr("");
    setLoading(true);
    try {
      await api.post(`/projects/${projectId}/approve`, { application_ids: selected });
      reload();
    } catch (e2) {
      setErr(formatApiError(e2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6" data-testid="applicants-panel">
      <div className="flex items-center justify-between">
        <div className="text-xs tracking-widest uppercase text-slate font-mono">Applicants</div>
        <span className="chip font-mono">{applications.length}</span>
      </div>
      <div className="mt-4 space-y-3 max-h-96 overflow-auto pr-1 -mr-1">
        {applications.length === 0 && (
          <div className="text-slate text-sm">No applicants yet. Hold tight.</div>
        )}
        {applications.map((a) => {
          const isOn = selected.includes(a.id);
          return (
            <label
              key={a.id}
              className="block rounded-lg border p-4 cursor-pointer transition-colors"
              style={{
                borderColor: isOn ? "var(--cobalt)" : "var(--hairline)",
                background: isOn ? "rgba(61,76,255,0.06)" : "#fff",
              }}
              data-testid={`applicant-${a.id}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate text-graphite">{a.user_name}</div>
                  <div className="text-xs text-slate truncate">{a.user_headline || "Freelancer"}</div>
                </div>
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => toggle(a.id)}
                  className="w-4 h-4"
                  style={{ accentColor: "var(--cobalt)" }}
                  data-testid={`applicant-check-${a.id}`}
                />
              </div>
              <div className="mt-3 text-sm text-graphite/85 leading-relaxed">&ldquo;{a.pitch}&rdquo;</div>
              {a.sample_url && (
                <a
                  href={a.sample_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--cobalt)] hover:underline"
                >
                  View sample <ExternalLink size={10} />
                </a>
              )}
            </label>
          );
        })}
      </div>
      <div className="mt-4 text-xs text-slate">
        Pick up to {maxApprove}. Approved freelancers get an email and the timer starts.
      </div>
      {err && <div className="text-ember text-sm mt-2">{err}</div>}
      <button
        disabled={selected.length === 0 || loading}
        onClick={approve}
        className="btn-primary w-full mt-4 inline-flex items-center justify-center gap-2 disabled:opacity-30"
        data-testid="approve-btn"
      >
        <CheckCircle2 size={14} />
        {loading ? "Opening arena…" : `Approve ${selected.length} & start competition`}
      </button>
    </div>
  );
}
