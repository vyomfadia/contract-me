import { JWTPayload } from './auth'

const TOKEN_KEY = 'auth-token'

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
    
    const maxAge = 7 * 24 * 60 * 60 // 7 days in seconds
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${maxAge}; SameSite=lax`
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY)
  }
  return null
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
  }
}

export function parseTokenPayload(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseTokenPayload(token)
  if (!payload || !payload.exp) {
    return true
  }
  return payload.exp * 1000 < Date.now()
}

export function getCurrentUser(): JWTPayload | null {
  const token = getAuthToken()
  if (!token || isTokenExpired(token)) {
    removeAuthToken()
    return null
  }
  return parseTokenPayload(token)
}

export function logout(): void {
  removeAuthToken()
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

export async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    removeAuthToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  return response
}