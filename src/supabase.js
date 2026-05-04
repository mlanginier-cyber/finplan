import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://szzzcasnznpdibnsdlko.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6enpjYXNuem5wZGlibnNkbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMzYxODAsImV4cCI6MjA5MjgxMjE4MH0.Z_br1HkyaixuhQyhqc7C6BFh1fq-YQOLWQNKl1ONsfo'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  if (error) throw error
}

export async function signOut() { await supabase.auth.signOut() }

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function ensureProfile(user) {
  await supabase.from('profiles').upsert({
    id: user.id, email: user.email,
    full_name: user.user_metadata?.full_name || user.email,
    avatar_url: user.user_metadata?.avatar_url,
    last_seen: new Date().toISOString()
  })
}

export async function loadData(userId) {
  const { data } = await supabase.from('financial_data').select('*').eq('user_id', userId).single()
  return data || {}
}

export async function saveData(userId, updates) {
  await supabase.from('financial_data').upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() })
  await supabase.from('profiles').upsert({ id: userId, last_seen: new Date().toISOString() })
}
