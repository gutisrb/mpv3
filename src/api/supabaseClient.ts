import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not defined in environment variables');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not defined in environment variables');
}

try {
  // Validate the URL
  new URL(supabaseUrl);
} catch (error) {
  throw new Error('VITE_SUPABASE_URL is not a valid URL');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  { realtime: { enabled: false } } // Disable Supabase realtime WebSocket
);