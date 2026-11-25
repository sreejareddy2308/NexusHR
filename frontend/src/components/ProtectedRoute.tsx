import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  allowedRoles: string[]
  children: ReactNode
}

export default function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {

  const location = useLocation()

  const token = sessionStorage.getItem('nexushr_token')
  const storedRoles = sessionStorage.getItem('nexushr_roles')

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  let roles: string[] = []

  try {
    const parsedRoles = storedRoles
      ? JSON.parse(storedRoles)
      : []

    if (!Array.isArray(parsedRoles)) {
      return <Navigate to="/login" replace />
    }

    roles = parsedRoles.map((role: unknown) =>
      String(role)
        .trim()
        .toUpperCase()
        .replace(/^ROLE_/, '')
    )

  } catch {
    return <Navigate to="/login" replace />
  }

  const normalizedAllowedRoles = allowedRoles.map(role =>
    role.trim().toUpperCase().replace(/^ROLE_/, '')
  )

  const hasAccess = roles.some(role =>
    normalizedAllowedRoles.includes(role)
  )

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

