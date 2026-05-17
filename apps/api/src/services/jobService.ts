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
} from '../db/queries/jobs.js'
import { getClientById } from '../db/queries/clients.js'
import { getChecklistByClientId } from '../db/queries/checklists.js'
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
  // Validate client belongs to this company
  const client = await getClientById(input.clientId, companyId)
  if (!client) throw new AppError('CLIENT_NOT_FOUND', 'No client found with that ID', 404)

  // Validate checklist belongs to this client
  const checklist = await getChecklistByClientId(input.clientId, companyId)
  if (!checklist || checklist.checklist.id !== input.checklistId) {
    throw new AppError('CHECKLIST_NOT_FOUND', 'Checklist does not belong to this client', 404)
  }

  const job = await createJobQuery(companyId, {
    clientId: input.clientId,
    checklistId: input.checklistId,
    scheduledAt: input.scheduledAt,
    ...(input.notes !== undefined && { notes: input.notes }),
  })

  // Assign crew and seed checklist items in parallel
  await Promise.all([
    setJobCrew(job.id, input.crewIds),
    seedJobChecklistItems(job.id, input.checklistId),
  ])

  // Notify assigned crew (fire-and-forget)
  input.crewIds.forEach((profileId) => {
    notifyCrewJobAssigned(job.id, profileId).catch(() => {})
  })

  return job
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

  const job = await updateJobQuery(id, companyId, {
    ...(input.scheduledAt !== undefined && { scheduledAt: input.scheduledAt }),
    ...(input.notes !== undefined && { notes: input.notes }),
  })
  if (!job) throw new AppError('JOB_NOT_FOUND', 'No job found with that ID', 404)

  if (input.crewIds !== undefined) {
    await setJobCrew(id, input.crewIds)
  }

  return job
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
