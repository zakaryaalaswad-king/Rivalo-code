import { useState } from "react";
import api, { formatApiError } from "../../lib/api";
import { Send } from "lucide-react";

export default function ApplyCard({ projectId, onApplied }) {
  const [pitch, setPitch] = useState("");
  const [sampleUrl, setSampleUrl] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await api.post(`/projects/${projectId}/apply`, { pitch, sample_url: sampleUrl });
      onApplied();
    } catch (e2) {
      setErr(formatApiError(e2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-6" data-testid="apply-form">
      <div className="text-xs tracking-widest uppercase text-[var(--cobalt)] font-mono">Apply to compete</div>
      <textarea
        value={pitch}
        onChange={(e) => setPitch(e.target.value)}
        required
        minLength={10}
        rows={4}
        placeholder="Why are you the right talent? Show your angle."
        className="w-full px-4 py-3 mt-4"
        data-testid="apply-pitch-input"
      />
      <input
        value={sampleUrl}
        onChange={(e) => setSampleUrl(e.target.value)}
        placeholder="Portfolio / sample URL (optional)"
        className="w-full px-4 py-3 mt-3"
        data-testid="apply-sample-input"
      />
      {err && <div className="text-ember text-sm mt-3">{err}</div>}
      <button
        disabled={loading}
        className="btn-primary w-full mt-4 inline-flex items-center justify-center gap-2 disabled:opacity-50"
        data-testid="apply-submit-btn"
      >
        <Send size={14} /> {loading ? "Sending…" : "Send application"}
      </button>
    </form>
  );
}
