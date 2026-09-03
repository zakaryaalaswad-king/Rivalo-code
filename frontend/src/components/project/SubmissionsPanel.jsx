import { useEffect, useState } from "react";
import api, { formatApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import FileUploader from "../FileUploader";
import { Send, Crown, ExternalLink } from "lucide-react";

export default function SubmissionsPanel({ project, submissions, isClient, reload }) {
  const { user } = useAuth();
  const mine = submissions.find((s) => s.user_id === user?.id);
  const [form, setForm] = useState({ description: "", url: "", files: [] });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mine) {
      setForm({
        description: mine.description,
        url: mine.url || "",
        files: (mine.files || []).map((u) => ({
          url: u,
          filename: u.split("/").pop(),
          content_type: "",
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine?.id]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await api.post(`/projects/${project.id}/submit`, {
        description: form.description,
        url: form.url,
        files: form.files.map((f) => f.url),
      });
      reload();
    } catch (e2) {
      setErr(formatApiError(e2));
    } finally {
      setLoading(false);
    }
  };

  const pickWinner = async (sid) => {
    if (!window.confirm("Crown this submission as the winner? The bounty will be released.")) return;
    try {
      await api.post(`/projects/${project.id}/pick-winner`, { submission_id: sid });
      reload();
    } catch (e2) {
      alert(formatApiError(e2));
    }
  };

  return (
    <div className="card p-8" data-testid="submissions-panel">
      <div className="text-xs tracking-widest uppercase text-slate font-mono">
        {isClient ? "Submissions" : "Your submission"}
      </div>

      {!isClient && (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <textarea
            required
            minLength={5}
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Walk the client through your work…"
            className="w-full px-4 py-3"
            data-testid="submit-desc-input"
          />
          <input
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="Link to deliverable (Figma, Drive, GitHub, etc.)"
            className="w-full px-4 py-3"
            data-testid="submit-url-input"
          />
          <FileUploader
            value={form.files}
            onChange={(arr) => setForm((f) => ({ ...f, files: arr }))}
            max={8}
          />
          {err && <div className="text-ember text-sm">{err}</div>}
          <button
            disabled={loading}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            data-testid="submit-work-btn"
          >
            <Send size={14} /> {loading ? "Sending…" : mine ? "Update submission" : "Submit work"}
          </button>
        </form>
      )}

      {isClient && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {submissions.length === 0 && (
            <div className="text-slate text-sm col-span-full">No submissions yet.</div>
          )}
          {submissions.map((s) => (
            <SubmissionCard key={s.id} s={s} onPickWinner={() => pickWinner(s.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionCard({ s, onPickWinner }) {
  const token = sessionStorage.getItem("ab_token") || "";
  const fullUrl = (u) => {
    if (u.startsWith("http")) return u;
    const sep = u.includes("?") ? "&" : "?";
    return `${process.env.REACT_APP_BACKEND_URL}${u}${sep}auth=${token}`;
  };
  return (
    <div className="rounded-lg canvas-2 p-5" data-testid={`submission-${s.id}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-graphite">{s.user_name}</div>
          <div className="text-xs text-slate">{new Date(s.submitted_at).toLocaleString()}</div>
        </div>
      </div>
      <div className="mt-3 text-sm text-graphite/85 whitespace-pre-wrap leading-relaxed">
        {s.description}
      </div>
      {s.url && (
        <a
          href={s.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--cobalt)] hover:underline"
        >
          View deliverable <ExternalLink size={12} />
        </a>
      )}
      {s.files && s.files.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2" data-testid={`submission-files-${s.id}`}>
          {s.files.map((u) => (
            <a
              key={u}
              href={fullUrl(u)}
              target="_blank"
              rel="noreferrer"
              className="block rounded-md aspect-square overflow-hidden border transition-colors hover:border-[var(--cobalt)]"
              style={{ borderColor: "var(--hairline)", background: "#fff" }}
            >
              <img
                src={fullUrl(u)}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </a>
          ))}
        </div>
      )}
      <button
        onClick={onPickWinner}
        className="btn-volt w-full mt-4 inline-flex items-center justify-center gap-2"
        data-testid={`pick-winner-${s.id}`}
      >
        <Crown size={14} /> Crown this winner
      </button>
    </div>
  );
}
