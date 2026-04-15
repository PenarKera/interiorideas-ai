# InteriorIdeas.ai

AI-powered interior design studio built with Next.js, Supabase, Groq, and Unsplash.

## What this project does

InteriorIdeas.ai helps users generate interior design concepts for different room types. A signed-in user can:

- choose a room, style, palette, budget, and extra notes
- generate an AI design concept
- view furniture suggestions, color tips, and inspiration photos
- save designs to Supabase
- reopen saved work from the gallery
- review simple usage analytics
- export a design as PDF with the browser print flow

## Live link

https://interiorideas-ai.vercel.app

## Run locally

1. Clone the repo:

```bash
git clone https://github.com/PenarKera/interiorideas-ai.git
cd interiorideas-ai
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Start the dev server:

```bash
npm run dev
```

5. Open `http://localhost:3000`

## Environment notes

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required for auth and database access.
- `GROQ_API_KEY` is required for AI design generation.
- `UNSPLASH_ACCESS_KEY` is optional but recommended for inspiration photos.
- `NEXT_PUBLIC_SITE_URL` is optional locally, but useful as a fallback base URL for auth redirects.

## Supabase setup

Run this SQL in the Supabase SQL Editor:

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
  photos JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_own" ON designs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

## Main stack

- Next.js 14
- React 18
- Supabase Auth + PostgreSQL
- Groq API for design generation
- Unsplash for reference photos

## Project structure

```text
app/
|-- api/generate/route.js
|-- login/page.js
|-- update-password/page.js
|-- page.js
`-- layout.js
lib/
|-- AuthContext.js
|-- auth-helpers.js
`-- supabase.js
```

## Notes for demo

- Authentication protects the main dashboard.
- Password reset redirects now use the current site origin instead of a hardcoded localhost URL.
- Login and reset flows show inline feedback for loading, success, and errors.

## Author

Penar Kera  
Advanced Programming course  
University "Isa Boletini" Mitrovice - 2026
