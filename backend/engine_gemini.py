"""
TalentIQ Core Engine (Gemini Free Tier Version)
------------------------------------------------
Uses Google Gemini 2.0 Flash — free, no credit card needed.
Get your key at: aistudio.google.com
"""

import json
import re
import urllib.request
from dataclasses import dataclass, field
from typing import Optional

GEMINI_API_KEY = "AIzaSyA74YKciPgEi2LG1S4zgVkSDPIj6Kc3CuE"  # paste your key here
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"


@dataclass
class ScoreBreakdown:
    exact_match: float
    semantic_similarity: float
    achievement_impact: float
    ownership_leadership: float
    composite: float = 0.0

    def __post_init__(self):
        self.composite = round(
            self.exact_match * 0.25 +
            self.semantic_similarity * 0.30 +
            self.achievement_impact * 0.25 +
            self.ownership_leadership * 0.20,
            1
        )


@dataclass
class ScoreExplanation:
    exact_match: str
    semantic_similarity: str
    achievement_impact: str
    ownership_leadership: str
    composite_summary: str
    red_flags: list[str] = field(default_factory=list)
    green_flags: list[str] = field(default_factory=list)


@dataclass
class CandidateProfile:
    name: str
    email: str
    skills: list[str]
    experience_years: float
    roles: list[str]
    education: str
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    achievements: list[str] = field(default_factory=list)
    raw_text: str = ""


@dataclass
class VerificationResult:
    github_active: Optional[bool] = None
    github_repos_count: Optional[int] = None
    github_top_languages: list[str] = field(default_factory=list)
    linkedin_profile_exists: Optional[bool] = None
    consistency_score: float = 0.0
    notes: list[str] = field(default_factory=list)


@dataclass
class TierResult:
    tier: str
    label: str
    rationale: str
    fast_track: bool = False


@dataclass
class InterviewQuestion:
    question: str
    category: str
    difficulty: str
    why_asked: str
    follow_up: str


@dataclass
class FullEvaluation:
    candidate: CandidateProfile
    jd_title: str
    scores: ScoreBreakdown
    explanation: ScoreExplanation
    verification: VerificationResult
    tier: TierResult
    interview_questions: list[InterviewQuestion]


def call_gemini(prompt: str) -> dict:
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }).encode("utf-8")

    req = urllib.request.Request(
        GEMINI_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())

    text = data["candidates"][0]["content"]["parts"][0]["text"]
    text = re.sub(r"^```json\s*|^```\s*|\s*```$", "", text, flags=re.MULTILINE).strip()
    return json.loads(text)


def parse_resume(resume_text: str) -> CandidateProfile:
    prompt = f"""You are a precise resume parser. Extract structured information from the resume below.

Return ONLY valid JSON matching this exact schema:
{{
  "name": "Full Name",
  "email": "email@example.com",
  "skills": ["skill1", "skill2"],
  "experience_years": 3.5,
  "roles": ["Software Engineer at Company X"],
  "education": "B.Tech Computer Science, NIT Trichy, 2020",
  "github_url": null,
  "linkedin_url": null,
  "achievements": ["Reduced API latency by 40%"]
}}

Rules:
- achievements must be QUANTIFIED impact statements only
- experience_years: calculate from dates, estimate if unclear
- skills: extract ALL technical skills, tools, frameworks, languages
- Return null for missing fields

RESUME TEXT:
---
{resume_text}
---"""

    data = call_gemini(prompt)
    return CandidateProfile(
        name=data.get("name", "Unknown"),
        email=data.get("email", ""),
        skills=data.get("skills", []),
        experience_years=data.get("experience_years", 0),
        roles=data.get("roles", []),
        education=data.get("education", ""),
        github_url=data.get("github_url"),
        linkedin_url=data.get("linkedin_url"),
        achievements=data.get("achievements", []),
        raw_text=resume_text
    )


