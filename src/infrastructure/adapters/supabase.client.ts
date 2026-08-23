/**
 * supabase.client.ts — Single shared Supabase client instance.
 *
 * All adapters import THIS instance — never call createClient() elsewhere.
 * Auth options enable session persistence + auto-refresh + URL detection.
 * Typed with IDatabase so all .from() calls are schema-aware.
 */

import { createClient } from '@supabase/supabase-js';
import type { IDatabase } from './database.types';

export const supabase = createClient<IDatabase>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    db: { schema: 'suksai' },
  },
);
