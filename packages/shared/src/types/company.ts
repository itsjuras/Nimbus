export interface Company {
  id: string
  name: string
  ownerId: string
  createdAt: string
}

export interface CompanySettings {
  id: string
  name: string
  companyName: string | null
  replyToEmail: string | null
}