def score_candidate(candidate: CandidateProfile, jd_text: str) -> tuple[ScoreBreakdown, ScoreExplanation]:
    prompt = f"""You are a senior technical recruiter. Score this candidate against the JD across 4 dimensions.

CRITICAL: Recognize technology equivalences:
- AWS Kinesis = Apache Kafka (distributed event streaming)
- RabbitMQ = Kafka (message queues)
- MySQL = PostgreSQL (relational databases)
- Docker Swarm = Kubernetes (container orchestration)

Return ONLY valid JSON:
{{
  "exact_match_score": 72,
  "exact_match_explanation": "explanation here",
  "semantic_similarity_score": 85,
  "semantic_similarity_explanation": "explanation here",
  "achievement_impact_score": 68,
  "achievement_impact_explanation": "explanation here",
  "ownership_leadership_score": 55,
  "ownership_leadership_explanation": "explanation here",
  "composite_summary": "overall summary here",
  "red_flags": ["flag1"],
  "green_flags": ["flag1"]
}}

JOB DESCRIPTION:
{jd_text}

CANDIDATE:
Name: {candidate.name}
Skills: {', '.join(candidate.skills)}
Experience: {candidate.experience_years} years
Roles: {'; '.join(candidate.roles)}
Achievements: {'; '.join(candidate.achievements) if candidate.achievements else 'None'}"""

    d = call_gemini(prompt)
    scores = ScoreBreakdown(
        exact_match=d["exact_match_score"],
        semantic_similarity=d["semantic_similarity_score"],
        achievement_impact=d["achievement_impact_score"],
        ownership_leadership=d["ownership_leadership_score"]
    )
    explanation = ScoreExplanation(
        exact_match=d["exact_match_explanation"],
        semantic_similarity=d["semantic_similarity_explanation"],
        achievement_impact=d["achievement_impact_explanation"],
        ownership_leadership=d["ownership_leadership_explanation"],
        composite_summary=d["composite_summary"],
        red_flags=d.get("red_flags", []),
        green_flags=d.get("green_flags", [])
    )
    return scores, explanation


def verify_claims(candidate: CandidateProfile) -> VerificationResult:
    result = VerificationResult()
    notes = []

    if candidate.github_url:
        try:
            username_match = re.search(r"github\.com/([^/\s]+)", candidate.github_url)
            if username_match:
                username = username_match.group(1)
                req = urllib.request.Request(
                    f"https://api.github.com/users/{username}",
                    headers={"User-Agent": "TalentIQ/1.0"}
                )
                with urllib.request.urlopen(req, timeout=5) as resp:
                    user_data = json.loads(resp.read())

                result.github_active = True
                result.github_repos_count = user_data.get("public_repos", 0)

                from datetime import datetime
                created = user_data.get("created_at", "")
                if created:
                    created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    age_days = (datetime.now(created_dt.tzinfo) - created_dt).days
                    if age_days < 180:
                        notes.append("⚠️ GitHub account created less than 6 months ago")

                repos_req = urllib.request.Request(
                    f"https://api.github.com/users/{username}/repos?sort=stars&per_page=5",
                    headers={"User-Agent": "TalentIQ/1.0"}
                )
                with urllib.request.urlopen(repos_req, timeout=5) as resp:
                    repos = json.loads(resp.read())

                result.github_top_languages = list({r["language"] for r in repos if r.get("language")})[:4]

                if result.github_repos_count < 3:
                    notes.append("⚠️ Fewer than 3 public repos — limited verifiability")
                elif result.github_repos_count >= 20:
                    notes.append(f"✅ Active GitHub: {result.github_repos_count} public repos")

        except Exception as e:
            result.github_active = False
            notes.append(f"⚠️ GitHub profile unreachable: {str(e)[:60]}")

    if candidate.linkedin_url:
        is_valid = bool(re.match(r"https?://(www\.)?linkedin\.com/in/[a-zA-Z0-9\-]+/?$", candidate.linkedin_url))
        result.linkedin_profile_exists = is_valid
        notes.append("✅ LinkedIn URL is well-formed" if is_valid else "⚠️ LinkedIn URL format looks non-standard")

    consistency_prompt = f"""Analyze this candidate for internal consistency and authenticity.
Skills claimed: {', '.join(candidate.skills)}
GitHub languages found: {', '.join(result.github_top_languages) if result.github_top_languages else 'N/A'}
Roles: {'; '.join(candidate.roles)}
Achievements: {'; '.join(candidate.achievements) if candidate.achievements else 'None'}

Return ONLY JSON:
{{"consistency_score": 78, "consistency_notes": ["note1", "note2"]}}"""

    try:
        cdata = call_gemini(consistency_prompt)
        result.consistency_score = cdata.get("consistency_score", 50)
        notes.extend(cdata.get("consistency_notes", []))
    except Exception:
        result.consistency_score = 50
        notes.append("Consistency analysis unavailable")

    result.notes = notes
    return result


