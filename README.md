# AllTech SaaS

Client portal + admin console for AllTech.

## Stack

- **Frontend:** React 19 + Vite
- **Backend/Auth/Database:** Supabase

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with your Supabase credentials:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Set up the database:
   - SQL files live in [`db/`](./db/).
   - Run `db/supabase_schema.sql` first, then `db/supabase_rls_fix.sql` in the Supabase SQL Editor.

## Development

Start the Vite dev server:

```bash
npm run dev
```

Other useful scripts:

```bash
npm run build    # Production build
npm run preview  # Preview production build locally
```
