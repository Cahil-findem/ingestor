import { useState, useCallback } from 'react'
import { FileUpload } from './components/FileUpload'
import { ProcessingResult } from './components/ProcessingResult'
import { LoadingSpinner } from './components/LoadingSpinner'
import { formatFileSize, simulateProcessing } from './utils/fileUtils'
import { processJsonData } from './utils/jsonProcessor'
import { validateJsonFile } from './utils/jsonValidator'
import { FileInfo, ProcessedData, ResultType } from './types'
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isProcessButtonEnabled, setIsProcessButtonEnabled] = useState(false)
  const [result, setResult] = useState<{
    type: ResultType
    title: string
    message: string
    data?: ProcessedData | null
    isVisible: boolean
  }>({
    type: 'success',
    title: '',
    message: '',
    data: null,
    isVisible: false,
  })

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true)
    setResult({ ...result, isVisible: false })

    const validation = await validateJsonFile(file)
    
    if (!validation.isValid) {
      setResult({
        type: 'error',
        title: 'Validation Failed',
        message: validation.error!,
        isVisible: true,
      })
      setIsProcessing(false)
      return
    }

    setSelectedFile(file)
    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size),
    })
    setIsProcessButtonEnabled(true)
    setIsProcessing(false)
  }, [result])

  const handleProcessFile = useCallback(async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setIsProcessButtonEnabled(false)
    setResult({ ...result, isVisible: false })

    try {
      // Re-validate the file (in case it was modified)
      const validation = await validateJsonFile(selectedFile)
      
      if (!validation.isValid) {
        throw new Error(validation.error!)
      }

      const jsonData = validation.data!
      await simulateProcessing()

      const processedData = processJsonData(jsonData)

      setResult({
        type: 'success',
        title: 'Processing Complete!',
        message: `Successfully processed JSON array with ${jsonData.length} profile${jsonData.length === 1 ? '' : 's'}.`,
        data: processedData,
        isVisible: true,
      })
    } catch (error) {
      setResult({
        type: 'error',
        title: 'Processing Failed',
        message: (error as Error).message,
        isVisible: true,
      })
    } finally {
      setIsProcessing(false)
      setIsProcessButtonEnabled(true)
    }
  }, [selectedFile, result])

  return (
    <div className="container">
      <h1>JSON Processor</h1>
      <p className="subtitle">Upload a JSON array with up to 10 profile objects</p>

      <FileUpload
        onFileSelect={handleFileSelect}
        fileInfo={fileInfo}
      />

      <button
        className="process-btn"
        onClick={handleProcessFile}
        disabled={!isProcessButtonEnabled}
      >
        Process File
      </button>

      <LoadingSpinner isVisible={isProcessing} />

      <ProcessingResult
        type={result.type}
        title={result.title}
        message={result.message}
        data={result.data}
        isVisible={result.isVisible}
      />
    </div>
  )
}

export default App