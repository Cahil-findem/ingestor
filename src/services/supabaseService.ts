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

export const diagnosticTest = async (): Promise<{
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

  const diagnostics: any = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    functionName: edgeFunctionName,
    timestamp: new Date().toISOString(),
    tests: {}
  }

  // Test 1: Try the configured function name
  try {
    console.log('Testing configured edge function:', edgeFunctionName)
    
    const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
      body: { test: true, profiles: [] },
    })

    diagnostics.tests.configuredFunction = {
      name: edgeFunctionName,
      error: error?.message || null,
      errorCode: error?.code || null,
      success: !error,
      response: data
    }

    if (!error) {
      return {
        success: true,
        message: `Edge function '${edgeFunctionName}' is working`,
        details: diagnostics
      }
    }
  } catch (err) {
    diagnostics.tests.configuredFunction = {
      name: edgeFunctionName,
      error: err instanceof Error ? err.message : 'Unknown error',
      success: false
    }
  }

  // Test 2: Try common function names
  const commonNames = ['ingest', 'upload', 'process', 'import', 'data-ingest', 'profiles']
  
  for (const testName of commonNames) {
    try {
      const { error } = await supabase.functions.invoke(testName, {
        body: { test: true },
      })
      
      diagnostics.tests[`common_${testName}`] = {
        name: testName,
        error: error?.message || null,
        exists: error?.message !== 'Failed to send a request to the Edge Function'
      }
    } catch (err) {
      diagnostics.tests[`common_${testName}`] = {
        name: testName,
        error: err instanceof Error ? err.message : 'Unknown error',
        exists: false
      }
    }
  }

  // Test 3: Try to get function list (if possible)
  try {
    // This might not work but worth trying
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    diagnostics.tests.listFunctions = {
      status: response.status,
      statusText: response.statusText,
      accessible: response.ok
    }
  } catch (err) {
    diagnostics.tests.listFunctions = {
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }

  return {
    success: false,
    message: `Edge function '${edgeFunctionName}' not found or not accessible. Check diagnostics for details.`,
    details: diagnostics
  }
}

export const testEdgeFunction = async (): Promise<{
  success: boolean
  message: string
  details?: any
}> => {
  return await diagnosticTest()
}