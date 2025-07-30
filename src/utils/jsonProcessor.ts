import { ProcessedData } from '../types'

export const processJsonData = (data: any): ProcessedData => {
  const processed: ProcessedData = {
    originalKeys: Object.keys(data),
    totalProperties: Object.keys(data).length,
    dataTypes: {},
    processedAt: new Date().toISOString(),
    summary: 'JSON file processed successfully',
  }

  for (const [key, value] of Object.entries(data)) {
    processed.dataTypes[key] = typeof value
  }

  return processed
}