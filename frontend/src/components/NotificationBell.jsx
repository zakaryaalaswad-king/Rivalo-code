import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { Bell, CheckCheck } from "lucide-react";

export default function NotificationBell() {
  const [data, setData] = useState({ items: [], unread: 0 });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const refresh = async () => {
    try { const { data } = await api.get("/notifications"); setData(data); } catch (_) { /* ignore */ }
  };
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 25000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const markAll = async () => { try { await api.post("/notifications/read-all"); refresh(); } catch (_) { /* ignore */ } };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open) refresh(); }}
        className="relative text-white/70 hover:text-white p-2 !bg-transparent"
        data-testid="notification-bell-btn"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {data.unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold flex items-center justify-center rounded-full"
            style={{ background: "var(--ember)", color: "#fff" }}
            data-testid="notification-unread-count"
          >
            {data.unread > 9 ? "9+" : data.unread}
          </span>
        )}
      </button>
      {open && (
        <div className="shell-card absolute right-0 mt-2 w-80 shadow-2xl z-50 overflow-hidden" data-testid="notification-dropdown">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--shell-hairline)" }}>
            <div className="text-xs tracking-widest uppercase text-slate font-mono">Notifications</div>
            {data.unread > 0 && (
              <button onClick={markAll} className="text-xs text-[var(--volt)] hover:underline inline-flex items-center gap-1 !bg-transparent" data-testid="notif-mark-all-read">
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-auto">
            {data.items.length === 0 && (
              <div className="p-8 text-center text-slate text-sm" data-testid="notif-empty">No notifications yet.</div>
            )}
            {data.items.map((n) => (
              <Link
                to={n.link || "#"}
                key={n.id}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 hover:bg-white/5"
                style={{
                  borderBottom: "1px solid var(--shell-hairline)",
                  background: !n.read ? "rgba(61,76,255,0.06)" : "transparent",
                }}
                data-testid={`notif-${n.id}`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: "var(--cobalt)" }} />}
                  <div className="flex-1">
                    <div className="text-sm text-white">{n.title}</div>
                    <div className="text-xs text-slate mt-0.5">{n.message}</div>
                    <div className="text-[10px] text-slate mt-1 opacity-70 font-mono">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
