import {
  getJobsByCompany,
  getJobById,
  getJobDetail,
  createJob as createJobQuery,
  updateJob as updateJobQuery,
  updateJobStatus,
  deleteJob as deleteJobQuery,
  setJobCrew,
  seedJobChecklistItems,
  clearJobChecklistItems,
} from '../db/queries/jobs.js'
import { getClientById } from '../db/queries/clients.js'
import { getChecklistByClientId, upsertChecklist } from '../db/queries/checklists.js'
import { AppError } from '../middleware/errorHandler.js'
import { notifyCrewJobAssigned, notifyOwnersJobStatusChanged } from '../lib/push.js'
import type { Job, JobDetail, CreateJobRequest, UpdateJobRequest, JobFilters } from '@nimbus/shared'

export async function listJobs(companyId: string, filters: JobFilters): Promise<Job[]> {
  return getJobsByCompany(companyId, filters)
}

export async function getJob(id: string, companyId: string): Promise<JobDetail> {
  const job = await getJobDetail(id, companyId)
  if (!job) throw new AppError('JOB_NOT_FOUND', 'No job found with that ID', 404)
  return job
}

export async function createJob(
  companyId: string,
  input: CreateJobRequest,
): Promise<Job> {
  const client = await getClientById(input.clientId, companyId)
  if (!client) throw new AppError('CLIENT_NOT_FOUND', 'No client found with that ID', 404)

  const checklistRecord = await getChecklistByClientId(input.clientId, companyId)
  let checklistId = input.checklistId ?? checklistRecord?.checklist.id
  if (!checklistId) {
    const created = await upsertChecklist(input.clientId, companyId, `${client.name} Checklist`)
    checklistId = created.id
  }

  // Build list of all dates to schedule
  const dates = buildRecurringDates(input.scheduledAt, input.recurrence)

  // Create all jobs in parallel
  const jobs = await Promise.all(
    dates.map((scheduledAt) =>
      createJobQuery(companyId, {
        clientId: input.clientId,
        checklistId: checklistId!,
        scheduledAt,
        ...(input.notes !== undefined && { notes: input.notes }),
      }),
    ),
  )

  // Seed checklist items and assign crew for all jobs in parallel
  await Promise.all(
    jobs.flatMap((job) => [
      setJobCrew(job.id, input.crewIds),
      seedJobChecklistItems(job.id, checklistId!),
    ]),
  )

  // Notify crew about first job only (fire-and-forget)
  input.crewIds.forEach((profileId) => {
    notifyCrewJobAssigned(jobs[0]!.id, profileId).catch(() => {})
  })

  return jobs[0]!
}

function buildRecurringDates(
  startIso: string,
  recurrence?: { frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'; occurrences: number },
): string[] {
  const start = new Date(startIso)
  if (!recurrence) return [startIso]

  const { frequency, occurrences } = recurrence
  const dates: string[] = [startIso]

  for (let i = 1; i < occurrences; i++) {
    const next = new Date(start)
    if (frequency === 'daily') next.setDate(start.getDate() + i)
    else if (frequency === 'weekly') next.setDate(start.getDate() + i * 7)
    else if (frequency === 'biweekly') next.setDate(start.getDate() + i * 14)
    else if (frequency === 'monthly') next.setMonth(start.getMonth() + i)
    dates.push(next.toISOString())
  }

  return dates
}

export async function updateJob(
  id: string,
  companyId: string,
  input: UpdateJobRequest,
): Promise<Job> {
  const existing = await getJobById(id, companyId)
  if (!existing) throw new AppError('JOB_NOT_FOUND', 'No job found with that ID', 404)

  if (existing.status === 'completed') {
    throw new AppError('JOB_COMPLETED', 'Cannot edit a completed job', 400)
  }

  const hasPatch = input.scheduledAt !== undefined || input.notes !== undefined
  let job: Job | null = existing

  if (hasPatch) {
    job = await updateJobQuery(id, companyId, {
      ...(input.scheduledAt !== undefined && { scheduledAt: input.scheduledAt }),
      ...(input.notes !== undefined && { notes: input.notes }),
    })
    if (!job) throw new AppError('JOB_NOT_FOUND', 'No job found with that ID', 404)
  }

  if (input.crewIds !== undefined) {
    await setJobCrew(id, input.crewIds)
  }

  return job as Job
}

export async function deleteJob(id: string, companyId: string): Promise<void> {
  const existing = await getJobById(id, companyId)
  if (!existing) throw new AppError('JOB_NOT_FOUND', 'No job found with that ID', 404)

  if (existing.status === 'in_progress') {
    throw new AppError('JOB_IN_PROGRESS', 'Cannot delete a job that is in progress', 400)
  }

  await deleteJobQuery(id, companyId)
}

export async function startJob(id: string, companyId: string): Promise<Job> {
  const existing = await getJobById(id, companyId)
  if (!existing) throw new AppError('JOB_NOT_FOUND', 'No job found with that ID', 404)

  if (existing.status !== 'scheduled') {
    throw new AppError('INVALID_STATUS', 'Job must be in scheduled status to start', 400)
  }

  const job = await updateJobStatus(id, companyId, 'in_progress')
  if (!job) throw new AppError('JOB_NOT_FOUND', 'No job found with that ID', 404)

  // Notify owners (fire-and-forget)
  const detail = await getJobDetail(id, companyId).catch(() => null)
  if (detail) {
    notifyOwnersJobStatusChanged(companyId, id, detail.clientName, 'in_progress').catch(() => {})
  }

  return job
}

export async function reseedJobChecklist(id: string, companyId: string): Promise<JobDetail> {
  const job = await getJobById(id, companyId)
  if (!job) throw new AppError('JOB_NOT_FOUND', 'No job found with that ID', 404)

  await clearJobChecklistItems(id)
  await seedJobChecklistItems(id, job.checklistId)

  const detail = await getJobDetail(id, companyId)
  if (!detail) throw new AppError('JOB_NOT_FOUND', 'No job found with that ID', 404)
  return detail
}

export async function missJob(id: string, companyId: string): Promise<Job> {
  const existing = await getJobById(id, companyId)
  if (!existing) throw new AppError('JOB_NOT_FOUND', 'No job found with that ID', 404)

  if (existing.status === 'completed' || existing.status === 'missed') {
    throw new AppError('INVALID_STATUS', 'Job is already completed or missed', 400)
  }

  const job = await updateJobStatus(id, companyId, 'missed')
  if (!job) throw new AppError('JOB_NOT_FOUND', 'No job found with that ID', 404)

  return job
}
