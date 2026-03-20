# TalentIQ — System Design Document

## 1. Overview

TalentIQ is an AI-powered resume shortlisting and interview assistant that evaluates candidates across multiple dimensions, verifies their public profiles, and generates hyper-personalized interview question paths.

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Ingestion Layer                             │
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │ PDF Upload  │  │  Bulk CSV/API    │  │  Direct Text Input    │  │
│  └──────┬──────┘  └────────┬─────────┘  └───────────┬───────────┘  │
│         └─────────────────┼────────────────────────┘               │
│                           ▼                                         │
│                   ┌───────────────┐                                 │
│                   │ Resume Parser │ ← LLM (structured extraction)  │
│                   └───────┬───────┘                                 │
└───────────────────────────┼──────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Processing Pipeline                           │
│                                                                      │
│   ┌─────────────────┐   ┌─────────────────┐   ┌──────────────────┐  │
│   │ Scoring Engine  │   │ Verification    │   │ Tier Classifier  │  │
│   │                 │   │ Engine          │   │                  │  │
│   │ • Exact Match   │   │ • GitHub API    │   │ A: Fast-track    │  │
│   │ • Semantic Sim. │   │ • LinkedIn URL  │   │ B: Tech Screen   │  │
│   │ • Achievements  │   │ • LLM Consist.  │   │ C: Evaluate      │  │
│   │ • Ownership     │   │   Check         │   │                  │  │
│   └────────┬────────┘   └────────┬────────┘   └────────┬─────────┘  │
│            └────────────────────┼──────────────────────┘            │
│                                 ▼                                   │
│                    ┌────────────────────────┐                       │
│                    │  Question Generator    │ ← LLM (personalized) │
│                    └────────────┬───────────┘                       │
└────────────────────────────────┼────────────────────────────────────┘
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          Output Layer                                │
│  ┌──────────────┐   ┌───────────────────┐   ┌─────────────────────┐ │
│  │  REST API    │   │   React UI        │   │  JSON Export        │ │
│  │  /evaluate   │   │   (Dashboard)     │   │  (ATS Integration)  │ │
│  └──────────────┘   └───────────────────┘   └─────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Descriptions

### 3.1 Resume Parser
**Purpose:** Convert unstructured PDF/text resume into structured JSON.

**Approach:**
- Use LLM (Claude) with a strict output schema for structured extraction
- For PDFs: `pdfminer.six` extracts raw text → LLM structures it
- For images/scans: pytesseract OCR → LLM structures it
- Output schema: `{name, email, skills[], experience_years, roles[], education, github_url, linkedin_url, achievements[]}`

**Why LLM over regex?** Resumes have zero consistent format. An LLM handles "10+ years", "Since 2014", "Jan '20 – Present" equally. It also disambiguates skills embedded in sentences.

---

### 3.2 Scoring Engine (4 Dimensions)

#### Dimension 1: Exact Match Score (weight: 25%)
- Literal keyword overlap between resume skills and JD requirements
- Normalized intersection: `|resume_skills ∩ jd_keywords| / |jd_keywords|`
- LLM explains which required skills are present/absent

#### Dimension 2: Semantic Similarity Score (weight: 30%)
- The most important dimension — recognizes technology equivalences
- **Key insight:** A developer with AWS Kinesis experience IS a strong fit for a Kafka role
- Approach: LLM is prompted with a rich ontology of known equivalences
- Examples handled:
  - `AWS Kinesis` ↔ `Apache Kafka` (distributed event streaming)
  - `RabbitMQ` ↔ `Kafka` (message queuing, different trade-offs)
  - `Redux` ↔ `Zustand` ↔ `MobX` (React state management)
  - `MySQL` ↔ `PostgreSQL` (relational databases)
  - `Docker Swarm` ↔ `Kubernetes` (container orchestration)
- For production scale: add embedding-based similarity using `text-embedding-3-small` + cosine similarity with a prebuilt tech ontology graph

#### Dimension 3: Achievement Impact Score (weight: 25%)
- Measures quality of impact statements
- Penalizes vague bullets ("worked on", "contributed to", "helped with")
- Rewards quantification: percentages, user counts, revenue, time saved
- LLM scores each bullet and aggregates

#### Dimension 4: Ownership & Leadership Score (weight: 20%)
- Detects initiative vs. passive participation
- High signals: "Led", "Architected", "Designed", "Owned", "Built from scratch"
- Low signals: "Was involved in", "Assisted", "Supported", "Part of the team"
- Also detects: open source projects, mentorship, cross-team influence

**Composite Formula:**
```
composite = exact * 0.25 + semantic * 0.30 + achievement * 0.25 + ownership * 0.20
```

---

### 3.3 Verification Engine
**Purpose:** Lightweight authenticity and consistency checks.

**GitHub Verification (GitHub REST API, no auth needed):**
- Validate URL exists and account is active
- Check `public_repos` count (< 3 = suspicious for a "senior dev")
- Fetch top 5 repos by stars → extract languages
- Compare declared skills vs. GitHub languages
- Check account age (< 6 months for a "5-year engineer" = red flag)

**LinkedIn Verification:**
- URL format validation (no scraping — violates ToS)
- Can be extended with LinkedIn API (OAuth) for profile completeness
- Checks for completeness signals in URL slug format

**LLM Consistency Analysis:**
- Given skills, GitHub languages, roles, and achievements
- LLM identifies: "Claims Kubernetes expertise but zero DevOps repos on GitHub"
- Outputs a `consistency_score` (0-100) + specific notes

---

### 3.4 Tier Classifier

