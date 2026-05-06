import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Only the public ANON KEY should ever be exposed here.
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL and Anon Key must be provided in environment variables.');
}

// Critical Security Check: Ensure the service_role key isn't accidentally exposed
if (supabaseAnonKey && supabaseAnonKey.includes('service_role')) {
  console.error('CRITICAL SECURITY ERROR: Service role key used in frontend environment variable!');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
