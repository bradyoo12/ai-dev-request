import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_TIMEOUT = 5000

export interface TesterApplication {
  id: string
  userId: string
  name: string
  email: string
  motivation: string
  experienceLevel: string
  interestedAreas: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export interface TesterProfile {
  id: string
  userId: string
  tier: string
  contributionPoints: number
  totalCreditsEarned: number
  bugsFound: number
  reviewsWritten: number
  testsCompleted: number
  joinedAt: string
}

export interface TesterContribution {
  id: string
  type: string
  description: string
  pointsAwarded: number
  creditsAwarded: number
  createdAt: string
}

export interface LeaderboardEntry {
  rank: number
  id: string
  userId: string
  tier: string
  contributionPoints: number
  totalCreditsEarned: number
  bugsFound: number
  reviewsWritten: number
  testsCompleted: number
  joinedAt: string
}

export interface TesterDashboard {
  profile: TesterProfile
  rank: number
  recentContributions: TesterContribution[]
  leaderboard: LeaderboardEntry[]
}

function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = API_TIMEOUT): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId))
}

export async function submitApplication(data: {
  name: string
  email: string
  motivation: string
  experienceLevel: string
  interestedAreas?: string
}): Promise<TesterApplication> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/testers/apply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to submit application')
    }
    return res.json()
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  }
}

export async function getMyApplication(): Promise<TesterApplication | null> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/testers/application`, {
      headers: getAuthHeaders(),
    })
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Failed to get application')
    return res.json()
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  }
}

export async function getAllApplications(): Promise<TesterApplication[]> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/testers/applications`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to get applications')
    return res.json()
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  }
}

export async function approveApplication(id: string): Promise<{ id: string; status: string }> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/testers/applications/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to approve application')
    return res.json()
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  }
}

export async function rejectApplication(id: string): Promise<{ id: string; status: string }> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/testers/applications/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to reject application')
    return res.json()
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  }
}

export async function getProfile(): Promise<TesterProfile | null> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/testers/profile`, {
      headers: getAuthHeaders(),
    })
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Failed to get profile')
    return res.json()
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  }
}

export async function getDashboard(): Promise<TesterDashboard> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/testers/dashboard`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to get dashboard')
    return res.json()
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  }
}

export async function addContribution(data: {
  type: string
  description: string
}): Promise<TesterContribution> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/testers/contributions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to add contribution')
    return res.json()
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  }
}

export async function getLeaderboard(top = 10): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/testers/leaderboard?top=${top}`)
    if (!res.ok) throw new Error('Failed to get leaderboard')
    return res.json()
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  }
}
