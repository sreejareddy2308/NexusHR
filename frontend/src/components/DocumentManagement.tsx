
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'

const API_URL = '/api/documents'

interface EmployeeDocument {
  id: number
  employeeId: number
  documentName: string
  documentType: string
  fileSize: number
  uploadedAt: string
}

export default function DocumentManagement() {
  const [employeeId, setEmployeeId] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<EmployeeDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const getToken = () =>
    sessionStorage.getItem('nexushr_token')

  // Fetch all employee documents
  const fetchDocuments = useCallback(async () => {
    const token = getToken()

    if (!token) {
      setError('Session expired. Please log in again.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(
          `Unable to load documents (${response.status}).`
        )
      }

      const data: EmployeeDocument[] = await response.json()

      setDocuments(data)

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load documents.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  // Load documents when page opens
  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Upload employee document
  const handleUpload = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setMessage('')
    setError('')

    const token = getToken()

    if (!token) {
      setError('Session expired. Please log in again.')
      return
    }

    if (!employeeId || Number(employeeId) <= 0) {
      setError('Enter a valid employee ID.')
      return
    }

    if (!file) {
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

    if (!allowedTypes.includes(file.type)) {
      setError(
        'Only PDF, DOC, DOCX, JPG and PNG files are allowed.'
      )
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Maximum file size is 5 MB.')
      return
    }

    const formData = new FormData()

    formData.append('employeeId', employeeId)
    formData.append('file', file)

    setUploading(true)

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const responseText = await response.text()

        throw new Error(
          responseText || `Upload failed (${response.status}).`
        )
      }

      const result = await response.json()

      setMessage(
        `Document "${result.documentName}" uploaded successfully!`
      )

      setFile(null)
      setEmployeeId('')

      const input = document.getElementById(
        'document-file'
      ) as HTMLInputElement | null

      if (input) {
        input.value = ''
      }

      // Refresh document list after upload
      await fetchDocuments()

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Document upload failed.'
      )
    } finally {
      setUploading(false)
    }
  }

  // Download employee document
  const handleDownload = async (id: number) => {
    const token = getToken()

    if (!token) {
      setError('Session expired. Please log in again.')
      return
    }

    try {
      setError('')
      setMessage('')

      const response = await fetch(
        `${API_URL}/${id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          `Download failed (${response.status}).`
        )
      }

      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')

      link.href = url

      const doc = documents.find(
        item => item.id === id
      )

      link.download =
        doc?.documentName || `document-${id}`

      document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(url)

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to download document.'
      )
    }
  }

  // Delete employee document
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this document? This action cannot be undone.'
    )

    if (!confirmed) return

    const token = getToken()

    if (!token) {
      setError('Session expired. Please log in again.')
      return
    }

    setDeletingId(id)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const responseText = await response.text()

        throw new Error(
          responseText || `Delete failed (${response.status}).`
        )
      }

      // Remove deleted document from the current UI
      setDocuments(previous =>
        previous.filter(doc => doc.id !== id)
      )

      setMessage('Document deleted successfully!')

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete document.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '30px auto',
        padding: '25px',
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 18px rgba(0,0,0,0.08)',
      }}
    >

      <h1>Document Management</h1>

      <p>
        Upload and manage employee documents securely.
      </p>

      {/* Success Message */}

      {message && (
        <p
          style={{
            color: '#15803d',
            background: '#dcfce7',
            padding: '12px',
            borderRadius: '6px',
          }}
          role="status"
        >
          {message}
        </p>
      )}

      {/* Error Message */}

      {error && (
        <p
          style={{
            color: '#dc2626',
            background: '#fee2e2',
            padding: '12px',
            borderRadius: '6px',
          }}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Upload Section */}

      <h2>Upload Employee Document</h2>

      <form onSubmit={handleUpload}>

        <div style={{ marginBottom: '20px' }}>

          <label htmlFor="employee-id">
            Employee ID
          </label>

          <input
            id="employee-id"
            type="number"
            min="1"
            value={employeeId}
            onChange={e => setEmployeeId(e.target.value)}
            placeholder="Enter employee ID"
            required
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              marginTop: '8px',
              boxSizing: 'border-box',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
            }}
          />

        </div>

        <div style={{ marginBottom: '20px' }}>

          <label htmlFor="document-file">
            Select Document
          </label>

          <input
            id="document-file"
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={e =>
              setFile(e.target.files?.[0] || null)
            }
            required
            style={{
              display: 'block',
              width: '100%',
              marginTop: '10px',
            }}
          />

          <small style={{ color: '#64748b' }}>
            PDF, DOC, DOCX, JPG, PNG.
            Maximum size: 5 MB.
          </small>

        </div>

        {file && (
          <p>
            Selected: {file.name} (
            {(file.size / 1024).toFixed(1)} KB)
          </p>
        )}

        <button
          type="submit"
          disabled={uploading}
          style={{
            padding: '12px 24px',
            background: uploading ? '#94a3b8' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
          }}
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>

      </form>

      {/* Main Divider */}

      <hr
        style={{
          margin: '35px 0',
          border: 'none',
          borderTop: '1px solid #cbd5e1',
        }}
      />

      {/* Uploaded Documents Section */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >

        <h2>Uploaded Employee Documents</h2>

        <button
          type="button"
          onClick={fetchDocuments}
          disabled={loading}
          style={{
            padding: '10px 18px',
            background: '#0f766e',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>

      </div>

      {/* Loading */}

      {loading ? (

        <p>Loading documents...</p>

      ) : documents.length === 0 ? (

        <p style={{ color: '#64748b' }}>
          No employee documents found.
        </p>

      ) : (

        <div
          style={{
            overflowX: 'auto',
            marginTop: '15px',
          }}
        >

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '850px',
            }}
          >

            <thead>

              <tr
                style={{
                  background: '#f1f5f9',
                  borderBottom: '2px solid #cbd5e1',
                }}
              >

                {[
                  'ID',
                  'Employee ID',
                  'Document Name',
                  'Type',
                  'Uploaded At',
                  'Action',
                ].map(header => (

                  <th
                    key={header}
                    style={{
                      padding: '14px 12px',
                      textAlign: 'left',
                      color: '#334155',
                      fontSize: '14px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {header}
                  </th>

                ))}

              </tr>

            </thead>

            <tbody>

              {documents.map(doc => (

                <tr
                  key={doc.id}
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >

                  <td style={{
                    padding: '14px 12px',
                    borderBottom: '1px solid #e2e8f0',
                  }}>
                    {doc.id}
                  </td>

                  <td style={{
                    padding: '14px 12px',
                    borderBottom: '1px solid #e2e8f0',
                  }}>
                    {doc.employeeId}
                  </td>

                  <td style={{
                    padding: '14px 12px',
                    borderBottom: '1px solid #e2e8f0',
                    fontWeight: '500',
                  }}>
                    {doc.documentName}
                  </td>

                  <td style={{
                    padding: '14px 12px',
                    borderBottom: '1px solid #e2e8f0',
                  }}>
                    {doc.documentType}
                  </td>

                  <td style={{
                    padding: '14px 12px',
                    borderBottom: '1px solid #e2e8f0',
                    whiteSpace: 'nowrap',
                  }}>
                    {doc.uploadedAt
                      ? new Date(doc.uploadedAt).toLocaleString()
                      : '-'}
                  </td>

                  {/* Download and Delete Actions */}

                  <td style={{
                    padding: '14px 12px',
                    borderBottom: '1px solid #e2e8f0',
                  }}>

                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                      }}
                    >

                      <button
                        type="button"
                        onClick={() => handleDownload(doc.id)}
                        style={{
                          padding: '9px 16px',
                          background: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                        }}
                      >
                        Download
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        style={{
                          padding: '9px 16px',
                          background:
                            deletingId === doc.id
                              ? '#fca5a5'
                              : '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor:
                            deletingId === doc.id
                              ? 'not-allowed'
                              : 'pointer',
                          fontWeight: '500',
                        }}
                      >
                        {deletingId === doc.id
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </div>
  )
}

