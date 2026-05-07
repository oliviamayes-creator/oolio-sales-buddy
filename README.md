# Oolio Onboard — Sales Team Onboarding Platform

AI-powered onboarding platform for the Oolio sales team. Built with Next.js and Claude API.

## Features

- 💬 **AI Chat** — Onboarding buddy powered by Claude with full Oolio knowledge base
- ✅ **Checklists** — Role-based onboarding tasks organized by Products, Tools, Process
- 🎯 **Quizzes** — Multiple choice + true/false with scoring and progress tracking
- 📄 **Document Library** — Centralized sales resources with download links
- ⚙️ **Admin Panel** — Knowledge manager, quiz builder, checklist editor, document manager, user management, activity dashboard
- 🔐 **Auth** — Email/password login with admin/user roles

## Deployment Steps

### 1. Create a new repo on GitHub

Go to github.com/oliviamayes-creator and create a new repo called `oolio-onboard`.

### 2. Push this code to GitHub

```bash
cd oolio-onboard
git init
git add .
git commit -m "Initial commit - Oolio Onboard platform"
git branch -M main
git remote add origin https://github.com/oliviamayes-creator/oolio-onboard.git
git push -u origin main
```

### 3. Deploy on Vercel

1. Go to vercel.com/dashboard
2. Click "Add New Project"
3. Import the `oolio-onboard` repo from GitHub
4. **Framework Preset:** Next.js (should auto-detect)
5. **Root Directory:** Leave as `/` (default)
6. **Environment Variables:** Add `ANTHROPIC_API_KEY` with your existing API key
7. Click "Deploy"

That's it. Your app will be live at `oolio-onboard.vercel.app` (or whatever Vercel assigns).

### 4. First login

- **Olivia:** olivia.mayes@oolio.com / oolio2025
- **Bridget:** bridget.gilmour@oolio.com / oolio2025

Change these passwords after first login by editing the user in the Admin panel.

## Project Structure

```
oolio-onboard/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.js      ← Claude API route (keeps key server-side)
│   ├── layout.js              ← Root layout with fonts
│   └── page.js                ← Main page
├── components/
│   └── OolioOnboard.jsx       ← The entire app
├── .env.example               ← Environment template
├── .gitignore
├── next.config.js
├── package.json
└── README.md
```

## Admin Guide

### Adding users
Admin Panel → Users → Enter name, email, password, role → Add User

### Creating quizzes
Admin Panel → Quizzes → Enter title + description → Add questions (MC or T/F) → Mark correct answers → Publish Quiz

### Managing checklists
Admin Panel → Checklists → Select topic (Products/Tools/Process) → Enter task title + description → Add Task

### Adding documents
Admin Panel → Docs → Enter title, description, link (SharePoint/Drive/etc), category, file type → Add Document

### Correcting AI answers
Admin Panel → Knowledge → Enter the topic/question and the correct answer → Add Knowledge. These override the AI's base knowledge.

## Future Upgrades

- **Vercel KV** — Replace localStorage with a proper database for shared data across browsers
- **Entra ID SSO** — Replace email/password with Microsoft M365 login
- **File uploads** — Use Vercel Blob for actual file hosting instead of links
- **Role-based paths** — Add AM, Support, Implementation onboarding tracks
