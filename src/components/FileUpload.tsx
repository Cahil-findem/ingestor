import React, { useCallback } from 'react'
import { FileInfo } from '../types'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  fileInfo: FileInfo | null
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  fileInfo,
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

  return (
    <div>
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