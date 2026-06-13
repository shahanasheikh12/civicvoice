# Product Requirements Document (PRD)
## CivicVoice – AI-Powered Civic Issue Reporting & Voting Platform

---

## 1. Overview

### 1.1 Problem Statement
There is no efficient, transparent system for citizens to report local civic issues such as road damage, water leakage, garbage accumulation, or streetlight failures. Existing systems lack public participation, prioritization mechanisms, and intelligent automation, leading to slow government response and low community engagement.

### 1.2 Objective
Build a web platform where citizens can report civic issues with images, descriptions, and location data. The community can vote on issues to highlight urgency, and AI/ML models assist in categorizing, prioritizing, and routing these issues to the correct authorities — improving transparency and response speed.

### 1.3 Target Users
- General public / residents reporting local issues
- Municipal authorities / department admins managing and resolving issues
- System administrators overseeing platform operations

---

## 2. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Increase reporting ease | Average time to submit a report < 1 minute |
| Improve prioritization | % of high-severity issues resolved before low-severity ones |
| Reduce duplicate clutter | % reduction in duplicate reports flagged by AI |
| Improve routing accuracy | % of issues correctly auto-tagged to authority |
| Community engagement | Avg. votes/comments per issue |

---

## 3. Core Features

### 3.1 Issue Reporting
- Image upload (single/multiple)
- Text description input
- Location capture (auto-detect via GPS or manual pin on map)
- Category selection (Road, Water, Garbage, Streetlight, Other)
- **AI Enhancement:** Auto-suggest category based on uploaded image using image classification model

### 3.2 Voting System
- Upvote/downvote on issues
- Ranking algorithm based on:
  - Vote count
  - Recency
  - **AI Enhancement:** Severity score (derived from image + text analysis)

### 3.3 Issue Feed
- List/grid view of all reported issues
- Filters: Location, Category, Status, Most Voted, Most Recent
- Map view toggle

### 3.4 Authority Tagging
- Auto-suggested authority tag based on category (rule-based)
- **AI Enhancement:** NLP-based classification of description text to refine/correct authority routing

### 3.5 Status Tracking
- Status states: Pending → In Progress → Resolved
- Public timeline/audit log per issue
- Resolution proof upload (photo) by authority/admin

### 3.6 Interactive Map View
- Google Maps integration showing all issues as pins
- Color-coded by category/status
- **AI Enhancement:** Hotspot clustering to highlight recurring problem zones

### 3.7 User Authentication
- Signup/login (email + password, optionally Google OAuth)
- Handled via Supabase Auth (built-in session management)

### 3.8 Comments & Discussion
- Threaded comments per issue
- Basic moderation (report comment)

### 3.9 Notifications
- In-app/email notifications on status change or new comment

### 3.10 Admin Dashboard
- View, filter, and manage all reports
- Update status, assign authority, respond to users
- View analytics (issues by category, resolution time, etc.)

### 3.11 User Reputation System
- Points for verified, non-duplicate, helpful reports
- Penalty for spam/duplicate/fake reports (AI-flagged)

---

## 4. AI/ML Features (Core Academic Component)

| Feature | Description | Model/Approach | Complexity |
|---|---|---|---|
| **Image-based Category Classification** | Classifies uploaded image into Pothole, Garbage, Water Leakage, Streetlight, etc. | Pretrained CNN (MobileNet/ResNet) fine-tuned via Transfer Learning on Kaggle datasets (pothole, garbage classification) | Easy |
| **NLP Urgency/Sentiment Detection** | Analyzes description text to detect urgency level (Low/Medium/High) | Pretrained Hugging Face sentiment/text classification model, or TF-IDF + Logistic Regression on labeled samples | Easy |
| **Duplicate Issue Detection** | Detects if a new report is similar to an existing one (text + image + location proximity) | Sentence-BERT embeddings (cosine similarity) + image embedding comparison + geo-distance threshold | Moderate |
| **Priority/Severity Scoring** | Combines votes, recency, urgency score, and severity into a single ranking score | Weighted scoring formula / simple regression model trained on synthetic labeled severity data | Moderate |
| **Hotspot Prediction (Clustering)** | Identifies recurring problem zones based on location + time data | DBSCAN / K-Means clustering on geo-coordinates | Moderate-Hard |
| **Spam/Fake Report Filter** | Flags irrelevant images or troll text submissions | Lightweight image/text classifier | Stretch goal |

**Recommended Priority for Implementation (academic timeline):**
1. Image-based category classification
2. NLP urgency/sentiment detection
3. Duplicate detection (stretch)
4. Hotspot clustering (stretch)

---

## 5. Technical Architecture

