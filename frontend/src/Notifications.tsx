import { useCallback, useEffect, useState } from 'react'
import './Notifications.css'

interface Notification {
  id: number
  recipientEmail: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [markingAll, setMarkingAll] = useState(false)

  const token = sessionStorage.getItem('nexushr_token')
  const tokenType =
    sessionStorage.getItem('nexushr_tokenType') || 'Bearer'

  const getHeaders = useCallback(() => ({
    Authorization: `${tokenType} ${token}`,
    'Content-Type': 'application/json',
  }), [token, tokenType])

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!token) {
      setError('Session expired. Please log in again.')
      setLoading(false)
      return
    }

    try {
      setError('')

      const headers = getHeaders()

      const [notificationResponse, countResponse] =
        await Promise.all([
          fetch('/api/notifications', { headers }),
          fetch('/api/notifications/unread-count', { headers }),
        ])

      if (!notificationResponse.ok || !countResponse.ok) {
        throw new Error('Unable to load notifications.')
      }

      const notificationData = await notificationResponse.json()
      const countData = await countResponse.json()

      setNotifications(
        Array.isArray(notificationData) ? notificationData : []
      )

      setUnreadCount(Number(countData.unreadCount) || 0)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.'
      )
    } finally {
      setLoading(false)
    }
  }, [token, getHeaders])

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  // Mark individual notification as read
  const markAsRead = async (id: number) => {
    try {
      setActionLoading(id)

      const response = await fetch(
        `/api/notifications/${id}/read`,
        {
          method: 'PATCH',
          headers: getHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error('Unable to mark notification as read.')
      }

      await loadNotifications()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Action failed.'
      )
    } finally {
      setActionLoading(null)
    }
  }

  // Delete notification
  const deleteNotification = async (id: number) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this notification?'
      )
    ) {
      return
    }

    try {
      setActionLoading(id)

      const response = await fetch(
        `/api/notifications/${id}`,
        {
          method: 'DELETE',
          headers: getHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error('Unable to delete notification.')
      }

      await loadNotifications()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Delete failed.'
      )
    } finally {
      setActionLoading(null)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      setMarkingAll(true)

      const response = await fetch(
        '/api/notifications/read-all',
        {
          method: 'PATCH',
          headers: getHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error(
          'Unable to mark all notifications as read.'
        )
      }

      await loadNotifications()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Action failed.'
      )
    } finally {
      setMarkingAll(false)
    }
  }

  // Dynamic notification categories
  const notificationTypes = Array.from(
    new Set(
      notifications
        .map(notification => notification.type?.toUpperCase())
        .filter((type): type is string => Boolean(type))
    )
  ).sort()

  // Count notifications for each filter
  const getFilterCount = (filter: string) => {
    if (filter === 'ALL') {
      return notifications.length
    }

    if (filter === 'UNREAD') {
      return notifications.filter(n => !n.read).length
    }

    if (filter === 'READ') {
      return notifications.filter(n => n.read).length
    }

    return notifications.filter(
      n => n.type?.toUpperCase() === filter
    ).length
  }

  // Filter notifications by category and search
  const filteredNotifications = notifications.filter(notification => {
    const type = notification.type?.toUpperCase()

    // Category filter
    if (activeFilter === 'UNREAD' && notification.read) {
      return false
    }

    if (activeFilter === 'READ' && !notification.read) {
      return false
    }

    if (
      !['ALL', 'UNREAD', 'READ'].includes(activeFilter) &&
      type !== activeFilter
    ) {
      return false
    }

    // Search filter
    const search = searchTerm.trim().toLowerCase()

    if (!search) {
      return true
    }

    return (
      notification.title?.toLowerCase().includes(search) ||
      notification.message?.toLowerCase().includes(search) ||
      notification.type?.toLowerCase().includes(search)
    )
  })

  // Sort filtered notifications by creation date
  const sortedNotifications = [...filteredNotifications].sort(
    (a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()

      const validA = Number.isNaN(dateA) ? null : dateA
      const validB = Number.isNaN(dateB) ? null : dateB

      // Keep invalid dates at the bottom
      if (validA === null && validB === null) return 0
      if (validA === null) return 1
      if (validB === null) return -1

      return sortOrder === 'NEWEST'
        ? validB - validA
        : validA - validB
    }
  )

  const getTypeLabel = (type: string) => {
    return type.charAt(0) + type.slice(1).toLowerCase()
  }

  // Format notification date
  const formatDate = (date: string) => {
    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date unavailable'
    }

    return parsedDate.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Notification icons
  const getNotificationIcon = (type: string) => {
    const normalizedType = type?.toUpperCase() || ''

    if (normalizedType.includes('LEAVE')) return '📅'
    if (normalizedType.includes('PAYROLL')) return '💰'
    if (normalizedType.includes('ATTENDANCE')) return '⏰'
    if (normalizedType.includes('PERFORMANCE')) return '📈'
    if (normalizedType.includes('DOCUMENT')) return '📄'

    return '🔔'
  }

  // Loading screen
  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notification-loading">
          <div className="notification-spinner" />
          <p>Loading your notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="notifications-page">

      {/* Header */}
      <header className="notifications-header">
        <div>
          <span className="notifications-eyebrow">
            EMPLOYEE PORTAL
          </span>

          <h1>Notifications</h1>

          <p>
            Stay updated with your latest HR activities and announcements.
          </p>
        </div>

        <button
          className="notification-refresh"
          onClick={() => void loadNotifications()}
        >
          ↻ Refresh
        </button>
      </header>

      {/* Error Message */}
      {error && (
        <div className="notification-error" role="alert">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Overview */}
      <section className="notification-overview">

        <div className="notification-overview-card">
          <div className="overview-icon blue">🔔</div>
          <div>
            <span>Total Notifications</span>
            <strong>{notifications.length}</strong>
          </div>
        </div>

        <div className="notification-overview-card">
          <div className="overview-icon orange">📩</div>
          <div>
            <span>Unread Notifications</span>
            <strong>{unreadCount}</strong>
          </div>
        </div>

        <div className="notification-overview-card">
          <div className="overview-icon green">✓</div>
          <div>
            <span>Read Notifications</span>
            <strong>
              {notifications.filter(n => n.read).length}
            </strong>
          </div>
        </div>

      </section>

      {/* Notification Content */}
      <section className="notifications-content">

        <div className="notifications-content-header">
          <div>
            <h2>Recent Activity</h2>
            <p>Manage your personal notifications.</p>
          </div>

          {unreadCount > 0 && (
            <button
              className="mark-all-read"
              onClick={() => void markAllAsRead()}
              disabled={markingAll}
            >
              {markingAll
                ? 'Updating...'
                : '✓ Mark All as Read'}
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="notification-filters">

          {['ALL', 'UNREAD', 'READ', ...notificationTypes].map(
            filter => (
              <button
                key={filter}
                className={`notification-filter ${
                  activeFilter === filter ? 'active' : ''
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter === 'ALL'
                  ? 'All'
                  : filter === 'UNREAD'
                    ? 'Unread'
                    : filter === 'READ'
                      ? 'Read'
                      : getTypeLabel(filter)}

                <span>{getFilterCount(filter)}</span>
              </button>
            )
          )}

        </div>

        {/* Search Bar */}
        <div className="notification-search">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search notifications by title, message or type..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Notification Sorting */}
        <div className="notification-sort">
          <label htmlFor="notification-sort-select">
            Sort by:
          </label>

          <select
            id="notification-sort-select"
            value={sortOrder}
            onChange={e =>
              setSortOrder(e.target.value as 'NEWEST' | 'OLDEST')
            }
          >
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
          </select>
        </div>

        {/* Notification List */}
        <div className="notification-list">

          {sortedNotifications.length === 0 ? (
            <div className="notification-empty">

              <div className="empty-icon">🔔</div>

              <h3>No notifications found</h3>

              <p>
                {searchTerm.trim()
                  ? `No notifications match "${searchTerm}". Try another search.`
                  : activeFilter === 'UNREAD'
                    ? 'You are all caught up! No unread notifications.'
                    : activeFilter === 'READ'
                      ? 'No read notifications available.'
                      : activeFilter === 'ALL'
                        ? 'Your notifications will appear here.'
                        : `No ${getTypeLabel(activeFilter)} notifications available.`}
              </p>

            </div>
          ) : (
            sortedNotifications.map(notification => (
              <article
                key={notification.id}
                className={`notification-card ${
                  notification.read ? 'read' : 'unread'
                }`}
              >

                <div className="notification-card-icon">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="notification-card-content">

                  <div className="notification-title-row">
                    <h3>{notification.title}</h3>

                    {!notification.read && (
                      <span className="unread-indicator">
                        New
                      </span>
                    )}
                  </div>

                  <p className="notification-message">
                    {notification.message}
                  </p>

                  <div className="notification-meta">

                    <span className="notification-type">
                      {notification.type}
                    </span>

                    <span>•</span>

                    <span>
                      {formatDate(notification.createdAt)}
                    </span>

                  </div>

                  <div className="notification-actions">

                    {!notification.read && (
                      <button
                        className="notification-read-btn"
                        onClick={() =>
                          void markAsRead(notification.id)
                        }
                        disabled={actionLoading === notification.id}
                      >
                        {actionLoading === notification.id
                          ? 'Updating...'
                          : '✓ Mark as Read'}
                      </button>
                    )}

                    <button
                      className="notification-delete-btn"
                      onClick={() =>
                        void deleteNotification(notification.id)
                      }
                      disabled={actionLoading === notification.id}
                    >
                      {actionLoading === notification.id
                        ? 'Processing...'
                        : '🗑 Delete'}
                    </button>

                  </div>

                </div>

              </article>
            ))
          )}

        </div>

        {/* Footer */}
        <div className="notifications-footer">
          Showing {sortedNotifications.length} of {notifications.length} notifications
        </div>

      </section>

    </main>
  )
}
