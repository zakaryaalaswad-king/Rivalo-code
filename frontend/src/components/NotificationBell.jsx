import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { Bell, CheckCheck } from "lucide-react";

export default function NotificationBell() {
  const [data, setData] = useState({ items: [], unread: 0 });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const refresh = async () => {
    try { const { data } = await api.get("/notifications"); setData(data); } catch (e) { console.error("Notifications refresh failed", e); }
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

  const markAll = async () => { try { await api.post("/notifications/read-all"); refresh(); } catch (e) { console.error("Mark all read failed", e); } };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen((o) => !o); if (!open) refresh(); }} className="relative text-slate-300 hover:text-white p-2" data-testid="notification-bell-btn" aria-label="Notifications">
        <Bell size={18} />
        {data.unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#3B82F6] text-black text-[10px] font-bold flex items-center justify-center" data-testid="notification-unread-count">
            {data.unread > 9 ? "9+" : data.unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0A0C22] border border-white/10 backdrop-blur-xl shadow-2xl z-50" data-testid="notification-dropdown">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="text-xs tracking-widest uppercase text-slate-400">Notifications</div>
            {data.unread > 0 && (
              <button onClick={markAll} className="text-xs text-[#3B82F6] hover:underline inline-flex items-center gap-1" data-testid="notif-mark-all-read">
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-auto">
            {data.items.length === 0 && <div className="p-8 text-center text-slate-500 text-sm" data-testid="notif-empty">No notifications yet.</div>}
            {data.items.map((n) => (
              <Link to={n.link || "#"} key={n.id} onClick={() => setOpen(false)} className={`block px-4 py-3 border-b border-white/5 hover:bg-white/5 ${!n.read ? "bg-[#3B82F6]/5" : ""}`} data-testid={`notif-${n.id}`}>
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#3B82F6] shrink-0" />}
                  <div className="flex-1">
                    <div className="text-sm">{n.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{n.message}</div>
                    <div className="text-[10px] text-slate-600 mt-1">{new Date(n.created_at).toLocaleString()}</div>
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
