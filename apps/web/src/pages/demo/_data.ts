export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'missed'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void'
export type CrewRole = 'owner' | 'manager' | 'crew'

export interface DemoClient {
  id: string
  name: string
  address: string
  contactName: string
  contactEmail: string
  notes: string
}

export interface ChecklistItem {
  id: string
  label: string
  requiresPhoto: boolean
  position: number
}

export interface DemoCrewMember {
  id: string
  fullName: string
  role: CrewRole
  phone: string
  email: string
}

export interface DemoChecklistItem {
  id: string
  label: string
  requiresPhoto: boolean
  completed: boolean
}

export interface DemoJob {
  id: string
  clientId: string
  status: JobStatus
  scheduledAt: Date
  crewIds: string[]
  notes?: string
  checklistItems: DemoChecklistItem[]
}

export interface DemoInvoice {
  id: string
  clientId: string
  status: InvoiceStatus
  amountCents: number
  currency: string
  dueDate: string
  lineItems: { description: string; quantity: number; unitAmountCents: number }[]
}

// ── helpers ───────────────────────────────────────────────────────────────────

function daysAgo(n: number, hour = 9): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, 0, 0, 0)
  return d
}

function daysAhead(n: number, hour = 9): Date {
  return daysAgo(-n, hour)
}

// ── clients ───────────────────────────────────────────────────────────────────

export const CLIENTS: DemoClient[] = [
  {
    id: 'c1',
    name: 'Apex Financial',
    address: '240 Bay Street, Toronto, ON',
    contactName: 'David Park',
    contactEmail: 'david@apexfinancial.ca',
    notes: 'Access code: 4821. Clean after 6pm on weekdays only.',
  },
  {
    id: 'c2',
    name: 'Metro Fitness',
    address: '1100 King Street West, Toronto, ON',
    contactName: 'Rachel Kim',
    contactEmail: 'rachel@metrofitness.ca',
    notes: 'Use service entrance on King St side. Park in loading zone.',
  },
  {
    id: 'c3',
    name: 'Riverside School',
    address: '45 Riverside Drive, Toronto, ON',
    contactName: 'Alan Thompson',
    contactEmail: 'athompson@riverside.edu',
    notes: 'School closed on weekends. Keys held at the front office.',
  },
  {
    id: 'c4',
    name: 'CloudBase Tech',
    address: '88 Queens Quay East, Toronto, ON',
    contactName: 'Priya Sharma',
    contactEmail: 'priya@cloudbasetech.com',
    notes: '',
  },
  {
    id: 'c5',
    name: 'Greenway Offices',
    address: '200 Front Street West, Toronto, ON',
    contactName: 'Mark Ellison',
    contactEmail: 'mark@greenwayoffices.ca',
    notes: 'Elevator access code: 77. Report to concierge on arrival.',
  },
]

// ── checklists ────────────────────────────────────────────────────────────────

