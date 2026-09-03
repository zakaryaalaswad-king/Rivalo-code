import { useState, useRef, useEffect } from "react";
import api, { formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Send, X, MessageCircle } from "lucide-react";

const SUGGESTIONS = [
  "How should I price this brief?",
  "Compare these two pitches for me",
  "What angle wins this category?",
];

let MSG_SEQ = 0;
const newId = () => `m-${Date.now()}-${++MSG_SEQ}`;

export default function AiChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const sessionId = useRef(`s-${Date.now()}`);
  const scroller = useRef(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 9e6, behavior: "smooth" });
  }, [messages, busy]);

  if (!user || user === false) return null;

  const send = async (override) => {
    const msg = (override ?? text).trim();
    if (!msg || busy) return;
    setMessages((m) => [...m, { id: newId(), role: "user", content: msg }]);
    setText("");
    setBusy(true);
    try {
      const { data } = await api.post("/ai/chat", {
        message: msg,
        session_id: sessionId.current,
      });
      setMessages((m) => [...m, { id: newId(), role: "ai", content: data.reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { id: newId(), role: "ai", content: `⚠️ ${formatApiError(e)}` },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-6 z-40 btn-primary inline-flex items-center gap-2 shadow-2xl"
          data-testid="ai-chat-toggle"
        >
          <MessageCircle size={18} /> Rivaloz Coach
        </button>
      )}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-40 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-7rem)] card !p-0 flex flex-col overflow-hidden shadow-2xl"
          data-testid="ai-chat-panel"
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ background: "var(--ink)", color: "#F0EEE8" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--cobalt)" }}>
                <MessageCircle size={14} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-sm">Rivaloz Coach</div>
                <div className="text-[10px] tracking-widest uppercase text-slate font-mono">Online</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white p-1 rounded-full !bg-transparent"
              data-testid="ai-chat-close"
            >
              <X size={16} />
            </button>
          </div>

          <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="text-sm text-graphite/80 leading-relaxed">
                  Ask me about <strong className="text-graphite">pitching, pricing, briefs, comparing competitors, or staying competitive</strong>. I won't write your deliverables — but I'll help you think.
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs px-3 py-1.5 rounded-full transition-colors"
                      style={{
                        border: "1px solid var(--hairline-strong)",
                        color: "var(--graphite)",
                      }}
                      data-testid={`ai-suggest-${s.slice(0, 12).replace(/\s+/g, "-")}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`ai-chat-bubble ${m.role === "user" ? "user" : ""} text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="ai-chat-bubble text-sm inline-flex items-center gap-1.5">
                  <span className="typing-dot" />
                  <span className="typing-dot" style={{ animationDelay: "120ms" }} />
                  <span className="typing-dot" style={{ animationDelay: "240ms" }} />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 flex gap-2" style={{ borderTop: "1px solid var(--hairline)" }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask for advice…"
              className="on-canvas flex-1 px-3 py-2 text-sm"
              data-testid="ai-chat-input"
            />
            <button
              onClick={() => send()}
              disabled={busy || !text.trim()}
              className="btn-primary !px-3 !py-2 disabled:opacity-50"
              data-testid="ai-chat-send"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
