-- ─── OOLIO ONBOARD MVP SCHEMA ───
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query → paste → Run)

-- 1. PROFILES (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  name text not null,
  role text not null default 'sales_rep' check (role in ('admin','manager','sales_rep','viewer')),
  active boolean default true,
  created_at timestamptz default now()
);

-- 2. KNOWLEDGE (admin-approved trusted answers)
create table if not exists public.knowledge (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  content text not null,
  product text check (product in ('oolio','ordermate','bepoz','general')) default 'general',
  category text,
  source_type text default 'manual',
  source_url text,
  approved boolean default true,
  created_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 3. DOCUMENTS (file library)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text default 'Sales',
  file_type text default 'PDF',
  product text check (product in ('oolio','ordermate','bepoz','general')) default 'general',
  storage_path text,
  external_url text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 4. CHAT MESSAGES (every Q&A logged)
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  user_email text,
  user_name text,
  question text not null,
  answer text,
  product_detected text,
  knowledge_used jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 5. FEEDBACK (👍 👎)
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.chat_messages(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  rating text check (rating in ('helpful','not_helpful')) not null,
  created_at timestamptz default now()
);

-- 6. CORRECTIONS (pending admin review)
create table if not exists public.corrections (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.chat_messages(id) on delete set null,
  submitted_by uuid references public.profiles(id) on delete set null,
  submitter_name text,
  original_question text,
  original_answer text,
  what_was_wrong text,
  corrected_answer text not null,
  source_url text,
  product text check (product in ('oolio','ordermate','bepoz','general')) default 'general',
  category text,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- ─── INDEXES ───
create index if not exists idx_knowledge_approved on public.knowledge(approved, product);
create index if not exists idx_knowledge_topic on public.knowledge using gin(to_tsvector('english', topic || ' ' || content));
create index if not exists idx_chat_user on public.chat_messages(user_id, created_at desc);
create index if not exists idx_corrections_status on public.corrections(status, created_at desc);
create index if not exists idx_documents_category on public.documents(category, product);

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Only allow @oolio.com emails
  if new.email not like '%@oolio.com' then
    raise exception 'Only @oolio.com emails are allowed';
  end if;
  
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'sales_rep'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── ROW LEVEL SECURITY ───
alter table public.profiles enable row level security;
alter table public.knowledge enable row level security;
alter table public.documents enable row level security;
alter table public.chat_messages enable row level security;
alter table public.feedback enable row level security;
alter table public.corrections enable row level security;

-- PROFILES: users see all, only admins update others, users update self
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select using (auth.uid() is not null);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update 
  using (auth.uid() = id);

-- KNOWLEDGE: all authenticated users can read approved knowledge
drop policy if exists "knowledge_select" on public.knowledge;
create policy "knowledge_select" on public.knowledge for select using (auth.uid() is not null);

-- DOCUMENTS: all authenticated users can read
drop policy if exists "documents_select" on public.documents;
create policy "documents_select" on public.documents for select using (auth.uid() is not null);

-- CHAT: users see own, admins see all (handled in API routes)
drop policy if exists "chat_select_own" on public.chat_messages;
create policy "chat_select_own" on public.chat_messages for select 
  using (auth.uid() = user_id);

drop policy if exists "chat_insert_own" on public.chat_messages;
create policy "chat_insert_own" on public.chat_messages for insert 
  with check (auth.uid() = user_id);

-- FEEDBACK
drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own" on public.feedback for insert 
  with check (auth.uid() = user_id);

drop policy if exists "feedback_select_own" on public.feedback;
create policy "feedback_select_own" on public.feedback for select 
  using (auth.uid() = user_id);

-- CORRECTIONS: users insert/view own
drop policy if exists "corrections_insert_own" on public.corrections;
create policy "corrections_insert_own" on public.corrections for insert 
  with check (auth.uid() = submitted_by);

drop policy if exists "corrections_select_own" on public.corrections;
create policy "corrections_select_own" on public.corrections for select 
  using (auth.uid() = submitted_by);

-- ─── SEED DATA ───
-- Documents (your existing 2 from prototype)
insert into public.documents (title, description, category, file_type, product) values
('Oolio Pricing Guide 2025','Full pricing breakdown for Oolio Core and Full Service plans, device add-ons, and integration costs.','Sales','PDF','oolio'),
('The Oolio Way Presentation','Customer-facing presentation deck covering the Oolio ecosystem, value proposition, and product suite.','Sales','PPTX','oolio')
on conflict do nothing;

-- Initial admin-approved knowledge (Oolio basics)
insert into public.knowledge (topic, content, product, category, approved) values
('Oolio Group overview','Oolio Group is an Australian-headquartered hospitality technology company. Legal entity: Swiftpos Global Pty Ltd. Purpose: Facilitating Celebration. Group CEO: Kris Satish. 50+ years serving Australian hospitality. 590+ Oolians globally. Founding member of ARCA. Backed by Pemba Capital Partners since 2019.','oolio','company','true'),
('The six POS brands','Oolio Group operates six POS brands: Oolio One (cloud-native, modern hospitality - restaurants, cafes, QSR, multi-site), OrderMate (server-based, fine dining and premium restaurants), Bepoz (enterprise, pubs/clubs/large enterprise), Swiftpos (stadia and large enterprise), Deliverit (QSR and delivery, pizza), Idealpos (clubs, pubs, retail with strong loyalty).','general','products','true'),
('Oolio One pricing','Oolio Core is from $80/month per venue ($2.60/day). Oolio Full Service is from $150/month per venue ($4.90/day). Device add-ons: Additional POS $30/mo, mPOS $20/mo, Kiosk $30/mo, KDS $20/mo, Menu Board $10/mo. Integration add-ons $20/mo each on Core (included with Full Service).','oolio','pricing','true'),
('The Oolio Way','Typical hospitality venues manage 17 different systems. The Oolio Way reduces this in two phases: Phase 1 takes 17 apps down to 7. Phase 2 takes 7 apps down to 3 by absorbing reservations, functions, and tips into the platform. Only 3rd-party ordering and accounting remain external.','oolio','positioning','true'),
('Oolio Pay payments','Oolio Pay is mandatory with Oolio One - external payment processors are not supported. Features: same/next-business-day settlements, hospitality trading days 5am-4:59am, store-and-forward offline payments, QR fallback during outages, 4G backup, PCI 6 compliant, tokenised payments.','oolio','payments','true'),
('Submitting leave through UKG','To submit leave: 1) Log into UKG, 2) Find the My Time Off tile on your dashboard, 3) Select the leave type (Annual, Sick, Personal), 4) Pick your dates on the calendar, 5) Add comments if needed, 6) Hit Submit. Your request routes to your manager for approval. Track status (Pending/Approved/Denied) in UKG. Always submit in advance and give your manager a courtesy heads-up via Teams.','general','tools','true'),
('Training and installations calendar','For Oolio One and OrderMate upcoming training sessions and venue installations, use the SyncMatters calendar: https://migratemycrm.syncmatters.com/calendah/2893-a750a924715d51a7d72b070c567c2d03125651bca299a003f09b1aa1c683dfff/show. Speak to Thomas Nikolov (Head of Service & Delivery) for changes.','general','tools','true'),
('Teams channels for Q&A','Oolio One Q&A team has channels for: General, BackOffice, Discounts/Customers/Loyalty, Integrations, Kitchen Ops/KDS, Online Store, POS Software Questions, POS, Products/Menus, Releases/Deployments PROD, Reports/Insights, Workshops. OM & One All team has: General, OM Accounts/Software/Quick Response/Change Log, OPOS Marketing/Movement/Tech/Tickets/Values, Red Alerts.','general','tools','true'),
('Key team contacts','Kris Satish: Group CEO. Leigh Richardson: CEO OrderMate & Oolio. Bridget Gilmour: Head of Sales. Thomas Nikolov: Head of Service & Delivery. Cheoni Goon: Head of Account Management. Michelle Vincent: Head of Software Solutions.','general','people','true')
on conflict do nothing;

-- ─── DONE ───
-- Next: create your first admin user via signup, then run this to promote yourself:
-- update public.profiles set role = 'admin' where email = 'olivia.mayes@oolio.com';