export const CHECKLISTS: Record<string, { name: string; items: ChecklistItem[] }> = {
  c1: {
    name: 'Office Standard Clean',
    items: [
      { id: 'ci1', label: 'Vacuum all carpeted areas', requiresPhoto: false, position: 0 },
      { id: 'ci2', label: 'Mop hard floor surfaces', requiresPhoto: false, position: 1 },
      { id: 'ci3', label: 'Clean and sanitize restrooms', requiresPhoto: true, position: 2 },
      { id: 'ci4', label: 'Empty all waste bins', requiresPhoto: false, position: 3 },
      { id: 'ci5', label: 'Wipe down reception desk', requiresPhoto: false, position: 4 },
      { id: 'ci6', label: 'Clean glass entrance doors', requiresPhoto: true, position: 5 },
    ],
  },
  c2: {
    name: 'Gym Deep Clean',
    items: [
      { id: 'ci7', label: 'Disinfect all gym equipment', requiresPhoto: true, position: 0 },
      { id: 'ci8', label: 'Clean locker rooms and showers', requiresPhoto: true, position: 1 },
      { id: 'ci9', label: 'Mop gym floor', requiresPhoto: false, position: 2 },
      { id: 'ci10', label: 'Clean reception area', requiresPhoto: false, position: 3 },
      { id: 'ci11', label: 'Restock paper towels and soap', requiresPhoto: false, position: 4 },
      { id: 'ci12', label: 'Take out trash', requiresPhoto: false, position: 5 },
    ],
  },
  c3: {
    name: 'School Standard Clean',
    items: [
      { id: 'ci13', label: 'Vacuum all classrooms', requiresPhoto: false, position: 0 },
      { id: 'ci14', label: 'Clean whiteboard surfaces', requiresPhoto: false, position: 1 },
      { id: 'ci15', label: 'Empty waste bins', requiresPhoto: false, position: 2 },
      { id: 'ci16', label: 'Mop hallways', requiresPhoto: false, position: 3 },
      { id: 'ci17', label: 'Clean restrooms', requiresPhoto: true, position: 4 },
      { id: 'ci18', label: 'Wipe down desks and chairs', requiresPhoto: false, position: 5 },
    ],
  },
  c4: {
    name: 'Tech Office Clean',
    items: [
      { id: 'ci19', label: 'Vacuum all carpeted areas', requiresPhoto: false, position: 0 },
      { id: 'ci20', label: 'Wipe down workstations and monitors', requiresPhoto: false, position: 1 },
      { id: 'ci21', label: 'Clean and sanitize kitchen area', requiresPhoto: false, position: 2 },
      { id: 'ci22', label: 'Clean and sanitize restrooms', requiresPhoto: true, position: 3 },
      { id: 'ci23', label: 'Empty all waste bins', requiresPhoto: false, position: 4 },
    ],
  },
  c5: {
    name: 'Office Standard Clean',
    items: [
      { id: 'ci24', label: 'Vacuum common areas', requiresPhoto: false, position: 0 },
      { id: 'ci25', label: 'Clean meeting rooms', requiresPhoto: false, position: 1 },
      { id: 'ci26', label: 'Clean and sanitize restrooms', requiresPhoto: true, position: 2 },
      { id: 'ci27', label: 'Empty all waste bins', requiresPhoto: false, position: 3 },
      { id: 'ci28', label: 'Mop lobby floor', requiresPhoto: false, position: 4 },
    ],
  },
}

function makeItems(clientId: string, completedCount: number): DemoChecklistItem[] {
  return (CHECKLISTS[clientId]?.items ?? []).map((item, i) => ({
    id: item.id,
    label: item.label,
    requiresPhoto: item.requiresPhoto,
    completed: i < completedCount,
  }))
}

// ── crew ──────────────────────────────────────────────────────────────────────

export const CREW: DemoCrewMember[] = [
  { id: 'cr1', fullName: 'Tom Harris', role: 'crew', phone: '(416) 555-0192', email: 'tom@brightline.ca' },
  { id: 'cr2', fullName: 'Maria Santos', role: 'crew', phone: '(416) 555-0248', email: 'maria@brightline.ca' },
  { id: 'cr3', fullName: 'James Okafor', role: 'crew', phone: '(416) 555-0371', email: 'james@brightline.ca' },
  { id: 'cr4', fullName: 'Lisa Park', role: 'manager', phone: '(416) 555-0419', email: 'lisa@brightline.ca' },
]

// ── jobs ──────────────────────────────────────────────────────────────────────