### 5.1 Stack
- **Frontend:** React.js, HTML, CSS, JavaScript (Tailwind/Bootstrap for styling)
- **Backend / Database:** Supabase (PostgreSQL database, auto-generated REST API, Row Level Security)
- **Backend (custom logic):** Node.js + Express.js — only for routing requests to the AI/ML microservice and any custom server-side logic not covered by Supabase's API
- **ML Microservice:** Python (Flask/FastAPI) — handles image classification, NLP, embeddings, clustering
- **Authentication:** Supabase Auth (email/password, Google OAuth)
- **File Storage:** Supabase Storage (for issue images)
- **Maps:** Google Maps API / Leaflet + OpenStreetMap (free alternative)

### 5.2 High-Level Flow
```
User → React Frontend
   → Supabase (Auth, Database, Storage)
       - Direct CRUD: issues, votes, comments, status via Supabase client SDK / auto REST API
       - Row Level Security enforces user permissions (e.g. one vote per user per issue)
   → Node/Express (thin layer, optional)
       → Python ML Microservice (image classify, NLP urgency, duplicate check, clustering)
           → Returns: category, urgency score, duplicate flag, severity score
           → Result written back to Supabase via SDK
   → Supabase Storage (images)
   → Google Maps API (location display)
```

> Note: Most CRUD operations (creating issues, voting, commenting, filtering feed) can call Supabase directly from React using the Supabase JS client — no need for a custom Express endpoint. Express/FastAPI is only needed to bridge to the AI/ML microservice.

### 5.3 Database Schema (Supabase / PostgreSQL)

**users** (extends Supabase `auth.users`)
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, references `auth.users.id` |
| name | text | |
| email | text | |
| reputation_score | int | default 0 |
| role | text | 'user' / 'admin' |

**issues**
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, default `gen_random_uuid()` |
| user_id | uuid | Foreign key → users.id |
| title | text | |
| description | text | |
| image_url | text | Supabase Storage public URL |
| category | text | User-selected category |
| ai_category | text | AI-predicted category |
| latitude | numeric | |
| longitude | numeric | |
| status | text | 'pending' / 'in_progress' / 'resolved' |
| urgency_score | numeric | From NLP model |
| severity_score | numeric | Combined AI ranking score |
| authority_tag | text | Routed department |
| created_at | timestamptz | default `now()` |
| updated_at | timestamptz | default `now()` |

**votes**
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| issue_id | uuid | Foreign key → issues.id |
| user_id | uuid | Foreign key → users.id |
| vote_type | text | 'up' / 'down' |
| | | Unique constraint on (issue_id, user_id) — enforces one vote per user per issue |

**comments**
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| issue_id | uuid | Foreign key → issues.id |
| user_id | uuid | Foreign key → users.id |
| text | text | |
| created_at | timestamptz | default `now()` |

### 5.4 Example SQL (Supabase)
```sql
create table issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  title text not null,
  description text,
  image_url text,
  category text,
  ai_category text,
  latitude numeric,
  longitude numeric,
  status text default 'pending',
  urgency_score numeric,
  severity_score numeric,
  authority_tag text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id) on delete cascade,
  user_id uuid references auth.users(id),
  vote_type text check (vote_type in ('up','down')),
  unique (issue_id, user_id)
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id) on delete cascade,
  user_id uuid references auth.users(id),
  text text not null,
  created_at timestamptz default now()
);
```

---

## 6. UI/UX Requirements
- Clean, modern, mobile-responsive design
- Dashboard-style homepage showing top-ranked issues
- Card-based issue feed with image thumbnails, vote counts, status badges
- Map toggle view with clustered pins
- Simple multi-step report submission form (Image → AI suggests category → Confirm → Location → Submit)

---

## 7. Project Phases / Milestones

| Phase | Deliverables | Est. Duration |
|---|---|---|
| Phase 1 | Setup project structure, auth, basic issue CRUD | 1-2 weeks |
| Phase 2 | Voting system, issue feed, filters | 1 week |
| Phase 3 | Map integration, authority tagging | 1 week |
| Phase 4 | AI/ML: Image classification + NLP urgency detection | 2 weeks |
| Phase 5 | Admin dashboard, notifications, status tracking | 1-2 weeks |
| Phase 6 | AI stretch features: duplicate detection, hotspot clustering | 1-2 weeks |
| Phase 7 | Testing, UI polish, deployment, documentation | 1 week |

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Limited labeled image dataset | Use pretrained models + transfer learning with small fine-tuning dataset (Kaggle) |
| Google Maps API cost | Use Leaflet + OpenStreetMap as free alternative |
| ML model latency | Run classification asynchronously; show "AI suggestion pending" UI state |
| Time constraints | Prioritize core AI features (image classification, NLP urgency) first; treat clustering/duplicate detection as stretch goals |
| Supabase Row Level Security misconfiguration | Test RLS policies early (e.g. users can only edit their own issues/votes) before building features on top |

---

## 9. Expected Outcome
A fully functional, mobile-responsive web platform where users can report civic issues (enhanced by AI auto-categorization), vote to prioritize urgent problems (ranked using AI-derived severity scores), track resolution status transparently, and where authorities can manage reports through an admin dashboard — improving civic transparency, engagement, and response efficiency.
