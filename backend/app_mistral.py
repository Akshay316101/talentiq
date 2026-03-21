"""
TalentIQ — Streamlit Demo (Mistral Free Tier)
----------------------------------------------
Run: python -m streamlit run app_mistral.py
"""

import streamlit as st
import dataclasses
import json

# ── PASTE YOUR MISTRAL KEY HERE ──────────────
MISTRAL_API_KEY = "CzVUxaBjZCvUbG3aGcZjuooLw05DNhkt"
# ─────────────────────────────────────────────

import engine_mistral
engine_mistral.MISTRAL_API_KEY = MISTRAL_API_KEY

from engine_mistral import (
    parse_resume, score_candidate, verify_claims,
    classify_tier, generate_interview_questions, FullEvaluation
)

def to_dict(obj):
    if dataclasses.is_dataclass(obj):
        return {k: to_dict(v) for k, v in dataclasses.asdict(obj).items()}
    elif isinstance(obj, list):
        return [to_dict(i) for i in obj]
    return obj

st.set_page_config(page_title="TalentIQ — AI Resume Evaluator", page_icon="⭐", layout="wide")

st.markdown("""
<style>
.tier-a { background: #0F6E56; color: #E1F5EE; padding: 8px 20px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; }
.tier-b { background: #185FA5; color: #E6F1FB; padding: 8px 20px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; }
.tier-c { background: #5F5E5A; color: #F1EFE8; padding: 8px 20px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; }
.score-box { background: #f8f9fa; border-radius: 10px; padding: 16px; text-align: center; border: 1px solid #e0e0e0; }
.score-num { font-size: 36px; font-weight: 700; }
.score-label { font-size: 13px; color: #666; margin-top: 4px; }
.green-flag { background: #e8f5e9; border-left: 4px solid #0F6E56; padding: 8px 12px; border-radius: 4px; margin: 4px 0; font-size: 14px; }
.red-flag { background: #fdecea; border-left: 4px solid #A32D2D; padding: 8px 12px; border-radius: 4px; margin: 4px 0; font-size: 14px; }
.why-text { background: #fff3e0; border-radius: 6px; padding: 8px 12px; font-size: 13px; margin-top: 8px; }
</style>
""", unsafe_allow_html=True)

st.markdown("# ⭐ TalentIQ")
st.markdown("**AI-powered resume shortlisting · Multi-dimensional scoring · Explainable results**")
st.divider()

SAMPLE_RESUME = """Arjun Mehta
arjun.mehta@gmail.com | +91 98765 43210
github.com/arjunmehta | linkedin.com/in/arjunmehta

EXPERIENCE

Senior Software Engineer — Zepto, Mumbai (Jan 2022 – Present)
- Redesigned order-routing service, reducing p99 latency from 800ms to 120ms (85% improvement)
- Built AWS Kinesis-based event pipeline processing 2M events/day
- Led migration of 3 monolith services to microservices, cutting deployment time by 60%
- Mentored 2 junior engineers

Software Engineer — Razorpay, Bangalore (Jun 2020 – Dec 2021)
- Implemented idempotency layer, reducing duplicate charges by 99.7%
- Contributed to internal RPC framework used by 40+ microservices

EDUCATION: B.Tech CS — NIT Trichy, 2020 | CGPA 8.6

SKILLS: Python, Go, PostgreSQL, Redis, Cassandra, AWS Kinesis, SQS, Lambda,
Docker, Kubernetes, FastAPI, gRPC, TypeScript

PROJECTS:
- pg-outbox: PostgreSQL transactional outbox library (340 GitHub stars)
- ratelimiter: Token bucket rate limiter in Go"""

SAMPLE_JD = """Senior Backend Engineer — Data Platform Team
Jano Healthcare, Bangalore

REQUIREMENTS:
- 3+ years Python or Go
- Apache Kafka (producer/consumer, partitioning, offset management)
- PostgreSQL + at least one NoSQL database
- Kubernetes / container orchestration
- Distributed systems: CAP theorem, eventual consistency
- Strong ownership — builders, not contributors

NICE TO HAVE:
- Healthcare domain experience
- Terraform / IaC
- Open-source contributions"""

col1, col2 = st.columns(2)
with col1:
    st.markdown("### 📄 Resume")
    resume_text = st.text_area("Resume", value=SAMPLE_RESUME, height=320, label_visibility="collapsed")
with col2:
    st.markdown("### 💼 Job Description")
    jd_text = st.text_area("JD", value=SAMPLE_JD, height=320, label_visibility="collapsed")

st.divider()

if st.button("🚀 Evaluate Candidate", type="primary", use_container_width=True):

    if "YOUR_MISTRAL" in MISTRAL_API_KEY:
        st.error("❌ Please paste your Mistral API key on line 8 of app_mistral.py")
        st.stop()

    progress = st.progress(0, text="Starting evaluation...")
    status = st.empty()

    try:
        status.info("📄 Step 1/5 — Parsing resume...")
        progress.progress(10, text="Parsing resume...")
        candidate = parse_resume(resume_text)
        progress.progress(25, text="Resume parsed ✓")

        status.info("🎯 Step 2/5 — Scoring against JD...")
        progress.progress(30, text="Scoring candidate...")
        scores, explanation = score_candidate(candidate, jd_text)
        progress.progress(50, text="Scoring complete ✓")

        status.info("🔍 Step 3/5 — Verifying claims...")
        progress.progress(55, text="Verifying claims...")
        verification = verify_claims(candidate)
        progress.progress(70, text="Verification complete ✓")

        status.info("🏆 Step 4/5 — Classifying tier...")
        progress.progress(75, text="Classifying tier...")
        tier = classify_tier(scores, verification)
        progress.progress(85, text="Tier classified ✓")

        status.info("💬 Step 5/5 — Generating interview questions...")
        progress.progress(90, text="Generating questions...")
        questions = generate_interview_questions(candidate, jd_text, scores, tier)
        progress.progress(100, text="Done! ✓")
        status.success("✅ Evaluation complete!")

        st.divider()

        res_col1, res_col2 = st.columns([2, 1])
        with res_col1:
            st.markdown(f"## {candidate.name}")
            st.markdown(f"📧 {candidate.email} · 🕐 {candidate.experience_years} years experience")
        with res_col2:
            tier_class = f"tier-{tier.tier.lower()}"
            st.markdown(f'<div class="{tier_class}">Tier {tier.tier} — {tier.label}</div>', unsafe_allow_html=True)
            st.markdown(f"<small>{tier.rationale}</small>", unsafe_allow_html=True)

        st.divider()
        st.markdown("### 📊 Scores")
        s1, s2, s3, s4, s5 = st.columns(5)

        with s1:
            st.markdown(f"""<div class="score-box"><div class="score-num" style="color:#1D9E75">{scores.exact_match:.0f}</div><div class="score-label">Exact Match</div></div>""", unsafe_allow_html=True)
        with s2:
            st.markdown(f"""<div class="score-box"><div class="score-num" style="color:#378ADD">{scores.semantic_similarity:.0f}</div><div class="score-label">Semantic Similarity</div></div>""", unsafe_allow_html=True)
        with s3:
            st.markdown(f"""<div class="score-box"><div class="score-num" style="color:#BA7517">{scores.achievement_impact:.0f}</div><div class="score-label">Achievements</div></div>""", unsafe_allow_html=True)
        with s4:
            st.markdown(f"""<div class="score-box"><div class="score-num" style="color:#533AB7">{scores.ownership_leadership:.0f}</div><div class="score-label">Ownership</div></div>""", unsafe_allow_html=True)
        with s5:
            st.markdown(f"""<div class="score-box"><div class="score-num" style="color:#333">{scores.composite:.1f}</div><div class="score-label">⭐ Composite</div></div>""", unsafe_allow_html=True)

        st.divider()

        tab1, tab2, tab3 = st.tabs(["📋 Score Analysis", "🔍 Verification", "💬 Interview Questions"])

        with tab1:
            for dim, expl in [
                ("Exact Match", explanation.exact_match),
                ("Semantic Similarity", explanation.semantic_similarity),
                ("Achievement Impact", explanation.achievement_impact),
                ("Ownership & Leadership", explanation.ownership_leadership),
            ]:
                with st.expander(f"**{dim}**", expanded=True):
                    st.markdown(expl)

            st.markdown(f"**Summary:** {explanation.composite_summary}")

            col_g, col_r = st.columns(2)
            with col_g:
                if explanation.green_flags:
                    st.markdown("**✅ Green Flags**")
                    for f in explanation.green_flags:
                        st.markdown(f'<div class="green-flag">+ {f}</div>', unsafe_allow_html=True)
            with col_r:
                if explanation.red_flags:
                    st.markdown("**⚠️ Red Flags**")
                    for f in explanation.red_flags:
                        st.markdown(f'<div class="red-flag">⚠ {f}</div>', unsafe_allow_html=True)

        with tab2:
            st.metric("Consistency Score", f"{verification.consistency_score:.0f}/100")
            st.progress(int(verification.consistency_score) / 100)
            st.markdown("**Verification Notes:**")
            for note in verification.notes:
                st.markdown(f"- {note}")

        with tab3:
            for i, q in enumerate(questions, 1):
                diff_color = {"Easy": "🟢", "Medium": "🟡", "Hard": "🔴"}.get(q.difficulty, "⚪")
                with st.expander(f"Q{i}: {q.question[:80]}...", expanded=(i == 1)):
                    st.markdown(f"**Category:** {q.category} · **Difficulty:** {diff_color} {q.difficulty}")
                    st.markdown(f"**Question:** {q.question}")
                    st.markdown(f'<div class="why-text">💡 <b>Why asked:</b> {q.why_asked}</div>', unsafe_allow_html=True)
                    st.markdown(f"**Follow-up:** {q.follow_up}")

        st.divider()
        full = FullEvaluation(candidate, jd_text[:80], scores, explanation, verification, tier, questions)
        st.download_button(
            "⬇️ Download Full Report (JSON)",
            data=json.dumps(to_dict(full), indent=2),
            file_name="talentiq_report.json",
            mime="application/json"
        )

    except Exception as e:
        progress.empty()
        status.empty()
        st.error(f"❌ Error: {str(e)}")
