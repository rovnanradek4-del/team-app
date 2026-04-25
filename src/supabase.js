import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://kqhdjzptzjybylqdxbwx.supabase.co'
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxaGRqenB0emp5YnlscWR4Ynd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTQ4MTUsImV4cCI6MjA5MDEzMDgxNX0.kD1HHOCBcgedYsUneLfpbbuv2RQ23qgdymglmWuCxxM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
