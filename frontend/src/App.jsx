import { useState, useEffect, useCallback } from "react";

// ── Token helpers ─────────────────────────────────────────────────────────────
const TOKEN_KEY = "ai_coach_token";
const getToken  = ()      => localStorage.getItem(TOKEN_KEY);
const setToken  = (t)     => localStorage.setItem(TOKEN_KEY, t);
const clearToken= ()      => localStorage.removeItem(TOKEN_KEY);

// ── API helpers ───────────────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const authHeader = () => {
  const t = getToken();
  return t ? { "Authorization": `Bearer ${t}` } : {};
};

const api = {
  get:    (path)       => fetch(`${BASE}${path}`, { headers: { ...authHeader() } }).then(r => r.json()),
  post:   (path, body) => fetch(`${BASE}${path}`, { method: "POST",  headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify(body) }).then(r => r.json()),
  put:    (path, body) => fetch(`${BASE}${path}`, { method: "PUT",   headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify(body) }).then(r => r.json()),
  patch:  (path, body) => fetch(`${BASE}${path}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify(body ?? {}) }).then(r => r.json()),
  delete: (path)       => fetch(`${BASE}${path}`, { method: "DELETE", headers: { ...authHeader() } }).then(r => r.json()),
};

// ── Coach Engine (rule-based) ─────────────────────────────────────────────────
function getCoachSuggestions(tasks, habits) {
  const suggestions = [];
  const completed = tasks.filter(t => t.is_completed).length;
  const pending   = tasks.filter(t => !t.is_completed).length;
  const overdue   = tasks.filter(t => !t.is_completed && t.deadline && new Date(t.deadline) < new Date()).length;
  const highPri   = tasks.filter(t => !t.is_completed && t.priority === "high").length;

  if (tasks.length === 0)    suggestions.push({ icon: "🚀", text: "Get started — add your first task!" });
  else if (overdue > 0)      suggestions.push({ icon: "⚠️", text: `${overdue} overdue task${overdue > 1 ? "s" : ""} — tackle them first!` });
  else if (highPri > 0)      suggestions.push({ icon: "🎯", text: `${highPri} high-priority task${highPri > 1 ? "s" : ""} waiting. Focus up!` });
  else if (completed < 2)    suggestions.push({ icon: "✅", text: "Try completing at least 2 tasks today to build momentum." });
  else if (pending > 5)      suggestions.push({ icon: "📋", text: "Heavy workload — prioritize what matters most today." });
  else if (pending === 0)    suggestions.push({ icon: "🎉", text: "You completed everything! Amazing work!" });

  if (habits.length === 0) {
    suggestions.push({ icon: "🌱", text: "Start tracking daily habits to build lasting routines." });
  } else {
    const maxStreak = Math.max(...habits.map(h => h.streak));
    if (maxStreak >= 7)       suggestions.push({ icon: "🔥", text: `${maxStreak}-day streak! Keep that fire going!` });
    else if (maxStreak >= 3)  suggestions.push({ icon: "⭐", text: "Great consistency — you're building real habits." });
    else                      suggestions.push({ icon: "💪", text: "Check in daily to rebuild your habit streak!" });
  }

  if (suggestions.length < 2) {
    suggestions.push({ icon: "🌟", text: "Everything's on track — keep it up!" });
  }
  return suggestions;
}

// ── Shared UI components ──────────────────────────────────────────────────────
function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: "#1a1a2e", color: "#e8d5b7", padding: "12px 20px",
      borderRadius: 10, fontSize: 14, fontFamily: "'Lora', serif",
      border: "1px solid #f4a261", boxShadow: "0 4px 20px rgba(0,0,0,.4)",
      animation: "slideIn .3s ease", maxWidth: 300
    }}>{msg}</div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#1a1a2e", border: "1px solid #f4a261", borderRadius: 16,
        padding: "28px 32px", width: "100%", maxWidth: 460,
        boxShadow: "0 8px 40px rgba(0,0,0,.6)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#f4a261", fontFamily: "'Playfair Display',serif", fontSize: 18 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#e8d5b7", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", color: "#c9a87c", fontSize: 12, marginBottom: 6, fontFamily: "'Lora',serif", letterSpacing: ".5px", textTransform: "uppercase" }}>{label}</label>}
    <input {...props} style={{
      width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #3a3a5c",
      background: "#0d0d1a", color: "#e8d5b7", fontFamily: "'Lora',serif", fontSize: 14,
      boxSizing: "border-box", outline: "none", transition: "border-color .2s",
      ...props.style
    }} onFocus={e => e.target.style.borderColor = "#f4a261"} onBlur={e => e.target.style.borderColor = "#3a3a5c"} />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", color: "#c9a87c", fontSize: 12, marginBottom: 6, fontFamily: "'Lora',serif", letterSpacing: ".5px", textTransform: "uppercase" }}>{label}</label>}
    <select {...props} style={{
      width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #3a3a5c",
      background: "#0d0d1a", color: "#e8d5b7", fontFamily: "'Lora',serif", fontSize: 14,
      boxSizing: "border-box", outline: "none", cursor: "pointer",
      ...props.style
    }}>{children}</select>
  </div>
);

const Btn = ({ children, variant = "primary", ...props }) => (
  <button {...props} style={{
    padding: variant === "small" ? "6px 14px" : "11px 24px",
    borderRadius: 8,
    border: variant === "ghost" ? "1px solid #3a3a5c" : "none",
    background: variant === "primary" ? "#f4a261" : variant === "danger" ? "#c0392b" : "transparent",
    color: variant === "primary" ? "#0d0d1a" : "#e8d5b7",
    fontFamily: "'Lora',serif", fontWeight: 700,
    fontSize: variant === "small" ? 12 : 14,
    cursor: props.disabled ? "not-allowed" : "pointer",
    opacity: props.disabled ? .6 : 1,
    transition: "all .2s", ...props.style
  }}>{children}</button>
);

const PRIORITY_COLORS = { high: "#e74c3c", medium: "#f39c12", low: "#27ae60" };
const PRIORITY_LABELS = { high: "🔴 High", medium: "🟡 Medium", low: "🟢 Low" };
const HABIT_CATEGORIES = ["general", "health", "fitness", "learning", "mindfulness", "productivity", "social", "other"];

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ["🏠 Home", "✅ Tasks", "🔁 Habits", "👤 Profile"];

// ════════════════════════════════════════════════════════════════════════════════
// AUTH SCREEN
// ════════════════════════════════════════════════════════════════════════════════
function AuthScreen({ onAuth }) {
  const [mode, setMode]   = useState("login"); // "login" | "register"
  const [form, setForm]   = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name,  email: form.email, password: form.password };

      const res = await api.post(path, body);
      if (res.success) {
        setToken(res.token);
        onAuth(res.data);
      } else {
        setError(res.message || "Something went wrong");
      }
    } catch {
      setError("Could not connect to server. Is the backend running?");
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div style={{
      minHeight: "100vh", background: "#0d0d1a",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🎯</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: "#f4a261", margin: 0 }}>
            AI Productivity Coach
          </h1>
          <p style={{ color: "#8888aa", marginTop: 6, fontSize: 13 }}>Track tasks, build habits, stay on track.</p>
        </div>

        {/* Card */}
        <div style={{
          background: "#1a1a2e", border: "1px solid #2a2a5e", borderRadius: 16,
          padding: "32px 28px", boxShadow: "0 8px 40px rgba(0,0,0,.5)"
        }}>
          {/* Mode tabs */}
          <div style={{ display: "flex", marginBottom: 24, borderRadius: 8, overflow: "hidden", border: "1px solid #2a2a5e" }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, padding: "10px", border: "none",
                background: mode === m ? "#f4a261" : "transparent",
                color: mode === m ? "#0d0d1a" : "#8888aa",
                fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 13, cursor: "pointer",
                textTransform: "capitalize"
              }}>{m === "login" ? "Sign In" : "Create Account"}</button>
            ))}
          </div>

          {mode === "register" && (
            <Input label="Your Name" value={form.name} onChange={update("name")}
              placeholder="e.g. Alex" onKeyDown={handleKey} autoFocus />
          )}
          <Input label="Email" type="email" value={form.email} onChange={update("email")}
            placeholder="you@example.com" onKeyDown={handleKey} autoFocus={mode === "login"} />
          <Input label="Password" type="password" value={form.password} onChange={update("password")}
            placeholder={mode === "register" ? "At least 6 characters" : "Your password"} onKeyDown={handleKey} />

          {error && (
            <div style={{ background: "#2d1a1a", border: "1px solid #c0392b", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#e74c3c", fontSize: 13 }}>
              {error}
            </div>
          )}

          <Btn onClick={submit} disabled={loading} style={{ width: "100%", marginTop: 4 }}>
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </Btn>

          {mode === "login" && (
            <p style={{ color: "#8888aa", fontSize: 12, textAlign: "center", marginTop: 16 }}>
              No account?{" "}
              <span onClick={() => setMode("register")} style={{ color: "#f4a261", cursor: "pointer" }}>
                Create one free
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser]     = useState(null);
  const [authed, setAuthed] = useState(false);
  const [tab, setTab]       = useState(0);
  const [tasks, setTasks]   = useState([]);
  const [habits, setHabits] = useState([]);
  const [toast, setToast]   = useState(null);
  const [loading, setLoading] = useState(true);

  const notify = msg => setToast(msg);

  // Try to restore session from stored token
  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    api.get("/auth/me").then(res => {
      if (res.success) { setUser(res.data); setAuthed(true); }
      else clearToken();
      setLoading(false);
    }).catch(() => { clearToken(); setLoading(false); });
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [t, h] = await Promise.all([api.get("/tasks"), api.get("/habits")]);
      if (t.success) setTasks(t.data);
      if (h.success) setHabits(h.data);
    } catch { notify("Failed to load data."); }
  }, []);

  useEffect(() => { if (authed) loadData(); }, [authed, loadData]);

  const handleAuth = (userData) => { setUser(userData); setAuthed(true); };

  const handleLogout = () => {
    clearToken();
    setUser(null); setAuthed(false);
    setTasks([]); setHabits([]);
    setTab(0);
    notify("Signed out.");
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0d0d1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, animation: "pulse 1.5s infinite" }}>⏳</div>
        <p style={{ color: "#8888aa", marginTop: 12, fontFamily: "'Lora',serif" }}>Loading…</p>
      </div>
    </div>
  );

  if (!authed) return (
    <>
      <GlobalStyles />
      <AuthScreen onAuth={handleAuth} />
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </>
  );

  const pages = [
    <HomePage  key="home"   tasks={tasks} habits={habits} notify={notify} />,
    <TaskPage  key="tasks"  tasks={tasks} setTasks={setTasks} notify={notify} />,
    <HabitPage key="habits" habits={habits} setHabits={setHabits} notify={notify} />,
    <ProfilePage key="prof" user={user} setUser={setUser} onLogout={handleLogout} notify={notify} />
  ];

  return (
    <>
      <GlobalStyles />
      <header style={{
        background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
        borderBottom: "1px solid #2a2a4e", padding: "16px 24px",
        display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 100
      }}>
        <span style={{ fontSize: 26 }}>🎯</span>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, color: "#f4a261", lineHeight: 1 }}>
            AI Productivity Coach
          </h1>
          {user && <p style={{ fontSize: 11, color: "#8888aa", marginTop: 2 }}>Welcome back, {user.name}</p>}
        </div>
      </header>

      <nav style={{
        display: "flex", borderBottom: "1px solid #2a2a4e", background: "#13132a",
        position: "sticky", top: 57, zIndex: 99, overflowX: "auto"
      }}>
        {TABS.map((label, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            flex: 1, minWidth: 82, padding: "13px 6px", border: "none", background: "none",
            color: tab === i ? "#f4a261" : "#8888aa",
            fontFamily: "'Lora',serif", fontSize: 12, fontWeight: tab === i ? 700 : 400,
            cursor: "pointer", borderBottom: tab === i ? "2px solid #f4a261" : "2px solid transparent",
            transition: "all .2s", whiteSpace: "nowrap"
          }}>{label}</button>
        ))}
      </nav>

      <main style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px", minHeight: "calc(100vh - 110px)" }}>
        {pages[tab]}
      </main>

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </>
  );
}

// ── Global CSS ────────────────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #0d0d1a; color: #e8d5b7; font-family: 'Lora', serif; min-height: 100vh; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: #0d0d1a; }
      ::-webkit-scrollbar-thumb { background: #3a3a5c; border-radius: 3px; }
      @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes pulse   { 0%,100%{ opacity:1 } 50%{ opacity:.4 } }
    `}</style>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ════════════════════════════════════════════════════════════════════════════════
function HomePage({ tasks, habits, notify }) {
  const suggestions = getCoachSuggestions(tasks, habits);
  const completed   = tasks.filter(t => t.is_completed).length;
  const pending     = tasks.filter(t => !t.is_completed).length;
  const topStreak   = habits.length ? Math.max(...habits.map(h => h.streak)) : 0;
  const overdue     = tasks.filter(t => !t.is_completed && t.deadline && new Date(t.deadline) < new Date()).length;

  return (
    <div style={{ animation: "fadeIn .4s ease" }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, marginBottom: 4, color: "#f4a261" }}>Dashboard</h2>
      <p style={{ color: "#8888aa", fontSize: 13, marginBottom: 24 }}>Your productivity at a glance</p>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Done",    value: completed, icon: "✅", color: "#2ecc71" },
          { label: "Pending", value: pending,   icon: "⏰", color: "#f39c12" },
          { label: "Overdue", value: overdue,   icon: "🚨", color: "#e74c3c" },
          { label: "Streak",  value: topStreak, icon: "🔥", color: "#e67e22" },
        ].map(s => (
          <div key={s.label} style={{
            background: "linear-gradient(135deg,#1a1a2e,#1e1e3e)", border: "1px solid #2a2a4e",
            borderRadius: 12, padding: "14px 8px", textAlign: "center"
          }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontFamily: "'Playfair Display',serif", color: s.color, fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#8888aa", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* AI Suggestions */}
      <div style={{ background: "linear-gradient(135deg,#1a1a2e,#1e1e38)", border: "1px solid #f4a261", borderRadius: 14, padding: "20px 20px 16px", marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#f4a261", fontSize: 16, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          🤖 Coach Suggestions
        </h3>
        {suggestions.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0",
            borderBottom: i < suggestions.length - 1 ? "1px solid #2a2a4e" : "none"
          }}>
            <span style={{ fontSize: 18, lineHeight: 1.5, flexShrink: 0 }}>{s.icon}</span>
            <p style={{ fontSize: 14, color: "#c9a87c", lineHeight: 1.6 }}>{s.text}</p>
          </div>
        ))}
      </div>

      {/* Upcoming tasks */}
      {pending > 0 && (
        <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 14, padding: "16px 20px" }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#f4a261", fontSize: 15, marginBottom: 12 }}>📋 Up Next</h3>
          {tasks.filter(t => !t.is_completed).slice(0, 4).map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1e1e3e" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_COLORS[t.priority] || "#f4a261", flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: "#e8d5b7", flex: 1 }}>{t.title}</span>
              {t.deadline && <span style={{ fontSize: 11, color: "#8888aa" }}>{String(t.deadline).split("T")[0]}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// TASK PAGE
// ════════════════════════════════════════════════════════════════════════════════
function TaskPage({ tasks, setTasks, notify }) {
  const [showModal, setShowModal]   = useState(false);
  const [editTask,  setEditTask]    = useState(null);
  const [form, setForm]             = useState({ title: "", description: "", deadline: "", priority: "medium" });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter]         = useState("all"); // all | pending | done

  const resetForm = () => setForm({ title: "", description: "", deadline: "", priority: "medium" });

  const openAdd  = ()    => { resetForm(); setEditTask(null);  setShowModal(true); };
  const openEdit = (task)=> {
    setForm({ title: task.title, description: task.description || "", deadline: String(task.deadline || "").split("T")[0], priority: task.priority || "medium" });
    setEditTask(task);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title.trim()) { notify("Title is required."); return; }
    setSubmitting(true);
    if (editTask) {
      const res = await api.put(`/tasks/${editTask.id}`, form);
      if (res.success) { setTasks(p => p.map(t => t.id === editTask.id ? res.data : t)); notify("Task updated!"); setShowModal(false); }
      else notify(res.message);
    } else {
      const res = await api.post("/tasks", form);
      if (res.success) { setTasks(p => [...p, res.data]); notify("Task added!"); setShowModal(false); resetForm(); }
      else notify(res.message);
    }
    setSubmitting(false);
  };

  const toggleDone = async (id) => {
    const res = await api.patch(`/tasks/${id}/complete`);
    if (res.success) { setTasks(p => p.map(t => t.id === id ? res.data : t)); notify(res.message); }
  };

  const remove = async (id) => {
    const res = await api.delete(`/tasks/${id}`);
    if (res.success) { setTasks(p => p.filter(t => t.id !== id)); notify("Task removed."); }
  };

  const filtered = tasks.filter(t =>
    filter === "all" ? true : filter === "pending" ? !t.is_completed : t.is_completed
  );
  const pending   = tasks.filter(t => !t.is_completed).length;
  const done      = tasks.filter(t =>  t.is_completed).length;

  return (
    <div style={{ animation: "fadeIn .4s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: "#f4a261" }}>Tasks</h2>
          <p style={{ color: "#8888aa", fontSize: 12 }}>{pending} pending · {done} done</p>
        </div>
        <Btn onClick={openAdd}>+ Add Task</Btn>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["all","All"], ["pending","Pending"], ["done","Done"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: "5px 14px", borderRadius: 20, border: "none", fontSize: 12,
            fontFamily: "'Lora',serif", cursor: "pointer",
            background: filter === v ? "#f4a261" : "#1a1a2e",
            color: filter === v ? "#0d0d1a" : "#8888aa",
            border: filter === v ? "none" : "1px solid #2a2a5e"
          }}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", paddingTop: 60, color: "#8888aa" }}>
          <div style={{ fontSize: 48 }}>📭</div>
          <p style={{ marginTop: 12 }}>No tasks here yet.</p>
        </div>
      )}

      {filtered.map(t => (
        <TaskCard key={t.id} task={t} onToggle={toggleDone} onEdit={openEdit} onDelete={remove} />
      ))}

      {showModal && (
        <Modal title={editTask ? "Edit Task" : "Add New Task"} onClose={() => setShowModal(false)}>
          <Input label="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Study for exam" autoFocus />
          <Input label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional details" />
          <Input label="Deadline" type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
          <Select label="Priority" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </Select>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn>
            <Btn onClick={save} disabled={submitting}>{submitting ? "Saving…" : editTask ? "Save Changes" : "Add Task"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const done     = task.is_completed;
  const priColor = PRIORITY_COLORS[task.priority] || "#8888aa";
  const isOverdue = !done && task.deadline && new Date(task.deadline) < new Date();

  return (
    <div style={{
      background: "#1a1a2e", borderRadius: 12, padding: "14px 16px", marginBottom: 10,
      border: `1px solid ${isOverdue ? "#8b2020" : done ? "#2a2a4e" : "#2a2a5e"}`,
      opacity: done ? .6 : 1, display: "flex", alignItems: "flex-start", gap: 12
    }}>
      {/* Complete toggle */}
      <button onClick={() => onToggle(task.id)} style={{
        width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 2,
        border: `2px solid ${done ? "#2ecc71" : "#f4a261"}`,
        background: done ? "#2ecc71" : "transparent", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12
      }}>{done ? "✓" : ""}</button>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <p style={{ fontSize: 14, fontWeight: 600, textDecoration: done ? "line-through" : "none", color: done ? "#8888aa" : "#e8d5b7" }}>
            {task.title}
          </p>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: priColor + "22", color: priColor, fontWeight: 700 }}>
            {task.priority?.toUpperCase()}
          </span>
          {isOverdue && <span style={{ fontSize: 10, color: "#e74c3c", fontWeight: 700 }}>OVERDUE</span>}
        </div>
        {task.description && <p style={{ fontSize: 12, color: "#8888aa", marginTop: 3 }}>{task.description}</p>}
        {task.deadline && <p style={{ fontSize: 11, color: isOverdue ? "#e74c3c" : "#c9a87c", marginTop: 4 }}>📅 {String(task.deadline).split("T")[0]}</p>}
      </div>

      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {!done && <button onClick={() => onEdit(task)} style={{ background: "none", border: "none", color: "#8888aa", cursor: "pointer", fontSize: 15, padding: 4 }}>✏️</button>}
        <button onClick={() => onDelete(task.id)} style={{ background: "none", border: "none", color: "#8888aa", cursor: "pointer", fontSize: 15, padding: 4 }}>🗑</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// HABIT PAGE
// ════════════════════════════════════════════════════════════════════════════════
function HabitPage({ habits, setHabits, notify }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ name: "", category: "general" });

  const addHabit = async () => {
    if (!form.name.trim()) { notify("Habit name is required."); return; }
    const res = await api.post("/habits", form);
    if (res.success) { setHabits(p => [...p, res.data]); setShowModal(false); setForm({ name: "", category: "general" }); notify("Habit added! 🌱"); }
    else notify(res.message);
  };

  const checkIn = async (id) => {
    const res = await api.patch(`/habits/${id}/checkin`);
    if (res.success) { setHabits(p => p.map(h => h.id === id ? res.data : h)); notify(res.message); }
    else notify(res.message);
  };

  const remove = async (id) => {
    const res = await api.delete(`/habits/${id}`);
    if (res.success) { setHabits(p => p.filter(h => h.id !== id)); notify("Habit removed."); }
  };

  return (
    <div style={{ animation: "fadeIn .4s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: "#f4a261" }}>Habits</h2>
          <p style={{ color: "#8888aa", fontSize: 12 }}>{habits.length} habits tracked</p>
        </div>
        <Btn onClick={() => setShowModal(true)}>+ Add Habit</Btn>
      </div>

      {habits.length === 0 && (
        <div style={{ textAlign: "center", paddingTop: 60, color: "#8888aa" }}>
          <div style={{ fontSize: 48 }}>🌱</div>
          <p style={{ marginTop: 12 }}>No habits yet. Start building your routine!</p>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {habits.map(h => <HabitCard key={h.id} habit={h} onCheckIn={checkIn} onDelete={remove} />)}
      </div>

      {showModal && (
        <Modal title="Add New Habit" onClose={() => setShowModal(false)}>
          <Input label="Habit Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Morning meditation" autoFocus />
          <Select label="Category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
            {HABIT_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </Select>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn>
            <Btn onClick={addHabit}>Add Habit</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function HabitCard({ habit, onCheckIn, onDelete }) {
  const streak  = habit.streak;
  const color   = streak >= 7 ? "#e74c3c" : streak >= 3 ? "#f39c12" : "#8888aa";
  const today   = new Date().toISOString().split("T")[0];
  const lastUp  = String(habit.last_updated || "").split("T")[0];
  const checkedToday = lastUp === today;

  return (
    <div style={{ background: "#1a1a2e", border: "1px solid #2a2a5e", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ textAlign: "center", minWidth: 52 }}>
        <div style={{ fontSize: 22, fontFamily: "'Playfair Display',serif", color, fontWeight: 700 }}>{streak}</div>
        <div style={{ fontSize: 10, color: "#8888aa" }}>streak</div>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#e8d5b7" }}>{habit.name}</p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
          {habit.category && habit.category !== "general" && (
            <span style={{ fontSize: 10, padding: "1px 8px", borderRadius: 10, background: "#2a2a5e", color: "#8888aa" }}>
              {habit.category}
            </span>
          )}
          <p style={{ fontSize: 11, color: "#8888aa" }}>
            {checkedToday ? "✅ Checked in today" : "⏰ Check in to keep your streak!"}
          </p>
        </div>
        {habit.longest_streak > 0 && (
          <p style={{ fontSize: 10, color: "#5a5a7a", marginTop: 2 }}>Best: {habit.longest_streak} days</p>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <Btn variant="small" onClick={() => onCheckIn(habit.id)}
          disabled={checkedToday}
          style={{ background: checkedToday ? "#2a2a4e" : "#f4a261", color: checkedToday ? "#8888aa" : "#0d0d1a" }}>
          {checkedToday ? "Done ✓" : "Check In"}
        </Btn>
        <button onClick={() => onDelete(habit.id)} style={{ background: "none", border: "none", color: "#8888aa", cursor: "pointer", fontSize: 16 }}>🗑</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PROFILE PAGE
// ════════════════════════════════════════════════════════════════════════════════
function ProfilePage({ user, setUser, onLogout, notify }) {
  const [name, setName]     = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) { notify("Name cannot be empty."); return; }
    setSaving(true);
    const res = await api.put("/auth/me", { name });
    if (res.success) { setUser(res.data); notify("Profile saved! ✨"); }
    else notify(res.message);
    setSaving(false);
  };

  return (
    <div style={{ animation: "fadeIn .4s ease", maxWidth: 440 }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: "#f4a261", marginBottom: 4 }}>Profile</h2>
      <p style={{ color: "#8888aa", fontSize: 12, marginBottom: 28 }}>Manage your account</p>

      {/* Profile card */}
      <div style={{ background: "#1a1a2e", border: "1px solid #2a2a5e", borderRadius: 14, padding: "24px 20px", marginBottom: 16 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg,#f4a261,#e76f51)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, margin: "0 auto 12px"
          }}>
            {(user?.name || "?")[0].toUpperCase()}
          </div>
          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: "#e8d5b7" }}>{user?.name}</p>
          <p style={{ fontSize: 12, color: "#8888aa" }}>{user?.email}</p>
          <p style={{ fontSize: 11, color: "#5a5a7a", marginTop: 4 }}>
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
          </p>
        </div>
        <Input label="Display Name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" />
        <Btn onClick={save} disabled={saving} style={{ width: "100%", marginTop: 4 }}>
          {saving ? "Saving…" : "Save Changes"}
        </Btn>
      </div>

      {/* About */}
      <div style={{ background: "#1a1a2e", border: "1px solid #2a2a5e", borderRadius: 14, padding: "20px", marginBottom: 16 }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#f4a261", fontSize: 15, marginBottom: 10 }}>ℹ️ About</h3>
        <p style={{ fontSize: 13, color: "#8888aa", lineHeight: 1.7 }}>
          AI Productivity Coach uses a rule-based coaching engine to analyze your tasks and habits,
          delivering personalized suggestions to keep you on track — no cloud AI required.
        </p>
      </div>

      {/* Logout */}
      <Btn variant="danger" onClick={onLogout} style={{ width: "100%" }}>Sign Out</Btn>
    </div>
  );
}
