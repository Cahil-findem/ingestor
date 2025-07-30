import { useState, useCallback } from 'react'
import { FileUpload } from './components/FileUpload'
import { ProcessingResult } from './components/ProcessingResult'
import { LoadingSpinner } from './components/LoadingSpinner'
import { formatFileSize, readFileAsText, simulateProcessing } from './utils/fileUtils'
import { processJsonData } from './utils/jsonProcessor'
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

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      setResult({
        type: 'error',
        title: 'Invalid File Type',
        message: 'Please select a JSON file (.json extension).',
        isVisible: true,
      })
      return
    }

    setSelectedFile(file)
    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size),
    })
    setIsProcessButtonEnabled(true)
    setResult({ ...result, isVisible: false })
  }, [result])

  const handleProcessFile = useCallback(async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setIsProcessButtonEnabled(false)
    setResult({ ...result, isVisible: false })

    try {
      const fileContent = await readFileAsText(selectedFile)

      let jsonData: any
      try {
        jsonData = JSON.parse(fileContent)
      } catch (parseError) {
        throw new Error('Invalid JSON format: ' + (parseError as Error).message)
      }

      await simulateProcessing()

      const processedData = processJsonData(jsonData)

      setResult({
        type: 'success',
        title: 'Processing Complete!',
        message: `Successfully processed JSON file with ${Object.keys(jsonData).length} top-level properties.`,
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
      <p className="subtitle">Upload a JSON file and process it instantly</p>

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