import { useCallback, useEffect, useRef, useState } from 'react'
import './EmployeeDocuments.css'

interface EmployeeDocument {
  id: number
  employeeId: number
  documentName: string
  documentType: string
  fileSize: number | string
  uploadedAt: string
}

const API_URL = '/api/documents'

export default function EmployeeDocuments() {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [restoringId, setRestoringId] = useState<number | null>(null)

  const [deletedDocument, setDeletedDocument] =
    useState<EmployeeDocument | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const token = sessionStorage.getItem('nexushr_token')

  // Fetch documents
  const fetchDocuments = useCallback(async (isRefresh = false) => {
    if (!token) {
      setError('Your session has expired. Please log in again.')
      setLoading(false)
      return
    }

    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const response = await fetch(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(
          `Unable to load documents. Status: ${response.status}`
        )
      }

      const data = await response.json()
      setDocuments(Array.isArray(data) ? data : [])

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load documents.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    void fetchDocuments()
  }, [fetchDocuments])

  // Upload document
  const uploadDocument = async () => {
    if (!token) {
      setError('Please log in again.')
      return
    }

    if (!selectedFile) {
      setError('Please select a document.')
      return
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ]

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Only PDF, DOC, DOCX, JPG and PNG files are allowed.')
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Maximum file size is 5 MB.')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    setUploading(true)
    setError('')
    setSuccess('')
    setDeletedDocument(null)

    try {
      const response = await fetch(`${API_URL}/me/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(
          await response.text() ||
          `Upload failed. Status: ${response.status}`
        )
      }

      setSelectedFile(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setSuccess('Document uploaded successfully.')
      setAppliedSearch('')
      setSearchQuery('')

      await fetchDocuments(true)

    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Upload failed.'
      )
    } finally {
      setUploading(false)
    }
  }

  // Download document
  const downloadDocument = async (document: EmployeeDocument) => {
    if (!token) {
      setError('Please log in again.')
      return
    }

    setDownloadingId(document.id)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `${API_URL}/${document.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          `Download failed. Status: ${response.status}`
        )
      }

      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)

      const link = window.document.createElement('a')
      link.href = objectUrl
      link.download = document.documentName

      window.document.body.appendChild(link)
      link.click()
      link.remove()

      window.setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl)
      }, 1000)

    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Download failed.'
      )
    } finally {
      setDownloadingId(null)
    }
  }

  // Delete document (Soft delete)
  const deleteDocument = async (document: EmployeeDocument) => {
    if (!token) {
      setError('Please log in again.')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${document.documentName}"?`
    )

    if (!confirmed) return

    setDeletingId(document.id)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `${API_URL}/${document.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const message = await response.text()

        throw new Error(
          message || `Delete failed. Status: ${response.status}`
        )
      }

      // Remove document from visible list
      setDocuments(previous =>
        previous.filter(item => item.id !== document.id)
      )

      // Keep document details for Undo
      setDeletedDocument(document)

      setSuccess('Document deleted successfully.')

    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Delete failed.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  // Undo document deletion
  const undoDelete = async () => {
    if (!token || !deletedDocument) {
      setError('Unable to restore document. Please log in again.')
      return
    }

    const document = deletedDocument

    setRestoringId(document.id)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `${API_URL}/${document.id}/restore`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const message = await response.text()

        throw new Error(
          message || `Restore failed. Status: ${response.status}`
        )
      }

      const restoredDocument: EmployeeDocument =
        await response.json()

      // Immediately add restored document to the list
      setDocuments(previous => [
        restoredDocument,
        ...previous.filter(
          item => item.id !== restoredDocument.id
        ),
      ])

      setDeletedDocument(null)

      setSuccess('Document restored successfully.')

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to restore document.'
      )
    } finally {
      setRestoringId(null)
    }
  }

  // Search documents
  const searchDocuments = () => {
    setAppliedSearch(searchQuery.trim())
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery('')
    setAppliedSearch('')
  }

  // Format file size
  const formatFileSize = (size: number | string) => {
    const parsed = Number(size)

    if (!Number.isFinite(parsed) || parsed < 0) {
      return 'N/A'
    }

    if (parsed < 1024) {
      return `${parsed} B`
    }

    if (parsed < 1024 * 1024) {
      return `${(parsed / 1024).toFixed(1)} KB`
    }

    return `${(parsed / (1024 * 1024)).toFixed(2)} MB`
  }

  // Format date
  const formatDate = (date: string) => {
    if (!date) return 'N/A'

    const parsed = new Date(date)

    if (Number.isNaN(parsed.getTime())) {
      return date
    }

    return parsed.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // File icon
  const getFileIcon = (type: string) => {
    const fileType = type?.toLowerCase() || ''

    if (fileType.includes('pdf')) return 'PDF'
    if (fileType.includes('image')) return 'IMG'
    if (fileType.includes('word')) return 'DOC'
    if (fileType.includes('sheet')) return 'XLS'

    return 'FILE'
  }

  // Filter documents using applied search
  const filteredDocuments = documents.filter(document => {
    if (!appliedSearch) return true

    const query = appliedSearch.toLowerCase()

    return (
      String(document.id).includes(query) ||
      document.documentName?.toLowerCase().includes(query) ||
      document.documentType?.toLowerCase().includes(query) ||
      document.uploadedAt?.toLowerCase().includes(query) ||
      formatDate(document.uploadedAt).toLowerCase().includes(query)
    )
  })

  return (
    <div className="employee-documents">

      {/* Header */}
      <div className="documents-header">
        <div>
          <span className="documents-eyebrow">
            EMPLOYEE PORTAL
          </span>

          <h1>My Documents</h1>

          <p>
            View, upload, download and delete your personal documents.
          </p>
        </div>

        <button
          type="button"
          className="documents-refresh-btn"
          onClick={() => void fetchDocuments(true)}
          disabled={refreshing || loading}
        >
          {refreshing ? 'Refreshing...' : '⟳ Refresh'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="documents-alert" role="alert">
          ! {error}
        </div>
      )}

      {/* Success and Undo notification */}
      {success && (
        <div className="documents-success" role="status">
          <span>{success}</span>

          {deletedDocument && (
            <button
              type="button"
              className="document-undo-btn"
              onClick={() => void undoDelete()}
              disabled={restoringId !== null}
            >
              {restoringId === deletedDocument.id
                ? 'Restoring...'
                : '↶ Undo'}
            </button>
          )}
        </div>
      )}

      {/* Upload Section */}
      <div className="documents-upload-panel">

        <h2>Upload a Document</h2>

        <p>
          Accepted formats: PDF, DOC, DOCX, JPG and PNG.
          Maximum file size: 5 MB.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={event => {
            setSelectedFile(event.target.files?.[0] || null)
            setError('')
            setSuccess('')
          }}
          disabled={uploading}
        />

        {selectedFile && (
          <p className="documents-selected-file">
            Selected: {selectedFile.name}
          </p>
        )}

        <button
          type="button"
          onClick={() => void uploadDocument()}
          disabled={!selectedFile || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>

      </div>

      {/* Summary */}
      <div className="documents-summary">

        <div className="documents-summary-card">
          <div className="documents-summary-icon blue">
            ▤
          </div>

          <div>
            <p>Total Documents</p>
            <h2>{documents.length}</h2>
            <small>Documents in your account</small>
          </div>
        </div>

        <div className="documents-summary-card">
          <div className="documents-summary-icon green">
            ✓
          </div>

          <div>
            <p>Available Documents</p>
            <h2>{documents.length}</h2>
            <small>Ready to download</small>
          </div>
        </div>

      </div>

      {/* Document Library */}
      <section className="documents-panel">

        <div className="documents-panel-header">
          <div>
            <h2>My Document Library</h2>
            <p>Manage and access your uploaded files.</p>
          </div>

          <span className="documents-count">
            {documents.length} Files
          </span>
        </div>

        {/* Search */}
        <div className="documents-search">

          <input
            type="search"
            placeholder="Search by Document ID, name, type or date..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                searchDocuments()
              }
            }}
            aria-label="Search documents"
          />

          <button
            type="button"
            className="documents-search-btn"
            onClick={searchDocuments}
            disabled={loading}
          >
            🔍 Search
          </button>

          <button
            type="button"
            className="documents-clear-btn"
            onClick={clearSearch}
            disabled={!searchQuery && !appliedSearch}
          >
            Clear
          </button>

        </div>

        {/* Loading */}
        {loading ? (

          <div className="documents-state">
            <div className="documents-loader" />
            <p>Loading your documents...</p>
          </div>

        ) : documents.length === 0 ? (

          /* Empty Library */
          <div className="documents-state">
            <div className="documents-empty-icon">▤</div>
            <h3>No Documents Found</h3>
            <p>Your uploaded documents will appear here.</p>
          </div>

        ) : filteredDocuments.length === 0 ? (

          /* No Search Results */
          <div className="documents-state">
            <div className="documents-empty-icon">⌕</div>
            <h3>No Matching Documents</h3>
            <p>
              No documents match "{appliedSearch}".
              Try another search.
            </p>
          </div>

        ) : (

          <>
            <div className="documents-table-wrapper">

              <table className="documents-table">

                <thead>
                  <tr>
                    <th>DOCUMENT ID</th>
                    <th>DOCUMENT NAME</th>
                    <th>TYPE</th>
                    <th>FILE SIZE</th>
                    <th>UPLOADED AT</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDocuments.map(document => (

                    <tr key={document.id}>

                      {/* Document ID */}
                      <td>
                        <span className="document-id">
                          #{document.id}
                        </span>
                      </td>

                      {/* Document Name */}
                      <td>
                        <div className="document-name-cell">
                          <div className="document-file-icon">
                            {getFileIcon(document.documentType)}
                          </div>

                          <span>{document.documentName}</span>
                        </div>
                      </td>

                      {/* Type */}
                      <td>
                        <span className="document-type">
                          {document.documentType || 'Unknown'}
                        </span>
                      </td>

                      {/* Size */}
                      <td>
                        {formatFileSize(document.fileSize)}
                      </td>

                      {/* Date */}
                      <td>
                        {formatDate(document.uploadedAt)}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="document-actions">

                          <button
                            type="button"
                            className="document-download-btn"
                            onClick={() => void downloadDocument(document)}
                            disabled={
                              downloadingId !== null ||
                              deletingId !== null ||
                              restoringId !== null
                            }
                          >
                            {downloadingId === document.id
                              ? 'Downloading...'
                              : '↓ Download'}
                          </button>

                          <button
                            type="button"
                            className="document-delete-btn"
                            onClick={() => void deleteDocument(document)}
                            disabled={
                              deletingId !== null ||
                              downloadingId !== null ||
                              restoringId !== null
                            }
                          >
                            {deletingId === document.id
                              ? 'Deleting...'
                              : '🗑 Delete'}
                          </button>

                        </div>
                      </td>

                    </tr>

                  ))}
                </tbody>

              </table>

            </div>

            <div className="documents-footer">
              Showing {filteredDocuments.length} of {documents.length} documents
            </div>
          </>

        )}

      </section>

      {/* Branding */}
      <div className="documents-bottom-text">
        NexusHR · PEOPLE. POTENTIAL. PROGRESS.
      </div>

    </div>
  )
}



