import type { User } from '../types/auth'

export function hasMenuAccess(user: User | null, menuId: string): boolean {
  if (!user || !user.is_active) return false
  return user.menu_access.includes(menuId)
}

export function hasSubMenuAccess(user: User | null, menuId: string, subMenuId: string): boolean {
  if (!user || !user.is_active) return false
  return user.sub_menu_access[menuId]?.includes(subMenuId) || false
}

export function hasComponentAccess(user: User | null, componentId: string): boolean {
  if (!user || !user.is_active) return false
  return user.component_access.includes(componentId)
}

export function hasPermission(user: User | null, resource: string, action: string): boolean {
  if (!user || !user.is_active) return false
  
  // Admin role has all permissions
  if (user.roles?.name === 'admin') return true
  
  // For now, we'll use role-based checks since we don't have permission details in the user object
  // In a more complex system, you'd fetch user permissions separately
  const roleName = user.roles?.name
  
  switch (resource) {
    case 'admin':
      return roleName === 'admin'
    case 'dashboard':
      return ['admin', 'member', 'viewer'].includes(roleName || '')
    case 'users':
      return roleName === 'admin'
    case 'reports':
      if (action === 'view') return ['admin', 'member', 'viewer'].includes(roleName || '')
      if (action === 'export') return ['admin', 'member'].includes(roleName || '')
      return false
    case 'transactions':
      if (action === 'create') return ['admin', 'member'].includes(roleName || '')
      if (action === 'approve') return roleName === 'admin'
      return false
    default:
      return false
  }
}

export function isAdmin(user: User | null): boolean {
  return user?.roles?.name === 'admin' || false
}

export function canAccessAdminPanel(user: User | null): boolean {
  return hasPermission(user, 'admin', 'access')
}