```
signal = composite * 0.75 + consistency_score * 0.25

Tier A (Fast-Track):  signal ≥ 75 AND semantic ≥ 70
Tier B (Tech Screen): signal ≥ 55
Tier C (Evaluate):    signal < 55
```

**Why include consistency in tier signal?**
A candidate scoring 90/100 on skills but 20/100 on consistency (unverifiable claims) is a B, not an A.

---

### 3.5 Question Generator
**Purpose:** Generate hyper-personalized interview questions that probe:
1. The candidate's weakest scoring dimensions
2. Specific technologies/companies from their resume
3. Anomalies detected during verification

**Output format per question:**
- `question`: The actual question
- `category`: Technical / Behavioral / Situational / Wildcard
- `difficulty`: Easy / Medium / Hard
- `why_asked`: **Explainability** — "Asking because achievement listed but no architectural detail given"
- `follow_up`: Suggested follow-up

---

## 4. Data Strategy

### 4.1 PDF → Structured JSON Pipeline
```
PDF → pdfminer.six (text extraction) → 
  → LLM structured extraction (schema-enforced JSON) →
  → Validation layer (Pydantic) →
  → CandidateProfile dataclass
```

For scanned PDFs: `pdf2image` → `pytesseract` → LLM

### 4.2 Schema Enforcement
We use Pydantic models to validate LLM outputs. If the LLM returns malformed JSON, we retry with a stricter prompt. Two-retry limit before returning a partial parse.

### 4.3 Storage (Production)
```
PostgreSQL: candidate_profiles, evaluations, scores, questions
Redis:      job queue (BullMQ/Celery), results cache (TTL: 24h)
Pinecone:   skill embeddings for semantic similarity (production)
S3:         raw PDF storage, immutable audit trail
```

---

## 5. AI Strategy

### LLM Usage
| Task | Model | Reason |
|------|-------|--------|
| Resume parsing | Claude Haiku | Fast, cheap, structured extraction |
| Scoring + explanations | Claude Sonnet | Nuanced reasoning needed |
| Question generation | Claude Sonnet | Creative, context-aware |
| Consistency analysis | Claude Haiku | Pattern matching, cost-sensitive |

### Embedding Strategy (Production)
For semantic similarity at scale, avoid LLM calls per-pair:
1. Pre-build a **skill ontology graph**: 500+ tech skills with equivalence clusters
2. Embed each skill using `text-embedding-3-small` → store in Pinecone
3. At eval time: embed candidate skills + JD skills → cosine similarity matrix
4. LLM only for explaining the top-K matches (not computing them)

**This reduces semantic scoring cost by ~80%** vs. pure LLM at 10K resume/day scale.

---

## 6. Scalability: 10,000+ Resumes/Day

### Architecture
```
Upload API → S3 (raw storage)
          → SQS queue
          → Worker pool (10 containers)
          → PostgreSQL (results)
          → Redis (cache + dedup)
```

### Math
- 10,000 resumes/day = ~7 resumes/minute peak
- 1 evaluation ≈ 4 LLM calls × ~2s = ~8s end-to-end
- 10 parallel workers → 10 × 7.5 = 75 resumes/min capacity ✓

### Cost Estimate (Anthropic API)
- Per resume: ~2,500 tokens input + ~800 tokens output × 4 calls = ~13,200 tokens
- Claude Sonnet at $3/MTok in, $15/MTok out:
  - Input: 10,000 × 10,000 tokens × $3/M = **$0.30/day**
  - Output: 10,000 × 3,200 tokens × $15/M = **$0.48/day**
  - **Total: ~$0.78/day** for 10K evaluations ← extremely cost-efficient

### Key Optimizations
1. **Dedup by resume hash**: if same PDF uploaded twice, return cached result
2. **Streaming results**: return scores as they complete (not all-or-nothing)
3. **Async verification**: GitHub/LinkedIn checks run in parallel with scoring
4. **Batch embeddings**: pre-embed JDs; only embed resumes at eval time

---

## 7. Explainability Design

Every score comes with a human-readable `explanation` field. The prompt instructs the LLM to reason in terms a non-technical recruiter can understand:

❌ Bad: "Score: 67"  
✅ Good: "Score: 67 — Candidate has Python (✓), PostgreSQL (✓), Docker (✓). Missing Kafka but has AWS Kinesis which is functionally equivalent (partial credit). Missing Terraform entirely."

The `why_asked` field in interview questions closes the loop: the recruiter knows not just WHAT to ask but WHY this specific question for this specific person.

---

## 8. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | Python 3.12 + FastAPI | Async, type hints, Pydantic |
| LLM | Anthropic Claude API | Best structured output, reasoning |
| PDF parsing | pdfminer.six | No OCR needed for text PDFs |
| Queue | Celery + Redis | Battle-tested job queue |
| Database | PostgreSQL + SQLAlchemy | ACID, JSON columns for flexible schema |
| Cache | Redis | O(1) dedup, result TTL |
| Frontend | React + Vite | Fast iteration, component model |
| Deployment | Docker + Kubernetes | Scale workers independently |
| Monitoring | Prometheus + Grafana | LLM latency, queue depth, error rates |

---

## 9. Future Enhancements

1. **Bias Detection Module**: Audit scores across demographic signals — ensure JD keyword biases don't unfairly penalize non-traditional backgrounds
2. **Multi-JD Ranking**: Score a candidate against 10 open roles and auto-route to best-fit JD
3. **Feedback Loop**: Recruiters mark hired/rejected → fine-tune scoring weights per company culture
4. **Video Interview Integration**: Transcribe and score video responses using the same pipeline
5. **ATS Webhooks**: Push evaluations to Greenhouse/Lever/Workday automatically
