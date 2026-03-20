import { useState, useRef, useEffect } from "react";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const SAMPLE_RESUME = `Arjun Mehta
arjun.mehta@gmail.com | +91 98765 43210
github.com/arjunmehta | linkedin.com/in/arjunmehta

SUMMARY
Backend engineer with 4 years of experience building high-throughput distributed systems.
Passionate about developer tooling and event-driven architectures.

EXPERIENCE

Senior Software Engineer — Zepto (Grocery Delivery), Mumbai
Jan 2022 – Present
- Redesigned order-routing service, reducing p99 latency from 800ms to 120ms (85% improvement)
- Built an AWS Kinesis-based event pipeline processing 2M events/day replacing a cron-based system
- Led migration of 3 monolith services to microservices, cutting deployment time by 60%
- Mentored 2 junior engineers; ran weekly architecture review sessions

Software Engineer — Razorpay, Bangalore
Jun 2020 – Dec 2021
- Implemented idempotency layer for payment retry logic, reducing duplicate charges by 99.7%
- Contributed to internal RPC framework used by 40+ microservices
- Was involved in the dashboard redesign project

EDUCATION
B.Tech Computer Science — NIT Trichy, 2020 | CGPA 8.6/10

SKILLS
Python, Go, TypeScript, PostgreSQL, Redis, Cassandra, AWS Kinesis, SQS, Lambda, Docker, Kubernetes, FastAPI, gRPC, React

PROJECTS
- pg-outbox: PostgreSQL transactional outbox pattern library (340 GitHub stars)
- ratelimiter: Token bucket rate limiter in Go`;

const SAMPLE_JD = `Senior Backend Engineer — Data Platform Team
Jano Healthcare, Bangalore

We're building the data infrastructure that powers India's largest preventive health network.

REQUIREMENTS:
- 3+ years backend experience in Python or Go
- Strong experience with Apache Kafka (producer/consumer, partitioning, offset management)
- Proficiency in PostgreSQL and at least one NoSQL database
- Experience with Kubernetes and container orchestration
- Understanding of distributed systems: CAP theorem, eventual consistency
- Strong ownership mentality — we need builders, not contributors

NICE TO HAVE:
- Healthcare domain experience
- Terraform or IaC tooling
- Open-source contributions`;

async function callClaude(systemPrompt, userContent) {
  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.content.filter(b => b.type === "text").map(b => b.text).join("");
  const clean = text.replace(/^```json\s*|^```\s*|\s*```$/gm, "").trim();
  return JSON.parse(clean);
}

function ScoreRing({ value, label, color, delay = 0 }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  const r = 28, c = 2 * Math.PI * r;
  const offset = c - (animated / 100) * c;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={72} height={72} viewBox="0 0 72 72">
        <circle cx={36} cy={36} r={r} fill="none" stroke="var(--color-border-tertiary)" strokeWidth={5} />
        <circle
          cx={36} cy={36} r={r} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)" }}
        />
        <text x={36} y={40} textAnchor="middle" fontSize={15} fontWeight={500} fill="var(--color-text-primary)">
          {Math.round(animated)}
        </text>
      </svg>
      <span style={{ fontSize: 11, color: "var(--color-text-secondary)", textAlign: "center", maxWidth: 70, lineHeight: 1.3 }}>{label}</span>
    </div>
  );
}

function TierBadge({ tier, label }) {
  const configs = {
    A: { bg: "#0F6E56", text: "#E1F5EE", icon: "★" },
    B: { bg: "#185FA5", text: "#E6F1FB", icon: "◆" },
    C: { bg: "#5F5E5A", text: "#F1EFE8", icon: "○" },
  };
  const cfg = configs[tier] || configs.C;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 10,
      background: cfg.bg, color: cfg.text,
      padding: "8px 16px", borderRadius: 8, fontWeight: 500, fontSize: 14
    }}>
      <span style={{ fontSize: 16 }}>{cfg.icon}</span>
      <span>Tier {tier} — {label}</span>
    </div>
  );
}

function QuestionCard({ q, index }) {
  const [open, setOpen] = useState(false);
  const diffColor = { Easy: "#0F6E56", Medium: "#BA7517", Hard: "#A32D2D" };
  return (
    <div style={{
      border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10,
      overflow: "hidden", background: "var(--color-background-primary)"
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "12px 16px", cursor: "pointer",
          display: "flex", alignItems: "flex-start", gap: 12,
          background: open ? "var(--color-background-secondary)" : "transparent"
        }}
      >
        <span style={{
          minWidth: 24, height: 24, borderRadius: "50%",
          background: "var(--color-background-secondary)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)"
        }}>{index + 1}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>{q.category}</span>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "var(--color-background-secondary)", color: diffColor[q.difficulty] || "var(--color-text-secondary)", fontWeight: 500 }}>{q.difficulty}</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--color-text-primary)" }}>{q.question}</p>
        </div>
        <span style={{ color: "var(--color-text-secondary)", fontSize: 12, marginTop: 2 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "12px 16px 14px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>Why this question: </strong>{q.why_asked}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>Follow-up: </strong>{q.follow_up}
          </p>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--color-text-secondary)",
          animation: "pulse 1.2s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`
        }} />
      ))}
    </div>
  );
}

