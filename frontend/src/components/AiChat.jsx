import { useState, useRef, useEffect } from "react";
import api, { formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Sparkles, Send, X, MessageCircle } from "lucide-react";

export default function AiChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const sessionId = useRef(`s-${Date.now()}`);
  const scroller = useRef(null);

  useEffect(() => { scroller.current?.scrollTo({ top: 9e6, behavior: "smooth" }); }, [messages]);

  if (!user || user === false) return null;

  const send = async () => {
    const msg = text.trim();
    if (!msg || busy) return;
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setText(""); setBusy(true);
    try {
      const { data } = await api.post("/ai/chat", { message: msg, session_id: sessionId.current });
      setMessages((m) => [...m, { role: "ai", content: data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "ai", content: `⚠️ ${formatApiError(e)}` }]);
    } finally { setBusy(false); }
  };

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} className="fixed bottom-24 right-6 z-40 btn-primary inline-flex items-center gap-2 shadow-2xl" data-testid="ai-chat-toggle">
          <MessageCircle size={18} /> Rivalo Coach
        </button>
      )}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-7rem)] card flex flex-col overflow-hidden shadow-2xl reveal" data-testid="ai-chat-panel">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2"><Sparkles size={16} className="text-[#22C55E]" /><div className="font-semibold">Rivalo Coach</div></div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white p-1" data-testid="ai-chat-close"><X size={16} /></button>
          </div>
          <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-sm text-muted">
                Ask me about <strong className="text-slate-300">pitching, pricing, briefs, comparing competitors, or staying competitive</strong>. I won't write your deliverables for you — but I'll help you think.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`ai-chat-bubble ${m.role === "user" ? "user" : ""} text-sm max-w-[85%] whitespace-pre-wrap`}>{m.content}</div>
              </div>
            ))}
            {busy && <div className="ai-chat-bubble text-sm text-muted inline-block">…thinking</div>}
          </div>
          <div className="border-t border-white/5 p-3 flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask for advice…" className="flex-1 px-3 py-2 text-sm" data-testid="ai-chat-input" />
            <button onClick={send} disabled={busy || !text.trim()} className="btn-primary !px-3 !py-2" data-testid="ai-chat-send"><Send size={14} /></button>
          </div>
        </div>
      )}
    </>
  );
}
