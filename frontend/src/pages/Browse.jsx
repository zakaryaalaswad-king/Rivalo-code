import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { Clock, Users, DollarSign, Search } from "lucide-react";

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const cat = searchParams.get("category") || "All";

  useEffect(() => { api.get("/categories").then((r) => setCats(["All", ...r.data])); }, []);
  useEffect(() => {
    const params = {};
    if (cat && cat !== "All") params.category = cat;
    if (q) params.q = q;
    api.get("/projects", { params }).then((r) => setProjects(r.data));
  }, [cat, q]);

  const setCat = (c) => {
    const next = new URLSearchParams(searchParams);
    if (c === "All") next.delete("category"); else next.set("category", c);
    setSearchParams(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <span className="pill">The Briefs</span>
          <h1 className="font-display text-4xl lg:text-5xl mt-4">Open arenas</h1>
        </div>
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search briefs…" className="w-full pl-10 pr-4 py-3" data-testid="browse-search-input" />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2" data-testid="browse-categories">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`px-4 py-2 text-xs tracking-wider uppercase border transition-colors ${cat === c ? "border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5" : "border-white/10 text-slate-400 hover:text-white"}`} data-testid={`cat-filter-${c}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-500" data-testid="browse-empty">No open briefs match. Be the first to post one.</div>
        )}
        {projects.map((p) => <ProjectCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}

export function ProjectCard({ p }) {
  const isInProgress = p.status === "in_progress";
  return (
    <Link to={`/projects/${p.id}`} className={`block bg-[#0A0C22] border ${isInProgress ? "border-[#D4AF37]/40" : "border-white/10"} p-6 hover:-translate-y-1 hover:border-[#D4AF37]/60 transition-all relative overflow-hidden`} data-testid={`project-card-${p.id}`}>
      {isInProgress && <div className="absolute top-3 right-3 bg-[#D4AF37] text-black text-[10px] tracking-widest uppercase px-2 py-1">Live</div>}
      <div className="text-xs tracking-widest text-[#8B5CF6] uppercase">{p.category}</div>
      <div className="font-display text-2xl mt-3 leading-tight">{p.title}</div>
      <div className="text-slate-400 text-sm mt-2 line-clamp-2">{p.description}</div>
      <div className="mt-5 flex items-center gap-4 text-xs text-slate-300">
        <span className="inline-flex items-center gap-1.5"><DollarSign size={12} className="text-[#D4AF37]" /><span className="font-mono">{p.budget.toFixed(0)}</span></span>
        <span className="inline-flex items-center gap-1.5"><Clock size={12} className="text-[#D4AF37]" />{p.duration_hours}h</span>
        <span className="inline-flex items-center gap-1.5"><Users size={12} className="text-[#D4AF37]" />{p.max_competitors} seats</span>
      </div>
      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
        <span className="text-slate-500">by {p.client_name || "Anonymous"}</span>
        <span className="text-[#D4AF37]">Enter →</span>
      </div>
    </Link>
  );
}
