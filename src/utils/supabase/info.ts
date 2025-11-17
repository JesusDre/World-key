// Supabase project identifiers used by UI fetch helpers.
// Prefer setting these values in your .env as VITE_SUPABASE_PROJECT_ID and VITE_SUPABASE_ANON_KEY.
// These fallbacks are placeholders to avoid import errors in development.
const meta = import.meta as unknown as { env: Record<string, string | undefined> };
export const projectId: string = meta.env.VITE_SUPABASE_PROJECT_ID ?? "your-supabase-project-id";
export const publicAnonKey: string = meta.env.VITE_SUPABASE_ANON_KEY ?? "your-public-anon-key";
