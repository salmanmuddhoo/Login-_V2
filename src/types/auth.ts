export interface User {
  id: string
  email: string
  full_name: string
  role_id: string
  menu_access: string[]
  sub_menu_access: Record<string, string[]>
  component_access: string[]
  is_active: boolean
  created_at: string
  needs_password_reset?: boolean
  roles?: {
    name: string
    description: string
  }
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface CreateUserData {
  email: string
  password: string
  full_name: string
  role_id: string
  menu_access?: string[]
  sub_menu_access?: Record<string, string[]>
  component_access?: string[]
}

export interface UpdateUserData {
  full_name: string
  role_id: string
  menu_access: string[]
  sub_menu_access: Record<string, string[]>
  component_access: string[]
  is_active: boolean
  needs_password_reset?: boolean
}

export interface Role {
  id: string
  name: string
  description: string
  created_at: string
}

export interface Permission {
  id: string
  resource: string
  action: string
  description: string
}

export interface PasswordValidationResult {
  isValid: boolean
  message: string
  errors: string[]
}