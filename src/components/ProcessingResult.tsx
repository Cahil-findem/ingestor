import React from 'react'
import { ResultType, ProcessedData } from '../types'

interface ProcessingResultProps {
  type: ResultType
  title: string
  message: string
  data?: ProcessedData | null
  isVisible: boolean
}

export const ProcessingResult: React.FC<ProcessingResultProps> = ({
  type,
  title,
  message,
  data,
  isVisible,
}) => {
  if (!isVisible) return null

  return (
    <div className={`result ${type}`}>
      <h3>{title}</h3>
      <div>{message}</div>
      
      {/* Database Upload Status */}
      {data?.databaseResult && (
        <div className="database-status">
          <h4>Database Upload Status:</h4>
          <p className={data.databaseResult.success ? 'success' : 'error'}>
            {data.databaseResult.message}
          </p>
          {data.databaseResult.data?.errors && data.databaseResult.data.errors.length > 0 && (
            <details className="upload-errors">
              <summary>Upload Errors ({data.databaseResult.data.errors.length})</summary>
              <ul>
                {data.databaseResult.data.errors.map((error, index) => (
                  <li key={index}>
                    <strong>Profile {index + 1}:</strong> {error.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
      
      {/* Processing Details */}
      {data && (
        <details className="processing-details">
          <summary>Processing Details</summary>
          <div className="json-preview">
            <pre>{JSON.stringify({
              originalKeys: data.originalKeys,
              totalProperties: data.totalProperties,
              dataTypes: data.dataTypes,
              processedAt: data.processedAt,
              summary: data.summary
            }, null, 2)}</pre>
          </div>
        </details>
      )}
    </div>
  )
}