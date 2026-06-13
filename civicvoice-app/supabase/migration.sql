-- ============================================================
-- CivicVoice — Supabase SQL Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================
-- Order matters: users table first (others reference it),
-- then issues, then votes and comments (reference issues).
-- ============================================================


-- ============================================================
-- TABLE: users
-- Extends Supabase's built-in auth.users table.
-- When a user signs up via Supabase Auth, we insert a matching
-- row here using a trigger (see bottom of file).
-- ============================================================
create table if not exists public.users (
  id               uuid        primary key references auth.users(id) on delete cascade,
  name             text,
  email            text,
  reputation_score int         default 0,
  role             text        default 'user'  -- 'user' | 'admin'
);

-- ============================================================
-- TABLE: issues
-- A civic issue report submitted by a citizen.
-- ============================================================
create table if not exists public.issues (
  id              uuid          primary key default gen_random_uuid(),
  user_id         uuid          references auth.users(id) on delete set null,
  title           text          not null,
  description     text,
  image_url       text,                         -- Supabase Storage public URL
  category        text,                         -- User-selected: Road | Water | Garbage | Streetlight | Other
  ai_category     text,                         -- AI-predicted category (filled by ML microservice)
  latitude        numeric,
  longitude       numeric,
  status          text          default 'pending',  -- pending | in_progress | resolved
  urgency_score   numeric,                      -- 0-1 score from NLP model
  severity_score  numeric,                      -- Combined ranking score
  authority_tag   text,                         -- Routed department e.g. "Municipal Roads Dept."
  created_at      timestamptz   default now(),
  updated_at      timestamptz   default now()
);

-- ============================================================
-- TABLE: votes
-- One vote per user per issue (enforced by UNIQUE constraint).
-- vote_type: 'up' or 'down'
-- ============================================================
create table if not exists public.votes (
  id          uuid    primary key default gen_random_uuid(),
  issue_id    uuid    references public.issues(id) on delete cascade,
  user_id     uuid    references auth.users(id) on delete cascade,
  vote_type   text    check (vote_type in ('up', 'down')),
  unique (issue_id, user_id)   -- Prevents double-voting
);

-- ============================================================
-- TABLE: comments
-- Discussion thread on each issue.
-- ============================================================
create table if not exists public.comments (
  id          uuid        primary key default gen_random_uuid(),
  issue_id    uuid        references public.issues(id) on delete cascade,
  user_id     uuid        references auth.users(id) on delete set null,
  text        text        not null,
  created_at  timestamptz default now()
);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables so Supabase enforces access rules.
-- Without RLS, anyone with the anon key can read/write everything.
-- ============================================================
alter table public.users    enable row level security;
alter table public.issues   enable row level security;
alter table public.votes    enable row level security;
alter table public.comments enable row level security;


-- ============================================================
-- RLS POLICIES: users table
-- ============================================================

-- Anyone can read user profiles (needed to display reporter names)
create policy "Users are publicly readable"
  on public.users for select
  using (true);

-- A user can only insert their own profile row
create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- A user can only update their own profile
create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);


-- ============================================================
-- RLS POLICIES: issues table
-- ============================================================

-- Anyone (even logged-out) can read issues
create policy "Issues are publicly readable"
  on public.issues for select
  using (true);

-- Only authenticated users can submit new issues
create policy "Authenticated users can insert issues"
  on public.issues for insert
  with check (auth.uid() = user_id);

-- Only the issue author can edit their own issue
create policy "Authors can update their own issues"
  on public.issues for update
  using (auth.uid() = user_id);

-- Only the issue author can delete their own issue
create policy "Authors can delete their own issues"
  on public.issues for delete
  using (auth.uid() = user_id);


-- ============================================================
-- RLS POLICIES: votes table
-- ============================================================

-- Anyone can read votes (needed for vote count display)
create policy "Votes are publicly readable"
  on public.votes for select
  using (true);

-- Only authenticated users can vote, and only as themselves
create policy "Authenticated users can insert votes"
  on public.votes for insert
  with check (auth.uid() = user_id);

-- Users can change their own vote (up ↔ down)
create policy "Users can update their own votes"
  on public.votes for update
  using (auth.uid() = user_id);

-- Users can remove their own vote
create policy "Users can delete their own votes"
  on public.votes for delete
  using (auth.uid() = user_id);


-- ============================================================
-- RLS POLICIES: comments table
-- ============================================================

-- Anyone can read comments
create policy "Comments are publicly readable"
  on public.comments for select
  using (true);

-- Authenticated users can post comments
create policy "Authenticated users can insert comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

-- Users can edit their own comments
create policy "Users can update their own comments"
  on public.comments for update
  using (auth.uid() = user_id);

-- Users can delete their own comments
create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);


-- ============================================================
-- TRIGGER: Auto-create user profile on signup
-- When Supabase Auth creates a new user, this trigger
-- automatically inserts a matching row in public.users.
-- This way we don't have to manually call the insert in the app.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    -- Try to grab display name from OAuth metadata, fallback to empty string
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Attach the trigger to auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();


-- ============================================================
-- HELPER: updated_at auto-update trigger for issues
-- Keeps updated_at in sync whenever an issue row is modified.
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger issues_updated_at
  before update on public.issues
  for each row
  execute procedure public.set_updated_at();
