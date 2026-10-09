import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase URL and public anon key must be configured.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
