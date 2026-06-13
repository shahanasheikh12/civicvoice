# CivicVoice

> A full-stack civic issue reporting and community voting platform. Citizens can report local infrastructure problems (potholes, water leaks, garbage, broken streetlights), vote on urgency, track status updates, and view all issues on a live map.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4 |
| Backend / DB | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| AI Microservice | Python 3.12, FastAPI, Hugging Face Transformers |
| Maps | Leaflet + react-leaflet (OpenStreetMap tiles) |
| Routing | React Router v6 |

---

## Project Structure

```
civicvoice/
├── civicvoice-app/          # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/      # Header, Footer, Ticker
│   │   │   └── ui/          # IssueCard, CategoryShape, StatusPill, NotificationBell, etc.
│   │   ├── context/         # AuthContext, ToastContext
│   │   ├── lib/             # supabaseClient.js
│   │   └── pages/           # FeedPage, ReportPage, MapPage, IssueDetailPage, AdminDashboard, etc.
│   ├── .env                 # Your local env vars (not committed)
│   └── .env.example         # Template — copy this to .env
│
├── ml-service/              # Python FastAPI AI microservice
│   ├── main.py              # FastAPI app with /predict-category and /predict-urgency
│   ├── requirements.txt     # Python dependencies
│   ├── venv/                # Python virtual environment (not committed)
│   └── README.md            # ML service setup guide
│
├── supabase/
│   └── migration.sql        # Complete database schema + RLS policies
│
└── README.md                # This file
```

---

## Running Locally

### 1. Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- A [Supabase](https://supabase.com) project

### 2. Clone the repo

```bash
git clone https://github.com/your-username/civicvoice.git
cd civicvoice
```

### 3. Set up the Frontend

```bash
cd civicvoice-app
cp .env.example .env
# Edit .env and add your Supabase URL and anon key
npm install
npm run dev
```

The React app will start at **http://localhost:5173**

### 4. Set up the Database

- Copy the contents of `supabase/migration.sql`
- Open your Supabase project → SQL Editor → paste and run the migration
- Create a Storage bucket named `issue-images` with public read access

### 5. Run the AI Microservice

```bash
cd ml-service
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```

The FastAPI service will start at **http://localhost:8000**. On the first run, the Hugging Face model (~260MB) will download automatically.

---

## Key Features

- 🗳️ **Community Voting** — Upvote/downvote issues with one-vote-per-user enforcement
- 📍 **Map View** — Live Leaflet map with color-coded markers by category
- 🤖 **AI Categorization** — FastAPI microservice auto-tags issues by category and urgency
- 🔔 **Real-time Notifications** — Supabase Realtime notifies users when their issue status changes
- 🛡️ **Admin Dashboard** — Admins can update issue statuses and view analytics
- 📸 **Image Upload** — Supabase Storage for issue photos with 5MB limit

---

## Environment Variables

See [`civicvoice-app/.env.example`](./civicvoice-app/.env.example) for all required variables.

---

## Making a User an Admin

1. Go to your Supabase project → Table Editor → `public.users`
2. Find your user row and change `role` from `'user'` to `'admin'`
3. Log out and log back in — the Admin panel will appear in the header

---

## License

MIT
