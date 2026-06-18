import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://groqfpqbegdpsobpveph.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyb3FmcHFiZWdkcHNvYnB2ZXBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5ODgxNTYsImV4cCI6MjA5NTU2NDE1Nn0.KpYoYZJBxk7xgliUizz79gC1mz1cFlPuSUpf-w3MpkY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)