// src/pages/ResetPasswordPage.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { validatePasswordStrength } from '../utils/validation'
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { changePassword } = useAuth()

  // Form state
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Message & feedback state
  const [message, setMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Access token from reset link
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Password validation
  const [passwordValidation, setPasswordValidation] = useState<{
    isValid: boolean
    message: string
    errors: string[]
  } | null>(null)

  // --- Extract access token from URL (hash fragment or query params) ---
  useEffect(() => {
    const extractToken = () => {
      // 1️⃣ Check hash fragment (used by Supabase for OAuth flows)
      const hash = window.location.hash.substring(1) // remove '#'
      const hashParams = new URLSearchParams(hash)
      let token = hashParams.get('access_token')

      // 2️⃣ If not found, check query params (common pattern for reset links)
      if (!token) {
        const searchParams = new URLSearchParams(window.location.search)
        token = searchParams.get('token')
      }

      // 3️⃣ Set token into state if found
      if (token) {
        setAccessToken(token)

        // Optional: clean URL to remove token for security
        const cleanUrl = window.location.origin + window.location.pathname
        window.history.replaceState({}, document.title, cleanUrl)
      } else {
        // No valid token: show error message
        setMessage('Invalid or missing reset link. Please request a new one.')
        setIsSuccess(false)
      }
    }

    extractToken()
  }, [])

  // --- Validate password strength on change ---
  useEffect(() => {
    if (password) {
      validatePasswordStrength(password).then(result => setPasswordValidation(result))
    } else {
      setPasswordValidation(null)
    }
  }, [password])

  // --- Form submission handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsSuccess(false)

    // 1️⃣ Check if passwords match
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    // 2️⃣ Check password strength
    if (!passwordValidation?.isValid) {
      setMessage('Password does not meet strength requirements.')
      return
    }

    // 3️⃣ Ensure access token exists
    if (!accessToken) {
      setMessage('Invalid reset link. Please request a new password reset email.')
      return
    }

    setIsLoading(true)

    try {
      // 4️⃣ Call changePassword from AuthContext
      // Pass accessToken for password reset scenario
      await changePassword(password, true)

      // 5️⃣ Success feedback
      setMessage('Your password has been successfully reset. Redirecting to login page...')
      setIsSuccess(true)

      // Clear form
      setPassword('')
      setConfirmPassword('')

      // 6️⃣ Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to reset password.'

      // Check for expired/invalid token
      if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        setMessage('This reset link has expired or is invalid. Please request a new password reset email.')
      } else {
        setMessage(errorMessage)
      }
      setIsSuccess(false)
    } finally {
      // Stop spinner
      setIsLoading(false)
    }
  }

  // --- JSX UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 bg-emerald-600 rounded-full flex items-center justify-center mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* --- Feedback Message --- */}
          {message && (
            <div className={`p-4 rounded-md ${isSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'} flex items-start`}>
              {isSuccess ? (
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              )}
              <div className={`text-sm ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>{message}</div>
            </div>
          )}

          {/* --- Password Fields --- */}
          <div className="rounded-md shadow-sm space-y-4">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {/* Password Strength Validation */}
              {passwordValidation && (
                <div className="mt-2">
                  <p className={`text-xs ${passwordValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidation.message}
                  </p>
                  {!passwordValidation.isValid && passwordValidation.errors.length > 0 && (
                    <ul className="mt-1 text-xs text-red-600 list-disc list-inside">
                      {passwordValidation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* --- Submit Button --- */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword || !passwordValidation?.isValid || !accessToken}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Resetting password...
                </div>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>

          {/* --- Link to request new reset if token missing --- */}
          {!accessToken && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Need a new reset link?
              </p>
              <Link 
                to="/forgot-password" 
                className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
              >
                Request password reset
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
