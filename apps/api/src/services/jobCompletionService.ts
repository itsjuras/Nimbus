import { supabase } from '../db/supabase.js'
import { getJobById, updateJobStatus, getJobDetail } from '../db/queries/jobs.js'
import {
  markChecklistItemComplete,
  insertJobPhoto,
  getChecklistCompletionStatus,
} from '../db/queries/jobChecklist.js'
import { createWageEntryRecord } from '../db/queries/wages.js'
import { AppError } from '../middleware/errorHandler.js'
import { sendCompletionReport } from './reportService.js'
import { notifyOwnersJobStatusChanged } from '../lib/push.js'
import type { Job, JobChecklistItem, JobPhoto } from '@nimbus/shared'

export async function markItemComplete(
  jobId: string,
  companyId: string,
  profileId: string,
  checklistItemId: string,
  completed: boolean,
): Promise<JobChecklistItem> {
  const job = await getJobById(jobId, companyId)
  if (!job) throw new AppError('JOB_NOT_FOUND', 'No job found with that ID', 404)

  if (job.status === 'completed') {
    throw new AppError('JOB_COMPLETED', 'Job is already completed', 400)
  }

  return markChecklistItemComplete(jobId, checklistItemId, profileId, completed)
}

export async function registerPhoto(
  jobId: string,
  companyId: string,
  profileId: string,
  checklistItemId: string,
  storagePath: string,
): Promise<JobPhoto> {
  const job = await getJobById(jobId, companyId)
  if (!job) throw new AppError('JOB_NOT_FOUND', 'No job found with that ID', 404)

  if (job.status === 'completed') {
    throw new AppError('JOB_COMPLETED', 'Job is already completed', 400)
  }

  return insertJobPhoto(jobId, checklistItemId, profileId, storagePath)
}

export async function completeJob(
  jobId: string,
  companyId: string,
  profileId: string,
): Promise<Job> {
  const job = await getJobById(jobId, companyId)
  if (!job) throw new AppError('JOB_NOT_FOUND', 'No job found with that ID', 404)

  if (job.status !== 'in_progress') {
    throw new AppError('INVALID_STATUS', 'Job must be in progress to complete', 400)
  }

  // Validate all photo-required items have at least one photo
  const status = await getChecklistCompletionStatus(jobId)
  if (status.missingPhotos.length > 0) {
    throw new AppError(
      'MISSING_PHOTOS',
      `Photos required for: ${status.missingPhotos.join(', ')}`,
      400,
    )
  }

  // Update job status
  const updated = await updateJobStatus(jobId, companyId, 'completed')
  if (!updated) throw new AppError('JOB_NOT_FOUND', 'No job found with that ID', 404)

  // Create completion record
  await supabase.from('job_completions').insert({
    job_id: jobId,
    completed_by: profileId,
  })

  // Auto-create wage entries for per-job crew members
  const detail = await getJobDetail(jobId, companyId).catch(() => null)
  if (detail) {
    const today = new Date().toISOString().split('T')[0]!
    await Promise.allSettled(
      detail.crew
        .filter((m) => m.payType === 'per_job' && m.payRateCents != null && m.payRateCents > 0)
        .map((m) =>
          createWageEntryRecord({
            companyId,
            profileId: m.id,
            payType: 'per_job',
            rateCents: m.payRateCents!,
            totalCents: m.payRateCents!,
            periodDate: today,
            jobId,
          }),
        ),
    )
  }

  // Send client report and owner notification asynchronously
  sendCompletionReport(jobId, companyId).catch((err) => {
    console.error(`[report] Unhandled error sending report for job ${jobId}:`, err)
  })

  notifyOwnersJobStatusChanged(companyId, jobId, '', 'completed').catch(() => {})

  return updated
}
