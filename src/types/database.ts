export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role_id: string | null
          menu_access: string[]
          sub_menu_access: Record<string, string[]>
          component_access: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string
          role_id?: string | null
          menu_access?: string[]
          sub_menu_access?: Record<string, string[]>
          component_access?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role_id?: string | null
          menu_access?: string[]
          sub_menu_access?: Record<string, string[]>
          component_access?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      permissions: {
        Row: {
          id: string
          resource: string
          action: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          resource: string
          action: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          resource?: string
          action?: string
          description?: string | null
          created_at?: string
        }
      }
      role_permissions: {
        Row: {
          id: string
          role_id: string
          permission_id: string
          created_at: string
        }
        Insert: {
          id?: string
          role_id: string
          permission_id: string
          created_at?: string
        }
        Update: {
          id?: string
          role_id?: string
          permission_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}