import { supabase, edgeFunctionName, isSupabaseConfigured } from '../lib/supabase'

export interface ProfileData {
  [key: string]: any
}

export interface DatabaseUploadResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

export interface EdgeFunctionResponse {
  success: boolean
  message: string
  insertedCount?: number
  errors?: Array<{
    profile: ProfileData
    error: string
  }>
}

export const uploadProfilesToDatabase = async (
  profiles: ProfileData[]
): Promise<DatabaseUploadResult> => {
  // Check if Supabase is configured
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      message: 'Database not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.',
      error: 'Missing Supabase configuration',
    }
  }

  try {
    // Call the Supabase edge function to process and insert profiles
    const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
      body: {
        profiles,
        timestamp: new Date().toISOString(),
      },
    })

    if (error) {
      console.error('Edge function error:', error)
      return {
        success: false,
        message: 'Failed to call database function',
        error: error.message || 'Unknown edge function error',
      }
    }

    const response = data as EdgeFunctionResponse

    if (!response.success) {
      return {
        success: false,
        message: response.message || 'Database operation failed',
        error: response.message,
        data: response.errors,
      }
    }

    return {
      success: true,
      message: `Successfully uploaded ${response.insertedCount} profile${
        response.insertedCount === 1 ? '' : 's'
      } to database`,
      data: {
        insertedCount: response.insertedCount,
        errors: response.errors || [],
      },
    }
  } catch (error) {
    console.error('Database upload error:', error)
    return {
      success: false,
      message: 'Failed to upload profiles to database',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export const testDatabaseConnection = async (): Promise<boolean> => {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured for connection test')
    return false
  }

  try {
    const { data, error } = await supabase.functions.invoke('health-check', {
      body: { test: true },
    })

    if (error) {
      console.error('Database connection test failed:', error)
      return false
    }

    return data?.success === true
  } catch (error) {
    console.error('Database connection test error:', error)
    return false
  }
}