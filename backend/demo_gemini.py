"""
TalentIQ Demo — Gemini Free Tier
---------------------------------
SETUP:
1. Get a free API key at aistudio.google.com
2. Paste it on line 14 below
3. Run: python demo_gemini.py
"""

import json, dataclasses, sys
import engine_gemini

# ── PASTE YOUR KEY HERE ──────────────────────
GEMINI_API_KEY = "AIzaSyA74YKciPgEi2LG1S4zgVkSDPIj6Kc3CuE"
# ─────────────────────────────────────────────

engine_gemini.GEMINI_API_KEY = GEMINI_API_KEY
engine_gemini.GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

from engine_gemini import evaluate_candidate

SAMPLE_RESUME = """
Arjun Mehta
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
- ratelimiter: Token bucket rate limiter in Go
"""

SAMPLE_JD = """
Senior Backend Engineer — Data Platform Team
Jano Healthcare, Bangalore

REQUIREMENTS:
- 3+ years Python or Go
- Apache Kafka (producer/consumer, partitioning, offset management)
- PostgreSQL + at least one NoSQL database
- Kubernetes / container orchestration
- Distributed systems: CAP theorem, eventual consistency
- Strong ownership — builders, not contributors
"""


def to_dict(obj):
    if dataclasses.is_dataclass(obj):
        return {k: to_dict(v) for k, v in dataclasses.asdict(obj).items()}
    elif isinstance(obj, list):
        return [to_dict(i) for i in obj]
    return obj


if __name__ == "__main__":
    if "YOUR_GEMINI" in GEMINI_API_KEY:
        print("❌ Please paste your Gemini API key on line 14 of this file!")
        print("   Get one free at: aistudio.google.com")
        sys.exit(1)

    print("=" * 60)
    print("  TalentIQ — Gemini Free Tier Demo")
    print("=" * 60)

    result = evaluate_candidate(SAMPLE_RESUME, SAMPLE_JD)

    print(f"\n📊 SCORES")
    print(f"  Exact Match:          {result.scores.exact_match:.0f}/100")
    print(f"  Semantic Similarity:  {result.scores.semantic_similarity:.0f}/100")
    print(f"  Achievement Impact:   {result.scores.achievement_impact:.0f}/100")
    print(f"  Ownership:            {result.scores.ownership_leadership:.0f}/100")
    print(f"  ───────────────────────────────────")
    print(f"  COMPOSITE:            {result.scores.composite:.1f}/100")

    print(f"\n🏆 TIER: {result.tier.tier} — {result.tier.label}")
    print(f"   {result.tier.rationale}")

    print(f"\n🔍 VERIFICATION")
    for note in result.verification.notes:
        print(f"   {note}")

    print(f"\n💬 INTERVIEW QUESTIONS")
    for i, q in enumerate(result.interview_questions, 1):
        print(f"\n  Q{i} [{q.category} | {q.difficulty}]")
        print(f"  {q.question}")
        print(f"  → Why asked: {q.why_asked}")

    with open("demo_output.json", "w") as f:
        json.dump(to_dict(result), f, indent=2)

    print("\n" + "=" * 60)
    print("  ✅ Full JSON saved to demo_output.json")
    print("=" * 60)
