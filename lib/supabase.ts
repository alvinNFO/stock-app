import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  "https://jegttqhcncgtcndqtuwm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZ3R0cWhjbmNndGNuZHF0dXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTI5NzYsImV4cCI6MjA5MzEyODk3Nn0.oxw6N6un9IAPyVwNLI6ajmog42aGz8DcHKALwefMmlY"
)