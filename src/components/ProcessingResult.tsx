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
      {data && (
        <div className="json-preview">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}