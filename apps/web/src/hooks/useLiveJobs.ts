import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useJobs } from './useJobs'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import type { Job } from '@nimbus/shared'

// Fetches jobs via the API and keeps them live via Supabase Realtime.
// When a job row changes in the DB, we patch the TanStack Query cache
// directly so every useJobs() call in the app sees the update instantly.
export function useLiveJobs() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const query = useJobs()

  useEffect(() => {
    if (!profile?.companyId) return

    const channel = supabase
      .channel(`jobs:company:${profile.companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `company_id=eq.${profile.companyId}`,
        },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload

          queryClient.setQueriesData<Job[]>({ queryKey: ['jobs'] }, (prev) => {
            if (!prev) return prev

            if (eventType === 'INSERT') {
              const job = dbRowToJob(newRow as Record<string, unknown>)
              return [...prev, job]
            }

            if (eventType === 'UPDATE') {
              const job = dbRowToJob(newRow as Record<string, unknown>)
              return prev.map((j) => (j.id === job.id ? job : j))
            }

            if (eventType === 'DELETE') {
              const deletedId = (oldRow as Record<string, unknown>)['id'] as string
              return prev.filter((j) => j.id !== deletedId)
            }

            return prev
          })

          // Also invalidate the individual job detail query so the
          // detail page refreshes if it's open
          if (eventType === 'UPDATE') {
            const updatedId = (newRow as Record<string, unknown>)['id'] as string
            queryClient.invalidateQueries({ queryKey: ['jobs', updatedId] })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.companyId, queryClient])

  return query
}

function dbRowToJob(row: Record<string, unknown>): Job {
  return {
    id: row['id'] as string,
    companyId: row['company_id'] as string,
    clientId: row['client_id'] as string,
    checklistId: row['checklist_id'] as string,
    scheduledAt: row['scheduled_at'] as string,
    status: row['status'] as Job['status'],
    notes: (row['notes'] as string | null) ?? null,
    createdAt: row['created_at'] as string,
  }
}
