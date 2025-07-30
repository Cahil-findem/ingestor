export interface ValidationResult {
  isValid: boolean
  error?: string
  data?: any[]
}

export const validateJsonFile = async (file: File): Promise<ValidationResult> => {
  // Check file extension
  if (!file.name.toLowerCase().endsWith('.json')) {
    return {
      isValid: false,
      error: 'Wrong file type. Please select a JSON file (.json extension).'
    }
  }

  let fileContent: string
  let parsedData: any

  try {
    // Read file content
    fileContent = await readFileAsText(file)
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to read the file. Please try again.'
    }
  }

  try {
    // Parse JSON
    parsedData = JSON.parse(fileContent)
  } catch (parseError) {
    return {
      isValid: false,
      error: 'Invalid JSON format. Please ensure your file contains valid JSON.'
    }
  }

  // Check if data is an array
  if (!Array.isArray(parsedData)) {
    return {
      isValid: false,
      error: 'Invalid JSON structure. The JSON file must contain an array of objects.'
    }
  }

  // Check array length (max 10 objects)
  if (parsedData.length > 10) {
    return {
      isValid: false,
      error: 'File too large. We only support uploading 10 profiles at a time.'
    }
  }

  // Check if array is empty
  if (parsedData.length === 0) {
    return {
      isValid: false,
      error: 'Empty array. Please provide at least one profile object.'
    }
  }

  // Check if all elements are objects
  const nonObjectIndex = parsedData.findIndex(item => 
    item === null || typeof item !== 'object' || Array.isArray(item)
  )
  
  if (nonObjectIndex !== -1) {
    return {
      isValid: false,
      error: `Invalid data at position ${nonObjectIndex + 1}. All array elements must be objects.`
    }
  }

  return {
    isValid: true,
    data: parsedData
  }
}

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}