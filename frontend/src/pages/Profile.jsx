import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import api, { API_BASE, formatApiError } from "../lib/api";
import FileUploader from "../components/FileUploader";
import TrustRing from "../components/TrustRing";
import VerifyEmailModal from "../components/VerifyEmailModal";
import { useNavigate } from "react-router-dom";
import { Camera, CheckCircle2, AlertCircle, Linkedin, Twitter, Instagram, Github, Globe, Plus, Trash2, Award, Trophy, Sparkles, CreditCard, Wallet, Bitcoin, Mail } from "lucide-react";

const SOCIAL_FIELDS = [
  { k: "linkedin", icon: Linkedin, label: "LinkedIn URL" },
  { k: "twitter", icon: Twitter, label: "Twitter / X" },
  { k: "instagram", icon: Instagram, label: "Instagram" },
  { k: "behance", icon: Globe, label: "Behance" },
  { k: "github", icon: Github, label: "GitHub" },
  { k: "website", icon: Globe, label: "Website" },
];

export default function Profile() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [showVerify, setShowVerify] = useState(false);

  useEffect(() => {
    if (user && user !== false) {
      setForm({
        name: user.name || "",
        headline: user.headline || "",
        bio: user.bio || "",
        age: user.age || "",
        phone: user.phone || "",
        location: user.location || "",
        languages: (user.languages || []).join(", "),
        hourly_rate: user.hourly_rate || "",
        skills: (user.skills || []).join(", "),
        avatar_url: user.avatar_url || "",
        cv_url: user.cv_url || "",
        portfolio: (user.portfolio || []).map((u) => ({ url: u, filename: u.split("/").pop(), content_type: "" })),
        social_links: { ...(user.social_links || {}) },
        former_projects: [...(user.former_projects || [])],
        payout_methods: { ...(user.payout_methods || {}) },
      });
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user || user === false || !form) return <div className="p-10 text-muted">Loading…</div>;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSocial = (k, v) => setForm((f) => ({ ...f, social_links: { ...f.social_links, [k]: v } }));
  const setPayout = (k, v) => setForm((f) => ({ ...f, payout_methods: { ...f.payout_methods, [k]: v } }));
  const addProj = () => setForm((f) => ({ ...f, former_projects: [...f.former_projects, { title: "", url: "", image: "", description: "" }] }));
  const setProj = (i, k, v) => setForm((f) => ({ ...f, former_projects: f.former_projects.map((p, idx) => idx === i ? { ...p, [k]: v } : p) }));
  const removeProj = (i) => setForm((f) => ({ ...f, former_projects: f.former_projects.filter((_, idx) => idx !== i) }));

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      set("avatar_url", data.url);
    } catch (e2) { setErr(formatApiError(e2)); }
  };
  const uploadCv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      set("cv_url", data.url);
    } catch (e2) { setErr(formatApiError(e2)); }
  };

  const save = async (e) => {
    e.preventDefault();
    setErr(""); setSuccess(""); setSaving(true);
    try {
      const payload = {
        ...form,
        age: form.age ? parseInt(form.age) : null,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
        languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        portfolio: form.portfolio.map((p) => p.url),
        former_projects: form.former_projects.filter((p) => p.title || p.url),
        payout_methods: form.payout_methods,
      };
      await api.patch("/users/me", payload);
      await refresh();
      setSuccess("Profile saved · trust points recalculated.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (e2) { setErr(formatApiError(e2)); }
    finally { setSaving(false); }
  };

  const token = sessionStorage.getItem("ab_token") || "";
  const avatarFull = form.avatar_url ? (form.avatar_url.startsWith("http") ? form.avatar_url : `${API_BASE.replace(/\/api$/, "")}${form.avatar_url}?auth=${token}`) : "";

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-12">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <span className="pill">Profile management</span>
          <h1 className="font-display text-4xl lg:text-5xl mt-4">{user.name}</h1>
          <div className="text-muted text-sm mt-2 flex flex-wrap items-center gap-3">
            <span>{user.email}</span>
            {user.email_verified
              ? <span className="chip chip-green inline-flex items-center gap-1"><CheckCircle2 size={12}/> Email verified</span>
              : <button onClick={() => setShowVerify(true)} className="chip chip-amber inline-flex items-center gap-1" data-testid="profile-verify-email-btn"><AlertCircle size={12}/> Verify email</button>
            }
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs tracking-widest uppercase text-muted">Plan</div>
            <div className="font-display text-2xl capitalize flex items-center gap-1.5 justify-end" data-testid="profile-plan">
              {user.plan === "free" ? <span className="text-muted">Free</span> :
               user.plan === "basic" ? <span style={{color:"#22C55E"}}>🟢 Basic</span> :
               user.plan === "pro" ? <span style={{color:"#3B82F6"}}>🔵 Pro</span> :
               user.plan === "business" ? <span style={{color:"#A855F7"}}>🟣 Business</span> : user.plan}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs tracking-widest uppercase text-muted">Wins</div>
            <div className="font-display text-3xl text-[#22C55E] flex items-center gap-2 justify-end" data-testid="profile-wins"><Trophy size={20}/>{user.wins || 0}</div>
          </div>
          <TrustRing points={user.trust_points || 0} size={92} />
        </div>
      </div>

      <form onSubmit={save} className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6" data-testid="profile-form">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-1">
          <Card title="Avatar">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                {avatarFull ? <img src={avatarFull} alt="" className="w-full h-full object-cover" /> : <Camera className="text-slate-500" />}
              </div>
              <div className="flex-1">
                <label className="btn-ghost inline-flex items-center gap-2 cursor-pointer text-sm" data-testid="profile-avatar-btn">
                  <Camera size={14}/> Upload photo
                  <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" data-testid="profile-avatar-input" />
                </label>
                {form.avatar_url && <button type="button" onClick={() => set("avatar_url", "")} className="block text-xs text-red-300 mt-2">Remove</button>}
              </div>
            </div>
          </Card>

          <Card title="Identity">
            <Field label="Full name"><input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full px-4 py-2.5" data-testid="profile-name-input" /></Field>
            <Field label="Headline (one line)"><input value={form.headline} onChange={(e) => set("headline", e.target.value)} maxLength={80} placeholder="Brand designer · 7 years" className="w-full px-4 py-2.5" data-testid="profile-headline-input"/></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age"><input type="number" min={16} max={99} value={form.age} onChange={(e) => set("age", e.target.value)} className="w-full px-4 py-2.5" data-testid="profile-age-input"/></Field>
              <Field label="Location"><input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Cairo, EG" className="w-full px-4 py-2.5" data-testid="profile-location-input"/></Field>
            </div>
            <Field label="Phone"><input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+20 100 123 4567" className="w-full px-4 py-2.5" data-testid="profile-phone-input"/></Field>
            <Field label="Languages (comma-separated)"><input value={form.languages} onChange={(e) => set("languages", e.target.value)} placeholder="English, Arabic" className="w-full px-4 py-2.5" data-testid="profile-languages-input"/></Field>
            <Field label="Hourly rate (USD)"><input type="number" min={0} value={form.hourly_rate} onChange={(e) => set("hourly_rate", e.target.value)} className="w-full px-4 py-2.5" data-testid="profile-rate-input"/></Field>
          </Card>

          <Card title="CV / Resume">
            {form.cv_url ? (
              <div className="flex items-center justify-between">
                <a href={`${API_BASE.replace(/\/api$/, "")}${form.cv_url}?auth=${token}`} target="_blank" rel="noreferrer" className="text-[#3B82F6] underline text-sm">Open uploaded CV</a>
                <button type="button" onClick={() => set("cv_url", "")} className="text-xs text-red-300">Remove</button>
              </div>
            ) : (
              <label className="btn-ghost inline-flex items-center gap-2 cursor-pointer text-sm" data-testid="profile-cv-btn">
                <Award size={14}/> Upload CV (PDF)
                <input type="file" accept="application/pdf" onChange={uploadCv} className="hidden" data-testid="profile-cv-input"/>
              </label>
            )}
            <div className="text-xs text-muted mt-2">PDF · max 10MB</div>
          </Card>
        </div>

        {/* Middle + right column */}
        <div className="space-y-6 lg:col-span-2">
          <Card title="About you">
            <Field label="Bio (aim for 120+ chars for full trust)">
              <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={5} placeholder="Who are you, what do you craft, what makes your work different?" className="w-full px-4 py-3" data-testid="profile-bio-input"/>
              <div className="text-xs text-muted mt-1">{form.bio.length} chars</div>
            </Field>
            <Field label="Skills (comma-separated · 5+ for trust)">
              <input value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="Branding, Logo, Typography, UI, Motion" className="w-full px-4 py-2.5" data-testid="profile-skills-input"/>
            </Field>
          </Card>

          <Card title="Social presence">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SOCIAL_FIELDS.map(({ k, icon: I, label }) => (
                <Field key={k} label={label}>
                  <div className="relative">
                    <I size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={form.social_links[k] || ""} onChange={(e) => setSocial(k, e.target.value)} placeholder="https://…" className="w-full pl-9 pr-3 py-2.5" data-testid={`profile-social-${k}`}/>
                  </div>
                </Field>
              ))}
            </div>
            <div className="text-xs text-muted mt-2">Add 2+ for trust · 4+ for max social trust.</div>
          </Card>

          <Card title="Portfolio (3+ for trust)">
            <FileUploader value={form.portfolio} onChange={(arr) => set("portfolio", arr)} max={10} />
          </Card>

          <Card title="Former projects (3+ for trust)">
            <div className="space-y-4">
              {form.former_projects.length === 0 && <div className="text-muted text-sm">Add past work the client can verify. Title + link or image is enough.</div>}
              {form.former_projects.map((p, i) => (
                <div key={p.__id || p.url || `fp-${i}`} className="border border-white/10 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid={`former-project-${i}`}>
                  <Field label="Title"><input value={p.title} onChange={(e) => setProj(i, "title", e.target.value)} className="w-full px-3 py-2"/></Field>
                  <Field label="Public URL"><input value={p.url} onChange={(e) => setProj(i, "url", e.target.value)} placeholder="https://…" className="w-full px-3 py-2"/></Field>
                  <Field label="Image URL (optional)"><input value={p.image} onChange={(e) => setProj(i, "image", e.target.value)} placeholder="https://…" className="w-full px-3 py-2"/></Field>
                  <Field label="Short description"><input value={p.description} onChange={(e) => setProj(i, "description", e.target.value)} className="w-full px-3 py-2"/></Field>
                  <div className="sm:col-span-2 text-right">
                    <button type="button" onClick={() => removeProj(i)} className="text-red-300 text-xs inline-flex items-center gap-1"><Trash2 size={12}/> Remove</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addProj} className="btn-ghost text-sm inline-flex items-center gap-2" data-testid="add-former-project-btn"><Plus size={14}/> Add former project</button>
            </div>
          </Card>

          <Card title="Trust ladder">
            <TrustChecklist user={user} />
          </Card>}
          {success && <div className="text-[#22C55E] text-sm inline-flex items-center gap-2"><Sparkles size={14}/>{success}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={() => nav(-1)} className="btn-ghost" data-testid="profile-cancel-btn">Cancel</button>
            <button disabled={saving} className="btn-primary flex-1" data-testid="profile-save-btn">{saving ? "Saving…" : "Save profile"}</button>
          </div>
        </div>
      </form>

      {showVerify && <VerifyEmailModal onClose={() => setShowVerify(false)} onVerified={refresh} />}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="card p-6">
      <div className="text-xs tracking-[0.2em] uppercase text-muted mb-4">{title}</div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Field({ label, children }) {
  return (<div><label className="text-xs text-muted">{label}</label><div className="mt-1">{children}</div></div>);
}
function PayField({ icon, label, value, onChange, placeholder, testid }) {
  return (
    <div>
      <label className="text-xs text-muted inline-flex items-center gap-1.5">{icon} {label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full mt-1 px-4 py-2.5" data-testid={testid} />
    </div>
  );
}

const VisaIcon = () => (
  <svg width="22" height="14" viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="20" rx="3" fill="#1A1F71"/><text x="16" y="14" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="9" fill="#F8FAFC" letterSpacing="0.5">VISA</text></svg>
);
const PayPalIcon = () => (
  <svg width="22" height="14" viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="20" rx="3" fill="#F8FAFC"/><text x="16" y="14" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="7" fill="#003087" letterSpacing="0">PayPal</text></svg>
);
const WiseIcon = () => (
  <svg width="22" height="14" viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="20" rx="3" fill="#163300"/><text x="16" y="14" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="9" fill="#9FE870">wise</text></svg>
);

function TrustChecklist({ user }) {
  const items = [
    { ok: !!user.avatar_url, pts: 5, label: "Upload profile photo" },
    { ok: !!user.email_verified, pts: 10, label: "Verify email" },
    { ok: !!user.phone, pts: 5, label: "Add phone number" },
    { ok: !!user.phone_verified, pts: 5, label: "Verify phone (coming soon)" },
    { ok: !!user.cv_url, pts: 10, label: "Upload CV" },
    { ok: (user.bio || "").length >= 120, pts: 5, label: "Bio ≥ 120 characters" },
    { ok: (user.skills || []).length >= 5, pts: 5, label: "5+ skills" },
    { ok: (user.portfolio || []).length >= 3, pts: 5, label: "3+ portfolio items" },
    { ok: Object.values(user.social_links || {}).filter(Boolean).length >= 2, pts: 5, label: "2+ social links" },
    { ok: Object.values(user.social_links || {}).filter(Boolean).length >= 4, pts: 5, label: "4+ social links" },
    { ok: (user.former_projects || []).length >= 3, pts: 10, label: "3+ former projects" },
    { ok: (user.wins || 0) >= 1, pts: 15, label: "Win 1 competition" },
    { ok: (user.wins || 0) >= 3, pts: 15, label: "Win 3 competitions" },
    { ok: (user.wins || 0) >= 5, pts: 10, label: "Win 5 competitions" },
  ];
  return (
    <ul className="space-y-2" data-testid="trust-checklist">
      {items.map((it) => (
        <li key={it.label} className={`flex items-center justify-between text-sm ${it.ok ? "text-slate-300" : "text-muted"}`}>
          <span className="inline-flex items-center gap-2">
            {it.ok ? <CheckCircle2 size={14} className="text-[#22C55E]"/> : <span className="w-3.5 h-3.5 rounded-full border border-slate-500 inline-block"/>}
            {it.label}
          </span>
          <span className={`font-mono text-xs ${it.ok ? "text-[#22C55E]" : "text-muted"}`}>+{it.pts}</span>
        </li>
      ))}
    </ul>
  );
}
