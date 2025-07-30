import { ProcessedData } from '../types'

export const processJsonData = (data: any[]): ProcessedData => {
  // Analyze the structure of the array of objects
  const allKeys = new Set<string>()
  const fieldTypes: Record<string, Set<string>> = {}
  
  // Collect all unique keys and their types across all objects
  data.forEach((obj) => {
    Object.keys(obj).forEach(key => {
      allKeys.add(key)
      if (!fieldTypes[key]) {
        fieldTypes[key] = new Set()
      }
      fieldTypes[key].add(typeof obj[key])
    })
  })
  
  const processed: ProcessedData = {
    originalKeys: Array.from(allKeys),
    totalProperties: data.length,
    dataTypes: {},
    processedAt: new Date().toISOString(),
    summary: `Successfully processed ${data.length} profile${data.length === 1 ? '' : 's'} with ${allKeys.size} unique field${allKeys.size === 1 ? '' : 's'}`,
  }

  // Convert Sets to arrays for the final output
  for (const [key, types] of Object.entries(fieldTypes)) {
    processed.dataTypes[key] = Array.from(types).join(' | ')
  }

  return processed
}