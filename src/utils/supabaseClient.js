import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://groqfpqbegdpsobpveph.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_742B2CPuRj6MmtoAdST7Xg_YDdtDMaZ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)