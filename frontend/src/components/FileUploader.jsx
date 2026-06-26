import { useRef, useState } from "react";
import api, { API_BASE, formatApiError } from "../lib/api";
import { Upload, X, FileText } from "lucide-react";

// Uploads files via /api/upload and stores returned URLs (relative paths like /api/files/...)
export default function FileUploader({ value = [], onChange, max = 5, accept = "image/*,application/pdf,video/mp4" }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const fullUrl = (relUrl) => {
    if (!relUrl) return "";
    if (relUrl.startsWith("http")) return relUrl;
    const token = sessionStorage.getItem("ab_token") || "";
    const sep = relUrl.includes("?") ? "&" : "?";
    return `${API_BASE.replace(/\/api$/, "")}${relUrl}${token ? `${sep}auth=${token}` : ""}`;
  };

  const onPick = async (e) => {
    setErr("");
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (value.length + files.length > max) { setErr(`Max ${max} files`); return; }
    setBusy(true);
    try {
      const newItems = [];
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        newItems.push({ url: data.url, filename: data.filename, content_type: data.content_type });
      }
      onChange([...value, ...newItems]);
    } catch (e2) { setErr(formatApiError(e2)); }
    finally { setBusy(false); if (ref.current) ref.current.value = ""; }
  };

  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div data-testid="file-uploader">
      <input ref={ref} type="file" accept={accept} multiple onChange={onPick} className="hidden" data-testid="file-uploader-input" />
      <button type="button" onClick={() => ref.current?.click()} disabled={busy || value.length >= max}
        className="inline-flex items-center gap-2 px-4 py-2 border border-white/20 hover:border-[#3B82F6] text-sm disabled:opacity-50" data-testid="file-uploader-btn">
        <Upload size={14} /> {busy ? "Uploading…" : `Add files (${value.length}/${max})`}
      </button>
      {err && <div className="text-red-400 text-xs mt-2">{err}</div>}
      {value.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {value.map((f, i) => {
            const isImg = (f.content_type || "").startsWith("image/");
            return (
              <div key={f.url || i} className="relative border border-white/10 bg-[#101230] p-2 group" data-testid={`file-item-${i}`}>
                {isImg ? (
                  <img src={fullUrl(f.url)} alt={f.filename} className="w-full h-24 object-cover" />
                ) : (
                  <div className="w-full h-24 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <FileText size={20} /> <span className="mt-1 truncate w-full text-center px-1">{f.filename}</span>
                  </div>
                )}
                <button type="button" onClick={() => remove(i)} className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`file-remove-${i}`}>
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { FileUploader };
