import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { Clock, Users, DollarSign, Search, Filter, ArrowUpDown, Flame, Trophy } from "lucide-react";

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "budget_desc", label: "Highest bounty" },
  { id: "budget_asc", label: "Lowest bounty" },
  { id: "deadline", label: "Shortest deadline" },
];

const STATUS_TABS = [
  { id: "all", label: "All", color: "" },
  { id: "open", label: "Open · accepting", color: "chip-green" },
  { id: "in_progress", label: "Live competitions", color: "chip" },
  { id: "completed", label: "Completed", color: "chip-amber" },
];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [minBudget, setMinBudget] = useState(parseInt(searchParams.get("min")) || 0);
  const cat = searchParams.get("category") || "All";
  const status = searchParams.get("status") || "all";

  useEffect(() => { api.get("/categories").then((r) => setCats(["All", ...r.data])); }, []);
  useEffect(() => {
    const params = {};
    if (cat && cat !== "All") params.category = cat;
    if (q) params.q = q;
    if (status !== "all") params.status = status;
    api.get("/projects", { params }).then((r) => setProjects(r.data));
  }, [cat, q, status]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(searchParams);
    if (!v || v === "All" || v === "all" || v === "newest" || v === 0) next.delete(k); else next.set(k, v);
    setSearchParams(next);
  };
  const setCat = (c) => setParam("category", c);
  const setStatus = (s) => setParam("status", s);
  const setSortParam = (s) => { setSort(s); setParam("sort", s); };
  const setMin = (v) => { setMinBudget(v); setParam("min", v); };

  const sorted = useMemo(() => {
    const filtered = projects.filter((p) => p.budget >= minBudget);
    const arr = [...filtered];
    if (sort === "budget_desc") arr.sort((a, b) => b.budget - a.budget);
    else if (sort === "budget_asc") arr.sort((a, b) => a.budget - b.budget);
    else if (sort === "deadline") arr.sort((a, b) => a.duration_hours - b.duration_hours);
    else arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return arr;
  }, [projects, sort, minBudget]);

  const liveCount = projects.filter((p) => p.status === "in_progress").length;
  const totalBounty = projects.reduce((s, p) => s + (p.budget || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <span className="pill">The Briefs</span>
          <h1 className="font-display text-4xl lg:text-5xl mt-4">Open arenas</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="chip"><Flame size={12} /> {liveCount} live now</span>
            <span className="chip chip-green"><DollarSign size={12} /> ${totalBounty.toFixed(0)} in play</span>
            <span className="chip"><Users size={12} /> {projects.length} briefs</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search briefs…" className="w-full pl-10 pr-4 py-3" data-testid="browse-search-input" />
          </div>
          <div className="relative">
            <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select value={sort} onChange={(e) => setSortParam(e.target.value)} className="pl-9 pr-8 py-3 appearance-none" data-testid="browse-sort-select">
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Status tabs */}
      <div className="mt-8 flex flex-wrap gap-2" data-testid="browse-status-tabs">
        {STATUS_TABS.map((s) => (
          <button key={s.id} onClick={() => setStatus(s.id)} className={`px-4 py-2 text-xs tracking-wider uppercase rounded-full border transition-all ${status === s.id ? "bg-[#3B82F6] text-white border-[#3B82F6]" : "border-white/10 text-slate-400 hover:text-white hover:border-white/30"}`} data-testid={`browse-status-${s.id}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Category chips */}
      <div className="mt-3 flex flex-wrap gap-2" data-testid="browse-categories">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 text-xs rounded-full border transition-all ${cat === c ? "border-[#22C55E] text-[#22C55E] bg-[#22C55E]/5" : "border-white/10 text-slate-400 hover:text-white hover:border-white/30"}`} data-testid={`cat-filter-${c}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Budget slider */}
      <div className="mt-6 card p-4 flex items-center gap-4 max-w-xl">
        <Filter size={14} className="text-[#3B82F6]" />
        <div className="text-xs text-muted whitespace-nowrap">Min bounty</div>
        <input type="range" min="0" max="2000" step="50" value={minBudget} onChange={(e) => setMin(parseInt(e.target.value))} className="flex-1" data-testid="browse-budget-slider" style={{ accentColor: "#3B82F6" }} />
        <div className="font-mono text-sm text-[#22C55E] w-16 text-right">${minBudget}</div>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sorted.length === 0 && (
          <div className="col-span-full text-center py-20 text-muted" data-testid="browse-empty">No briefs match. Try widening your filters.</div>
        )}
        {sorted.map((p) => <ProjectCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}

export function ProjectCard({ p }) {
  const isInProgress = p.status === "in_progress";
  const isCompleted = p.status === "completed";
  return (
    <Link to={`/projects/${p.id}`} className={`block card p-6 transition-all hover:-translate-y-1 ${isInProgress ? "border-[#3B82F6]/50 hover:border-[#3B82F6]" : isCompleted ? "border-[#22C55E]/40 hover:border-[#22C55E]" : "hover:border-white/30"} relative overflow-hidden`} data-testid={`project-card-${p.id}`}>
      <div className="absolute top-3 right-3 flex gap-1.5">
        {isInProgress && <span className="chip"><Flame size={10} /> Live</span>}
        {isCompleted && <span className="chip chip-green"><Trophy size={10} /> Won</span>}
      </div>
      <div className="text-xs tracking-widest text-[#3B82F6] uppercase">{p.category}</div>
      <div className="font-display text-2xl mt-3 leading-tight">{p.title}</div>
      <div className="text-muted text-sm mt-2 line-clamp-2">{p.description}</div>
      <div className="mt-5 flex items-center gap-4 text-xs text-slate-300">
        <span className="inline-flex items-center gap-1.5"><DollarSign size={12} className="text-[#22C55E]" /><span className="font-mono">{p.budget.toFixed(0)}</span></span>
        <span className="inline-flex items-center gap-1.5"><Clock size={12} className="text-[#3B82F6]" />{p.duration_hours}h</span>
        <span className="inline-flex items-center gap-1.5"><Users size={12} className="text-[#3B82F6]" />{p.max_competitors} seats</span>
      </div>
      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
        <span className="text-muted">by {p.client_name || "Anonymous"}</span>
        <span className="text-[#3B82F6]">Enter →</span>
      </div>
    </Link>
  );
}
