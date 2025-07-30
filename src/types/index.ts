export interface ProcessedData {
  originalKeys: string[]
  totalProperties: number
  dataTypes: Record<string, string>
  processedAt: string
  summary: string
}

export interface FileInfo {
  name: string
  size: string
}

export type ResultType = 'success' | 'error'