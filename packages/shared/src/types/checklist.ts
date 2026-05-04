export interface Checklist {
  id: string
  clientId: string
  companyId: string
  name: string
  createdAt: string
}

export interface ChecklistItem {
  id: string
  checklistId: string
  label: string
  requiresPhoto: boolean
  position: number
  createdAt: string
}
