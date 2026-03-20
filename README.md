# TalentIQ — AI Resume Shortlisting & Interview Assistant

> Built for Jano Healthcare · Round 1 Assignment · AI/Backend Track

An end-to-end AI system that evaluates candidates with multi-dimensional scoring, claim verification, intelligent tier classification, and hyper-personalized interview question generation.

---

## What's Built

All three parts implemented (assignment required only one):

| Part | Status | Description |
|------|--------|-------------|
| **A — Scoring Engine** | ✅ Complete | 4-dimension scoring with full explainability |
| **B — Verification Engine** | ✅ Complete | GitHub API + LinkedIn validation + LLM consistency check |
| **C — Tier + Questions** | ✅ Complete | A/B/C classification + 5 personalized interview questions |
| **UI** | ✅ Bonus | React dashboard with live progress + animated score rings |
| **System Design** | ✅ Complete | Full architecture, scalability plan, AI strategy |

---

## Quick Start (100% Free — no credit card needed)

### Step 1: Get a free Gemini API key
1. Go to **aistudio.google.com**
2. Sign in with Google → click **"Get API key"** → **"Create API key"**
3. Copy your key (starts with `AIza...`)

### Step 2: Paste your key into the demo file
Open `backend/demo_gemini.py`, find line 14, replace:
```python
GEMINI_API_KEY = "AIza...your actual key here..."
```

### Step 3: Install and run
```bash
cd backend
pip install fastapi uvicorn
python demo_gemini.py
```

### Expected output
```
============================================================
  TalentIQ — Gemini Free Tier Demo
============================================================
📄 Parsing resume...
🎯 Scoring against JD...
🔍 Verifying claims...
🏆 Classifying tier...
💬 Generating interview questions...

📊 SCORES
  Exact Match:          72/100
  Semantic Similarity:  85/100
  Achievement Impact:   78/100
  Ownership:            61/100
  ───────────────────────────────────
  COMPOSITE:            74.8/100

🏆 TIER: A — Fast-Track to Final Round
✅ Full JSON saved to demo_output.json
```

---

## File Structure

```
talentiq/
├── README.md
├── backend/
│   ├── engine_gemini.py      ← Core pipeline (all 5 stages)
│   ├── demo_gemini.py        ← Run this to see it work
│   └── requirements.txt
├── frontend/
│   └── TalentIQ.jsx          ← React UI component
└── docs/
    └── SYSTEM_DESIGN.md      ← Full architecture document
```

---

## System Architecture

```
Resume (text/PDF) + Job Description
           ↓
     [Resume Parser]        → Structured JSON via Gemini
           ↓
    [Scoring Engine]        → 4 scores + explanations
           ↓
  [Verification Engine]     → GitHub API + consistency check
           ↓
   [Tier Classifier]        → A / B / C with rationale
           ↓
   [Question Generator]     → 5 personalized interview questions
```

---

## Scoring Dimensions

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Exact Match | 25% | Literal keyword overlap with JD |
| Semantic Similarity | 30% | Technology conceptual equivalence |
| Achievement Impact | 25% | Quantified results vs. vague bullets |
| Ownership & Leadership | 20% | "Led, Built" vs. "Assisted, Was involved" |

### The Key Insight: Semantic Similarity
A candidate with **AWS Kinesis** scores highly for a **Kafka** role — both are distributed event streaming platforms. The system maps technology equivalences rather than doing naive keyword matching.

---

## Explainability

Every score includes a plain-English explanation:

> **Ownership Score: 55/100** — Resume uses passive voice heavily ("was involved in", "assisted with"). Only 2 clear ownership signals: "Led migration" and "Architected the caching layer".

Every interview question includes `why_asked`:

> **Why asked:** Achievement is listed but no architectural detail given — testing whether this was genuine ownership or peripheral involvement.

---

## Scalability: 10,000 Resumes/Day

- 10 parallel workers handle ~75 resumes/minute comfortably
- ~$0.78/day in API costs at full volume
- Full design: [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md)
