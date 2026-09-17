import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rjffxowpstgvnpikoyne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqZmZ4b3dwc3Rndm5waWtveW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODA3MDQsImV4cCI6MjA4ODU1NjcwNH0.w4nhr_nM3fJeqOEcI47_oFgwCtw-QS9vpWi2ZCyzBA4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
