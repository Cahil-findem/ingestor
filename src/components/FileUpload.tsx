import React, { useCallback } from 'react'
import { FileInfo } from '../types'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  fileInfo: FileInfo | null
  label: string
  onLabelChange: (label: string) => void
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  fileInfo,
  label,
  onLabelChange,
}) => {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('dragover')
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('dragover')
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.currentTarget.classList.remove('dragover')

      const files = e.dataTransfer.files
      if (files.length > 0) {
        onFileSelect(files[0])
      }
    },
    [onFileSelect]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  const handleClick = useCallback(() => {
    document.getElementById('fileInput')?.click()
  }, [])

  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onLabelChange(e.target.value)
  }, [onLabelChange])

  return (
    <div>
      <div className="label-section">
        <label htmlFor="profileLabel" className="label-text">
          Profile Label (Optional)
        </label>
        <input
          type="text"
          id="profileLabel"
          className="label-input"
          placeholder="e.g., Tech Candidates Q1 2024, Marketing Team, etc."
          value={label}
          onChange={handleLabelChange}
          maxLength={100}
        />
        <div className="label-hint">
          Add a descriptive label to organize your profile batches
        </div>
      </div>

      <div
        className="upload-area"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-icon">📁</div>
        <div className="upload-text">Drop your JSON file here</div>
        <div className="upload-subtext">or click to browse</div>
      </div>

      <input
        type="file"
        id="fileInput"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {fileInfo && (
        <div className="file-info">
          <div className="file-name">{fileInfo.name}</div>
          <div className="file-size">{fileInfo.size}</div>
        </div>
      )}
    </div>
  )
}