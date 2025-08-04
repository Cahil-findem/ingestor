export interface ProcessedData {
  originalKeys: string[]
  totalProperties: number
  dataTypes: Record<string, string>
  processedAt: string
  summary: string
  label?: string
  databaseResult?: DatabaseUploadResult
}

export interface FileInfo {
  name: string
  size: string
}

export interface UploadRequest {
  profiles: ProfileData[]
  label?: string
}

export interface ProfileData {
  [key: string]: any
}

export interface DatabaseUploadResult {
  success: boolean
  message: string
  data?: {
    insertedCount: number
    errors: Array<{
      profile: any
      error: string
    }>
  }
  error?: string
}

export type ResultType = 'success' | 'error' | 'warning'