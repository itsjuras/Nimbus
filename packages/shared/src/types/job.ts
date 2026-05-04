export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'missed'

export interface Job {
  id: string
  companyId: string
  clientId: string
  checklistId: string
  scheduledAt: string
  status: JobStatus
  notes: string | null
  createdAt: string
}

export interface JobCompletion {
  id: string
  jobId: string
  completedBy: string
  completedAt: string
  notes: string | null
}

export interface JobChecklistItem {
  id: string
  jobId: string
  checklistItemId: string
  completed: boolean
  completedBy: string | null
  completedAt: string | null
}

export interface JobPhoto {
  id: string
  jobId: string
  checklistItemId: string
  profileId: string
  storagePath: string
  createdAt: string
}

export interface JobCrewMember {
  id: string
  fullName: string
  role: string
  avatarUrl: string | null
}

export interface JobChecklistItemDetail {
  id: string
  checklistItemId: string
  label: string
  requiresPhoto: boolean
  position: number
  completed: boolean
  completedBy: string | null
  completedAt: string | null
  photos: JobPhoto[]
}

export interface JobDetail extends Job {
  clientName: string
  checklistName: string
  crew: JobCrewMember[]
  checklistItems: JobChecklistItemDetail[]
  completedAt: string | null
}
