import { supabase } from '../db/supabase.js'

interface PushPayload {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
}

export async function sendPushToProfile(profileId: string, payload: Omit<PushPayload, 'to'>): Promise<void> {
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('profile_id', profileId)

  if (!tokens || tokens.length === 0) return

  const messages: PushPayload[] = tokens.map((t) => ({
    to: t.token as string,
    ...payload,
  }))

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  })
}

export async function sendPushToCompanyOwners(companyId: string, payload: Omit<PushPayload, 'to'>): Promise<void> {
  const { data: owners } = await supabase
    .from('profiles')
    .select('id')
    .eq('company_id', companyId)
    .in('role', ['owner', 'manager'])

  if (!owners || owners.length === 0) return

  await Promise.all(owners.map((o) => sendPushToProfile(o.id as string, payload)))
}

export async function notifyCrewJobAssigned(jobId: string, profileId: string): Promise<void> {
  await sendPushToProfile(profileId, {
    title: 'New Job Assigned',
    body: 'You have been assigned a new job.',
    data: { jobId },
  })
}

export async function notifyOwnersJobStatusChanged(
  companyId: string,
  jobId: string,
  clientName: string,
  status: string,
): Promise<void> {
  const statusLabel: Record<string, string> = {
    in_progress: 'started',
    completed: 'completed',
    missed: 'marked missed',
  }
  const label = statusLabel[status] ?? status

  await sendPushToCompanyOwners(companyId, {
    title: `Job ${label}`,
    body: `${clientName} has been ${label}.`,
    data: { jobId },
  })
}
