export type UserRole = 'owner' | 'manager' | 'crew'

export interface Profile {
  id: string
  companyId: string
  role: UserRole
  fullName: string
  phone: string | null
  avatarUrl: string | null
  createdAt: string
}
