import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { ProjectCard } from "./Browse";
import Countdown from "../components/Countdown";
import { Trophy, PlusCircle } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [myProjects, setMyProjects] = useState([]);
  const [comps, setComps] = useState([]);
  const [tab, setTab] = useState("client");

  useEffect(() => {
    api.get("/projects", { params: { mine: true } }).then((r) => setMyProjects(r.data)).catch((e) => console.error("Load my projects failed", e));
    api.get("/dashboard/freelancer").then((r) => setComps(r.data.competitions || [])).catch((e) => console.error("Load competitions failed", e));
  }, []);

  if (!user || user === false) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <span className="pill">Your console</span>
          <h1 className="font-display text-4xl lg:text-5xl mt-4">Welcome, {user.name}</h1>
          <p className="text-slate-400 mt-2 text-sm">{user.email}</p>
        </div>
        <Link to="/post" className="bg-[#3B82F6] text-black px-6 py-3 font-semibold hover:bg-[#60A5FA] inline-flex items-center gap-2" data-testid="dashboard-post-btn">
          <PlusCircle size={16} /> Post a brief
        </Link>
      </div>

      <div className="mt-10 border-b border-white/10 flex gap-8" data-testid="dashboard-tabs">
        {[
          { id: "client", label: `As Client (${myProjects.length})` },
          { id: "freelancer", label: `As Freelancer (${comps.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`pb-3 text-sm tracking-wide ${tab === t.id ? "text-[#3B82F6] border-b-2 border-[#3B82F6]" : "text-slate-400 hover:text-white"}`} data-testid={`dashboard-tab-${t.id}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "client" && (
        <div className="mt-8">
          {myProjects.length === 0 ? (
            <div className="text-center py-20 bg-[#0A0C22] border border-white/10" data-testid="client-empty">
              <Trophy className="text-[#3B82F6] mx-auto" size={28} />
              <div className="font-display text-2xl mt-4">No briefs yet</div>
              <p className="text-slate-400 mt-2 text-sm">Post your first brief and watch talent line up.</p>
              <Link to="/post" className="mt-6 inline-block bg-[#3B82F6] text-black px-6 py-3 font-semibold hover:bg-[#60A5FA]">Post a brief</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProjects.map((p) => <ProjectCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      )}

      {tab === "freelancer" && (
        <div className="mt-8 space-y-4">
          {comps.length === 0 ? (
            <div className="text-center py-20 bg-[#0A0C22] border border-white/10" data-testid="freelancer-empty">
              <Trophy className="text-[#3B82F6] mx-auto" size={28} />
              <div className="font-display text-2xl mt-4">No competitions yet</div>
              <Link to="/browse" className="mt-6 inline-block bg-[#3B82F6] text-black px-6 py-3 font-semibold hover:bg-[#60A5FA]">Browse open briefs</Link>
            </div>
          ) : (
            comps.map(({ application, project }) => (
              <Link to={`/projects/${project.id}`} key={application.id} className="block bg-[#0A0C22] border border-white/10 p-6 hover:border-[#3B82F6]/40 transition-colors" data-testid={`comp-${application.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs tracking-widest text-[#8B5CF6] uppercase">{project.category}</div>
                    <div className="font-display text-2xl mt-2">{project.title}</div>
                    <div className="text-sm text-slate-400 mt-1">Status: <span className={
                      application.status === "approved" ? "text-[#3B82F6]" :
                      application.status === "rejected" ? "text-red-400" : "text-slate-300"
                    }>{application.status}</span> · Bounty <span className="font-mono">${project.budget}</span></div>
                  </div>
                  {application.status === "approved" && project.competition_deadline && project.status === "in_progress" && (
                    <Countdown deadline={project.competition_deadline} />
                  )}
                  {project.status === "completed" && project.winner_user_id === application.user_id && (
                    <div className="inline-flex items-center gap-2 text-[#3B82F6] font-medium"><Trophy size={16} /> You won this</div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
