import { Trophy, ExternalLink } from "lucide-react";

export default function WinnerPanel({ project, submissions }) {
  const winner = submissions.find((s) => s.id === project.winner_submission_id);
  return (
    <div
      className="card p-8 text-center"
      data-testid="winner-panel"
      style={{ background: "var(--volt)", color: "var(--volt-ink)", borderColor: "var(--volt)" }}
    >
      <Trophy size={32} className="mx-auto" />
      <div className="font-display text-3xl mt-3">Winner crowned</div>
      {winner ? (
        <div className="mt-6 text-left">
          <div className="text-xs tracking-widest uppercase font-mono opacity-70">Champion</div>
          <div className="mt-2 text-2xl font-semibold">{winner.user_name}</div>
          <div className="mt-4 whitespace-pre-wrap leading-relaxed opacity-90">
            {winner.description}
          </div>
          {winner.url && (
            <a
              href={winner.url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm underline"
            >
              View deliverable <ExternalLink size={12} />
            </a>
          )}
        </div>
      ) : (
        <div className="mt-4 opacity-70">Winner has been chosen.</div>
      )}
    </div>
  );
}
