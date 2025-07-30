import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a function to get the Supabase client
export const getSupabaseClient = () => {
  if (!supabaseUrl) {
    throw new Error('Missing VITE_SUPABASE_URL environment variable')
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Export a lazy-initialized client
export const supabase = (() => {
  try {
    return getSupabaseClient()
  } catch (error) {
    console.warn('Supabase client not initialized:', error)
    return null
  }
})()

export const edgeFunctionName = import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_NAME || 'data_ingress'

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey)