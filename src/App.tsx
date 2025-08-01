import { useState, useCallback } from 'react'
import { useEffect } from 'react'
import { FileUpload } from './components/FileUpload'
import { ProcessingResult } from './components/ProcessingResult'
import { LoadingSpinner } from './components/LoadingSpinner'
import { formatFileSize, simulateProcessing } from './utils/fileUtils'
import { processJsonData } from './utils/jsonProcessor'
import { validateJsonFile } from './utils/jsonValidator'
import { uploadProfilesToDatabase, testEdgeFunction, triggerQueueProcessor } from './services/supabaseService'
import { FileInfo, ProcessedData, ResultType } from './types'
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isProcessButtonEnabled, setIsProcessButtonEnabled] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [showVectorizationButton, setShowVectorizationButton] = useState(false)
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

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.settings-menu')) {
        setShowSettingsMenu(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

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
    setShowVectorizationButton(false)
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

      // Process the JSON data locally
      const processedData = processJsonData(jsonData)

      // Upload to database via edge function
      const databaseResult = await uploadProfilesToDatabase(jsonData)
      processedData.databaseResult = databaseResult

      // Determine result type based on database operation
      let resultType: ResultType = 'success'
      let title = 'Processing Complete!'
      let message = `Successfully processed ${jsonData.length} profile${jsonData.length === 1 ? '' : 's'}.`

      if (!databaseResult.success) {
        resultType = 'error'
        title = 'Database Upload Failed'
        message = `Processed ${jsonData.length} profile${jsonData.length === 1 ? '' : 's'} locally, but failed to upload to database: ${databaseResult.message}`
      } else if (databaseResult.data?.errors && databaseResult.data.errors.length > 0) {
        resultType = 'warning'
        title = 'Partial Upload Success'
        message = `Processed ${jsonData.length} profile${jsonData.length === 1 ? '' : 's'}. ${databaseResult.data.insertedCount} uploaded successfully, ${databaseResult.data.errors.length} failed.`
      } else {
        message += ` All profiles uploaded to database successfully.`
      }

      setResult({
        type: resultType,
        title,
        message,
        data: processedData,
        isVisible: true,
      })

      // Show vectorization button after 3 seconds if successful
      if (resultType === 'success') {
        setTimeout(() => {
          setShowVectorizationButton(true)
        }, 3000)
      }
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

  const handleTestEdgeFunction = useCallback(async () => {
    setShowSettingsMenu(false)
    setIsProcessing(true)
    const testResult = await testEdgeFunction()
    setResult({
      type: testResult.success ? 'success' : 'error',
      title: testResult.success ? 'Edge Function Test Passed' : 'Edge Function Test Failed',
      message: testResult.message,
      data: testResult.details ? { summary: JSON.stringify(testResult.details, null, 2) } as any : undefined,
      isVisible: true,
    })
    setIsProcessing(false)
  }, [])

  const handleTriggerQueueProcessor = useCallback(async () => {
    setShowSettingsMenu(false)
    setIsProcessing(true)
    const queueResult = await triggerQueueProcessor()
    setResult({
      type: queueResult.success ? 'success' : 'error',
      title: queueResult.success ? 'Queue Processor Triggered' : 'Queue Processor Failed',
      message: queueResult.message,
      data: queueResult.details ? { summary: JSON.stringify(queueResult.details, null, 2) } as any : undefined,
      isVisible: true,
    })
    setIsProcessing(false)
  }, [])

  const toggleSettingsMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowSettingsMenu(!showSettingsMenu)
  }, [showSettingsMenu])

  return (
    <div className="container">
      <div className="header">
        <div className="header-content">
          <h1>Profile JSON Processor</h1>
          <p className="subtitle">Upload a JSON array with up to 10 profile objects to the database</p>
        </div>
        <div className="header-actions">
          <div className="settings-menu">
            <button 
              className="settings-button"
              onClick={toggleSettingsMenu}
              disabled={isProcessing}
            >
              ⚙️
            </button>
            {showSettingsMenu && (
              <div className="settings-dropdown">
                <button onClick={handleTestEdgeFunction} disabled={isProcessing}>
                  🔧 Test Edge Function
                </button>
                <button onClick={handleTriggerQueueProcessor} disabled={isProcessing}>
                  🚀 Force Vectorization
                </button>
              </div>
            )}
          </div>
          <a 
            href="https://smb-search.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="search-link"
          >
            Go to Search →
          </a>
        </div>
      </div>

      <FileUpload
        onFileSelect={handleFileSelect}
        fileInfo={fileInfo}
      />

      <button
        className="main-cta"
        onClick={handleProcessFile}
        disabled={!isProcessButtonEnabled}
      >
        Ingest Profiles
      </button>

      {showVectorizationButton && (
        <button
          className={`vectorization-cta ${showVectorizationButton ? 'show' : ''}`}
          onClick={handleTriggerQueueProcessor}
          disabled={isProcessing}
        >
          🚀 Start Vectorization
        </button>
      )}

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