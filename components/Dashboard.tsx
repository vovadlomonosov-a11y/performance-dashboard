"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const WRAP_STATUSES = ["Design", "Print", "Install Scheduled", "Being Installed"];

const TEAM = [
    {
        id: "scott", name: "Scott", role: "Sales", emoji: "💰", color: "#3b82f6",
        hasSalesLog: true, hasOutboundLog: true,
        sections: [
            {
                id: "lead_response", title: "Lead Response", icon: "⚡", items: [
                    { id: "sc_respond_5min", label: "All new leads responded to within 5 minutes" },
                    { id: "sc_no_stale", label: "Zero leads sitting uncontacted for 24+ hours" },
                ]
            },
            {
                id: "follow_up", title: "Follow-Up Discipline", icon: "🔄", items: [
                    { id: "sc_5_touches", label: "All active leads have received required follow-up touches (5 max)" },
                    { id: "sc_pipeline_updated", label: "Every lead's status updated in CRM/pipeline today" },
                    { id: "sc_dead_leads", label: "Unresponsive leads (5+ touches) marked dead — not lingering" },
                ]
            },
            {
                id: "closing", title: "Closing & Handoff", icon: "🎯", items: [
                    { id: "sc_quotes_sent", label: "All qualified leads received a quote/proposal same-day" },
                    { id: "sc_deposit_collected", label: "Deposit collected on every closed deal" },
                    { id: "sc_book_job_paper", label: "Booked job paperwork placed on Emily's desk" },
                ]
            },
            {
                id: "outbound", title: "Outbound Prospecting (Tue/Wed)", icon: "📞", items: [
                    { id: "sc_outbound_done", label: "Completed outbound prospecting block today" },
                    { id: "sc_dealership_touch", label: "Dealership partner touchpoint completed (if scheduled)" },
                    { id: "sc_new_opportunities", label: "At least 1 new opportunity added to pipeline today" },
                ]
            },
        ],
    },
    {
        id: "emily", name: "Emily", role: "VIP Experience & Ops", emoji: "⭐", color: "#8b5cf6",
        hasWrapLog: true,
        sections: [
            {
                id: "confirmation", title: "Appointment Confirmation & Prep", icon: "📞", items: [
                    { id: "em_confirm_all", label: "All next-day appointments confirmed by 2 PM" },
                    { id: "em_confirm_followup", label: "Unconfirmed customers followed up via text + call" },
                    { id: "em_confirm_cancel", label: "Cancellations/confirmations noted in TintWiz CRM" },
                    { id: "em_cx_prep", label: "Customer snack, drink & special preferences prepped for tomorrow" },
                ]
            },
            {
                id: "experience", title: "Customer Experience", icon: "✨", items: [
                    { id: "em_cx_video_update", label: "Every customer received a mid-job video update today" },
                    { id: "em_cx_aftercare", label: "Aftercare instructions delivered at checkout" },
                    { id: "em_cx_review", label: "Review request sent after every completed job" },
                    { id: "em_cx_referral", label: "Referral asked for after every single job" },
                ]
            },
            {
                id: "bookkeeping", title: "Bookkeeping", icon: "📊", items: [
                    { id: "em_bk_invoices_qb", label: "All today's invoices entered in QuickBooks" },
                    { id: "em_bk_tomorrow_ready", label: "Tomorrow's invoices prepped and ready" },
                    { id: "em_bk_payments", label: "Payments collected and matched to invoices" },
                    { id: "em_bk_discrepancies", label: "Any discrepancies flagged and documented" },
                ]
            },
            {
                id: "social", title: "Social Media", icon: "📱", items: [
                    { id: "em_sm_story_every_car", label: "Story posted for every single car completed today" },
                    { id: "em_sm_photos", label: "Before/after photos captured and filed" },
                ]
            },
            {
                id: "wraps", title: "Commercial Wrap Jobs", icon: "🚛", items: [
                    { id: "em_wr_status_updated", label: "Status updated for every wrap job in the shop" },
                    { id: "em_wr_customer_update", label: "Customer updated on wrap progress (if applicable)" },
                ]
            },
        ],
    },
    {
        id: "anthony", name: "Anthony", role: "Window Tinter", emoji: "🔧", color: "#f59e0b",
        hasTintLog: true,
        sections: [
            {
                id: "production", title: "Production Speed", icon: "⏱️", items: [
                    { id: "an_jobs_target", label: "Completed all scheduled jobs for today" },
                    { id: "an_on_time", label: "Every job finished within estimated time window" },
                    { id: "an_no_bottleneck", label: "Zero delays caused to next scheduled job" },
                ]
            },
            {
                id: "workspace", title: "Workspace & Materials", icon: "🧹", items: [
                    { id: "an_trash", label: "Trash taken out" },
                    { id: "an_tools", label: "All tools cleaned and returned to proper storage" },
                    { id: "an_waste", label: "Material usage minimized — no excessive waste" },
                    { id: "an_inventory_weekly", label: "Inventory done once a week. Friday." },
                    { id: "an_overstock", label: "Any overstock items organized and put in storage" },
                ]
            },
        ],
    },
    {
        id: "nick", name: "Nick", role: "Detailer (Part-Time)", emoji: "🧽", color: "#10b981",
        hasCarLog: true,
        sections: [
            {
                id: "closing_duties", title: "Closing Duties", icon: "🧹", items: [
                    { id: "ni_chemicals", label: "All chemicals refilled" },
                    { id: "ni_bay_swept", label: "Bay swept" },
                    { id: "ni_towels", label: "All towels folded" },
                    { id: "ni_pads", label: "All polishing pads washed" },
                    { id: "ni_cabinets", label: "Cabinets wiped down (2x/week — Mon & Thu)" },
                    { id: "ni_exterior_in", label: "All items from outside brought in and organized" },
                ]
            },
            {
                id: "tinter_assist", title: "Window Tinter Assist", icon: "🤝", items: [
                    { id: "ni_helped_windshield", label: "Helped install a windshield" },
                    { id: "ni_removed_tint", label: "Removed old tint" },
                    { id: "ni_prepped_vehicle", label: "Prepped vehicle for tinting" },
                    { id: "ni_assisted_rear", label: "Assisted with large/rear glass" },
                ]
            },
            {
                id: "detail_production", title: "Production & Timing", icon: "⏱️", items: [
                    { id: "ni_on_time", label: "All scheduled details completed on time" },
                    { id: "ni_no_delay", label: "Zero delays to tinting or other scheduled services" },
                    { id: "ni_checklist", label: "Product usage checklist followed for every job" },
                ]
            },
            {
                id: "detail_documentation", title: "Documentation", icon: "📸", items: [
                    { id: "ni_before_photos", label: "Before photos taken for every detail job" },
                    { id: "ni_after_photos", label: "After photos taken and sent to Emily for social" },
                    { id: "ni_condition_notes", label: "Pre-existing damage/conditions documented" },
                ]
            },
        ],
    },
    {
        id: "inna", name: "Inna", role: "Window Tinter", emoji: "🪟", color: "#14b8a6",
        hasTintLog: true,
        sections: [
            {
                id: "in_production", title: "Production Speed", icon: "⏱️", items: [
                    { id: "in_jobs_target", label: "Completed all scheduled jobs for today" },
                    { id: "in_on_time", label: "Every job finished within estimated time window" },
                    { id: "in_no_bottleneck", label: "Zero delays caused to next scheduled job" },
                ]
            },
            {
                id: "in_workspace", title: "Workspace & Materials", icon: "🧹", items: [
                    { id: "in_trash", label: "Trash taken out" },
                    { id: "in_tools", label: "All tools cleaned and returned to proper storage" },
                    { id: "in_waste", label: "Material usage minimized — no excessive waste" },
                    { id: "in_inventory_weekly", label: "Inventory done once a week. Friday." },
                    { id: "in_overstock", label: "Any overstock items organized and put in storage" },
                ]
            },
        ],
    },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const OUTBOUND_DAYS = [1, 2];
const REWARD_TIERS = [
    { id: 1, emoji: "🚗", label: "Free Car Wash", desc: "Full detail on your personal vehicle", type: "weekly", minPct: 90, streakWeeks: 1, color: "#22c55e" },
    { id: 2, emoji: "💵", label: "$100 Cash Bonus", desc: "Added to your next paycheck", type: "weekly", minPct: 95, streakWeeks: 1, color: "#3b82f6" },
    { id: 3, emoji: "💰", label: "$150 Cash Bonus", desc: "2 weeks of consistent excellence", type: "streak", minPct: 90, streakWeeks: 2, color: "#eab308" },
    { id: 4, emoji: "🏖️", label: "Half-Day + $150", desc: "Any afternoon off + $150 cash", type: "streak", minPct: 95, streakWeeks: 3, color: "#f97316" },
    { id: 5, emoji: "👑", label: "$250 + EOM Spot", desc: "$250 + Employee of the Month parking", type: "streak", minPct: 90, streakWeeks: 4, color: "#a855f7" },
];

const getWK = () => {
    // ISO 8601 week number — stable Mon-Sun weeks
    const d = new Date();
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    t.setDate(t.getDate() + 4 - (t.getDay() || 7)); // nearest Thursday
    const yearStart = new Date(t.getFullYear(), 0, 1);
    const wk = Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${t.getFullYear()}-W${wk}`;
};
const getTI = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };
const gAI = (m: any) => m.sections.flatMap((s: any) => s.items.map((i: any) => i.id));
const gc = (p: number) => p >= 90 ? "#22c55e" : p >= 75 ? "#eab308" : "#ef4444";
const gz = (p: number) => p >= 90 ? "GREEN" : p >= 75 ? "YELLOW" : "RED";
const gzb = (p: number) => p >= 90 ? "#22c55e15" : p >= 75 ? "#eab30815" : "#ef444415";
const dkf = (mid: string, di: number) => `${mid}_${di}`;
const M = "'JetBrains Mono', monospace";
const S = "'Inter', -apple-system, sans-serif";

const dWD = () => { const d: any = {}; TEAM.forEach((m) => { d[m.id] = {}; DAYS.forEach((_, di) => { d[m.id][di] = {}; gAI(m).forEach((id: string) => { d[m.id][di][id] = false; }); }); }); return d; };
const dSt = () => { const s: any = {}; TEAM.forEach((m) => { s[m.id] = { weeks90: 0, weeks95: 0, history: [] }; }); return s; };

const fmtWeekRange = (weekStr: string): string => {
    const m = weekStr.match(/^(\d{4})-W(\d+)$/);
    if (!m) return weekStr;
    const year = parseInt(m[1]), week = parseInt(m[2]);
    const jan4 = new Date(year, 0, 4);
    const dow = jan4.getDay() || 7;
    const wk1Mon = new Date(jan4.getTime() - (dow - 1) * 86400000);
    const mon = new Date(wk1Mon.getTime() + (week - 1) * 7 * 86400000);
    const sat = new Date(mon.getTime() + 5 * 86400000);
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${fmt(mon)} – ${fmt(sat)}`;
};

const NI = ({ label, value, onChange, disabled, prefix }: any) => (
    <div style={{ flex: "1 1 120px" }}>
        <div style={{ fontSize: 9, color: "#64748b", fontFamily: M, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {prefix && <span style={{ fontSize: 14, color: "#64748b", fontWeight: 700 }}>{prefix}</span>}
            <input type="number" min="0" value={value || ""} onChange={(e) => onChange(e.target.value)} disabled={disabled}
                style={{ width: "100%", padding: "8px 10px", background: "#1e293b", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 16, fontWeight: 700, fontFamily: M, outline: "none", boxSizing: "border-box" }} placeholder="0" />
        </div>
    </div>
);

export default function Dashboard() {
    const [userRole, setUserRole] = useState<string | null>(null); // null=not logged in, "owner", or member id
    const [pinInput, setPinInput] = useState("");
    const [pinError, setPinError] = useState("");
    const [wd, setWd] = useState(dWD);
    const [sD, setSD] = useState(Math.min(getTI(), 5));
    const [sM, setSM] = useState<string | null>(null);
    const [notes, setNotes] = useState<any>({});
    const [carLogs, setCL] = useState<any>({});
    const [salesLogs, setSL] = useState<any>({});
    const [outLogs, setOL] = useState<any>({});
    const [wrapLogs, setWL] = useState<any>({});
    const [tintLogs, setTL] = useState<any>({});
    const [ownerTasks, setOT] = useState<any>({});
    const [sub, setSub] = useState<any>({});
    const [streaks, setStr] = useState(dSt);
    const [wF, setWF] = useState(false);
    const [sR, setSR] = useState(false);
    const [init, setInit] = useState(false);
    const [taskInput, setTaskInput] = useState("");
    const [taskMember, setTM] = useState("");
    const [taskDay, setTD] = useState(Math.min(getTI(), 5));
    const [showAssign, setSA] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [clockLogs, setClock] = useState<any>({});
    const [notWorked, setNW] = useState<any>({});
    const [showHours, setSH] = useState(false);
    const [showMonthly, setSMo] = useState(false);
    const [monthlyData, setMoData] = useState<any>(null);
    const [notifyStatus, setNS] = useState<Record<string, "sending" | "ok" | "fail">>({});
    const [histWeek, setHW] = useState<string | null>(null);
    const [histData, setHD] = useState<any>(null);
    const [histLoading, setHL] = useState(false);
    const [histDay, setHDay] = useState<number>(0);

    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Persistence ────────────────────────────────────────────────────────

    const pendingUnchecks = useRef<{member: string; day: number; item: string}[]>([]);

    const sv = useCallback((data: any, opts?: { force?: boolean }) => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        setSaveStatus("saving");
        const unchecks = [...pendingUnchecks.current];
        pendingUnchecks.current = [];
        const force = opts?.force || false;
        saveTimeout.current = setTimeout(async () => {
            try {
                await fetch("/api/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ week: getWK(), data, unchecks: unchecks.length > 0 ? unchecks : undefined, force }),
                });
                setSaveStatus("saved");
                setTimeout(() => setSaveStatus("idle"), 2000);
            } catch {
                setSaveStatus("idle");
            }
        }, 1500);
    }, []);

    const pk = useCallback((ov: any = {}) => ({ wd, notes, carLogs, salesLogs, outLogs, wrapLogs, tintLogs, ownerTasks, sub, wF, clockLogs, notWorked, ...ov }), [wd, notes, carLogs, salesLogs, outLogs, wrapLogs, tintLogs, ownerTasks, sub, wF, clockLogs, notWorked]);

    // ── Load on mount ──────────────────────────────────────────────────────

    const loadData = useCallback(async () => {
        try {
            const res = await fetch(`/api/load?week=${getWK()}`);
            if (res.ok) {
                const json = await res.json();
                if (json.weekData) {
                    const p = json.weekData;
                    if (p.wd) {
                        // Merge saved wd into fresh defaults so new team members (e.g. Inna)
                        // always start with all their items initialized to false
                        const merged: any = dWD();
                        for (const [mid, memberDays] of Object.entries(p.wd as Record<string, any>)) {
                            if (!merged[mid]) merged[mid] = {};
                            for (const [di, items] of Object.entries(memberDays as Record<string, any>)) {
                                merged[mid][di] = { ...(merged[mid][di] || {}), ...(items as any) };
                            }
                        }
                        setWd(merged);
                    }
                    if (p.notes) setNotes(p.notes);
                    if (p.carLogs) setCL(p.carLogs);
                    if (p.salesLogs) setSL(p.salesLogs);
                    if (p.outLogs) setOL(p.outLogs);
                    if (p.wrapLogs) setWL(p.wrapLogs);
                    if (p.tintLogs) setTL(p.tintLogs);
                    if (p.ownerTasks) setOT(p.ownerTasks);
                    if (p.sub) setSub(p.sub);
                    if (p.wF) setWF(p.wF);
                    if (p.clockLogs) setClock(p.clockLogs);
                    if (p.notWorked) setNW(p.notWorked);
                }
                if (json.streaks && Object.keys(json.streaks).length > 0) setStr(json.streaks);
            }
        } catch {}
        setInit(true);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const loadHistWeek = useCallback(async (week: string) => {
        setHL(true);
        setHD(null);
        try {
            const res = await fetch(`/api/load?week=${week}`);
            if (res.ok) {
                const json = await res.json();
                setHD(json.weekData || null);
            }
        } catch {}
        setHL(false);
    }, []);

    useEffect(() => { setHW(null); setHD(null); }, [sM]);

    // ── Auth ────────────────────────────────────────────────────────────────

    useEffect(() => {
        const saved = localStorage.getItem("dashboard_role");
        if (saved) setUserRole(saved);
    }, []);

    const doLogin = async () => {
        setPinError("");
        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin: pinInput }),
            });
            const json = await res.json();
            if (res.ok && json.role) {
                setUserRole(json.role);
                localStorage.setItem("dashboard_role", json.role);
                setPinInput("");
                // Auto-select member view for non-owners
                if (json.role !== "owner") setSM(json.role);
            } else {
                setPinError("Invalid PIN");
            }
        } catch {
            setPinError("Connection error");
        }
    };

    const doLogout = () => {
        setUserRole(null);
        localStorage.removeItem("dashboard_role");
        setSM(null);
        setPinInput("");
    };

    const isOwner = userRole === "owner";

    // Auto-select member view for non-owners on role restore
    useEffect(() => {
        if (userRole && userRole !== "owner" && !sM) setSM(userRole);
    }, [userRole, sM]);

    // ── Actions ────────────────────────────────────────────────────────────

    const canEdit = (mid: string) => isOwner || userRole === mid;

    const toggle = (mid: string, di: number, iid: string) => {
        if (!canEdit(mid) || sub[dkf(mid, di)] || wF) return;
        const newVal = !wd[mid]?.[di]?.[iid];
        if (!newVal) pendingUnchecks.current.push({ member: mid, day: di, item: iid });
        const u = { ...wd, [mid]: { ...wd[mid], [di]: { ...wd[mid]?.[di], [iid]: newVal } } };
        setWd(u); sv(pk({ wd: u }));
    };

    const gMDS = (mid: string, di: number) => { const m = TEAM.find((t) => t.id === mid)!, items = gAI(m), dd = wd[mid]?.[di] || {}, done = items.filter((id: string) => dd[id]).length; return { done, total: items.length, pct: items.length > 0 ? Math.round((done / items.length) * 100) : 0 }; };
    const gMWS = (mid: string) => { const m = TEAM.find((t) => t.id === mid)!, items = gAI(m); let t = 0, d = 0; const today = Math.min(getTI(), 5); for (let i = 0; i <= today; i++) { if (notWorked[dkf(mid, i)]) continue; const dd = wd[mid]?.[i] || {}; items.forEach((id: string) => { t++; if (dd[id]) d++; }); } return t > 0 ? Math.round((d / t) * 100) : 0; };
    const gTA = () => { const s = TEAM.map((m) => gMWS(m.id)); return Math.round(s.reduce((a, b) => a + b, 0) / s.length); };
    const gSS = (mid: string, sid: string, di: number) => { const m = TEAM.find((t) => t.id === mid)!, sec = m.sections.find((s) => s.id === sid)!, dd = wd[mid]?.[di] || {}, done = sec.items.filter((i) => dd[i.id]).length; return { done, total: sec.items.length, pct: sec.items.length > 0 ? Math.round((done / sec.items.length) * 100) : 0 }; };
    const subDay = (mid: string, di: number) => {
        if (!canEdit(mid)) return;
        const u = { ...sub, [dkf(mid, di)]: true };
        setSub(u);
        const data = pk({ sub: u });
        // Cancel any pending debounce and save immediately — submissions must persist
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        setSaveStatus("saving");
        fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ week: getWK(), data }),
        }).then(() => { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); })
          .catch(() => { setSaveStatus("idle"); });
    };

    const gUT = (mid: string) => {
        const ws = gMWS(mid), st: any = streaks[mid] || { weeks90: 0, weeks95: 0 };
        // Only count current week toward rewards AFTER the week is finalized
        const w90 = st.weeks90 + (wF && ws >= 90 ? 1 : 0);
        const w95 = st.weeks95 + (wF && ws >= 95 ? 1 : 0);
        return REWARD_TIERS.map((tier) => { const sc = tier.minPct >= 95 ? w95 : w90; return { ...tier, unlocked: sc >= tier.streakWeeks, progress: Math.min(sc / tier.streakWeeks, 1), current: sc, needed: tier.streakWeeks }; });
    };

    const finWeek = async () => {
        // Cancel any pending debounced save so it can't overwrite wF: true afterwards
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        const upd = { ...streaks } as any;
        TEAM.forEach((m) => {
            const ws = gMWS(m.id), prev: any = upd[m.id] || { weeks90: 0, weeks95: 0, history: [] };
            upd[m.id] = { weeks90: ws >= 90 ? prev.weeks90 + 1 : 0, weeks95: ws >= 95 ? prev.weeks95 + 1 : 0, history: [...(prev.history || []), { week: getWK(), score: ws }].slice(-12) };
        });
        setStr(upd); setWF(true);
        const payload = pk({ wF: true });
        setSaveStatus("saving");
        try {
            await fetch("/api/finalize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ week: getWK(), data: payload, streaks: upd }),
            });
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
        } catch {
            setSaveStatus("idle");
        }
    };

    const resetW = () => {
        if (!confirm("Reset all data for this week? This cannot be undone.")) return;
        const w = dWD(); setWd(w); setNotes({}); setCL({}); setSL({}); setOL({}); setWL({}); setTL({}); setOT({}); setSub({}); setWF(false); setSM(null); setClock({}); setNW({});
        sv({ wd: w, notes: {}, carLogs: {}, salesLogs: {}, outLogs: {}, wrapLogs: {}, tintLogs: {}, ownerTasks: {}, sub: {}, wF: false, clockLogs: {}, notWorked: {} }, { force: true });
    };

    const updf = (setter: any, current: any, key: string, field: string, val: any, ln: string) => { const u = { ...current, [key]: { ...(current[key] || {}), [field]: val } }; setter(u); sv(pk({ [ln]: u })); };
    const updT = (setter: any, current: any, key: string, val: any, ln: string) => { const u = { ...current, [key]: val }; setter(u); sv(pk({ [ln]: u })); };

    // ── Owner tasks ────────────────────────────────────────────────────────

    const getOTasks = (mid: string, di: number) => (ownerTasks[dkf(mid, di)] || {}).tasks || [];
    const getOTDone = (mid: string, di: number) => (ownerTasks[dkf(mid, di)] || {}).done || {};
    const addOTask = (mid: string, di: number, text: string) => {
        if (!text.trim()) return;
        const key = dkf(mid, di), tasks = [...getOTasks(mid, di), { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text: text.trim() }];
        const u = { ...ownerTasks, [key]: { ...(ownerTasks[key] || {}), tasks } };
        setOT(u); sv(pk({ ownerTasks: u }));
        const nKey = `${mid}_${Date.now()}`;
        setNS(p => ({ ...p, [nKey]: "sending" }));
        fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "task_assigned", memberId: mid, task: text.trim(), day: DAYS[di] }) })
            .then(r => r.json()).then(d => setNS(p => ({ ...p, [nKey]: d.ok ? "ok" : "fail" })))
            .catch(() => setNS(p => ({ ...p, [nKey]: "fail" })));
        setTimeout(() => setNS(p => { const n = { ...p }; delete n[nKey]; return n; }), 5000);
    };
    const removeOTask = (mid: string, di: number, taskId: string) => {
        const key = dkf(mid, di), tasks = getOTasks(mid, di).filter((t: any) => t.id !== taskId);
        const done = { ...getOTDone(mid, di) }; delete done[taskId];
        const u = { ...ownerTasks, [key]: { ...(ownerTasks[key] || {}), tasks, done } };
        setOT(u); sv(pk({ ownerTasks: u }));
    };
    const toggleOTask = (mid: string, di: number, taskId: string) => {
        const key = dkf(mid, di), done = { ...getOTDone(mid, di), [taskId]: !getOTDone(mid, di)[taskId] };
        const u = { ...ownerTasks, [key]: { ...(ownerTasks[key] || {}), done } };
        setOT(u); sv(pk({ ownerTasks: u }));
    };
    const getAllPendingOTasks = () => {
        let count = 0;
        TEAM.forEach((m) => { for (let d = 0; d < 6; d++) { const tasks = getOTasks(m.id, d), done = getOTDone(m.id, d); tasks.forEach((t: any) => { if (!done[t.id]) count++; }); } });
        return count;
    };
    const getMemberPendingOTasks = (mid: string) => {
        let count = 0;
        for (let d = 0; d < 6; d++) { const tasks = getOTasks(mid, d), done = getOTDone(mid, d); tasks.forEach((t: any) => { if (!done[t.id]) count++; }); }
        return count;
    };

    const safeNum = (v: any) => { const n = Number(v); return isNaN(n) ? 0 : n; };
    const gWST = () => { let j = 0, r = 0, u = 0, ur = 0; for (let d = 0; d < 6; d++) { const sl = salesLogs[dkf("scott", d)] || {}; j += safeNum(sl.jobsClosed); r += safeNum(sl.revenue); u += safeNum(sl.upsells); ur += safeNum(sl.upsellRevenue); } return { jobs: j, rev: r, ups: u, upRev: ur }; };

    const clockIn = (mid: string, di: number) => { const key = dkf(mid, di), now = new Date(), time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`; const u = { ...clockLogs, [key]: { ...(clockLogs[key] || {}), in: time } }; setClock(u); sv(pk({ clockLogs: u })); };
    const clockOut = (mid: string, di: number) => { const key = dkf(mid, di), now = new Date(), time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`; const u = { ...clockLogs, [key]: { ...(clockLogs[key] || {}), out: time } }; setClock(u); sv(pk({ clockLogs: u })); };
    const delClk = (mid: string, di: number, f: 'in' | 'out') => { const key = dkf(mid, di); const { [f]: _, ...rest } = clockLogs[key] || {}; const u = { ...clockLogs, [key]: rest }; setClock(u); sv(pk({ clockLogs: u })); };
    const calcHrs = (inT?: string, outT?: string) => { if (!inT || !outT) return null; const [ih, im] = inT.split(':').map(Number), [oh, om] = outT.split(':').map(Number); let mins = (oh * 60 + om) - (ih * 60 + im); if (mins < 0) mins += 24 * 60; return mins > 0 ? { h: Math.floor(mins / 60), m: mins % 60, total: mins / 60 } : null; };
    const getMWH = (mid: string) => { let tot = 0; for (let i = 0; i < 6; i++) { const cl = clockLogs[dkf(mid, i)] || {}, r = calcHrs(cl.in, cl.out); if (r) tot += r.total; } return tot; };
    const fmtH = (h: number) => { const totalMins = Math.round(h * 60); return `${Math.floor(totalMins / 60)}h ${String(totalMins % 60).padStart(2,'0')}m`; };
    const toggleNW = (mid: string, di: number) => { if (wF) return; const key = dkf(mid, di); const u = { ...notWorked, [key]: !notWorked[key] }; setNW(u); sv(pk({ notWorked: u })); };
    const sendReminders = () => { fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "daily_reminder" }) }).catch(() => {}); };

    const gTJ = (mid: string, di: number) => (tintLogs[dkf(mid, di)] || {}).jobs || [];
    const gTD = (mid: string, di: number) => (tintLogs[dkf(mid, di)] || {}).draft || {};
    const uTD = (mid: string, di: number, f: string, v: any) => { const k = dkf(mid, di); setTL((p: any) => ({ ...p, [k]: { ...(p[k] || {}), draft: { ...((p[k] || {}).draft || {}), [f]: v } } })); };
    const aTJ = (mid: string, di: number) => { const k = dkf(mid, di), dr = gTD(mid, di); if (!dr.vehicle) return; const jobs = [...gTJ(mid, di), { vehicle: dr.vehicle, reduction: dr.reduction || "", split: dr.split || false, splitWith: dr.splitWith || "", services: dr.services || "" }]; const u = { ...tintLogs, [k]: { ...tintLogs[k], jobs, draft: {} } }; setTL(u); sv(pk({ tintLogs: u })); };
    const rTJ = (mid: string, di: number, idx: number) => { const k = dkf(mid, di), jobs = [...gTJ(mid, di)]; jobs.splice(idx, 1); const u = { ...tintLogs, [k]: { ...tintLogs[k], jobs } }; setTL(u); sv(pk({ tintLogs: u })); };
    const gWTC = (mid: string) => { let c = 0; for (let d = 0; d < 6; d++) c += gTJ(mid, d).length; return c; };

    const lb = [...TEAM].map((m) => ({ ...m, weekScore: gMWS(m.id) })).sort((a, b) => b.weekScore - a.weekScore);

    if (!init) return (<div style={{ background: "#0a0f1a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "#64748b", fontFamily: M, fontSize: 14 }}>Loading...</div></div>);

    // ── Login screen ────────────────────────────────────────────────────────
    if (!userRole) return (
        <div style={{ background: "#0a0f1a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: S }}>
            <div style={{ background: "#1e293b", borderRadius: 16, padding: "40px 32px", width: 340, border: "1px solid #334155" }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <div style={{ fontSize: 11, color: "#64748b", fontFamily: M, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Upstate Auto Styling</div>
                    <h2 style={{ color: "#e2e8f0", fontSize: 20, fontWeight: 800, margin: 0 }}>Team Dashboard</h2>
                </div>
                <div style={{ marginBottom: 16 }}>
                    <input
                        type="password"
                        placeholder="Enter your PIN"
                        value={pinInput}
                        onChange={(e) => { setPinInput(e.target.value); setPinError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && doLogin()}
                        style={{ width: "100%", padding: "12px 14px", background: "#0f172a", border: `1px solid ${pinError ? "#ef4444" : "#334155"}`, borderRadius: 8, color: "#e2e8f0", fontSize: 18, fontFamily: M, textAlign: "center", letterSpacing: 8, outline: "none", boxSizing: "border-box" }}
                        autoFocus
                    />
                </div>
                {pinError && <div style={{ color: "#ef4444", fontSize: 12, fontFamily: M, textAlign: "center", marginBottom: 12 }}>{pinError}</div>}
                <button onClick={doLogin} style={{ width: "100%", padding: "12px", borderRadius: 8, background: "linear-gradient(135deg, #3b82f6, #2563eb)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: S }}>Sign In</button>
            </div>
        </div>
    );

    const am = sM ? TEAM.find((m) => m.id === sM) : null;
    const ds = am ? gMDS(am.id, sD) : null;
    const dayKey = am ? dkf(am.id, sD) : null;
    const dl = dayKey ? (sub[dayKey] || wF) : false;
    const isOB = OUTBOUND_DAYS.includes(sD);
    const dayOTasks = am ? getOTasks(am.id, sD) : [];
    const dayODone = am ? getOTDone(am.id, sD) : {};

    return (
        <div style={{ background: "#0a0f1a", minHeight: "100vh", fontFamily: S, color: "#e2e8f0" }}>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

            <div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", borderBottom: "1px solid #1e293b", padding: "14px 24px" }}>
                <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e88" }} /><span style={{ fontFamily: M, fontSize: 11, color: "#64748b", letterSpacing: 2, textTransform: "uppercase" }}>Upstate Auto Styling</span></div>
                        <h1 style={{ fontSize: 21, fontWeight: 800, margin: 0, letterSpacing: -0.5, background: "linear-gradient(135deg, #e2e8f0, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Team Accountability Dashboard</h1>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {/* Save indicator */}
                        {saveStatus !== "idle" && (
                            <span style={{ fontSize: 10, fontFamily: M, color: saveStatus === "saved" ? "#22c55e" : "#64748b", letterSpacing: 1 }}>
                                {saveStatus === "saving" ? "⟳ Saving..." : "✓ Saved"}
                            </span>
                        )}
                        <button onClick={() => loadData()} style={{ padding: "7px 14px", borderRadius: 8, background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: M }} title="Reload data from server">↺ REFRESH</button>
                        {isOwner && sM && <button onClick={() => setSM(null)} style={{ padding: "7px 14px", borderRadius: 8, background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: M }}>← TEAM</button>}
                        {isOwner && <button onClick={() => setSA(!showAssign)} style={{ padding: "7px 14px", borderRadius: 8, background: showAssign ? "#ef444422" : "#1e293b", border: `1px solid ${showAssign ? "#ef444444" : "#334155"}`, color: showAssign ? "#f87171" : "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: M, position: "relative" }}>
                            📌 ASSIGN{getAllPendingOTasks() > 0 && <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{getAllPendingOTasks()}</span>}
                        </button>}
                        {isOwner && <button onClick={() => setSH(!showHours)} style={{ padding: "7px 14px", borderRadius: 8, background: showHours ? "#22c55e22" : "#1e293b", border: `1px solid ${showHours ? "#22c55e44" : "#334155"}`, color: showHours ? "#4ade80" : "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: M }}>⏱️ HOURS</button>}
                        {isOwner && <button onClick={() => setSR(!sR)} style={{ padding: "7px 14px", borderRadius: 8, background: sR ? "#a855f722" : "#1e293b", border: `1px solid ${sR ? "#a855f744" : "#334155"}`, color: sR ? "#c084fc" : "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: M }}>🏆 REWARDS</button>}
                        {isOwner && <button onClick={() => { setSMo(!showMonthly); if (!showMonthly && !monthlyData) fetch("/api/monthly").then(r => r.json()).then(d => setMoData(d.data)).catch(() => {}); }} style={{ padding: "7px 14px", borderRadius: 8, background: showMonthly ? "#0ea5e922" : "#1e293b", border: `1px solid ${showMonthly ? "#0ea5e944" : "#334155"}`, color: showMonthly ? "#38bdf8" : "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: M }}>📅 MONTHLY</button>}
                        {isOwner && <button onClick={sendReminders} style={{ padding: "7px 14px", borderRadius: 8, background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: M }} title="Send end-of-day reminder emails to all team members">📧 REMIND</button>}
                        {Object.values(notifyStatus).some(s => s === "fail") && <span style={{ fontSize: 10, color: "#ef4444", fontFamily: M, fontWeight: 700 }}>⚠ SMS failed</span>}
                        {Object.values(notifyStatus).some(s => s === "ok") && <span style={{ fontSize: 10, color: "#22c55e", fontFamily: M, fontWeight: 700 }}>✓ SMS sent</span>}
                        <button onClick={doLogout} style={{ padding: "7px 14px", borderRadius: 8, background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: M }} title="Sign out">🚪 OUT</button>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px 24px" }}>

                {/* ASSIGN TASK PANEL */}
                {showAssign && (
                    <div style={{ background: "linear-gradient(135deg, #0f172a, #1a1520)", borderRadius: 16, border: "1px solid #ef444433", padding: "20px 24px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #ef4444, #f97316)" }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", letterSpacing: 2, fontFamily: M, marginBottom: 14 }}>📌 ASSIGN ONE-OFF TASK</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                            <div style={{ flex: "1 1 250px" }}>
                                <div style={{ fontSize: 9, color: "#64748b", fontFamily: M, letterSpacing: 1, marginBottom: 4 }}>WHO</div>
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                    {TEAM.map((m) => (
                                        <button key={m.id} onClick={() => setTM(m.id)} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", background: taskMember === m.id ? `${m.color}22` : "#1e293b", border: `1px solid ${taskMember === m.id ? m.color + "55" : "#334155"}`, color: taskMember === m.id ? m.color : "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                                            <span style={{ fontSize: 13 }}>{m.emoji}</span> {m.name}
                                            {getMemberPendingOTasks(m.id) > 0 && <span style={{ background: "#ef444433", color: "#f87171", fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 4, fontFamily: M }}>{getMemberPendingOTasks(m.id)}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ flex: "0 0 auto" }}>
                                <div style={{ fontSize: 9, color: "#64748b", fontFamily: M, letterSpacing: 1, marginBottom: 4 }}>WHICH DAY</div>
                                <div style={{ display: "flex", gap: 4 }}>
                                    {DAYS.map((day, i) => (
                                        <button key={i} onClick={() => setTD(i)} style={{ padding: "6px 10px", borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: M, background: taskDay === i ? "#ef444422" : "#1e293b", border: `1px solid ${taskDay === i ? "#ef444444" : "#334155"}`, color: taskDay === i ? "#f87171" : "#64748b" }}>{day}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input value={taskInput} onChange={(e) => setTaskInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && taskMember && taskInput.trim()) { addOTask(taskMember, taskDay, taskInput); setTaskInput(""); } }}
                                placeholder={taskMember ? `Task for ${TEAM.find((m) => m.id === taskMember)?.name} on ${DAYS[taskDay]}...` : "Select a team member first..."}
                                disabled={!taskMember}
                                style={{ flex: 1, padding: "10px 14px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                            <button onClick={() => { if (taskMember && taskInput.trim()) { addOTask(taskMember, taskDay, taskInput); setTaskInput(""); } }}
                                disabled={!taskMember || !taskInput.trim()}
                                style={{ padding: "10px 20px", borderRadius: 8, background: taskMember && taskInput.trim() ? "#ef4444" : "#1e293b", border: "none", color: taskMember && taskInput.trim() ? "#fff" : "#475569", fontSize: 11, fontWeight: 700, cursor: taskMember && taskInput.trim() ? "pointer" : "default", fontFamily: M, whiteSpace: "nowrap" }}>+ ASSIGN</button>
                        </div>

                        {taskMember && (() => {
                            const tasks = getOTasks(taskMember, taskDay), done = getOTDone(taskMember, taskDay);
                            const mem = TEAM.find((m) => m.id === taskMember);
                            return tasks.length > 0 && (
                                <div style={{ marginTop: 12 }}>
                                    <div style={{ fontSize: 9, color: "#64748b", fontFamily: M, letterSpacing: 1, marginBottom: 6 }}>{mem!.name.toUpperCase()}'S TASKS FOR {DAYS[taskDay].toUpperCase()}</div>
                                    {tasks.map((task: any) => (
                                        <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                                            <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${done[task.id] ? "#22c55e" : "#334155"}`, background: done[task.id] ? "#22c55e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                {done[task.id] && <span style={{ color: "#0a0f1a", fontSize: 9, fontWeight: 800 }}>✓</span>}
                                            </div>
                                            <span style={{ fontSize: 12, color: done[task.id] ? "#475569" : "#e2e8f0", textDecoration: done[task.id] ? "line-through" : "none", flex: 1 }}>{task.text}</span>
                                            <button onClick={() => removeOTask(taskMember, taskDay, task.id)} style={{ fontSize: 10, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontFamily: M, padding: "2px 4px" }}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* REWARDS */}
                {sR && (
                    <div style={{ background: "linear-gradient(135deg, #0f172a, #1a1a2e)", borderRadius: 16, border: "1px solid #1e293b", padding: "20px 24px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #22c55e, #3b82f6, #eab308, #f97316, #a855f7)" }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 2, fontFamily: M, marginBottom: 14 }}>REWARD TIERS</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                            {REWARD_TIERS.map((tier) => (<div key={tier.id} style={{ flex: "1 1 170px", padding: "14px", borderRadius: 12, background: `${tier.color}08`, border: `1px solid ${tier.color}25`, textAlign: "center" }}><div style={{ fontSize: 28 }}>{tier.emoji}</div><div style={{ fontSize: 12, fontWeight: 800, color: tier.color, fontFamily: M, marginTop: 4 }}>{tier.label}</div><div style={{ fontSize: 10, color: "#e2e8f0", marginTop: 4, lineHeight: 1.4 }}>{tier.desc}</div><div style={{ marginTop: 8, padding: "4px 8px", borderRadius: 6, background: "#1e293b", fontSize: 9, color: "#64748b", fontFamily: M }}>{tier.type === "weekly" ? `${tier.minPct}%+ this week` : `${tier.minPct}%+ for ${tier.streakWeeks} weeks`}</div></div>))}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 2, fontFamily: M, marginBottom: 10 }}>WHO'S UNLOCKED WHAT</div>
                        {TEAM.map((member) => {
                            const tiers = gUT(member.id); return (
                                <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1e293b22" }}>
                                    <span style={{ fontSize: 15 }}>{member.emoji}</span><span style={{ fontSize: 13, fontWeight: 700, minWidth: 70 }}>{member.name}</span>
                                    <div style={{ display: "flex", gap: 6, flex: 1 }}>{tiers.map((t) => (<div key={t.id} style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: t.unlocked ? `${t.color}22` : "#1e293b44", border: `1px solid ${t.unlocked ? t.color + "44" : "#1e293b"}`, fontSize: t.unlocked ? 18 : 14, opacity: t.unlocked ? 1 : 0.4, position: "relative" }}>{t.unlocked ? t.emoji : "🔒"}{!t.unlocked && t.progress > 0 && <div style={{ position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)", fontSize: 8, color: "#64748b", fontFamily: M, whiteSpace: "nowrap" }}>{t.current}/{t.needed}</div>}</div>))}</div>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: gc(gMWS(member.id)), fontFamily: M }}>{gMWS(member.id)}%</div>
                                </div>);
                        })}
                    </div>
                )}

                {/* HOURS PANEL */}
                {showHours && (
                    <div style={{ background: "linear-gradient(135deg, #0f172a, #0f1a14)", borderRadius: 16, border: "1px solid #22c55e33", padding: "20px 24px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #22c55e, #3b82f6)" }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", letterSpacing: 2, fontFamily: M, marginBottom: 14 }}>⏱️ WEEKLY HOURS</div>
                        {TEAM.map((member) => {
                            const wh = getMWH(member.id);
                            return (
                                <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #1e293b" }}>
                                    <span style={{ fontSize: 15 }}>{member.emoji}</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 70 }}>{member.name}</span>
                                    <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
                                        {DAYS.map((day, di) => {
                                            const cl = clockLogs[dkf(member.id, di)] || {};
                                            const dur = calcHrs(cl.in, cl.out);
                                            const nw = notWorked[dkf(member.id, di)];
                                            return (
                                                <div key={di} style={{ textAlign: "center", minWidth: 56 }}>
                                                    <div style={{ fontSize: 8, color: "#475569", fontFamily: M, marginBottom: 2 }}>{day}</div>
                                                    {nw ? (
                                                        <div style={{ fontSize: 10, color: "#475569", fontFamily: M }}>OFF</div>
                                                    ) : dur ? (
                                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#e2e8f0", fontFamily: M }}>{dur.h}h {dur.m}m</div>
                                                    ) : cl.in ? (
                                                        <div style={{ fontSize: 10, color: "#eab308", fontFamily: M }}>{cl.in}–?</div>
                                                    ) : (
                                                        <div style={{ fontSize: 10, color: "#334155", fontFamily: M }}>—</div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ textAlign: "right", minWidth: 64 }}>
                                        <div style={{ fontSize: 8, color: "#475569", fontFamily: M, marginBottom: 2 }}>TOTAL</div>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: wh > 0 ? "#22c55e" : "#334155", fontFamily: M }}>{wh > 0 ? fmtH(wh) : "—"}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* MONTHLY REVIEW */}
                {showMonthly && (
                    <div style={{ background: "linear-gradient(135deg, #0f172a, #0f1829)", borderRadius: 16, border: "1px solid #0ea5e933", padding: "20px 24px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #0ea5e9, #6366f1)" }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8", letterSpacing: 2, fontFamily: M, marginBottom: 16 }}>📅 MONTHLY REVIEW</div>
                        {!monthlyData ? (
                            <div style={{ color: "#475569", fontFamily: M, fontSize: 12 }}>Loading...</div>
                        ) : Object.keys(monthlyData).length === 0 ? (
                            <div style={{ color: "#475569", fontFamily: M, fontSize: 12 }}>No history data yet. Finalize a week to start building monthly stats.</div>
                        ) : (
                            Object.entries(monthlyData).sort(([a], [b]) => b.localeCompare(a)).map(([month, members]: [string, any]) => {
                                const [yr, mo] = month.split("-");
                                const monthName = new Date(parseInt(yr), parseInt(mo) - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
                                return (
                                    <div key={month} style={{ marginBottom: 20 }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#38bdf8", fontFamily: M, letterSpacing: 1, marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #1e293b" }}>{monthName.toUpperCase()}</div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            {TEAM.map((member) => {
                                                const d = members[member.id];
                                                if (!d) return null;
                                                return (
                                                    <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#0a0f1a", borderRadius: 9, border: "1px solid #1e293b" }}>
                                                        <span style={{ fontSize: 16 }}>{member.emoji}</span>
                                                        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 70 }}>{member.name}</span>
                                                        <div style={{ flex: 1, background: "#1e293b", borderRadius: 4, height: 6, overflow: "hidden" }}>
                                                            <div style={{ width: `${d.avg}%`, height: "100%", background: `linear-gradient(90deg, ${gc(d.avg)}88, ${gc(d.avg)})`, borderRadius: 4 }} />
                                                        </div>
                                                        <div style={{ textAlign: "center", minWidth: 52 }}><div style={{ fontSize: 8, color: "#475569", fontFamily: M }}>AVG</div><div style={{ fontSize: 20, fontWeight: 900, color: gc(d.avg), fontFamily: M }}>{d.avg}%</div></div>
                                                        <div style={{ textAlign: "center", minWidth: 44 }}><div style={{ fontSize: 8, color: "#475569", fontFamily: M }}>BEST</div><div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", fontFamily: M }}>{d.best}%</div></div>
                                                        <div style={{ textAlign: "center", minWidth: 44 }}><div style={{ fontSize: 8, color: "#475569", fontFamily: M }}>WEEKS</div><div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", fontFamily: M }}>{d.weeks}</div></div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* TEAM VIEW */}
                {!sM && (
                    <>
                        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                            <div style={{ flex: "1 1 200px", background: "linear-gradient(135deg, #0f172a, #1a2742)", borderRadius: 14, border: "1px solid #1e293b", padding: "20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #ef4444, #eab308, #22c55e)" }} />
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 2, fontFamily: M, marginBottom: 4 }}>TEAM SCORE</div>
                                <div style={{ fontSize: 48, fontWeight: 900, color: gc(gTA()), fontFamily: M, lineHeight: 1 }}>{gTA()}%</div>
                                <div style={{ display: "inline-block", marginTop: 6, padding: "3px 10px", borderRadius: 16, background: gzb(gTA()), fontSize: 10, fontWeight: 700, color: gc(gTA()), fontFamily: M }}>{gz(gTA())} ZONE</div>
                            </div>
                            {(() => {
                                const t = gWST(); return (
                                    <div style={{ flex: "1 1 200px", background: "linear-gradient(135deg, #0f172a, #1a2232)", borderRadius: 14, border: "1px solid #1e293b", padding: "20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#3b82f6" }} />
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 2, fontFamily: M, marginBottom: 4 }}>WEEKLY REVENUE</div>
                                        <div style={{ fontSize: 36, fontWeight: 900, color: "#3b82f6", fontFamily: M, lineHeight: 1 }}>${t.rev.toLocaleString()}</div>
                                        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
                                            <div><div style={{ fontSize: 9, color: "#475569", fontFamily: M }}>JOBS</div><div style={{ fontSize: 16, fontWeight: 800, fontFamily: M }}>{t.jobs}</div></div>
                                            <div><div style={{ fontSize: 9, color: "#475569", fontFamily: M }}>UPSELLS</div><div style={{ fontSize: 16, fontWeight: 800, color: "#22c55e", fontFamily: M }}>{t.ups}</div></div>
                                            <div><div style={{ fontSize: 9, color: "#475569", fontFamily: M }}>UPSELL $</div><div style={{ fontSize: 16, fontWeight: 800, color: "#22c55e", fontFamily: M }}>${t.upRev.toLocaleString()}</div></div>
                                        </div>
                                    </div>);
                            })()}
                            {wF && (<div style={{ flex: "1 1 200px", background: "linear-gradient(135deg, #0f172a, #1a2a1a)", borderRadius: 14, border: "1px solid #22c55e33", padding: "20px", textAlign: "center", position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#22c55e" }} /><div style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", letterSpacing: 2, fontFamily: M, marginBottom: 4 }}>WEEK STATUS</div><div style={{ fontSize: 28, marginTop: 4 }}>✅</div><div style={{ fontSize: 11, color: "#22c55e", fontFamily: M, marginTop: 4, fontWeight: 700 }}>FINALIZED</div></div>)}
                        </div>

                        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 2, fontFamily: M, marginBottom: 8, paddingLeft: 4 }}>LEADERBOARD</div>
                        {lb.map((member, rank) => {
                            const tiers = gUT(member.id), pending = getMemberPendingOTasks(member.id); return (
                                <div key={member.id} onClick={() => { if (isOwner || member.id === userRole) setSM(member.id); }} style={{ background: "#0f172a", borderRadius: 12, border: "1px solid #1e293b", padding: "12px 16px", marginBottom: 7, cursor: (isOwner || member.id === userRole) ? "pointer" : "default", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 12, position: "relative", overflow: "hidden" }} onMouseEnter={(e) => { if (isOwner || member.id === userRole) { (e.currentTarget as HTMLDivElement).style.borderColor = member.color + "55"; (e.currentTarget as HTMLDivElement).style.background = "#111827"; } }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1e293b"; (e.currentTarget as HTMLDivElement).style.background = "#0f172a"; }}>
                                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: member.color }} />
                                    <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: rank === 0 ? "#eab30822" : "#1e293b", border: rank === 0 ? "1px solid #eab30844" : "1px solid #334155", fontSize: 14, fontWeight: 900, fontFamily: M, color: rank === 0 ? "#eab308" : "#475569", flexShrink: 0 }}>{rank === 0 ? "👑" : `#${rank + 1}`}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                            <span style={{ fontSize: 16 }}>{member.emoji}</span><span style={{ fontSize: 14, fontWeight: 700 }}>{member.name}</span><span style={{ fontSize: 10, color: "#64748b", fontFamily: M }}>— {member.role}</span>
                                            {pending > 0 && <span style={{ fontSize: 9, fontWeight: 700, fontFamily: M, padding: "2px 6px", borderRadius: 4, background: "#ef444422", color: "#f87171", border: "1px solid #ef444433" }}>📌 {pending} task{pending > 1 ? "s" : ""}</span>}
                                        </div>
                                        <div style={{ display: "flex", gap: 3, marginTop: 6 }}>{DAYS.map((day, di) => { const s = gMDS(member.id, di); return (<div key={di} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 34 }}><div style={{ fontSize: 8, color: "#475569", fontFamily: M }}>{day}</div><div style={{ width: 34, height: 5, borderRadius: 3, background: "#1e293b", overflow: "hidden" }}><div style={{ width: `${s.pct}%`, height: "100%", borderRadius: 3, background: gc(s.pct) }} /></div></div>); })}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>{tiers.map((t) => (<div key={t.id} style={{ width: 26, height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: t.unlocked ? `${t.color}18` : "#1e293b33", border: `1px solid ${t.unlocked ? t.color + "33" : "transparent"}`, fontSize: t.unlocked ? 13 : 10, opacity: t.unlocked ? 1 : 0.3 }}>{t.unlocked ? t.emoji : "🔒"}</div>))}</div>
                                    <div style={{ textAlign: "center", minWidth: 56, padding: "6px 8px", borderRadius: 8, background: gzb(member.weekScore), flexShrink: 0 }}><div style={{ fontSize: 9, color: "#475569", fontFamily: M }}>WEEK</div><div style={{ fontSize: 22, fontWeight: 900, color: gc(member.weekScore), fontFamily: M }}>{member.weekScore}%</div></div>
                                    {isOwner && (() => { const wh = getMWH(member.id); return <div style={{ textAlign: "center", minWidth: 52, padding: "6px 8px", borderRadius: 8, background: "#0f172a", border: "1px solid #1e293b", flexShrink: 0 }}><div style={{ fontSize: 9, color: "#475569", fontFamily: M }}>HOURS</div><div style={{ fontSize: 14, fontWeight: 800, color: wh > 0 ? "#22c55e" : "#334155", fontFamily: M }}>{wh > 0 ? fmtH(wh) : "—"}</div></div>; })()}
                                </div>);
                        })}
                        {isOwner && <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                            {!wF && <button onClick={finWeek} style={{ padding: "10px 20px", borderRadius: 8, background: "linear-gradient(135deg, #22c55e, #16a34a)", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: M, letterSpacing: 1 }}>✓ FINALIZE WEEK</button>}
                            <button onClick={resetW} style={{ padding: "10px 20px", borderRadius: 8, background: "transparent", border: "1px solid #334155", color: "#64748b", fontSize: 11, cursor: "pointer", fontFamily: M, letterSpacing: 1 }}>RESET WEEK</button>
                        </div>}
                    </>
                )}

                {/* INDIVIDUAL VIEW */}
                {am && (
                    <>
                        <div style={{ background: "#0f172a", borderRadius: 14, border: "1px solid #1e293b", padding: "16px 20px", marginBottom: 12, position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: am.color }} />
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 22 }}>{am.emoji}</span><div><div style={{ fontSize: 18, fontWeight: 800 }}>{am.name}</div><div style={{ fontSize: 11, color: "#64748b", fontFamily: M }}>{am.role}</div></div></div>
                                <div style={{ textAlign: "right" }}><div style={{ fontSize: 38, fontWeight: 900, color: gc(ds!.pct), fontFamily: M, lineHeight: 1 }}>{ds!.pct}%</div><div style={{ fontSize: 9, fontWeight: 700, color: gc(ds!.pct), fontFamily: M, marginTop: 3 }}>{gz(ds!.pct)} — {ds!.done}/{ds!.total}</div></div>
                            </div>
                        </div>

                        {/* Rewards compact */}
                        <div style={{ background: "#0f172a", borderRadius: 12, border: "1px solid #1e293b", padding: "14px 16px", marginBottom: 12 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 2, fontFamily: M, marginBottom: 10 }}>REWARD PROGRESS</div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {gUT(am.id).map((t) => (<div key={t.id} style={{ flex: "1 1 100px", padding: "10px 8px", borderRadius: 10, background: t.unlocked ? `${t.color}12` : "#1e293b44", border: `1px solid ${t.unlocked ? t.color + "33" : "#1e293b"}`, textAlign: "center", position: "relative", overflow: "hidden" }}>{t.unlocked && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: t.color }} />}<div style={{ fontSize: 22 }}>{t.unlocked ? t.emoji : "🔒"}</div><div style={{ fontSize: 9, fontWeight: 700, color: t.unlocked ? t.color : "#475569", fontFamily: M, marginTop: 4 }}>{t.label}</div>{!t.unlocked && <><div style={{ margin: "6px auto 0", width: "80%", height: 4, borderRadius: 2, background: "#1e293b", overflow: "hidden" }}><div style={{ width: `${t.progress * 100}%`, height: "100%", borderRadius: 2, background: t.color + "88" }} /></div><div style={{ fontSize: 8, color: "#475569", fontFamily: M, marginTop: 3 }}>{t.type === "weekly" ? `Need ${t.minPct}%` : `${t.current}/${t.needed} weeks`}</div></>}{t.unlocked && <div style={{ fontSize: 8, color: t.color, fontFamily: M, marginTop: 4, fontWeight: 700 }}>UNLOCKED ✓</div>}</div>))}
                            </div>
                        </div>

                        {/* Day selector */}
                        <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
                            {DAYS.map((day, i) => {
                                const s = gMDS(am.id, i), sel = i === sD, td = i === Math.min(getTI(), 5), hasT = getOTasks(am.id, i).length > 0, nw = notWorked[dkf(am.id, i)]; return (
                                    <button key={day} onClick={() => setSD(i)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: `1px solid ${sel ? (nw ? "#475569" : am.color) : "#1e293b"}`, background: sel ? "#1e293b" : "#0f172a", cursor: "pointer", textAlign: "center", position: "relative" }}>
                                        {td && !nw && <div style={{ position: "absolute", top: -3, right: -3, width: 7, height: 7, borderRadius: "50%", background: am.color, boxShadow: `0 0 6px ${am.color}88` }} />}
                                        {hasT && <div style={{ position: "absolute", top: -3, left: -3, width: 7, height: 7, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 6px #ef444488" }} />}
                                        <div style={{ fontSize: 10, fontWeight: 700, color: sel ? "#e2e8f0" : "#64748b", fontFamily: M }}>{day}</div>
                                        {nw ? (
                                            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", fontFamily: M, marginTop: 1 }}>OFF</div>
                                        ) : (
                                            <div style={{ fontSize: 16, fontWeight: 800, color: s.done > 0 ? gc(s.pct) : "#334155", fontFamily: M, marginTop: 1 }}>{s.pct}%</div>
                                        )}
                                        {sub[dkf(am.id, i)] && !nw && <div style={{ fontSize: 8, color: "#22c55e", marginTop: 1 }}>✓</div>}
                                    </button>);
                            })}
                        </div>

                        {/* TIME CLOCK */}
                        <div style={{ background: "#0f172a", borderRadius: 11, border: `1px solid ${notWorked[dayKey!] ? "#ef444433" : "#1e293b"}`, marginBottom: 8, overflow: "hidden" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 14px", borderBottom: "1px solid #1e293b", background: notWorked[dayKey!] ? "#ef444408" : "transparent" }}>
                                <span style={{ fontSize: 14 }}>⏱️</span>
                                <span style={{ fontSize: 12, fontWeight: 700 }}>Time Clock</span>
                                {getMWH(am.id) > 0 && <span style={{ fontSize: 9, color: "#22c55e", fontFamily: M, fontWeight: 700, marginLeft: "auto", padding: "2px 8px", background: "#22c55e18", borderRadius: 4 }}>{fmtH(getMWH(am.id))} THIS WEEK</span>}
                            </div>
                            <div style={{ padding: "12px 14px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                                {notWorked[dayKey!] ? (
                                    <div style={{ flex: 1, fontSize: 12, color: "#64748b", fontStyle: "italic" }}>Day marked as not worked — excluded from score</div>
                                ) : (
                                    <>
                                        <div>
                                            <div style={{ fontSize: 9, color: "#64748b", fontFamily: M, letterSpacing: 1, marginBottom: 5 }}>CLOCK IN</div>
                                            {(clockLogs[dayKey!] || {}).in ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <div style={{ fontSize: 20, fontWeight: 800, color: "#22c55e", fontFamily: M }}>{clockLogs[dayKey!].in}</div>
                                                    {!dl && <button onClick={() => delClk(am.id, sD, 'in')} style={{ fontSize: 10, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: M, padding: "2px 4px" }}>✕</button>}
                                                </div>
                                            ) : (
                                                <button onClick={() => clockIn(am.id, sD)} disabled={dl} style={{ padding: "7px 14px", borderRadius: 7, background: dl ? "#1e293b" : "#22c55e22", border: `1px solid ${dl ? "#334155" : "#22c55e55"}`, color: dl ? "#475569" : "#22c55e", fontSize: 11, fontWeight: 700, cursor: dl ? "default" : "pointer", fontFamily: M }}>▶ CLOCK IN</button>
                                            )}
                                        </div>
                                        <div style={{ color: "#334155", fontSize: 16, paddingTop: 14 }}>→</div>
                                        <div>
                                            <div style={{ fontSize: 9, color: "#64748b", fontFamily: M, letterSpacing: 1, marginBottom: 5 }}>CLOCK OUT</div>
                                            {(clockLogs[dayKey!] || {}).out ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <div style={{ fontSize: 20, fontWeight: 800, color: "#f87171", fontFamily: M }}>{clockLogs[dayKey!].out}</div>
                                                    {!dl && <button onClick={() => delClk(am.id, sD, 'out')} style={{ fontSize: 10, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: M, padding: "2px 4px" }}>✕</button>}
                                                </div>
                                            ) : (clockLogs[dayKey!] || {}).in ? (
                                                <button onClick={() => clockOut(am.id, sD)} disabled={dl} style={{ padding: "7px 14px", borderRadius: 7, background: dl ? "#1e293b" : "#ef444422", border: `1px solid ${dl ? "#334155" : "#ef444455"}`, color: dl ? "#475569" : "#f87171", fontSize: 11, fontWeight: 700, cursor: dl ? "default" : "pointer", fontFamily: M }}>■ CLOCK OUT</button>
                                            ) : (
                                                <div style={{ fontSize: 11, color: "#334155", fontFamily: M, paddingTop: 4 }}>Clock in first</div>
                                            )}
                                        </div>
                                        {(() => { const dur = calcHrs((clockLogs[dayKey!] || {}).in, (clockLogs[dayKey!] || {}).out); return dur && (<div><div style={{ fontSize: 9, color: "#64748b", fontFamily: M, letterSpacing: 1, marginBottom: 5 }}>TODAY</div><div style={{ fontSize: 20, fontWeight: 800, fontFamily: M, color: "#e2e8f0" }}>{dur.h}h {dur.m}m</div></div>); })()}
                                    </>
                                )}
                                <div style={{ marginLeft: "auto" }}>
                                    <button onClick={() => toggleNW(am.id, sD)} disabled={wF} style={{ padding: "7px 12px", borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: wF ? "default" : "pointer", fontFamily: M, background: notWorked[dayKey!] ? "#ef444415" : "#1e293b", border: `1px solid ${notWorked[dayKey!] ? "#ef444433" : "#334155"}`, color: notWorked[dayKey!] ? "#f87171" : "#475569" }}>
                                        {notWorked[dayKey!] ? "✕ NOT WORKED" : "MARK NOT WORKED"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* OWNER TASKS */}
                        {dayOTasks.length > 0 && (
                            <div style={{ background: "#0f172a", borderRadius: 11, border: "1px solid #ef444433", marginBottom: 8, overflow: "hidden" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 14px", borderBottom: "1px solid #1e293b", background: "#ef444408" }}>
                                    <span style={{ fontSize: 14 }}>📌</span><span style={{ fontSize: 12, fontWeight: 700 }}>Tasks from Owner</span>
                                    <span style={{ fontSize: 9, color: "#ef4444", fontFamily: M, fontWeight: 700, marginLeft: "auto", padding: "2px 8px", background: "#ef444418", borderRadius: 4 }}>{dayOTasks.filter((t: any) => !dayODone[t.id]).length} REMAINING</span>
                                </div>
                                <div style={{ padding: "3px 0" }}>
                                    {dayOTasks.map((task: any) => {
                                        const chk = dayODone[task.id] || false;
                                        return (
                                            <div key={task.id} onClick={() => toggleOTask(am.id, sD, task.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", cursor: "pointer" }} onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#1e293b44"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                                                <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${chk ? "#22c55e" : "#ef4444"}`, background: chk ? "#22c55e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{chk && <span style={{ color: "#0a0f1a", fontSize: 12, fontWeight: 800 }}>✓</span>}</div>
                                                <span style={{ fontSize: 12, color: chk ? "#94a3b8" : "#e2e8f0", textDecoration: chk ? "line-through" : "none", flex: 1 }}>{task.text}</span>
                                                <span style={{ fontSize: 8, color: "#ef4444", fontFamily: M }}>FROM OWNER</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Checklists */}
                        {am.sections.map((sec) => {
                            const ss = gSS(am.id, sec.id, sD); return (
                                <div key={sec.id} style={{ background: "#0f172a", borderRadius: 11, border: "1px solid #1e293b", marginBottom: 8, overflow: "hidden" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #1e293b" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ fontSize: 14 }}>{sec.icon}</span><span style={{ fontSize: 12, fontWeight: 700 }}>{sec.title}</span></div>
                                        <div style={{ fontSize: 10, fontWeight: 700, fontFamily: M, color: ss.pct === 100 ? "#22c55e" : ss.done > 0 ? "#eab308" : "#475569", background: ss.pct === 100 ? "#22c55e11" : "transparent", padding: "2px 7px", borderRadius: 5 }}>{ss.done}/{ss.total}</div>
                                    </div>
                                    <div style={{ padding: "3px 0" }}>
                                        {sec.items.map((item) => {
                                            const chk = wd[am.id]?.[sD]?.[item.id] || false; return (
                                                <div key={item.id} onClick={() => toggle(am.id, sD, item.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", cursor: dl ? "default" : "pointer", opacity: dl && !chk ? 0.4 : 1 }} onMouseEnter={(e) => { if (!dl) (e.currentTarget as HTMLDivElement).style.background = "#1e293b44"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                                                    <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${chk ? "#22c55e" : "#334155"}`, background: chk ? "#22c55e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{chk && <span style={{ color: "#0a0f1a", fontSize: 12, fontWeight: 800 }}>✓</span>}</div>
                                                    <span style={{ fontSize: 12, color: chk ? "#94a3b8" : "#cbd5e1", textDecoration: chk ? "line-through" : "none" }}>{item.label}</span>
                                                </div>);
                                        })}
                                    </div>
                                </div>);
                        })}

                        {/* TINT LOG (Anthony & Inna) */}
                        {am.hasTintLog && (
                            <div style={{ background: "#0f172a", borderRadius: 11, border: `1px solid ${am.color}33`, marginBottom: 8, overflow: "hidden" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 14px", borderBottom: "1px solid #1e293b", background: `${am.color}08` }}><span style={{ fontSize: 14 }}>🚘</span><span style={{ fontSize: 12, fontWeight: 700 }}>Cars Tinted Today</span><span style={{ fontSize: 9, color: am.color, fontFamily: M, fontWeight: 700, marginLeft: "auto", padding: "2px 8px", background: `${am.color}18`, borderRadius: 4 }}>{gTJ(am.id, sD).length} TODAY • {gWTC(am.id)} WEEK</span></div>
                                <div style={{ padding: 14 }}>
                                    {gTJ(am.id, sD).map((job: any, idx: number) => (
                                        <div key={idx} style={{ background: "#1e293b", borderRadius: 8, padding: "10px 12px", marginBottom: 8, border: "1px solid #334155" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                                                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{job.vehicle}</div>{job.services && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{job.services}</div>}</div>
                                                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                                                    {job.reduction && <div style={{ padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: M, background: `${am.color}18`, color: am.color, border: `1px solid ${am.color}33` }}>{job.reduction}% VLT</div>}
                                                    {job.split && <div style={{ padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: M, background: "#3b82f618", color: "#3b82f6", border: "1px solid #3b82f633" }}>SPLIT{job.splitWith ? ` w/ ${job.splitWith}` : ""}</div>}
                                                </div>
                                            </div>
                                            {!dl && <button onClick={() => rTJ(am.id, sD, idx)} style={{ marginTop: 6, fontSize: 10, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontFamily: M, padding: 0 }}>✕ Remove</button>}
                                        </div>
                                    ))}
                                    {!dl && (() => {
                                        const dr = gTD(am.id, sD); return (
                                            <div style={{ background: "#0f172a", borderRadius: 8, border: "1px dashed #334155", padding: 12, marginTop: 4 }}>
                                                <div style={{ fontSize: 9, color: "#64748b", fontFamily: M, letterSpacing: 1, marginBottom: 8 }}>ADD VEHICLE</div>
                                                <input value={dr.vehicle || ""} onChange={(e) => uTD(am.id, sD, "vehicle", e.target.value)} placeholder="Vehicle (e.g. 2024 BMW X5)" style={{ width: "100%", padding: "8px 10px", background: "#1e293b", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
                                                <input value={dr.services || ""} onChange={(e) => uTD(am.id, sD, "services", e.target.value)} placeholder="Services (e.g. full sides + rear, windshield)" style={{ width: "100%", padding: "8px 10px", background: "#1e293b", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
                                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                                                    <div style={{ flex: "1 1 120px" }}><div style={{ fontSize: 9, color: "#64748b", fontFamily: M, letterSpacing: 1, marginBottom: 4 }}>REDUCTION (VLT %)</div><input type="number" min="0" max="100" value={dr.reduction || ""} onChange={(e) => uTD(am.id, sD, "reduction", e.target.value)} placeholder="e.g. 20" style={{ width: "100%", padding: "8px 10px", background: "#1e293b", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 14, fontWeight: 700, fontFamily: M, outline: "none", boxSizing: "border-box" }} /></div>
                                                    <div style={{ flex: "1 1 200px" }}><div style={{ fontSize: 9, color: "#64748b", fontFamily: M, letterSpacing: 1, marginBottom: 4 }}>SPLIT WITH ANOTHER INSTALLER?</div><div style={{ display: "flex", gap: 6, alignItems: "center" }}><button onClick={() => uTD(am.id, sD, "split", !dr.split)} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: M, cursor: "pointer", background: dr.split ? "#3b82f622" : "#1e293b", border: `1px solid ${dr.split ? "#3b82f644" : "#334155"}`, color: dr.split ? "#60a5fa" : "#64748b" }}>{dr.split ? "YES — SPLIT" : "NO — SOLO"}</button>{dr.split && <input value={dr.splitWith || ""} onChange={(e) => uTD(am.id, sD, "splitWith", e.target.value)} placeholder="Who?" style={{ flex: 1, padding: "6px 10px", background: "#1e293b", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box" }} />}</div></div>
                                                </div>
                                                <button onClick={() => aTJ(am.id, sD)} disabled={!dr.vehicle} style={{ padding: "7px 16px", borderRadius: 7, background: dr.vehicle ? am.color : "#1e293b", border: "none", color: dr.vehicle ? "#0a0f1a" : "#475569", fontSize: 11, fontWeight: 700, cursor: dr.vehicle ? "pointer" : "default", fontFamily: M }}>+ ADD TINT JOB</button>
                                            </div>);
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* EMILY: Wrap Log */}
                        {am.hasWrapLog && (
                            <div style={{ background: "#0f172a", borderRadius: 11, border: "1px solid #8b5cf633", marginBottom: 8, overflow: "hidden" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 14px", borderBottom: "1px solid #1e293b", background: "#8b5cf608" }}><span style={{ fontSize: 14 }}>🚛</span><span style={{ fontSize: 12, fontWeight: 700 }}>Wrap Jobs — Shop Status</span></div>
                                <div style={{ padding: 14 }}>
                                    {((wrapLogs[dayKey!] || {}).jobs || []).map((job: any, idx: number) => (
                                        <div key={idx} style={{ background: "#1e293b", borderRadius: 8, padding: "10px 12px", marginBottom: 8, border: "1px solid #334155" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                                                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{job.vehicle}</div>{job.notes && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{job.notes}</div>}</div>
                                                <div style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: M, background: job.status === "Being Installed" ? "#22c55e18" : job.status === "Install Scheduled" ? "#3b82f618" : job.status === "Print" ? "#eab30818" : "#8b5cf618", color: job.status === "Being Installed" ? "#22c55e" : job.status === "Install Scheduled" ? "#3b82f6" : job.status === "Print" ? "#eab308" : "#8b5cf6", border: `1px solid ${job.status === "Being Installed" ? "#22c55e33" : job.status === "Install Scheduled" ? "#3b82f633" : job.status === "Print" ? "#eab30833" : "#8b5cf633"}`, whiteSpace: "nowrap" }}>{job.status}</div>
                                            </div>
                                            {!dl && <button onClick={() => { const jobs = [...((wrapLogs[dayKey!] || {}).jobs || [])]; jobs.splice(idx, 1); const u = { ...wrapLogs, [dayKey!]: { ...wrapLogs[dayKey!], jobs } }; setWL(u); sv(pk({ wrapLogs: u })); }} style={{ marginTop: 6, fontSize: 10, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontFamily: M, padding: 0 }}>✕ Remove</button>}
                                        </div>
                                    ))}
                                    {!dl && (() => {
                                        const dr = (wrapLogs[dayKey!] || {}).draft || {};
                                        const uD = (f: string, v: any) => { setWL((p: any) => ({ ...p, [dayKey!]: { ...(p[dayKey!] || {}), draft: { ...((p[dayKey!] || {}).draft || {}), [f]: v } } })); };
                                        const aJ = () => { if (!dr.vehicle) return; const jobs = [...((wrapLogs[dayKey!] || {}).jobs || []), { vehicle: dr.vehicle, status: dr.status || "Design", notes: dr.notes || "" }]; const u = { ...wrapLogs, [dayKey!]: { ...wrapLogs[dayKey!], jobs, draft: {} } }; setWL(u); sv(pk({ wrapLogs: u })); };
                                        return (
                                            <div style={{ background: "#0f172a", borderRadius: 8, border: "1px dashed #334155", padding: 12, marginTop: 4 }}>
                                                <div style={{ fontSize: 9, color: "#64748b", fontFamily: M, letterSpacing: 1, marginBottom: 8 }}>ADD WRAP JOB</div>
                                                <input value={dr.vehicle || ""} onChange={(e) => uD("vehicle", e.target.value)} placeholder="Vehicle (e.g. 2024 Ford Transit — ABC Plumbing)" style={{ width: "100%", padding: "8px 10px", background: "#1e293b", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
                                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>{WRAP_STATUSES.map((st) => (<button key={st} onClick={() => uD("status", st)} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: M, cursor: "pointer", background: (dr.status || "Design") === st ? "#8b5cf622" : "#1e293b", border: `1px solid ${(dr.status || "Design") === st ? "#8b5cf644" : "#334155"}`, color: (dr.status || "Design") === st ? "#c084fc" : "#64748b" }}>{st}</button>))}</div>
                                                <textarea value={dr.notes || ""} onChange={(e) => uD("notes", e.target.value)} placeholder="Where it's at..." style={{ width: "100%", minHeight: 40, background: "#1e293b", border: "1px solid #334155", borderRadius: 7, padding: 8, color: "#e2e8f0", fontSize: 11, fontFamily: S, resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
                                                <button onClick={aJ} disabled={!dr.vehicle} style={{ padding: "7px 16px", borderRadius: 7, background: dr.vehicle ? "#8b5cf6" : "#1e293b", border: "none", color: dr.vehicle ? "#fff" : "#475569", fontSize: 11, fontWeight: 700, cursor: dr.vehicle ? "pointer" : "default", fontFamily: M }}>+ ADD</button>
                                            </div>);
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* SCOTT: Sales */}
                        {am.hasSalesLog && (
                            <div style={{ background: "#0f172a", borderRadius: 11, border: "1px solid #1e293b", marginBottom: 8, overflow: "hidden" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 14px", borderBottom: "1px solid #1e293b" }}><span style={{ fontSize: 14 }}>💵</span><span style={{ fontSize: 12, fontWeight: 700 }}>Today's Sales Numbers</span></div>
                                <div style={{ padding: 14 }}>
                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}><NI label="JOBS CLOSED" value={(salesLogs[dayKey!] || {}).jobsClosed} onChange={(v: any) => updf(setSL, salesLogs, dayKey!, "jobsClosed", v, "salesLogs")} disabled={dl} /><NI label="TOTAL REVENUE" prefix="$" value={(salesLogs[dayKey!] || {}).revenue} onChange={(v: any) => updf(setSL, salesLogs, dayKey!, "revenue", v, "salesLogs")} disabled={dl} /></div>
                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><NI label="UPSELLS" value={(salesLogs[dayKey!] || {}).upsells} onChange={(v: any) => updf(setSL, salesLogs, dayKey!, "upsells", v, "salesLogs")} disabled={dl} /><NI label="UPSELL REVENUE" prefix="$" value={(salesLogs[dayKey!] || {}).upsellRevenue} onChange={(v: any) => updf(setSL, salesLogs, dayKey!, "upsellRevenue", v, "salesLogs")} disabled={dl} /></div>
                                </div>
                            </div>
                        )}

                        {/* SCOTT: Outbound */}
                        {am.hasOutboundLog && isOB && (
                            <div style={{ background: "#0f172a", borderRadius: 11, border: "1px solid #3b82f633", marginBottom: 8, overflow: "hidden" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 14px", borderBottom: "1px solid #1e293b", background: "#3b82f608" }}><span style={{ fontSize: 14 }}>📋</span><span style={{ fontSize: 12, fontWeight: 700 }}>Outbound Log</span><span style={{ fontSize: 9, color: "#3b82f6", fontFamily: M, fontWeight: 700, marginLeft: "auto", padding: "2px 8px", background: "#3b82f618", borderRadius: 4 }}>OUTBOUND DAY</span></div>
                                <div style={{ padding: 14 }}>
                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}><NI label="PEOPLE SPOKEN TO" value={(outLogs[dayKey!] || {}).peopleSpokeWith} onChange={(v: any) => updf(setOL, outLogs, dayKey!, "peopleSpokeWith", v, "outLogs")} disabled={dl} /></div>
                                    <div style={{ fontSize: 9, color: "#64748b", fontFamily: M, letterSpacing: 1, marginBottom: 4 }}>RESULTS / SUCCESS NOTES</div>
                                    <textarea value={(outLogs[dayKey!] || {}).successNotes || ""} onChange={(e) => updf(setOL, outLogs, dayKey!, "successNotes", e.target.value, "outLogs")} placeholder="e.g. ABC Motors interested in fleet tinting" disabled={dl} style={{ width: "100%", minHeight: 70, background: "#1e293b", border: "1px solid #334155", borderRadius: 7, padding: 10, color: "#e2e8f0", fontSize: 12, fontFamily: S, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }} />
                                </div>
                            </div>
                        )}
                        {am.hasOutboundLog && !isOB && (<div style={{ background: "#0f172a", borderRadius: 11, border: "1px solid #1e293b", marginBottom: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14 }}>📞</span><span style={{ fontSize: 11, color: "#475569" }}>Outbound log on <span style={{ color: "#3b82f6", fontWeight: 700, fontFamily: M }}>TUE</span> and <span style={{ color: "#3b82f6", fontWeight: 700, fontFamily: M }}>WED</span></span></div>)}

                        {/* NICK: Car Log */}
                        {am.hasCarLog && (
                            <div style={{ background: "#0f172a", borderRadius: 11, border: "1px solid #1e293b", marginBottom: 8, overflow: "hidden" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 14px", borderBottom: "1px solid #1e293b" }}><span style={{ fontSize: 14 }}>🚘</span><span style={{ fontSize: 12, fontWeight: 700 }}>Cars Worked On Today</span></div>
                                <div style={{ padding: 14 }}><textarea value={carLogs[dayKey!] || ""} onChange={(e) => updT(setCL, carLogs, dayKey!, e.target.value, "carLogs")} placeholder={"2024 Toyota Camry — full interior detail\n2023 Ford F-150 — wash + engine bay"} disabled={dl} style={{ width: "100%", minHeight: 90, background: "#1e293b", border: "1px solid #334155", borderRadius: 7, padding: 10, color: "#e2e8f0", fontSize: 12, fontFamily: S, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }} /></div>
                            </div>
                        )}

                        {/* Notes */}
                        <div style={{ background: "#0f172a", borderRadius: 11, border: "1px solid #1e293b", padding: 14, marginBottom: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, fontFamily: M, letterSpacing: 1 }}>END-OF-DAY NOTES</div>
                            <textarea value={notes[dayKey!] || ""} onChange={(e) => updT(setNotes, notes, dayKey!, e.target.value, "notes")} placeholder="Issues, wins, escalations..." disabled={dl} style={{ width: "100%", minHeight: 50, background: "#1e293b", border: "1px solid #334155", borderRadius: 7, padding: 10, color: "#e2e8f0", fontSize: 12, fontFamily: S, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                        </div>

                        {/* Submit */}
                        {!dl ? (
                            <button onClick={() => subDay(am.id, sD)} disabled={ds!.done === 0} style={{ width: "100%", padding: 12, borderRadius: 9, background: ds!.done > 0 ? `linear-gradient(135deg, ${am.color}, ${am.color}cc)` : "#1e293b", border: "none", color: ds!.done > 0 ? "#fff" : "#475569", fontSize: 13, fontWeight: 700, cursor: ds!.done > 0 ? "pointer" : "default", fontFamily: M, letterSpacing: 1 }}>SUBMIT {am.name.toUpperCase()}'S {DAYS[sD].toUpperCase()}</button>
                        ) : (
                            <div style={{ width: "100%", padding: 12, borderRadius: 9, background: "#22c55e11", border: "1px solid #22c55e33", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#22c55e", fontFamily: M, letterSpacing: 1, boxSizing: "border-box" }}>✓ SUBMITTED — {ds!.pct}%</div>
                        )}

                        {/* Weekly KPI */}
                        <div style={{ marginTop: 16, fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 2, fontFamily: M, marginBottom: 8 }}>WEEKLY KPI BREAKDOWN</div>
                        {am.sections.map((sec) => {
                            let t = 0, d = 0; const kpiToday = Math.min(getTI(), 5); for (let i = 0; i <= kpiToday; i++) { if (notWorked[dkf(am.id, i)]) continue; const dd = wd[am.id]?.[i] || {}; sec.items.forEach((item) => { t++; if (dd[item.id]) d++; }); } const pct = t > 0 ? Math.round((d / t) * 100) : 0; return (
                                <div key={sec.id} style={{ background: "#0f172a", borderRadius: 9, border: "1px solid #1e293b", padding: "10px 14px", marginBottom: 5 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 12 }}>{sec.icon}</span><span style={{ fontSize: 11, fontWeight: 700 }}>{sec.title}</span></div><span style={{ fontSize: 14, fontWeight: 800, color: gc(pct), fontFamily: M }}>{pct}%</span></div>
                                    <div style={{ background: "#1e293b", borderRadius: 3, height: 5, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${gc(pct)}88, ${gc(pct)})` }} /></div>
                                </div>);
                        })}

                        {am.hasSalesLog && (() => {
                            const t = gWST(); return (
                                <div style={{ background: "#0f172a", borderRadius: 9, border: "1px solid #3b82f633", padding: "14px", marginTop: 8 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "#3b82f6", letterSpacing: 2, fontFamily: M, marginBottom: 10 }}>WEEKLY SALES SUMMARY</div>
                                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                        <div><div style={{ fontSize: 9, color: "#475569", fontFamily: M }}>JOBS</div><div style={{ fontSize: 24, fontWeight: 900, fontFamily: M }}>{t.jobs}</div></div>
                                        <div><div style={{ fontSize: 9, color: "#475569", fontFamily: M }}>REVENUE</div><div style={{ fontSize: 24, fontWeight: 900, color: "#3b82f6", fontFamily: M }}>${t.rev.toLocaleString()}</div></div>
                                        <div><div style={{ fontSize: 9, color: "#475569", fontFamily: M }}>UPSELLS</div><div style={{ fontSize: 24, fontWeight: 900, color: "#22c55e", fontFamily: M }}>{t.ups}</div></div>
                                        <div><div style={{ fontSize: 9, color: "#475569", fontFamily: M }}>UPSELL $</div><div style={{ fontSize: 24, fontWeight: 900, color: "#22c55e", fontFamily: M }}>${t.upRev.toLocaleString()}</div></div>
                                    </div>
                                </div>);
                        })()}

                        {am.hasTintLog && (
                            <div style={{ background: "#0f172a", borderRadius: 9, border: `1px solid ${am.color}33`, padding: "14px", marginTop: 8 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: am.color, letterSpacing: 2, fontFamily: M, marginBottom: 10 }}>WEEKLY TINT SUMMARY</div>
                                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                    <div><div style={{ fontSize: 9, color: "#475569", fontFamily: M }}>TOTAL CARS</div><div style={{ fontSize: 24, fontWeight: 900, color: am.color, fontFamily: M }}>{gWTC(am.id)}</div></div>
                                    <div><div style={{ fontSize: 9, color: "#475569", fontFamily: M }}>SPLIT JOBS</div><div style={{ fontSize: 24, fontWeight: 900, color: "#3b82f6", fontFamily: M }}>{(() => { let c = 0; for (let d = 0; d < 6; d++) gTJ(am.id, d).forEach((j: any) => { if (j.split) c++; }); return c; })()}</div></div>
                                    {DAYS.map((day, di) => (<div key={di}><div style={{ fontSize: 9, color: "#475569", fontFamily: M }}>{day.toUpperCase()}</div><div style={{ fontSize: 18, fontWeight: 800, color: gTJ(am.id, di).length > 0 ? "#e2e8f0" : "#334155", fontFamily: M }}>{gTJ(am.id, di).length}</div></div>))}
                                </div>
                            </div>
                        )}

                        {/* PREVIOUS WEEKS */}
                        {(() => {
                            const hist = (streaks[am.id]?.history || []).filter((h: any) => h.week !== getWK()).slice().reverse();
                            if (hist.length === 0) return null;
                            return (
                                <div style={{ marginTop: 20 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 2, fontFamily: M, marginBottom: 8 }}>PREVIOUS WEEKS</div>
                                    {hist.map((h: any) => {
                                        const isOpen = histWeek === h.week;
                                        return (
                                            <div key={h.week} style={{ background: "#0f172a", borderRadius: 11, border: `1px solid ${isOpen ? am.color + "44" : "#1e293b"}`, marginBottom: 6, overflow: "hidden" }}>
                                                <div onClick={() => { if (isOpen) { setHW(null); setHD(null); } else { setHW(h.week); setHDay(0); loadHistWeek(h.week); } }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: isOpen ? `${am.color}08` : "transparent" }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>{fmtWeekRange(h.week)}</div>
                                                        <div style={{ fontSize: 9, color: "#475569", fontFamily: M, marginTop: 2 }}>{h.week}</div>
                                                    </div>
                                                    <div style={{ background: "#1e293b", borderRadius: 6, height: 5, width: 80, overflow: "hidden" }}>
                                                        <div style={{ width: `${h.score}%`, height: "100%", borderRadius: 6, background: gc(h.score) }} />
                                                    </div>
                                                    <div style={{ fontSize: 16, fontWeight: 800, color: gc(h.score), fontFamily: M, minWidth: 44, textAlign: "right" }}>{h.score}%</div>
                                                    <div style={{ fontSize: 10, color: "#475569" }}>{isOpen ? "▲" : "▼"}</div>
                                                </div>
                                                {isOpen && (
                                                    <div style={{ borderTop: `1px solid ${am.color}22`, padding: "12px 14px" }}>
                                                        {histLoading ? (
                                                            <div style={{ fontSize: 11, color: "#475569", fontFamily: M, textAlign: "center", padding: 12 }}>Loading...</div>
                                                        ) : histData ? (
                                                            <>
                                                                <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                                                                    {DAYS.map((day, di) => {
                                                                        const dd = histData.wd?.[am.id]?.[di] || {};
                                                                        const items = gAI(am);
                                                                        const done = items.filter((id: string) => dd[id]).length;
                                                                        const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
                                                                        const sel = di === histDay;
                                                                        return (
                                                                            <button key={di} onClick={() => setHDay(di)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: `1px solid ${sel ? am.color : "#1e293b"}`, background: sel ? "#1e293b" : "#0f172a", cursor: "pointer", textAlign: "center" }}>
                                                                                <div style={{ fontSize: 9, fontWeight: 700, color: sel ? "#e2e8f0" : "#64748b", fontFamily: M }}>{day}</div>
                                                                                <div style={{ fontSize: 14, fontWeight: 800, color: done > 0 ? gc(pct) : "#334155", fontFamily: M, marginTop: 1 }}>{pct}%</div>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                                {am.sections.map((sec) => (
                                                                    <div key={sec.id} style={{ background: "#0a0f1a", borderRadius: 9, border: "1px solid #1e293b", marginBottom: 6, overflow: "hidden" }}>
                                                                        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderBottom: "1px solid #1e293b" }}>
                                                                            <span style={{ fontSize: 12 }}>{sec.icon}</span>
                                                                            <span style={{ fontSize: 11, fontWeight: 700 }}>{sec.title}</span>
                                                                        </div>
                                                                        <div style={{ padding: "2px 0" }}>
                                                                            {sec.items.map((item) => {
                                                                                const chk = histData.wd?.[am.id]?.[histDay]?.[item.id] || false;
                                                                                return (
                                                                                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 12px" }}>
                                                                                        <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${chk ? "#22c55e" : "#334155"}`, background: chk ? "#22c55e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{chk && <span style={{ color: "#0a0f1a", fontSize: 11, fontWeight: 800 }}>✓</span>}</div>
                                                                                        <span style={{ fontSize: 11, color: chk ? "#94a3b8" : "#64748b", textDecoration: chk ? "line-through" : "none" }}>{item.label}</span>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </>
                                                        ) : (
                                                            <div style={{ fontSize: 11, color: "#475569", fontFamily: M, textAlign: "center", padding: 12 }}>No data available</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </>
                )}
            </div>
        </div>
    );
}