def classify_tier(scores: ScoreBreakdown, verification: VerificationResult) -> TierResult:
    signal = scores.composite * 0.75 + verification.consistency_score * 0.25
    if signal >= 75 and scores.semantic_similarity >= 70:
        return TierResult("A", "Fast-Track to Final Round",
            f"Composite {scores.composite:.0f}/100, strong semantic match ({scores.semantic_similarity:.0f}). Move to hiring manager.", True)
    elif signal >= 55:
        return TierResult("B", "Technical Screen Recommended",
            f"Composite {scores.composite:.0f}/100 shows potential. Technical screen will clarify depth.")
    else:
        return TierResult("C", "Needs Further Evaluation",
            f"Composite {scores.composite:.0f}/100. Significant gaps or unverifiable claims.")


def generate_interview_questions(candidate, jd_text, scores, tier) -> list[InterviewQuestion]:
    weak_dims = []
    if scores.achievement_impact < 60: weak_dims.append("achievement quantification")
    if scores.ownership_leadership < 60: weak_dims.append("ownership and leadership")
    if scores.exact_match < 60: weak_dims.append("required technical skills")

    prompt = f"""You are a senior engineering interviewer. Generate exactly 5 targeted interview questions.
Be specific to THIS candidate — mention their actual companies and projects.
Probe weak dimensions: {', '.join(weak_dims) if weak_dims else 'overall depth'}
Mix: 2 Technical Deep-Dives, 2 Behavioral, 1 Situational.

Return ONLY a valid JSON array:
[{{"question": "...", "category": "Technical Deep-Dive", "difficulty": "Hard", "why_asked": "...", "follow_up": "..."}}]

Candidate: {candidate.name}
Skills: {', '.join(candidate.skills)}
Roles: {'; '.join(candidate.roles)}
Achievements: {'; '.join(candidate.achievements) if candidate.achievements else 'None'}
Tier: {tier.tier}
JD: {jd_text[:600]}"""

    items = call_gemini(prompt)
    return [InterviewQuestion(
        question=q["question"], category=q["category"],
        difficulty=q["difficulty"], why_asked=q["why_asked"],
        follow_up=q["follow_up"]
    ) for q in items]


def evaluate_candidate(resume_text: str, jd_text: str) -> FullEvaluation:
    print("📄 Parsing resume...")
    candidate = parse_resume(resume_text)

    print("🎯 Scoring against JD...")
    scores, explanation = score_candidate(candidate, jd_text)

    print("🔍 Verifying claims...")
    verification = verify_claims(candidate)

    print("🏆 Classifying tier...")
    tier = classify_tier(scores, verification)

    print("💬 Generating interview questions...")
    questions = generate_interview_questions(candidate, jd_text, scores, tier)

    jd_title = jd_text.strip().split('\n')[0][:80]
    return FullEvaluation(candidate, jd_title, scores, explanation, verification, tier, questions)
