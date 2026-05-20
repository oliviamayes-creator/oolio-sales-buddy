-- ═══════════════════════════════════════════════════════
-- OOLIO ONBOARD — MIGRATION v2
-- Run in Supabase SQL Editor. Safe to re-run (idempotent).
-- ═══════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────
-- 1. ADD 'owner' ROLE
-- ───────────────────────────────────────────────────────
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('owner','admin','manager','sales_rep','viewer'));

-- Promote Olivia to owner (idempotent)
update public.profiles set role = 'owner' where lower(email) = 'olivia.mayes@oolio.com';

-- ───────────────────────────────────────────────────────
-- 2. OOLIO BRAIN (admin-only knowledge store, markdown content)
-- ───────────────────────────────────────────────────────
create table if not exists public.brain (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  source_url text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_brain_title on public.brain(title);
create index if not exists idx_brain_search on public.brain using gin(to_tsvector('english', title || ' ' || content));

alter table public.brain enable row level security;
drop policy if exists "brain_select" on public.brain;
create policy "brain_select" on public.brain for select using (auth.uid() is not null);

-- ───────────────────────────────────────────────────────
-- 3. CHAT SESSIONS (ChatGPT-style multi-chat history)
-- ───────────────────────────────────────────────────────
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text default 'New chat',
  resolved boolean default false,
  resolved_at timestamptz,
  message_count integer default 0,
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_sessions_user on public.chat_sessions(user_id, last_message_at desc);
create index if not exists idx_sessions_resolved on public.chat_sessions(resolved, created_at desc);

alter table public.chat_sessions enable row level security;
drop policy if exists "sessions_select_own" on public.chat_sessions;
create policy "sessions_select_own" on public.chat_sessions for select using (auth.uid() = user_id);
drop policy if exists "sessions_insert_own" on public.chat_sessions;
create policy "sessions_insert_own" on public.chat_sessions for insert with check (auth.uid() = user_id);
drop policy if exists "sessions_update_own" on public.chat_sessions;
create policy "sessions_update_own" on public.chat_sessions for update using (auth.uid() = user_id);
drop policy if exists "sessions_delete_own" on public.chat_sessions;
create policy "sessions_delete_own" on public.chat_sessions for delete using (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────
-- 4. LINK CHAT_MESSAGES TO SESSIONS
-- ───────────────────────────────────────────────────────
alter table public.chat_messages add column if not exists session_id uuid references public.chat_sessions(id) on delete cascade;
alter table public.chat_messages add column if not exists role text default 'user' check (role in ('user','assistant'));
create index if not exists idx_chat_messages_session on public.chat_messages(session_id, created_at);

-- ───────────────────────────────────────────────────────
-- 5. SEED OOLIO BRAIN (~50 entries — extracted from system prompt)
-- ───────────────────────────────────────────────────────
-- Only inserts if brain is empty; safe to re-run.
do $$
declare
  brain_count integer;
begin
  select count(*) into brain_count from public.brain;
  if brain_count > 0 then
    raise notice 'Brain already has % entries — skipping seed', brain_count;
    return;
  end if;

  insert into public.brain (title, content) values

  -- ─── COMPANY ───
  ('Oolio Group company overview',
'Oolio Group is an Australian-headquartered hospitality technology company providing point-of-sale (POS), payments, and customer engagement solutions to hospitality venues worldwide.

- **Legal entity:** Swiftpos Global Pty Ltd
- **Customer-facing brand:** Oolio
- **Purpose:** "Facilitating Celebration" — enhancing experiences and connecting people with technology
- **Group CEO:** Kris Satish
- **Heritage:** 50+ years serving Australian hospitality
- **Team size:** 590+ Oolians globally, 330+ in Australia
- **Investment:** Backed by Pemba Capital Partners since 2019
- **Industry:** Founding member of ARCA (Australian Restaurant & Cafe Association)
- **Contact:** sales@oolio.com · 1300 166 546'),

  ('Oolio Group history & timeline',
'- **1973:** Business Electronics (BEH) founded
- **1992:** Kris Satish starts relationship with BEH
- **2001:** Gravity Systems & Vectron Australia incorporated by Kris and Shiva
- **2014:** Gravity Systems acquired BEH to form Bepoz Group
- **2019:** Pemba Capital Partners partnership begins
- **2021:** Idealpos and Deliverit join Bepoz Group
- **2022:** Bepoz Group rebrands to **Oolio**, launches in Australia
- **2023:** MSL Solutions joins (OrderMate and Swiftpos brands)
- **2024:** Begins processing payments in UK and Spain
- **2025:** Oolio launches in Nordics, US, and New Zealand'),

  ('Oolio global presence',
'Oolio Group operates across multiple regions:

**Countries:** Australia, New Zealand, United Kingdom, United States, Denmark, India, Philippines, Vietnam

**On-ground teams in Australia:**
- Melbourne — 167 Oolians
- Sydney — 87 Oolians
- Brisbane — 60 Oolians
- Perth — 10 Oolians

**Global total:** 590+ Oolians'),

  ('Oolio Giving — Peter MacCallum Cancer Foundation',
'Oolio has partnered with the **Peter MacCallum Cancer Foundation** for charitable giving.

- **100%** of customer donations go to Peter Mac
- Oolio **matches every donation dollar-for-dollar**
- Customers can opt to round up or donate at checkout
- Optional for venues to enable
- A **Donations Dashboard** is available in the Merchant Portal

This is a major part of Oolio''s purpose-driven brand. Worth mentioning to socially-conscious customers.'),

  -- ─── BRAND PORTFOLIO ───
  ('The six Oolio POS brands — overview',
'Oolio Group has six distinct POS brands. **They are separate products with different features. Never blend documentation, pricing, or feature info between them.**

1. **Oolio One** — Flagship cloud-native POS + payments. The default and primary product.
2. **OrderMate** — Server-based POS for fine dining and premium restaurants.
3. **Bepoz** — Enterprise-grade POS for pubs, clubs, large enterprise.
4. **Swiftpos** — Large-scale enterprise and stadia POS.
5. **Deliverit** — QSR and delivery-focused POS.
6. **Idealpos** — Versatile POS for clubs, pubs, and retail.

When the sales team asks a question without naming a brand, **default to Oolio One**.'),

  ('Oolio One — flagship product positioning',
'**Oolio One** (formerly known as "Oolio Platform") is the flagship cloud-native POS and payments platform.

**Best fit:** modern restaurants, cafes, QSR, multi-site hospitality groups wanting an integrated tech stack.

**Strengths:**
- Integrated POS + Payments (Oolio Pay)
- Cloud-native, modern tech stack
- Online ordering, QR ordering, kiosk, loyalty, gift cards, KDS, AI reporting
- Built on Next.js, Go, React Native, Kubernetes, Snowflake
- Single platform — fewer integrations to manage

**Default assumption:** when someone asks about Oolio without naming a brand, they mean Oolio One.'),

  ('OrderMate — when to recommend',
'**OrderMate** is a server-based POS best suited to **high-end fine dining and premium restaurant groups**.

**Strengths:**
- Refined table service workflows
- Complex menu and modifier handling
- Deep inbuilt stock control
- Trusted by established Australian fine dining operators

**Recommend when:** the prospect is a fine dining venue or premium restaurant group needing deep table-service refinement. Route the lead to the OrderMate team.

**Do not blend OrderMate feature/pricing details into Oolio One conversations.**'),

  ('Bepoz — when to recommend',
'**Bepoz** is enterprise-grade POS for **pubs, clubs, gaming venues, and large enterprise hospitality**.

**Strengths:**
- Deep multi-area / multi-revenue-centre functionality
- Advanced stock control
- Group-level reporting and consolidation
- Handles complex pricing tiers (member/non-member, time-based)

**Recommend when:** the prospect is a pub group, club, or large enterprise venue with multiple revenue centres. Route the lead to the Bepoz team.

**Do not blend Bepoz functionality into Oolio One conversations.**'),

  ('Swiftpos — when to recommend',
'**Swiftpos** is purpose-built for **stadiums, arenas, exhibition centres, and large-format high-volume venues**.

**Strengths:**
- Designed for high-volume, short-burst transaction environments
- Built for stadia-scale operations
- Multi-zone, multi-vendor handling

**Recommend when:** the prospect is a stadium, arena, exhibition centre, or large venue with stadium-style transaction patterns.'),

  ('Deliverit — when to recommend',
'**Deliverit** is QSR and delivery-focused POS.

**Strengths:**
- Built for pizza chains and QSR
- Strong driver management
- Delivery logistics and routing
- Designed for delivery-heavy operations

**Recommend when:** the prospect is a pizza chain, delivery-heavy QSR, or operation requiring driver and delivery management as a primary workflow.'),

  ('Idealpos — when to recommend',
'**Idealpos** is versatile POS for **clubs, pubs, and retail**.

**Strengths:**
- Strong loyalty and membership integration
- Versatile across hospitality and retail
- Established Australian club/pub presence

**Recommend when:** the prospect is a club, pub, or retail operation, particularly those needing strong membership/loyalty features.'),

  -- ─── THE OOLIO WAY ───
  ('The Oolio Way — value proposition pitch',
'A typical hospitality venue manages **17 different systems** (POS, payments, online ordering, kiosk, loyalty, BI, KDS, reservations, etc.).

The Oolio Way reduces this in two phases:

**Phase 1: 17 apps → 7 apps**
Oolio absorbs: POS, payments, self-service, QR ordering, loyalty, BI, KDS, integrations.

**Phase 2: 7 apps → 3 apps**
Oolio absorbs reservations, functions, and tips. Only 3rd-party ordering (UberEats/DoorDash) and accounting (Xero/MYOB) remain external.

**The pitch:** less complexity, one source of truth, lower total cost, better data.

Sales reps should be able to deliver this in under 2 minutes.'),

  -- ─── OOLIOVERSE / OOLIO ONE MODULES ───
  ('The Oolioverse — full Oolio One module list',
'The Oolioverse is the full set of Oolio One modules:

- **Point of Sale** — Fixed, mobile, tablet POS for QSR to fine dining
- **Payments (Oolio Pay)** — Integrated payments with next-business-day payouts
- **Online Ordering** — Own your orders, skip commission fees
- **Kiosk** — Self-ordering kiosks
- **Loyalty** — Wallet-based, app-based, tokenised loyalty
- **Multi-Site Menu Management** — Centralised menu control
- **Kitchen Display System (KDS)** — Real-time kitchen orders
- **Reporting & Insights** — AI agent for insights, multi-venue, heat maps, forecasting
- **Oolio Order Manager** — Hub for UberEats, DoorDash, in-house, self-delivery
- **Oolio Gift Cards** — Digital, cross-location redemption
- **Order Ready Board** — Pickup notifications
- **Oolio Voice** — Phone Ordering AI Agent (coming soon)
- **Inventory Management** — In development'),

  ('Oolio One — Point of Sale module',
'Oolio One POS runs across:
- **Fixed POS terminals** (15.6" Windows)
- **Tablets** (8.7", 11", 14" Android, TAP ON GLASS)
- **Mobile POS / mPOS** (6.75" Android, TAP ON GLASS — order and pay at the table)

Use case range: QSR to fine dining. The same Oolio One platform scales from a coffee cart with 1 tablet to a multi-site venue group with 50+ terminals.'),

  ('Oolio Online Ordering',
'Own your orders, skip commission fees.

Allows venues to take direct online orders (pickup and delivery) without paying 25-35% commissions to third-party platforms.

Integrates with the venue''s existing menu via Multi-Site Menu Management. Orders flow into the same POS and KDS as in-house orders.

This is a strong commercial angle for venues currently relying heavily on UberEats/DoorDash.'),

  ('Oolio Kiosk',
'Self-ordering kiosks for hospitality venues.

Common use cases:
- QSR self-order at point of entry
- Quick coffee / cafe lineup reduction
- Multi-language ordering
- Upsell prompts integrated with menu

Hardware add-on pricing: **$30/month per kiosk** on top of base plan.'),

  ('Oolio Loyalty',
'Wallet-based, app-based, tokenised loyalty programme built into Oolio One.

- Customer profiles
- Points / rewards
- Cross-location redemption
- Loyalty reporting in the Insights module
- Managed service available'),

  ('Oolio Kitchen Display System (KDS)',
'KDS displays real-time kitchen orders, reducing errors and improving kitchen-front-of-house communication.

- Real-time order display
- Bump bar and touch interaction
- Coursing control (Hold & Fire)
- Integrated with POS — no separate sync

Hardware add-on pricing: **$20/month per KDS screen** on top of base plan.

For specific hardware compatibility (which KDS displays / printers / kitchen hardware are supported), check help.oolio.com or contact the Oolio hardware/support team. Never guess at supported brands or models.'),

  ('Oolio Reporting & Insights (with AI Agent)',
'Reporting & Insights includes an **AI agent for insights** — natural-language reporting.

Features:
- Multi-venue reporting
- Heat maps
- Forecasting
- Real-time dashboards
- Comparable across periods
- AI-driven insights ("your wine sales dropped 12% on Thursdays")'),

  ('Oolio Order Manager',
'Order Manager is the central hub for managing orders from all channels:
- UberEats
- DoorDash
- In-house orders
- Self-delivery

Reduces the need for multiple tablets at the pass and prevents missed orders. Plays nicely with Doshii and Deliverect.'),

  ('Oolio Gift Cards',
'Digital gift cards, redeemable across all locations of a venue group.

- Issued and redeemed via POS
- Tracked in reporting
- Cross-location redemption is a strong selling point for multi-site groups'),

  ('Oolio Order Ready Board',
'Pickup notification display for QSR / counter service venues.

When an order is ready, the customer''s name/number appears on the Order Ready Board screen. Reduces the need for staff to call out names and improves pickup flow.

Hardware add-on pricing: **$10/month per Menu/Order Ready Board screen.**'),

  ('Oolio Voice — coming soon',
'**Oolio Voice** is a Phone Ordering AI Agent currently in development.

Customers can phone the venue and place orders with an AI agent that integrates directly into the Oolio One ordering workflow. Reduces missed calls and frees staff during rush periods.

For current status and timing, always check the live roadmap: https://tree.oolio.com/tree'),

  ('Oolio Inventory Management — in development',
'Native Inventory Management is currently in development.

For now, customers needing inventory should use the existing **CTB&Co, Supy, or Restoke.ai** integrations.

For current status of native inventory, check https://tree.oolio.com/tree'),

  -- ─── PRICING ───
  ('Oolio Core plan — $80/month per venue',
'**Oolio Core** is the entry plan.

- **Price:** $80/month per venue (or $2.60/day)
- **24/7 support** included
- **CDS (Customer Display Screen)** included
- **Online ordering** included
- **QR ordering** included
- **Loyalty** included
- **Reporting** included
- **Order Manager** included
- **3rd-party connections** included
- **Integrations** are paid add-ons (~$20/mo each)

**Best for:** smaller venues or those new to the platform.'),

  ('Oolio Full Service plan — $150/month per venue',
'**Oolio Full Service** is the comprehensive plan.

- **Price:** $150/month per venue (or $4.90/day)
- Includes **everything in Core**, PLUS:
  - **Table Mode** — full table service workflow
  - **Courses & Covers**
  - **Advanced Printing**
  - **Waitlist** management
  - **Unlimited integrations** (no per-integration fee)

**Best for:** table-service venues, multi-site groups, anyone needing the full Oolioverse experience.'),

  ('Oolio device & hardware add-on pricing',
'On top of the base Core or Full Service plan, per-device add-ons are:

- Additional **POS terminal:** $30/month
- Additional **mPOS:** $20/month
- **Kiosk:** $30/month per device
- **KDS:** $20/month per screen
- **Menu Board / Order Ready Board:** $10/month per screen

A venue''s monthly cost = base plan + device add-ons.'),

  ('Customer-specific pricing — confidentiality rule',
'**Never share specific customer contract details or negotiated rates in chat responses.**

Each customer''s pricing is commercially confidential. If a sales rep asks "what does ANYDAY pay?" — direct them to HubSpot or the Account Manager. Never quote a specific customer''s rate.

Sharing public list pricing is fine. Sharing customer-specific rates is not.'),

  -- ─── OOLIO PAY ───
  ('Oolio Pay — overview & mandatory pairing',
'**Oolio Pay is mandatory with Oolio One.** Customers cannot use external payment processors with Oolio One.

This is intentional — it allows Oolio to provide:
- A single end-to-end transaction flow
- Integrated reconciliation
- Better support (one party owns the experience end-to-end)
- Better margins for both Oolio and the customer

Sales reps should position this as a feature, not a constraint.'),

  ('Oolio Pay — settlements & trading days',
'Oolio Pay offers **same/next-business-day settlements**.

**Hospitality trading days:** 5am to 4:59am (the next morning). This means a late-night service ending at 2am settles as part of the prior trading day, not the next calendar day — making reconciliation much cleaner for venues.

Settlements appear in the customer''s nominated bank account next business day for transactions on the prior trading day.'),

  ('Oolio Pay — reliability features',
'Oolio Pay is built for hospitality uptime:

- **Store and Forward:** if the internet drops, payments can still be processed offline and forwarded when connectivity returns
- **QR Fallback:** if a terminal goes down, customers can scan a QR code to pay via their phone
- **4G Backup:** terminals can fall back to mobile network if WiFi fails
- **Tokenised payments:** PCI 6 compliant, card data is tokenised

This stack has saved venues from losing sales during multiple major outage events.'),

  ('Oolio Capital — instant unsecured funding',
'**Oolio Capital** provides instant unsecured capital access to eligible Oolio Pay merchants (T&Cs apply).

The pitch: a venue can access funding for equipment, expansion, or working capital without going through traditional lenders. Repayments come out of transaction volume.

Refer interested customers to the Oolio Capital team. Do not quote terms.'),

  -- ─── HARDWARE ───
  ('Oolio POS Terminal (Fixed)',
'**Oolio POS Terminal** — fixed countertop POS.

- 15.6" LCD display
- Windows operating system
- PCAP touch screen
- Splash resistant
- Built-in 2D Scanner
- Built-in RFID Reader

Common use: front counter, fixed point of sale, primary till.

For full hardware specs and ordering, contact the Oolio hardware team or check help.oolio.com.'),

  ('Oolio Tablets — TAP ON GLASS',
'**Oolio POS & Pay Tablets** — Android tablets with TAP ON GLASS payments.

- Sizes: **8.7", 11", and 14"**
- Operating system: Android 13
- **One device for ordering AND payments** — no separate payment terminal needed
- Tap on Glass means the customer can tap their card directly on the tablet screen

Common use: floor service, table ordering, mobile counter staff.'),

  ('Oolio mPOS — mobile point of sale',
'**Oolio mPOS** — handheld mobile POS for at-table ordering and payment.

- 6.75" HD+ display
- Android 13
- TAP ON GLASS — order AND pay at the table on one device
- Pocketable

Common use: table service staff carrying a single device for the whole interaction.'),

  ('Oolio Payments Terminal',
'**Oolio Payments Terminal** — standalone payment terminal for venues using non-Oolio POS hardware, or as additional payment-only devices.

- Android 10
- Built-in receipt printer
- PCI 6 compliant
- Offline transaction processing (store and forward)'),

  ('Hardware compatibility rule — never guess',
'**Critical rule for hardware questions** (printers, scanners, KDS displays, kitchen hardware, payment devices):

- **NEVER** list specific brand names or model numbers unless explicitly approved in the knowledge below or in Oolio''s official documentation.
- Direct the user to:
  - https://help.oolio.com
  - The Oolio hardware/support team
  - The **Oolio One Q&A > POS** or **Kitchen Ops and KDS** Teams channel

Making up printer models or compatibility is a credibility-destroying hallucination. Always defer to the official source.'),

  -- ─── INTEGRATIONS ───
  ('Reservations integrations',
'Oolio One integrates with reservation systems:

- **SevenRooms** — **two-way sync**, the deepest integration. Reservations, profiles, and visit history flow both ways.
- **NowBookIt** — supported
- **OpenTable** — supported

For prospects already on SevenRooms, the two-way sync is a major selling point.'),

  ('Accounting integrations',
'Oolio One integrates with major accounting platforms:

- **Xero** — daily sales journal sync
- **MYOB** — daily sales journal sync

These connections push end-of-day sales totals into the accounting platform. Reduces manual data entry and improves close-of-day workflows.

For accounting integration setup queries, route to the **Oolio One Q&A > Integrations** Teams channel.'),

  ('Labour integrations',
'Oolio One integrates with workforce management:

- **Deputy** — rostering, time and attendance
- **Tanda** — rostering, time and attendance

Sales-pulled data and clock-in data can flow between platforms.'),

  ('Inventory integrations',
'For inventory management (until native Oolio Inventory ships), Oolio One integrates with:

- **CTB&Co** — full inventory and cost control
- **Supy** — inventory and supplier management
- **Restoke.ai** — AI-driven inventory and forecasting

These are the recommended options for venues needing inventory today.'),

  ('Third-party ordering integrations',
'Oolio One connects to third-party ordering platforms via:

- **Doshii** — middleware connecting Oolio One to UberEats, DoorDash, and other ordering platforms
- **Deliverect** — alternative middleware for delivery channel management

Orders from UberEats / DoorDash / Menulog flow into Oolio One through these integrations and appear in the Order Manager.'),

  ('Upcoming integrations — 2026',
'**Coming in 2026:**
- **Loaded** — additional ecosystem integration
- **PEISO** — additional ecosystem integration

For the live roadmap including integration status, check https://tree.oolio.com/tree'),

  -- ─── INTERNAL TOOLS ───
  ('HubSpot CRM — sales pipeline tool',
'**HubSpot** is the CRM for the Oolio sales team.

Used for:
- Deal pipeline tracking
- Contact and company records
- Activity logging (calls, emails, meetings)
- Quote generation
- Email sequences

Every BDM should have a HubSpot login and use it daily. For access issues, contact IT Helpdesk.'),

  ('UKG — submitting leave (step-by-step)',
'**To submit a leave request through UKG:**

1. Log into UKG
2. On your dashboard, find the **My Time Off** tile
3. Select the **type of leave** (Annual, Sick, Personal — depends on your UKG configuration)
4. Pick your **dates** on the calendar
5. Add **comments** if needed
6. Click **Submit**
7. Your request routes automatically to your **manager for approval**
8. Track status (Pending / Approved / Denied) back in UKG

**Best practice:**
- Always submit leave **in advance** where possible
- Give your manager a **courtesy heads-up via Teams** — but the formal request must still go through UKG
- The mobile UKG app works too if you have it set up'),

  ('UKG — checking your leave balance',
'Your UKG dashboard shows your current accrual balances across leave categories (annual, sick, personal).

You can see:
- How much leave you''ve **taken**
- What''s currently **approved** (booked but not yet taken)
- What''s **remaining** / available

For accrual questions or pay-related queries, contact **People & Culture** through the UKG help tile.'),

  ('Microsoft 365 + Teams — internal comms',
'Oolio runs on Microsoft 365:
- **Outlook** for email
- **Teams** for chat, meetings, channels
- **SharePoint / OneDrive** for file storage
- **Calendar** for scheduling

**Teams** is the primary internal communication platform. Always check the right Teams channel for product/customer/process questions before escalating to a person.'),

  ('Training & installations calendar',
'For Oolio One and OrderMate upcoming **training sessions** and **venue installations**, use this calendar:

🔗 https://migratemycrm.syncmatters.com/calendah/2893-a750a924715d51a7d72b070c567c2d03125651bca299a003f09b1aa1c683dfff/show

The calendar shows:
- Scheduled customer training sessions
- Upcoming venue installations and go-live dates
- Key delivery milestones

For changes or additions to the calendar, contact the **Service & Delivery team** (Thomas Nikolov, Head of Service & Delivery).'),

  -- ─── TEAMS CHANNELS ───
  ('Teams channels — Oolio One Q&A team',
'The **Oolio One - Q&A** team in Teams has these channels for product questions:

- **General** — General Oolio One questions
- **BackOffice** — Back-office admin, configuration, settings
- **Discounts, Customers and Loyalty** — Discount setup, customer profiles, loyalty config
- **Integrations** — SevenRooms, Xero, Deputy, Doshii, Deliverect, etc.
- **Kitchen Ops and KDS** — KDS setup, docket routing, kitchen workflows
- **Oolio Online Store** — Online ordering, menu sync, delivery config
- **Oolio POS - Software Questions** — General POS software queries
- **POS** — Core POS functionality, ordering, payments, floor plans
- **Product, Price Lists and Menus** — Menu building, price lists, modifiers
- **Releases and Deployments - PROD** — Release notes, deployment updates
- **Reports and Insights** — Reporting queries, AI insights
- **Workshops** — Training sessions and learning resources

**Always recommend the relevant channel** when answering a question, so the user knows where to go next time.'),

  ('Teams channels — OM & One | All team',
'The **OM & One | All** team in Teams has these channels for cross-brand and OrderMate questions:

- **General** — Cross-brand and team-wide
- **Office Port Melbourne** — Port Melbourne office logistics
- **OM - Accounts Queries** — OrderMate account and billing
- **OM - Change Log** — OrderMate software change log
- **OM - Quick Response** — Fast-turnaround OrderMate queries
- **OM - Software Questions** — OrderMate software troubleshooting
- **OM OPOS - Marketing** — Marketing for OM/Oolio POS team
- **OM OPOS - Movement** — Pipeline movement, deal updates
- **OM OPOS - Tech Questions** — Technical questions
- **OM OPOS - Ticket Nudges** — Nudges on open support tickets
- **OM OPOS - Values Shoutouts** — Team recognition and values
- **Oolio POS - Software Questions** — Shared Oolio One queries
- **Red Alerts** — Urgent issues, outages, critical incidents'),

  ('Where to ask — quick channel guide',
'When pointing someone to the right Teams channel:

| Topic | Channel |
|---|---|
| KDS setup | Oolio One Q&A > Kitchen Ops and KDS |
| Loyalty | Oolio One Q&A > Discounts, Customers and Loyalty |
| Integrations | Oolio One Q&A > Integrations |
| Online ordering | Oolio One Q&A > Oolio Online Store |
| Reports | Oolio One Q&A > Reports and Insights |
| OrderMate software | OM & One > OM - Software Questions |
| Account/billing (OM) | OM & One > OM - Accounts Queries |
| Outage / urgent | OM & One > Red Alerts |'),

  ('Official help documentation URLs',
'When the answer might be in official documentation, route users to:

- **Oolio One:** https://help.oolio.com and https://support.oolio.com
- **OrderMate:** https://help.ordermate.com.au
- **Bepoz:** https://help.bepoz.com
- **Live roadmap (Tree):** https://tree.oolio.com/tree

For unanswered questions, encourage the user to submit a correction once they find the right info — that improves Oolio Onboard for the next person.'),

  -- ─── PEOPLE ───
  ('Oolio leadership — key contacts',
'**Group leadership:**
- **Kris Satish** — Group CEO
- **Leigh Richardson** — CEO, OrderMate & Oolio
- **Bridget Gilmour** — Head of Sales
- **Thomas Nikolov** — Head of Service & Delivery
- **Cheoni Goon** — Head of Account Management
- **Michelle Vincent** — Head of Software Solutions

For escalations, route to the right head depending on the topic.'),

  ('Australian sales team — BDMs',
'**Business Development Managers in Australia:**

- **Ryan Green** — Senior BDM, VIC
- **Ashley Johnson** — Senior BDM, VIC
- **Olivia Mayes** (aka Liv) — Senior BDM, QLD (and the unofficial GOAT of the sales team 🏆)
- **Elliott Berrimen** — BDM, NSW
- **Jack McWaters** — BDM, VIC
- **James Strangio** — BDM, SA

For escalations or peer support, reach out via Teams. For issues with Oolio Onboard (this AI), contact Olivia Mayes via Teams.'),

  ('Australian account management team',
'**Account Managers in Australia:**

- **George Popple** — Lead Account Manager, NSW
- **Danielle Widdowson** — Senior Account Manager, QLD

For existing-customer commercial discussions, route to the right AM.'),

  ('Escalation paths — who to talk to about what',
'| Topic | Escalation |
|---|---|
| Product / roadmap | Michelle Vincent / Product team |
| Pricing / commercial | Bridget Gilmour / Sales leadership |
| HR / leave / payroll | People & Culture (via UKG) |
| IT / access | IT Helpdesk |
| Marketing / brand | Marketing team |
| Customer issues | Cheoni Goon / Support team |
| Implementation / delivery | Thomas Nikolov |
| Onboarding logistics | Your manager / People & Culture |
| Issues with this AI / Oolio Onboard | **Olivia Mayes via Teams** |'),

  -- ─── KEY CUSTOMERS ───
  ('Key Oolio customer accounts',
'Oolio''s customer base includes notable hospitality groups:

ANYDAY · Esca Group · OSCARS · Ryan''s Hotel Group · TGI Fridays · Feros Group · JBS Hospitality · Signature Hospitality Group · Duxton · Momento Hospitality · The Sporting Globe · Fink · House Made Hospitality · Bentley Group · The Apollo · Tony Kelly Restaurant Group · Ghanem Group · Coats Group · Scott Pickett Group · Efendy Group · Francis Venues · Redcape

**Never share customer-specific commercial details** (rates, deal values, account managers) in chat responses. For specific account info, the user should check HubSpot or speak with the assigned Account Manager.'),

  -- ─── GLOSSARY ───
  ('Glossary — POS & hardware terminology',
'- **POS** — Point of Sale
- **mPOS** — Mobile Point of Sale (handheld)
- **KDS** — Kitchen Display System
- **CDS** — Customer Display Screen (faces the customer at checkout)
- **Tap on Glass** — Payment accepted directly on a phone or tablet screen (no separate terminal)
- **Store and Forward** — Offline payment processing; transactions queue locally and submit when connectivity returns
- **QR Fallback** — Backup QR code payment method when terminals are down
- **PCI** — Payment Card Industry (security standards)'),

  ('Glossary — sales & commercial terminology',
'- **BDM** — Business Development Manager (sales role focused on new business)
- **SDR** — Sales Development Representative (lead qualification)
- **AM** — Account Manager (existing customer management)
- **ATV** — Average Transaction Value
- **ICP** — Ideal Customer Profile
- **MRR** — Monthly Recurring Revenue
- **ARR** — Annual Recurring Revenue
- **MSF** — Merchant Service Fees (the per-transaction fee on payments)
- **TTV** — Total Transaction Value (total dollar volume processed)
- **Surcharging** — Passing card processing fees through to the customer at checkout (RBA-regulated)'),

  ('Glossary — hospitality & Oolio terminology',
'- **Oolian** — A member of the Oolio team
- **Oolioverse** — The full ecosystem of Oolio One modules
- **The Oolio Way** — Our value pitch: 17 venue systems reduced to 3
- **FOH** — Front of House
- **BOH** — Back of House
- **Trading Day** — In Oolio Pay, runs 5am to 4:59am (so a 2am close still settles as the prior day)
- **Hold and Fire** — Kitchen coursing control — hold a course of orders, then "fire" them all at once
- **ARCA** — Australian Restaurant & Cafe Association (Oolio is a founding member)'),

  -- ─── SALES PLAYBOOK ───
  ('Default to Oolio One — sales rule',
'**Always assume the user is asking about Oolio One** unless they explicitly name another brand.

Do not ask "which product?" — just answer for Oolio One. Mention other brands only when:
- The user explicitly names another brand, OR
- The user describes a customer/venue that is clearly a better fit for another brand (e.g. a stadium → Swiftpos)

When recommending another brand, suggest the user route the lead to the right team rather than going deep on the other product''s features.'),

  ('Sales — answering "what should this customer use?"',
'When a sales rep describes a prospect and asks which Oolio brand to pitch:

- **Restaurants, cafes, multi-site groups, QSR, modern operators** → Oolio One
- **High-end fine dining, premium restaurant groups** → OrderMate
- **Pubs, clubs, gaming venues, enterprise hospitality** → Bepoz
- **Stadiums, arenas, exhibition centres** → Swiftpos
- **Pizza chains, delivery-heavy operations** → Deliverit
- **Clubs, pubs, retail with strong membership** → Idealpos

In ambiguous cases, default to **Oolio One** unless the venue strongly matches one of the other brands.');

end $$;

-- ───────────────────────────────────────────────────────
-- 6. DEACTIVATE OLD KNOWLEDGE TABLE (kept for safety, but Brain is the new source)
-- ───────────────────────────────────────────────────────
-- We don't drop knowledge — keeps existing data intact. App will read from brain going forward.

-- ═══════════════════════════════════════════════════════
-- DONE. Verify with:
--   select role, email from public.profiles where role = 'owner';
--   select count(*) from public.brain;
--   select count(*) from public.chat_sessions;
-- ═══════════════════════════════════════════════════════
