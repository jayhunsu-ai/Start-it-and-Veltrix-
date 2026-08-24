-- Start-It — Supabase schema
-- Row-Level Security is on for every client-facing table from the start,
-- not bolted on later. A user can only ever read/write their own rows.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  segment text check (segment in ('new', 'scale', 'influencer', 'learn')),
  tier text check (tier in ('free', 'foundation', 'growth', 'visibility')) default 'free',
  created_at timestamptz default now()
);

create table if not exists brand_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  readiness_score int,
  strengths jsonb,
  gaps jsonb,
  summary text,
  created_at timestamptz default now()
);

create table if not exists extras_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  extra_type text check (extra_type in ('brand_kit', 'product_manager', 'smm', 'cac_agent', 'legal_check', 'media_kit')),
  status text check (status in ('requested', 'in_progress', 'human_review', 'delivered')) default 'requested',
  assigned_talent_id uuid, -- references marketplace_talent(id), nullable until matched
  created_at timestamptz default now()
);

-- The flywheel: learners who complete skill tracks become marketplace talent
create table if not exists marketplace_talent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  skill text check (skill in ('social_media', 'brand_design', 'copywriting', 'product_management')),
  certified boolean default false,
  rating numeric(2,1),
  active_client_count int default 0,
  created_at timestamptz default now()
);

create table if not exists future_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  letter_text text not null,
  deliver_at timestamptz not null,
  delivered boolean default false,
  created_at timestamptz default now()
);

-- === Row-Level Security ===
alter table profiles enable row level security;
alter table brand_snapshots enable row level security;
alter table extras_orders enable row level security;
alter table marketplace_talent enable row level security;
alter table future_letters enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own snapshots" on brand_snapshots for all using (auth.uid() = user_id);
create policy "own orders" on extras_orders for all using (auth.uid() = user_id);
create policy "own talent row" on marketplace_talent for all using (auth.uid() = user_id);
create policy "own letters" on future_letters for all using (auth.uid() = user_id);