const STEPS = [
  { id: "parse", label: "Parsing resume" },
  { id: "score", label: "Scoring against JD" },
  { id: "verify", label: "Verifying claims" },
  { id: "tier", label: "Classifying tier" },
  { id: "questions", label: "Generating questions" },
];

export default function TalentIQ() {
  const [resume, setResume] = useState(SAMPLE_RESUME);
  const [jd, setJd] = useState(SAMPLE_JD);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState([]);
  const [activeStep, setActiveStep] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("scores");
  const resultRef = useRef(null);

  const step = (id, done = false) => {
    setActiveStep(done ? null : id);
    if (done) setProgress(p => [...p, id]);
  };

  const run = async () => {
    setLoading(true);
    setResult(null);
    setProgress([]);
    setError(null);
    setActiveStep(null);

    try {
      // STEP 1: Parse
      step("parse");
      const candidate = await callClaude(
        "You are a resume parser. Return ONLY valid JSON, no markdown fences.",
        `Parse this resume into JSON: {"name":"","email":"","skills":[],"experience_years":0,"roles":[],"education":"","github_url":null,"linkedin_url":null,"achievements":[]}\n\nRESUME:\n${resume}`
      );
      step("parse", true);

      // STEP 2: Score
      step("score");
      const scored = await callClaude(
        "You are a senior technical recruiter. Return ONLY valid JSON, no markdown fences.",
        `Score this candidate against the JD across 4 dimensions. Recognize technology equivalences (e.g. AWS Kinesis = Kafka, RabbitMQ = Kafka conceptually).

Return JSON: {"exact_match_score":0,"exact_match_explanation":"","semantic_similarity_score":0,"semantic_similarity_explanation":"","achievement_impact_score":0,"achievement_impact_explanation":"","ownership_leadership_score":0,"ownership_leadership_explanation":"","composite_summary":"","red_flags":[],"green_flags":[]}

JD: ${jd}

CANDIDATE:
Skills: ${(candidate.skills || []).join(", ")}
Experience: ${candidate.experience_years} years
Roles: ${(candidate.roles || []).join("; ")}
Achievements: ${(candidate.achievements || []).join("; ") || "None"}`
      );
      step("score", true);

      // STEP 3: Verify
      step("verify");
      const verification = await callClaude(
        "You are a background verification assistant. Return ONLY valid JSON, no markdown fences.",
        `Analyze this candidate's profile for authenticity signals.

Skills claimed: ${(candidate.skills || []).join(", ")}
GitHub URL: ${candidate.github_url || "not provided"}
LinkedIn URL: ${candidate.linkedin_url || "not provided"}
Roles: ${(candidate.roles || []).join("; ")}
Achievements: ${(candidate.achievements || []).join("; ") || "None"}

Return JSON: {"consistency_score":0,"notes":[],"github_active":null,"github_repos_estimate":null,"linkedin_valid":null}`
      );
      step("verify", true);

      // STEP 4: Tier
      step("tier");
      const composite = Math.round(
        scored.exact_match_score * 0.25 +
        scored.semantic_similarity_score * 0.30 +
        scored.achievement_impact_score * 0.25 +
        scored.ownership_leadership_score * 0.20
      );
      const signal = composite * 0.75 + (verification.consistency_score || 50) * 0.25;
      let tier, tierLabel, rationale;
      if (signal >= 75 && scored.semantic_similarity_score >= 70) {
        tier = "A"; tierLabel = "Fast-Track to Final Round";
        rationale = `Composite ${composite}/100 with strong semantic match. Verified consistency. Move directly to hiring manager interview.`;
      } else if (signal >= 55) {
        tier = "B"; tierLabel = "Technical Screen Recommended";
        rationale = `Composite ${composite}/100 shows potential but gaps exist. Technical screen will clarify depth.`;
      } else {
        tier = "C"; tierLabel = "Needs Further Evaluation";
        rationale = `Composite ${composite}/100. Significant gaps or unverifiable claims. Consider only if pipeline is thin.`;
      }
      step("tier", true);

      // STEP 5: Questions
      step("questions");
      const weakDims = [];
      if (scored.achievement_impact_score < 60) weakDims.push("achievement quantification");
      if (scored.ownership_leadership_score < 60) weakDims.push("ownership signals");
      if (scored.exact_match_score < 60) weakDims.push("required technical skills");

      const questions = await callClaude(
        "You are a senior engineering interviewer. Return ONLY a valid JSON array, no markdown fences.",
        `Generate 5 targeted interview questions for this candidate. Be hyper-specific — reference their actual companies and projects.

Mix: 2 Technical Deep-Dives, 2 Behavioral, 1 Situational.
Probe weak dims: ${weakDims.join(", ") || "overall depth"}.

Return JSON array: [{"question":"","category":"","difficulty":"Easy|Medium|Hard","why_asked":"","follow_up":""}]

Candidate: ${candidate.name}
Skills: ${(candidate.skills || []).join(", ")}
Roles: ${(candidate.roles || []).join("; ")}
Achievements: ${(candidate.achievements || []).join("; ") || "none"}
Tier: ${tier}
JD (first 400 chars): ${jd.slice(0, 400)}`
      );
      step("questions", true);

      setResult({ candidate, scored, verification, tier, tierLabel, rationale, composite, questions });
      setActiveTab("scores");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setActiveStep(null);
    }
  };

  const scores = result ? [
    { label: "Exact Match", value: result.scored.exact_match_score, color: "#1D9E75" },
    { label: "Semantic Sim.", value: result.scored.semantic_similarity_score, color: "#378ADD" },
    { label: "Achievements", value: result.scored.achievement_impact_score, color: "#BA7517" },
    { label: "Ownership", value: result.scored.ownership_leadership_score, color: "#533AB7" },
  ] : [];

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 860, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .tab-btn { background:transparent; border:0.5px solid var(--color-border-tertiary); border-radius:6px; padding:6px 14px; font-size:13px; cursor:pointer; color:var(--color-text-secondary); transition:all .15s; }
        .tab-btn.active { background:var(--color-background-secondary); color:var(--color-text-primary); font-weight:500; border-color:var(--color-border-secondary); }
        .tab-btn:hover:not(.active) { background:var(--color-background-secondary); }
        textarea { font-family: var(--font-mono); font-size: 12px; line-height: 1.6; resize: vertical; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <path d="M8 1L10.5 6H15L11 9.5L12.5 15L8 12L3.5 15L5 9.5L1 6H5.5L8 1Z" fill="white"/>
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>TalentIQ</h1>
          <span style={{ fontSize: 12, padding: "2px 8px", background: "var(--color-background-secondary)", borderRadius: 4, color: "var(--color-text-secondary)", border: "0.5px solid var(--color-border-tertiary)" }}>AI Resume Evaluator</span>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          Multi-dimensional scoring · Semantic skill matching · Explainable AI · Interview question generation
        </p>
      </div>

      {/* Input */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--color-text-primary)" }}>Resume</label>
          <textarea
            value={resume} onChange={e => setResume(e.target.value)}
            rows={14}
            style={{ width: "100%", padding: 12, border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, background: "var(--color-background-primary)", color: "var(--color-text-primary)", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--color-text-primary)" }}>Job Description</label>
          <textarea
            value={jd} onChange={e => setJd(e.target.value)}
            rows={14}
            style={{ width: "100%", padding: 12, border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, background: "var(--color-background-primary)", color: "var(--color-text-primary)", boxSizing: "border-box" }}
          />
        </div>
      </div>

      <button
        onClick={run}
        disabled={loading}
        style={{
          padding: "10px 24px", borderRadius: 8, border: "none",
          background: loading ? "var(--color-background-secondary)" : "#1D9E75",
          color: loading ? "var(--color-text-secondary)" : "white",
          fontSize: 14, fontWeight: 500, cursor: loading ? "default" : "pointer",
          display: "flex", alignItems: "center", gap: 8
        }}
      >
        {loading ? <><Spinner /><span>Evaluating...</span></> : "Evaluate Candidate"}
      </button>

      {/* Progress */}
      {loading && (
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          {STEPS.map(s => {
            const done = progress.includes(s.id);
            const active = activeStep === s.id;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, opacity: (!done && !active) ? 0.35 : 1, transition: "opacity .3s" }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                  border: `1.5px solid ${done ? "#1D9E75" : active ? "#378ADD" : "var(--color-border-tertiary)"}`,
                  background: done ? "#1D9E75" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {done && <svg width={10} height={10} viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth={1.5} fill="none" strokeLinecap="round"/></svg>}
                  {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#378ADD", animation: "pulse 1s infinite" }} />}
                </div>
                <span style={{ fontSize: 13, color: done ? "var(--color-text-primary)" : active ? "#185FA5" : "var(--color-text-secondary)", fontWeight: active ? 500 : 400 }}>{s.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "var(--color-background-danger)", color: "var(--color-text-danger)", fontSize: 13, border: "0.5px solid var(--color-border-danger)" }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div ref={resultRef} style={{ marginTop: 32, animation: "fadeIn .5s ease" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 500 }}>{result.candidate.name}</h2>
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>{result.candidate.email} · {result.candidate.experience_years}y experience</p>
            </div>
            <TierBadge tier={result.tier} label={result.tierLabel} />
          </div>

          {/* Composite */}
          <div style={{ padding: "14px 18px", borderRadius: 10, background: "var(--color-background-secondary)", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 4 }}>Composite score</div>
              <div style={{ fontSize: 32, fontWeight: 500 }}>{result.composite}<span style={{ fontSize: 16, color: "var(--color-text-secondary)" }}>/100</span></div>
            </div>
            <div style={{ maxWidth: 420 }}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{result.scored.composite_summary}</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {["scores", "verification", "questions"].map(t => (
              <button key={t} className={`tab-btn${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
                {t === "scores" ? "Scores & Analysis" : t === "verification" ? "Verification" : "Interview Questions"}
              </button>
            ))}
          </div>

          {activeTab === "scores" && (
            <div style={{ animation: "fadeIn .3s ease" }}>
              {/* Score rings */}
              <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16, padding: "16px 0 24px", borderBottom: "0.5px solid var(--color-border-tertiary)", marginBottom: 20 }}>
                {scores.map((s, i) => <ScoreRing key={s.label} value={s.value} label={s.label} color={s.color} delay={i * 150} />)}
              </div>

              {/* Explanations */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Exact Match", key: "exact_match_explanation", score: result.scored.exact_match_score, color: "#1D9E75" },
                  { label: "Semantic Similarity", key: "semantic_similarity_explanation", score: result.scored.semantic_similarity_score, color: "#378ADD" },
                  { label: "Achievement Impact", key: "achievement_impact_explanation", score: result.scored.achievement_impact_score, color: "#BA7517" },
                  { label: "Ownership & Leadership", key: "ownership_leadership_explanation", score: result.scored.ownership_leadership_score, color: "#533AB7" },
                ].map(dim => (
                  <div key={dim.key} style={{ padding: "12px 16px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, background: "var(--color-background-primary)", borderLeft: `3px solid ${dim.color}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{dim.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: dim.color }}>{dim.score}/100</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{result.scored[dim.key]}</p>
                  </div>
                ))}
              </div>

              {/* Flags */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                {result.scored.green_flags?.length > 0 && (
                  <div style={{ padding: "12px 14px", borderRadius: 8, background: "var(--color-background-success)", border: "0.5px solid var(--color-border-success)" }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-success)", marginBottom: 8 }}>Green flags</div>
                    {result.scored.green_flags.map((f, i) => (
                      <p key={i} style={{ margin: "0 0 4px", fontSize: 13, color: "var(--color-text-success)", lineHeight: 1.5 }}>+ {f}</p>
                    ))}
                  </div>
                )}
                {result.scored.red_flags?.length > 0 && (
                  <div style={{ padding: "12px 14px", borderRadius: 8, background: "var(--color-background-danger)", border: "0.5px solid var(--color-border-danger)" }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-danger)", marginBottom: 8 }}>Red flags</div>
                    {result.scored.red_flags.map((f, i) => (
                      <p key={i} style={{ margin: "0 0 4px", fontSize: 13, color: "var(--color-text-danger)", lineHeight: 1.5 }}>⚠ {f}</p>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: "var(--color-background-secondary)", fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                <strong style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>Tier rationale: </strong>{result.rationale}
              </div>
            </div>
          )}

          {activeTab === "verification" && (
            <div style={{ animation: "fadeIn .3s ease" }}>
              <div style={{ padding: "14px 18px", borderRadius: 10, border: "0.5px solid var(--color-border-tertiary)", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Consistency score</span>
                  <span style={{ fontSize: 18, fontWeight: 500 }}>{result.verification.consistency_score ?? 50}/100</span>
                </div>
                <div style={{ height: 6, background: "var(--color-border-tertiary)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${result.verification.consistency_score ?? 50}%`, background: "#1D9E75", borderRadius: 3, transition: "width 1s ease" }} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(result.verification.notes || []).map((note, i) => (
                  <div key={i} style={{ padding: "10px 14px", borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)", fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{note}</div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "questions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeIn .3s ease" }}>
              {(result.questions || []).map((q, i) => <QuestionCard key={i} q={q} index={i} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
