import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import './Documents.css'

interface EmployeeDocument {
  id: number
  employeeId: number
  documentName: string
  documentType: string
  fileName: string
  fileSize: number
  uploadedAt: string
  deleted?: boolean
}

type DocumentFilter = 'ALL' | 'PDF' | 'WORD' | 'IMAGE' | 'OTHER'

const API_URL = 'http://localhost:8080/api'

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return '--'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(date: string) {
  if (!date) return '--'

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return date

  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getExtension(fileName: string) {
  return fileName?.split('.').pop()?.toLowerCase() || ''
}

function getCategory(doc: EmployeeDocument): DocumentFilter {
  const extension = getExtension(doc.fileName || doc.documentName)
  const type = doc.documentType?.toLowerCase() || ''

  if (extension === 'pdf' || type.includes('pdf')) return 'PDF'

  if (
    ['doc', 'docx'].includes(extension) ||
    type.includes('word')
  ) return 'WORD'

  if (
    ['jpg', 'jpeg', 'png'].includes(extension) ||
    type.includes('image')
  ) return 'IMAGE'

  return 'OTHER'
}

export default function Documents() {
  const [employeeId, setEmployeeId] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [documents, setDocuments] = useState<EmployeeDocument[]>([])
  const [pendingUndo, setPendingUndo] =
    useState<EmployeeDocument | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [filter, setFilter] = useState<DocumentFilter>('ALL')

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [restoringId, setRestoringId] = useState<number | null>(null)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Authentication headers
  const getHeaders = useCallback(() => {
    const token = sessionStorage.getItem('nexushr_token')
    const tokenType =
      sessionStorage.getItem('nexushr_tokenType') || 'Bearer'

    if (!token) {
      throw new Error('Session expired. Please log in again.')
    }

    return {
      Authorization: `${tokenType} ${token}`,
    }
  }, [])

  // Load all active documents
  const fetchAllDocuments = useCallback(
    async (isRefresh = false) => {
      setLoading(true)

      if (isRefresh) setRefreshing(true)

      setError('')

      try {
        const response = await fetch(
          `${API_URL}/documents/all`,
          {
            headers: getHeaders(),
          }
        )

        if (!response.ok) {
          throw new Error(
            `Unable to load documents. Status: ${response.status}`
          )
        }

        const data: unknown = await response.json()

        if (!Array.isArray(data)) {
          throw new Error('Invalid document response from server.')
        }

        setDocuments(data as EmployeeDocument[])
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
    },
    [getHeaders]
  )

  useEffect(() => {
    void fetchAllDocuments()
  }, [fetchAllDocuments])

  // Upload document
  const uploadDocument = async () => {
    if (!employeeId.trim() || !file) {
      setError('Enter an employee ID and select a document.')
      return
    }

    if (!/^\d+$/.test(employeeId.trim()) || Number(employeeId) < 1) {
      setError('Please enter a valid employee ID.')
      return
    }

    const allowedExtensions = [
      'pdf',
      'doc',
      'docx',
      'jpg',
      'jpeg',
      'png',
    ]

    const extension = getExtension(file.name)

    if (!allowedExtensions.includes(extension)) {
      setError('Only PDF, DOC, DOCX, JPG and PNG files are allowed.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Maximum file size is 5 MB.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(
        `${API_URL}/documents/upload?employeeId=${encodeURIComponent(employeeId.trim())}`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: formData,
        }
      )

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(
          responseText || `Upload failed: ${response.status}`
        )
      }

      setFile(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setMessage('Document uploaded successfully.')

      await fetchAllDocuments()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Document upload failed.'
      )
    } finally {
      setUploading(false)
    }
  }

  // Download document
  const downloadDocument = async (doc: EmployeeDocument) => {
    setDownloadingId(doc.id)
    setError('')
    setMessage('')

    try {
      const response = await fetch(
        `${API_URL}/documents/${doc.id}/download`,
        {
          headers: getHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = window.document.createElement('a')
      link.href = url
      link.download = doc.fileName || doc.documentName || 'document'

      window.document.body.appendChild(link)
      link.click()
      link.remove()

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Download failed.'
      )
    } finally {
      setDownloadingId(null)
    }
  }

  // Delete document
  const deleteDocument = async (doc: EmployeeDocument) => {
    const confirmed = window.confirm(
      `Delete "${doc.documentName}" (Document ID: ${doc.id})?`
    )

    if (!confirmed) return

    setDeletingId(doc.id)
    setError('')
    setMessage('')

    try {
      const response = await fetch(
        `${API_URL}/documents/${doc.id}`,
        {
          method: 'DELETE',
          headers: getHeaders(),
        }
      )

      if (!response.ok) {
        const responseText = await response.text()

        throw new Error(
          responseText || `Delete failed: ${response.status}`
        )
      }

      // Save deleted document for Undo
      setPendingUndo(doc)

      // Remove document from active list
      setDocuments(previous =>
        previous.filter(item => item.id !== doc.id)
      )

      setMessage(`"${doc.documentName}" deleted successfully.`)

    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Delete failed.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  // Restore deleted document
  const undoDelete = async () => {
    if (!pendingUndo || restoringId !== null) return

    const doc = pendingUndo

    setRestoringId(doc.id)
    setError('')
    setMessage('')

    try {
      const response = await fetch(
        `${API_URL}/documents/${doc.id}/restore`,
        {
          method: 'POST',
          headers: getHeaders(),
        }
      )

      if (!response.ok) {
        const responseText = await response.text()

        throw new Error(
          responseText || `Restore failed: ${response.status}`
        )
      }

      // Handle JSON response and 204 No Content
      let restoredDocument = doc

      if (response.status !== 204) {
        const responseText = await response.text()

        if (responseText.trim()) {
          restoredDocument = {
            ...doc,
            ...JSON.parse(responseText),
          }
        }
      }

      // Update visible document list
      setDocuments(previous => [
        { ...restoredDocument, deleted: false },
        ...previous.filter(item => item.id !== doc.id),
      ])

      setPendingUndo(null)

      setMessage(`"${doc.documentName}" restored successfully.`)

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
    setAppliedSearch(searchTerm.trim().toLowerCase())
  }

  // Clear search
  const clearSearch = () => {
    setSearchTerm('')
    setAppliedSearch('')
    setFilter('ALL')
  }

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch =
        !appliedSearch ||
        [
          String(doc.id),
          String(doc.employeeId),
          doc.documentName,
          doc.documentType,
          doc.fileName,
          formatDate(doc.uploadedAt),
        ].some(value =>
          String(value || '').toLowerCase().includes(appliedSearch)
        )

      const matchesFilter =
        filter === 'ALL' || getCategory(doc) === filter

      return matchesSearch && matchesFilter
    })
  }, [documents, appliedSearch, filter])

  const pdfCount = documents.filter(
    doc => getCategory(doc) === 'PDF'
  ).length

  const wordCount = documents.filter(
    doc => getCategory(doc) === 'WORD'
  ).length

  const imageCount = documents.filter(
    doc => getCategory(doc) === 'IMAGE'
  ).length

  const otherCount = documents.filter(
    doc => getCategory(doc) === 'OTHER'
  ).length

  return (
    <div className="documents-page">

      {/* Header */}
      <div className="documents-header">
        <div>
          <p className="documents-eyebrow">
            NEXUSHR / HUMAN RESOURCES
          </p>

          <h2>Document Management</h2>

          <p>
            Securely upload, organize and access employee documents.
          </p>
        </div>

        <div className="documents-header-icon">📁</div>
      </div>

      {/* Permanent Undo Panel */}
      <div className="document-undo-panel">

        <div className="document-undo-message">
          <span className="document-undo-icon">
            {pendingUndo ? '🗑️' : '↶'}
          </span>

          <div>
            <strong>
              {pendingUndo
                ? 'Document deleted'
                : 'Undo Document Deletion'}
            </strong>

            <p>
              {pendingUndo
                ? pendingUndo.documentName
                : 'No recently deleted document available to restore.'}
            </p>

            {pendingUndo && (
              <small>
                Document ID: #{pendingUndo.id}
              </small>
            )}
          </div>
        </div>

        {/* Always-visible Undo Button */}
        <button
          type="button"
          className="document-undo-button"
          onClick={() => void undoDelete()}
          disabled={!pendingUndo || restoringId !== null}
        >
          {restoringId !== null
            ? 'Restoring...'
            : '↶ Undo'}
        </button>

      </div>

      {/* Statistics */}
      <section className="documents-stats">

        <div className="documents-stat-card">
          <div className="documents-stat-icon total-icon">📂</div>
          <div>
            <p>Total Documents</p>
            <h3>{documents.length}</h3>
          </div>
        </div>

        <div className="documents-stat-card">
          <div className="documents-stat-icon pdf-icon">📕</div>
          <div>
            <p>PDF Documents</p>
            <h3>{pdfCount}</h3>
          </div>
        </div>

        <div className="documents-stat-card">
          <div className="documents-stat-icon word-icon">📘</div>
          <div>
            <p>Word Documents</p>
            <h3>{wordCount}</h3>
          </div>
        </div>

        <div className="documents-stat-card">
          <div className="documents-stat-icon other-icon">🖼️</div>
          <div>
            <p>Image / Other</p>
            <h3>{imageCount + otherCount}</h3>
          </div>
        </div>

      </section>

      {/* Upload */}
      <section className="document-upload-card">

        <div className="document-section-heading">
          <div>
            <h3>Upload Employee Document</h3>
            <p>Add a document to an employee's records.</p>
          </div>

          <span className="document-heading-icon">↑</span>
        </div>

        <div className="document-upload-form">

          <div className="document-form-group">
            <label htmlFor="employee-id">Employee ID</label>

            <input
              id="employee-id"
              type="number"
              min="1"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              placeholder="Enter employee ID"
              disabled={uploading}
            />
          </div>

          <div className="document-form-group">
            <label htmlFor="document-file">Select Document</label>

            <input
              ref={fileInputRef}
              id="document-file"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={e =>
                setFile(e.target.files?.[0] || null)
              }
              disabled={uploading}
            />

            <small>
              PDF, DOC, DOCX, JPG and PNG. Maximum size: 5 MB.
            </small>
          </div>

        </div>

        {file && (
          <div className="selected-document">
            <span>📄</span>

            <div>
              <strong>{file.name}</strong>
              <small>{formatFileSize(file.size)}</small>
            </div>

            <button
              type="button"
              className="remove-selected-file"
              onClick={() => {
                setFile(null)

                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
              disabled={uploading}
            >
              ×
            </button>
          </div>
        )}

        <div className="document-upload-actions">
          <button
            type="button"
            className="document-primary-button"
            onClick={() => void uploadDocument()}
            disabled={uploading || loading || !file}
          >
            {uploading ? 'Uploading...' : '↑ Upload Document'}
          </button>
        </div>

        {message && (
          <div className="document-success" role="status">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="document-error" role="alert">
            ! {error}
          </div>
        )}

      </section>

      {/* All Employee Documents */}
      <section className="document-list-card">

        <div className="document-list-header">
          <div>
            <h3>All Employee Documents</h3>
            <p>
              View and manage documents uploaded for all employees.
            </p>
          </div>

          <span className="document-count">
            {filteredDocuments.length} Records
          </span>
        </div>

        {/* Search and filter */}
        <div className="document-list-toolbar">

          <div className="document-search-box">
            <span>⌕</span>

            <input
              type="search"
              placeholder="Search Document ID, Employee ID, name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') searchDocuments()
              }}
            />
          </div>

          <button
            type="button"
            className="document-search-button"
            onClick={searchDocuments}
            disabled={loading}
          >
            🔍 Search
          </button>

          <button
            type="button"
            className="document-clear-button"
            onClick={clearSearch}
            disabled={
              !searchTerm && !appliedSearch && filter === 'ALL'
            }
          >
            Clear
          </button>

          <button
            type="button"
            className="document-refresh-button"
            onClick={() => void fetchAllDocuments(true)}
            disabled={loading}
          >
            {refreshing ? 'Refreshing...' : '↻ Refresh'}
          </button>

        </div>

        {/* Filters */}
        <div className="document-filters">
          {(
            ['ALL', 'PDF', 'WORD', 'IMAGE', 'OTHER'] as DocumentFilter[]
          ).map(item => (
            <button
              type="button"
              key={item}
              className={
                filter === item
                  ? 'document-filter active'
                  : 'document-filter'
              }
              onClick={() => setFilter(item)}
            >
              {item === 'ALL' ? 'All Files' : item}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="document-table-wrapper">

          <table className="document-table">

            <thead>
              <tr>
                <th>DOCUMENT ID</th>
                <th>DOCUMENT NAME</th>
                <th>EMPLOYEE ID</th>
                <th>TYPE</th>
                <th>FILE SIZE</th>
                <th>UPLOADED AT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>

              {loading && documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="document-empty-state">
                    Loading documents...
                  </td>
                </tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="document-empty-state">
                    <div className="document-empty-icon">📁</div>
                    <strong>No documents found</strong>
                    <p>
                      Try another search or refresh the library.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map(doc => (
                  <tr key={doc.id}>

                    <td>
                      <span className="document-id">
                        #{doc.id}
                      </span>
                    </td>

                    <td>
                      <div className="document-name-cell">
                        <span className="document-file-icon">
                          {getCategory(doc) === 'PDF' ? '📕' : '📄'}
                        </span>

                        <div>
                          <strong>{doc.documentName}</strong>
                          <small>{doc.fileName}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="document-employee-id">
                        EMP-{doc.employeeId}
                      </span>
                    </td>

                    <td>
                      <span className="document-type-badge">
                        {doc.documentType ||
                          getExtension(doc.fileName).toUpperCase()}
                      </span>
                    </td>

                    <td>{formatFileSize(doc.fileSize)}</td>

                    <td>{formatDate(doc.uploadedAt)}</td>

                    <td>
                      <div className="document-actions">

                        <button
                          type="button"
                          className="document-download-button"
                          onClick={() => void downloadDocument(doc)}
                          disabled={
                            downloadingId !== null ||
                            deletingId !== null ||
                            restoringId !== null
                          }
                        >
                          {downloadingId === doc.id
                            ? 'Downloading...'
                            : '↓ Download'}
                        </button>

                        <button
                          type="button"
                          className="document-delete-button"
                          onClick={() => void deleteDocument(doc)}
                          disabled={
                            deletingId !== null ||
                            downloadingId !== null ||
                            restoringId !== null
                          }
                        >
                          {deletingId === doc.id
                            ? 'Deleting...'
                            : '🗑 Delete'}
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}

            </tbody>
          </table>

        </div>

        <div className="document-list-footer">
          Showing {filteredDocuments.length} of {documents.length} documents
        </div>

      </section>

    </div>
  )
}



