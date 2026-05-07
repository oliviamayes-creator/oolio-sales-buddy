# Oolio Onboard — MVP Production Build

Real Supabase auth + database + storage. Server-side AI. Mobile-friendly. Multi-user. Admin moderation.

---

## ⚡ DEPLOYMENT — DO THIS IN ORDER

### Step 1 — Run the database schema

1. Go to your Supabase project → **SQL Editor** → **New query**
2. Open `supabase/schema.sql` from this project
3. Copy the entire contents, paste into the SQL editor
4. Click **Run**
5. You should see "Success. No rows returned." That's correct — it created tables, indexes, policies, triggers, and seeded knowledge + 2 documents.

### Step 2 — Create the Storage bucket for documents

1. In Supabase → **Storage** → **New bucket**
2. Name: `documents`
3. **Public bucket: NO** (leave unchecked — files served via signed URLs)
4. Click **Save**

### Step 3 — Configure Auth

1. Supabase → **Authentication** → **Providers** → make sure **Email** is enabled
2. Supabase → **Authentication** → **Email Templates** → optional: customize the confirmation email if you want
3. Supabase → **Authentication** → **URL Configuration** → set **Site URL** to your Vercel URL (e.g. `https://oolio-onboard.vercel.app`)
4. **IMPORTANT for MVP:** Supabase → **Authentication** → **Providers** → Email → toggle off "Confirm email" so users can sign in immediately. (Re-enable for production.)

### Step 4 — Push to GitHub

```bash
cd oolio-onboard
git init
git add .
git commit -m "Oolio Onboard MVP"
git branch -M main
git remote add origin https://github.com/oliviamayes-creator/oolio-onboard.git
git push -u origin main
```

### Step 5 — Deploy to Vercel

1. vercel.com → **Add New Project** → import `oolio-onboard`
2. Framework: **Next.js** (auto-detected)
3. Add environment variables (all of these):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (anon/public key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service_role key — KEEP SECRET)
ANTHROPIC_API_KEY=sk-ant-api03-...
TAVILY_API_KEY=tvly-... (optional for MVP)
```

Find these in Supabase → **Settings** → **API**.

4. Click **Deploy**

### Step 6 — Create your admin account

1. Visit your deployed URL → click **Create an account**
2. Sign up with `olivia.mayes@oolio.com` and any password (min 8 chars)
3. Go back to Supabase → **SQL Editor** → run:

```sql
update public.profiles set role = 'admin' where email = 'olivia.mayes@oolio.com';
update public.profiles set role = 'admin' where email = 'bridget.gilmour@oolio.com';
```

4. Sign out and back in. You'll now see the **Admin** tab in the bottom nav.

### Step 7 — Test it

- Sign in → ask the chatbot a question (e.g. "What's Oolio Pay?")
- Click 👎 then "Correct this" → submit a correction
- Open Admin → Corrections → approve it → it appears in Knowledge
- Open in mobile Safari/Chrome — should work cleanly
- Open in incognito — should require login (no localStorage dependency)

---

## 🧠 Architecture

```
oolio-onboard/
├── supabase/schema.sql           ← Run this once in Supabase SQL editor
├── middleware.js                 ← Protects routes, refreshes sessions
├── lib/
│   ├── supabase-browser.js       ← Client-side Supabase
│   └── supabase-server.js        ← Server-side + service role
├── app/
│   ├── login/page.js             ← Login (email/pass)
│   ├── signup/page.js            ← Signup (@oolio.com only)
│   ├── page.js                   ← Home (chat) — server component
│   ├── documents/page.js         ← Document library
│   ├── admin/page.js             ← Admin panel (role-gated)
│   ├── account/page.js           ← Profile + change password
│   └── api/
│       ├── chat/                 ← Server-side Claude call + retrieval + logging
│       ├── feedback/             ← 👍 👎
│       ├── correction/           ← Submit correction → goes to pending queue
│       ├── documents/            ← List documents (any user)
│       └── admin/
│           ├── users/            ← Manage users (admin only)
│           ├── corrections/      ← Approve/reject corrections (admin only)
│           ├── knowledge/        ← CRUD knowledge (admin only)
│           └── documents/        ← Upload/delete docs (admin only)
└── components/
    ├── AppShell.js               ← Header + bottom nav
    ├── ChatView.js               ← Chat UI with feedback & correction modal
    ├── DocumentsView.js          ← Document list
    ├── AdminView.js              ← Admin panel (5 tabs)
    └── AccountView.js            ← Profile/password
```

---

## 🔒 Security

- All secrets are server-side only (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`)
- Client only ever sees `NEXT_PUBLIC_*` env vars
- Row Level Security enabled on all tables
- Admin endpoints check `profile.role === 'admin'` before any write
- Signup restricted to `@oolio.com` emails (enforced by DB trigger)
- Users can only self-update their own profile (RLS)
- All files in Storage served via signed URLs (10-min expiry)

---

## 📦 What's Working in This MVP

✅ Real Supabase auth — login, signup, password change, session persistence  
✅ Real database — no localStorage for any critical data  
✅ Multi-user support with roles (admin / manager / sales_rep / viewer)  
✅ AI chat with admin-approved knowledge retrieval (text search + product filtering)  
✅ Feedback (👍 👎)  
✅ Correction workflow → admin review → approved corrections become trusted knowledge  
✅ Document library with file uploads to Supabase Storage  
✅ Product separation logic (Oolio / OrderMate / Bepoz never blended)  
✅ Mobile-responsive UI with safe-area handling  
✅ Works in incognito (no localStorage dependency)  
✅ Works in Chrome / Edge / Safari / mobile Safari / mobile Chrome  
✅ Server-side secrets only — no API keys exposed to browser  

---

## 🚧 Deferred to Next Sprint

- pgvector embeddings (currently using Postgres full-text search + ILIKE fallback)
- Tavily web search fallback (env var ready, integration pending)
- Help guide auto-crawler (admin can manually add knowledge entries with source URLs for now)
- Google Places venue search
- PDF text extraction for uploaded files
- Advanced reporting visualizations
- Onboarding checklist & quiz UI (data preserved in v1, ready to restore)
- Email password reset flow
- Entra ID SSO

---

## 🛠 Common Issues

**"Only @oolio.com emails are allowed"** — that's the trigger working correctly. Use a real Oolio email.

**Admin tab not showing** — you need to manually promote yourself in SQL editor (see Step 6).

**Chat says "Not authenticated"** — your session may have expired. Sign out and back in.

**File upload fails** — make sure the `documents` storage bucket exists in Supabase (see Step 2).

**Knowledge search not finding obvious matches** — the seeded data is sparse. Use the Admin → Knowledge tab to add more entries or approve corrections submitted by users.
