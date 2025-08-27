import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { authApi } from '../utils/api'

/**
 * Defines the shape of the AuthContext.
 * This is what all components using `useAuth()` will have access to.
 */
interface AuthContextType {
  user: any | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  changePassword: (newPassword: string, clearNeedsPasswordReset?: boolean) => Promise<void>
  sendPasswordResetEmail: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetches extra profile data from your custom `users` table
   * (since Supabase default auth only stores minimal info).
   */
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, is_active, needs_password_reset, roles(name)')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[fetchUserProfile] Error fetching user profile:', error)
      return null
    }
    return data
  }

  /**
   * On app start, check if a user session already exists (e.g., from cookies/localStorage).
   * If so, load their profile from the DB and set it into state.
   * Also subscribe to auth state changes (login/logout/password change).
   */
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        setUser(profile)
      }
      setLoading(false)
    }

    init()

    // Listen for sign in/out/password changes
    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        setUser(profile)
      } else {
        setUser(null)
        localStorage.removeItem('userProfile')
      }
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  /**
   * Signs in a user with email + password using Supabase auth.
   * If successful, fetches their extended profile and saves it locally.
   */
  const signIn = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id)

        // prevent inactive accounts from signing in
        if (!profile?.is_active) throw new Error('Account is inactive')

        setUser(profile)
        localStorage.setItem('userProfile', JSON.stringify(profile))
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Logs the user out from Supabase and clears local state.
   */
  const signOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      localStorage.removeItem('userProfile')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Changes the user's password using the secure Edge Function approach.
   * @param newPassword - The new password to set
   * @param clearNeedsPasswordReset - Whether to clear the needs_password_reset flag (default: false)
   */

const changePassword = async (
  newPassword: string,
  clearNeedsPasswordReset: boolean = false,
  accessToken?: string // ✅ Accept token for reset-password flow
) => {
  console.log("[changePassword] START", { newPassword: !!newPassword, clearNeedsPasswordReset, accessToken: !!accessToken })
  setLoading(true)
  setError(null)

  try {
    let result: any

    if (accessToken) {
      // --- FORGOT PASSWORD / RESET FLOW ---
      // Supabase Edge Function or direct API call with token
      console.log("[changePassword] Resetting password using access token")
      result = await authApi.updatePassword(newPassword, clearNeedsPasswordReset, accessToken)

      // After password reset with token, the user is NOT logged in automatically
      // You can optionally show a message or redirect to login page
    } else {
      // --- LOGGED-IN USER FLOW ---
      console.log("[changePassword] Changing password for logged-in user")
      const { data, error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) throw error
      result = data

      // Optional: Refresh profile after logged-in password change
      await refreshUser()
    }

    // --- Step 2: Update users table if required ---
    if (clearNeedsPasswordReset && result?.user?.id) {
      console.log("[changePassword] Updating users.needs_password_reset flag…")
      const { error: updateError } = await supabase
        .from("users")
        .update({ needs_password_reset: false })
        .eq("id", result.user.id)

      if (updateError) {
        console.error("[changePassword] Error updating users table:", updateError)
        throw updateError
      }
      console.log("[changePassword] users.needs_password_reset updated")
    }

    console.log("[changePassword] SUCCESS — password changed")
    return result
  } catch (err: any) {
    console.error("[changePassword] CATCH block", err)
    setError(err.message || "Unexpected error")
    throw err
  } finally {
    setLoading(false)
    console.log("[changePassword] FINALLY — loading set to false")
  }
}


  /**
   * Force refresh the current user profile from the DB.
   * Useful after updating roles or other user data.
   */
  const refreshUser = async () => {
    const { data: { user: sessionUser } } = await supabase.auth.getUser()
    if (sessionUser) {
      const profile = await fetchUserProfile(sessionUser.id)
      setUser(profile)
    }
  }

  /**
   * Sends a password reset email with a redirect URL.
   * User will click link → be redirected → enter new password.
   */
  const sendPasswordResetEmail = async (email: string) => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut, refreshUser, changePassword, sendPasswordResetEmail }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Custom hook for consuming AuthContext.
 * Throws if used outside an AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
