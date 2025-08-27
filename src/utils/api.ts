import { getAuthHeaders } from '../lib/supabase'
import type { CreateUserData, UpdateUserData, User, PasswordValidationResult } from '../types/auth'

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function handleResponse(response: Response) {
  const data = await response.json()
  
  if (!response.ok) {
    throw new ApiError(response.status, data.error || 'Request failed')
  }
  
  return data
}

// Admin Users API
export const adminUsersApi = {
  async getUsers(): Promise<{ users: User[] }> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/admin-users`, {
      method: 'GET',
      headers
    })
    return handleResponse(response)
  },

  async createUser(userData: CreateUserData): Promise<{ user: User }> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/admin-users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(userData)
    })
    return handleResponse(response)
  },

  async updateUser(userId: string, userData: UpdateUserData): Promise<{ user: User }> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/admin-users/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(userData)
    })
    return handleResponse(response)
  },

  async deleteUser(userId: string): Promise<{ message: string }> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/admin-users/${userId}`, {
      method: 'DELETE',
      headers
    })
    return handleResponse(response)
  }
}

// Password Validation API
export const passwordValidationApi = {
  async validatePassword(password: string): Promise<PasswordValidationResult> {
    const response = await fetch(`${API_BASE_URL}/validate-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new ApiError(response.status, errorData.message || 'Server-side validation failed')
    }

    return handleResponse(response) as Promise<PasswordValidationResult>
  }
}
// Auth API
export const authApi = {
  async updatePassword(newPassword: string, clearNeedsPasswordReset: boolean = false): Promise<{ message: string; user: any }> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/update-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        newPassword, 
        clearNeedsPasswordReset 
      })
    })
    return handleResponse(response)
  }
}