export const JOBS: DemoJob[] = [
  {
    id: 'j1',
    clientId: 'c1',
    status: 'scheduled',
    scheduledAt: daysAhead(1, 9),
    crewIds: ['cr1', 'cr2'],
    checklistItems: makeItems('c1', 0),
  },
  {
    id: 'j2',
    clientId: 'c2',
    status: 'scheduled',
    scheduledAt: daysAhead(3, 8),
    crewIds: ['cr3'],
    checklistItems: makeItems('c2', 0),
  },
  {
    id: 'j3',
    clientId: 'c3',
    status: 'scheduled',
    scheduledAt: daysAhead(4, 7),
    crewIds: ['cr1', 'cr3'],
    checklistItems: makeItems('c3', 0),
  },
  {
    id: 'j4',
    clientId: 'c2',
    status: 'in_progress',
    scheduledAt: daysAgo(0, 8),
    crewIds: ['cr2', 'cr3'],
    checklistItems: makeItems('c2', 3),
  },
  {
    id: 'j5',
    clientId: 'c1',
    status: 'in_progress',
    scheduledAt: daysAgo(0, 9),
    crewIds: ['cr1'],
    notes: 'Reception desk area needs extra attention today.',
    checklistItems: makeItems('c1', 2),
  },
  {
    id: 'j6',
    clientId: 'c1',
    status: 'completed',
    scheduledAt: daysAgo(1, 18),
    crewIds: ['cr1', 'cr2'],
    checklistItems: makeItems('c1', 6),
  },
  {
    id: 'j7',
    clientId: 'c3',
    status: 'completed',
    scheduledAt: daysAgo(2, 7),
    crewIds: ['cr3', 'cr4'],
    checklistItems: makeItems('c3', 6),
  },
  {
    id: 'j8',
    clientId: 'c2',
    status: 'completed',
    scheduledAt: daysAgo(5, 8),
    crewIds: ['cr2'],
    checklistItems: makeItems('c2', 6),
  },
  {
    id: 'j9',
    clientId: 'c5',
    status: 'completed',
    scheduledAt: daysAgo(7, 9),
    crewIds: ['cr1', 'cr4'],
    checklistItems: makeItems('c5', 5),
  },
  {
    id: 'j10',
    clientId: 'c4',
    status: 'missed',
    scheduledAt: daysAgo(6, 9),
    crewIds: ['cr3'],
    checklistItems: makeItems('c4', 0),
  },
]

// ── invoices ──────────────────────────────────────────────────────────────────

export const INVOICES: DemoInvoice[] = [
  {
    id: 'inv1',
    clientId: 'c1',
    status: 'paid',
    amountCents: 85000,
    currency: 'cad',
    dueDate: 'Oct 31, 2025',
    lineItems: [{ description: 'Monthly cleaning service — October', quantity: 1, unitAmountCents: 85000 }],
  },
  {
    id: 'inv2',
    clientId: 'c2',
    status: 'paid',
    amountCents: 62000,
    currency: 'cad',
    dueDate: 'Nov 15, 2025',
    lineItems: [{ description: 'Gym deep clean — November', quantity: 4, unitAmountCents: 15500 }],
  },
  {
    id: 'inv3',
    clientId: 'c3',
    status: 'paid',
    amountCents: 54000,
    currency: 'cad',
    dueDate: 'Nov 30, 2025',
    lineItems: [{ description: 'School standard clean — November', quantity: 1, unitAmountCents: 54000 }],
  },
  {
    id: 'inv4',
    clientId: 'c4',
    status: 'sent',
    amountCents: 78000,
    currency: 'cad',
    dueDate: 'Dec 5, 2025',
    lineItems: [{ description: 'Tech office clean — December', quantity: 1, unitAmountCents: 78000 }],
  },
  {
    id: 'inv5',
    clientId: 'c5',
    status: 'sent',
    amountCents: 120000,
    currency: 'cad',
    dueDate: 'Dec 10, 2025',
    lineItems: [
      { description: 'Office clean — December', quantity: 4, unitAmountCents: 25000 },
      { description: 'Deep clean surcharge', quantity: 1, unitAmountCents: 20000 },
    ],
  },
  {
    id: 'inv6',
    clientId: 'c1',
    status: 'draft',
    amountCents: 85000,
    currency: 'cad',
    dueDate: 'Jan 15, 2026',
    lineItems: [{ description: 'Monthly cleaning service — January', quantity: 1, unitAmountCents: 85000 }],
  },
]

// ── helpers ───────────────────────────────────────────────────────────────────

export function getClient(id: string): DemoClient | undefined {
  return CLIENTS.find((c) => c.id === id)
}

export function getCrew(id: string): DemoCrewMember | undefined {
  return CREW.find((c) => c.id === id)
}

export function formatDate(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (diffDays === 0) return `Today ${timeStr}`
  if (diffDays === 1) return `Tomorrow ${timeStr}`
  if (diffDays === -1) return `Yesterday ${timeStr}`
  if (diffDays > 1 && diffDays < 7)
    return `${date.toLocaleDateString([], { weekday: 'short' })} ${timeStr}`
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)
}
