import React from 'react'

interface LoadingSpinnerProps {
  isVisible: boolean
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ isVisible }) => {
  if (!isVisible) return null

  return (
    <div className="loading">
      <div className="spinner"></div>
      <div>Processing your JSON file...</div>
    </div>
  )
}