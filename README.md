# TalentIQ — AI Resume Shortlisting & Interview Assistant

> Built for Jano Healthcare · Round 1 Assignment · AI/Backend Track

An end-to-end AI system that evaluates candidates with multi-dimensional scoring, claim verification, intelligent tier classification, and hyper-personalized interview question generation.

---

## Demo Screenshots

> Input — paste any resume and job description
<img width="1918" height="838" alt="OP0" src="https://github.com/user-attachments/assets/1bc1fc9f-1aa8-4819-b4d1-b18efcf18bc6" />

> Scores — 4-dimensional scoring with composite result and tier classification
<img width="1918" height="907" alt="OP1" src="https://github.com/user-attachments/assets/5e5b6091-3c61-45e6-a662-8c0b6fff0f25" />

> Explainability — plain-English reasoning behind every score
<img width="1916" height="690" alt="OP2" src="https://github.com/user-attachments/assets/4ae0dd69-1e0e-4a28-a7ed-3f6711812b66" />

> Interview Questions — personalized questions with "why asked" for each
<img width="1918" height="908" alt="OP4" src="https://github.com/user-attachments/assets/6c9f6f03-5074-4ce8-b258-6b17fb104dbd" />


---

## What's Built

All three parts implemented (assignment required only one):

| Part | Status | Description |
|------|--------|-------------|
| **A — Scoring Engine** | ✅ Complete | 4-dimension scoring with full explainability |
| **B — Verification Engine** | ✅ Complete | GitHub API + LinkedIn validation + LLM consistency check |
| **C — Tier + Questions** | ✅ Complete | A/B/C classification + 5 personalized interview questions |
| **UI** | ✅ Bonus | Streamlit dashboard with live progress + score visualization |
| **System Design** | ✅ Complete | Full architecture, scalability plan, AI strategy |

---

## Quick Start (100% Free — no credit card needed)

### Step 1: Get a free Mistral API key
1. Go to **console.mistral.ai**
2. Sign up with Google
3. Go to **API Keys** → **Create new key**
4. Copy your key

### Step 2: Paste your key into the app file
Open `backend/app_mistral.py`, find line 8, replace:
```python
MISTRAL_API_KEY = "your_actual_key_here"
```

### Step 3: Install and run
```bash
cd backend
pip install streamlit
python -m streamlit run app_mistral.py
```

The app will open automatically at `http://localhost:8501`

---

## File Structure

```
talentiq/
├── README.md
├── backend/
│   ├── engine_mistral.py     ← Core pipeline (parser, scorer, verifier, questions)
│   ├── app_mistral.py        ← Streamlit UI — run this
│   └── requirements.txt
├── frontend/
│   └── TalentIQ.jsx          ← React UI component (bonus)
└── docs/
    └── SYSTEM_DESIGN.md      ← Full architecture document
```

---

## System Architecture

```
Resume (text/PDF) + Job Description
           ↓
     [Resume Parser]        → Structured JSON via Mistral AI
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
A candidate with **AWS Kinesis** scores highly for a **Kafka** role — both are distributed event streaming platforms. The system understands technology equivalences rather than doing naive keyword matching.

---

## Explainability

Every score includes a plain-English explanation:

> **Ownership Score: 55/100** — Resume uses passive voice heavily ("was involved in", "assisted with"). Only 2 clear ownership signals: "Led migration" and "Architected the caching layer".

Every interview question includes a `why_asked` field:

> **Why asked:** Achievement is listed but no architectural detail given — testing whether this was genuine ownership or peripheral involvement.

---

## Scalability: 10,000 Resumes/Day

- 10 parallel workers handle ~75 resumes/minute comfortably
- Mistral AI free tier handles development and demo volumes
- Full design: [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md)
