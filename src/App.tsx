import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginForm } from './components/LoginForm'
import { Dashboard } from './pages/Dashboard'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminUsers } from './pages/AdminUsers'
import { ProfilePage } from './pages/ProfilePage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { ForcePasswordChangePage } from './pages/ForcePasswordChangePage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/force-password-change" element={<ForcePasswordChangePage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            <Route path="dashboard" element={
              <ProtectedRoute requiredPermission={{ resource: 'dashboard', action: 'access' }}>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="admin/dashboard" element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="admin/users" element={
              <ProtectedRoute requiredPermission={{ resource: 'users', action: 'read' }}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            
            <Route path="profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            
            {/* Placeholder routes for other pages */}
            <Route path="reports" element={
              <ProtectedRoute requiredPermission={{ resource: 'reports', action: 'view' }}>
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="transactions" element={
              <ProtectedRoute requiredPermission={{ resource: 'transactions', action: 'create' }}>
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold text-gray-900">Transactions</h2>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="analytics" element={
              <ProtectedRoute requiredPermission={{ resource: 'reports', action: 'view' }}>
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="settings" element={
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
                <p className="text-gray-600 mt-2">Coming soon...</p>
              </div>
            } />
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App