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
    // Note: The edge function expects a direct array of profiles, not wrapped in an object
    const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
      body: profiles, // Send profiles directly as array
    })

    if (error) {
      console.error('Edge function error details:', {
        error,
        functionName: edgeFunctionName,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        context: error.context,
        profilesSent: profiles.length,
        firstProfile: profiles[0] // Log first profile for debugging
      })
      
      return {
        success: false,
        message: `Failed to call edge function '${edgeFunctionName}': ${error.message || error.code || 'Unknown error'}`,
        error: `Edge function error: ${JSON.stringify({
          message: error.message,
          code: error.code,
          details: error.details,
          profileCount: profiles.length
        })}`,
      }
    }

    const response = data as any
    
    console.log('Edge function response:', {
      response,
      success: response?.success,
      inserted: response?.inserted,
      error: response?.error
    })

    if (!response || !response.success) {
      return {
        success: false,
        message: response?.error || 'Database operation failed',
        error: response?.error || 'Unknown error',
      }
    }

    return {
      success: true,
      message: `Successfully uploaded ${response.inserted} profile${
        response.inserted === 1 ? '' : 's'
      } to database`,
      data: {
        insertedCount: response.inserted,
        errors: [],
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
      body: [], // Send empty array for test
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
  const commonNames = ['ingest', 'upload', 'process', 'import', 'data-ingest', 'data-ingress', 'profiles']
  
  for (const testName of commonNames) {
    try {
      const { error } = await supabase.functions.invoke(testName, {
        body: [],
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

  // Test 3: Direct fetch test using Supabase's exact format
  try {
    console.log('Testing direct fetch to data-ingress...')
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/data-ingress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([])
    })
    
    const responseText = await response.text()
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }
    
    diagnostics.tests.directFetch = {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      responseBody: responseData,
      headers: Object.fromEntries(response.headers.entries())
    }
    
    if (response.ok) {
      return {
        success: true,
        message: 'Direct fetch to data-ingress succeeded!',
        details: diagnostics
      }
    }
    
  } catch (err) {
    diagnostics.tests.directFetch = {
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }

  // Test 4: Check if anon key works for basic API access
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    })
    
    diagnostics.tests.basicApiAccess = {
      status: response.status,
      statusText: response.statusText,
      accessible: response.ok,
      anonKeyFormat: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10) + '...'
    }
  } catch (err) {
    diagnostics.tests.basicApiAccess = {
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }

  // Test 5: Check edge functions permissions specifically
  try {
    // Try to get function info with different approach
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/data-ingress`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      }
    })
    
    diagnostics.tests.edgeFunctionOptions = {
      status: response.status,
      statusText: response.statusText,
      accessible: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    }
  } catch (err) {
    diagnostics.tests.edgeFunctionOptions = {
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

export const triggerQueueProcessor = async (): Promise<{
  success: boolean
  message: string
  details?: any
}> => {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      message: 'Supabase not configured. Cannot trigger queue processor.',
    }
  }

  try {
    console.log('Triggering queue processor...')
    
    const { data, error } = await supabase.functions.invoke('queue-processor', {
      body: {},
    })

    if (error) {
      console.error('Queue processor error:', error)
      return {
        success: false,
        message: `Failed to trigger queue processor: ${error.message || 'Unknown error'}`,
        details: error,
      }
    }

    console.log('Queue processor response:', data)

    return {
      success: true,
      message: data?.message || 'Queue processor triggered successfully',
      details: data,
    }
  } catch (error) {
    console.error('Queue processor trigger error:', error)
    return {
      success: false,
      message: 'Failed to trigger queue processor',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}