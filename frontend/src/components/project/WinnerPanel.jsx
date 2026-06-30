import { Trophy, ExternalLink } from "lucide-react";

export default function WinnerPanel({ project, submissions }) {
  const winner = submissions.find((s) => s.id === project.winner_submission_id);
  return (
    <div className="card p-8" data-testid="winner-panel" style={{ borderColor: "rgba(34,197,94,0.45)" }}>
      <div className="flex items-center gap-3">
        <Trophy className="text-[#22C55E]" />
        <div className="font-display text-3xl">Winner crowned</div>
      </div>
      {winner ? (
        <div className="mt-6">
          <div className="text-xs tracking-widest uppercase text-muted">Champion</div>
          <div className="mt-2 text-2xl font-medium">{winner.user_name}</div>
          <div className="mt-4 text-slate-300 whitespace-pre-wrap leading-relaxed">
            {winner.description}
          </div>
          {winner.url && (
            <a
              href={winner.url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm text-[#3B82F6] hover:underline"
            >
              View deliverable <ExternalLink size={12} />
            </a>
          )}
        </div>
      ) : (
        <div className="mt-4 text-muted">Winner has been chosen.</div>
      )}
    </div>
  );
}
