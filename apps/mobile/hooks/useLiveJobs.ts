import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useJobs, JOBS_KEY } from './useJobs'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import type { Job } from '@nimbus/shared'

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

          queryClient.setQueriesData<Job[]>({ queryKey: JOBS_KEY }, (prev) => {
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

          if (eventType === 'UPDATE') {
            const updatedId = (newRow as Record<string, unknown>)['id'] as string
            queryClient.invalidateQueries({ queryKey: [...JOBS_KEY, updatedId] })
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
