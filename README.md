# ◈ InteriorIdeas.ai

> AI-powered interior design platform built with Next.js and Groq AI

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green?style=flat-square&logo=supabase)
![AI](https://img.shields.io/badge/AI-Groq%20LLaMA-blue?style=flat-square)

## 🏠 About

InteriorIdeas.ai generates professional interior design concepts in seconds. Users select their room type, design style, color palette, and budget — then AI creates a full design concept including furniture recommendations, color tips, and expert advice.

## ✨ Features

- **AI Design Generation** — Powered by Groq (LLaMA 3.3 70B) for fast, professional results
- **User Authentication** — Secure signup/login with Supabase Auth
- **Save Designs** — Every design saved to your personal database
- **Design History** — Browse, search, and reload past designs
- **Analytics Dashboard** — Track your design activity with charts
- **Export PDF** — Print or save any design as PDF
- **Protected Routes** — Dashboard only accessible when logged in

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React |
| Styling | Inline CSS (custom dark theme) |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| AI | Groq API (LLaMA 3.3 70B) |

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/PenarKera/interiorideas-ai.git
cd interiorideas-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

### 4. Set up Supabase database

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room TEXT,
  style TEXT,
  palette TEXT,
  budget TEXT,
  concept_title TEXT,
  concept_description TEXT,
  key_elements JSONB,
  furniture JSONB,
  color_tips JSONB,
  pro_tip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_own" ON designs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
interiorideas-ai/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.js      # AI generation endpoint
│   ├── login/
│   │   └── page.js           # Login & signup page
│   ├── page.js               # Main dashboard
│   └── layout.js             # Root layout with AuthProvider
├── lib/
│   ├── supabase.js           # Supabase client
│   └── AuthContext.js        # Auth state management
├── .env.local                # Environment variables (not committed)
└── README.md
```

## 🔐 Security

- API keys stored in `.env.local` — never exposed to the frontend
- Row Level Security (RLS) enabled — users only see their own designs
- Supabase handles password hashing and session management

## 👨‍💻 Author

**Penar Kera** — Built as part of Advanced Programming course  
University "Isa Boletini" Mitrovicë — 2026

---

*Built with ◈ InteriorIdeas.ai*
