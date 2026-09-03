import { useEffect, useState } from "react";
import { Trophy, Circle } from "lucide-react";

/**
 * BattleView — the signature surface of Rivaloz.
 * Renders approved freelancers as diagonal split slots that slide in from
 * opposite edges with a subtle 3D perspective + shake (Versus Impact).
 * When project.status is `completed`, the winner slot tilts + glows in volt.
 */
export default function BattleView({ project, applications, submissions }) {
  const approved = (applications || []).filter((a) => a.status === "approved");
  const isCompleted = project.status === "completed";
  const winnerSubmissionId = project.winner_submission_id;
  const winnerUserId = project.winner_user_id;

  // If we don't have applications loaded (freelancer / anonymous view),
  // synthesize slots from approved_freelancer_ids so the view still renders.
  const slotsSrc =
    approved.length > 0
      ? approved
      : (project.approved_freelancer_ids || []).map((uid, i) => ({
          id: `p-${i}`,
          user_id: uid,
          user_name: `Competitor ${i + 1}`,
          user_headline: "Approved",
        }));

  if (slotsSrc.length === 0) return null;

  const withSubs = slotsSrc.map((a) => {
    const sub = (submissions || []).find((s) => s.user_id === a.user_id);
    return { app: a, sub };
  });

  const columns = Math.min(3, withSubs.length);

  return (
    <div className="mt-8" data-testid="battle-view">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-2xl text-white">
          {isCompleted ? "Match result" : "The arena"}
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-widest text-slate">
          {isCompleted ? "Bounty released" : "Live now"}
        </span>
      </div>

      <div className={`battle-split battle-split-${columns} relative`}>
        {isCompleted && <FlashStreaks />}
        {withSubs.map(({ app, sub }, i) => {
          const isWinner =
            isCompleted &&
            ((winnerSubmissionId && sub && sub.id === winnerSubmissionId) ||
              (winnerUserId && app.user_id === winnerUserId));
          return (
            <BattleSlot
              key={app.id}
              index={i}
              total={withSubs.length}
              app={app}
              sub={sub}
              isWinner={isWinner}
              isCompleted={isCompleted}
            />
          );
        })}
      </div>
    </div>
  );
}

function BattleSlot({ index, total, app, sub, isWinner, isCompleted }) {
  // Alternate entrance directions for versus feel
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const dir = index === 0 ? "vs-enter-left" : index === total - 1 ? "vs-enter-right" : "vs-enter-left";
  const anim = mounted ? `${dir} vs-shake` : "opacity-0";

  return (
    <div
      className={`battle-slot ${anim} ${isWinner ? "winner-reveal" : ""}`}
      data-testid={`battle-slot-${index}`}
      style={
        isWinner
          ? { background: "var(--volt)", color: "var(--volt-ink)" }
          : undefined
      }
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest opacity-70">
          Contender {String(index + 1).padStart(2, "0")}
        </span>
        {isWinner ? (
          <Trophy size={16} />
        ) : isCompleted ? (
          <Circle size={12} className="opacity-40" />
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-slate">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--ember)] animate-pulse" />
            live
          </span>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center font-semibold"
          style={{
            background: isWinner ? "var(--volt-ink)" : "var(--cobalt)",
            color: isWinner ? "var(--volt)" : "#fff",
          }}
        >
          {(app.user_name || "?")[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-base font-semibold truncate">{app.user_name || "Competitor"}</div>
          <div className="text-xs opacity-70 truncate">{app.user_headline || "Freelancer"}</div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4 text-xs">
        <div>
          <div className="opacity-60 font-mono uppercase tracking-widest text-[10px]">Status</div>
          <div className="mt-0.5 font-medium">
            {isWinner ? "Winner" : sub ? "Submitted" : isCompleted ? "Beaten" : "Working"}
          </div>
        </div>
        <div>
          <div className="opacity-60 font-mono uppercase tracking-widest text-[10px]">Files</div>
          <div className="mt-0.5 font-mono">{sub?.files?.length || 0}</div>
        </div>
      </div>
    </div>
  );
}

function FlashStreaks() {
  // Fast camera-flash light streaks radiating from the winner announcement.
  const angles = [-20, 8, 32, -48, 60];
  return (
    <>
      {angles.map((a, i) => (
        <span
          key={a}
          className="flash-streak"
          style={{ "--r": `${a}deg`, animationDelay: `${i * 90}ms` }}
        />
      ))}
    </>
  );
}
