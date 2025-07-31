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
    console.log('Attempting to call edge function:', {
      functionName: edgeFunctionName,
      profileCount: profiles.length,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.substring(0, 30) + '...',
      timestamp: new Date().toISOString()
    })

    // Call the Supabase edge function to process and insert profiles
    const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
      body: {
        profiles,
        timestamp: new Date().toISOString(),
      },
    })

    if (error) {
      console.error('Edge function error details:', {
        error,
        functionName: edgeFunctionName,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        context: error.context
      })
      
      return {
        success: false,
        message: `Failed to call edge function '${edgeFunctionName}': ${error.message || error.code || 'Unknown error'}`,
        error: `Edge function error: ${JSON.stringify({
          message: error.message,
          code: error.code,
          details: error.details
        })}`,
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

export const testEdgeFunction = async (): Promise<{
  success: boolean
  message: string
  details?: any
}> => {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      message: 'Supabase not configured'
    }
  }

  try {
    console.log('Testing edge function connectivity...')
    
    const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
      body: {
        test: true,
        profiles: [],
        timestamp: new Date().toISOString(),
      },
    })

    if (error) {
      return {
        success: false,
        message: `Edge function '${edgeFunctionName}' failed: ${error.message || error.code}`,
        details: {
          error: error.message,
          code: error.code,
          details: error.details,
          functionName: edgeFunctionName
        }
      }
    }

    return {
      success: true,
      message: `Edge function '${edgeFunctionName}' is accessible`,
      details: data
    }
  } catch (error) {
    return {
      success: false,
      message: `Edge function test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}