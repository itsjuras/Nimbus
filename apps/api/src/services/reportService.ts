import { resend, fromEmail } from '../lib/resend.js'
import { getJobDetail } from '../db/queries/jobs.js'
import { supabase } from '../db/supabase.js'
import type { JobChecklistItemDetail } from '@nimbus/shared'

const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 7 // 7 days in seconds
const BUCKET = 'job-photos'

export async function sendCompletionReport(jobId: string, companyId: string): Promise<void> {
  const job = await getJobDetail(jobId, companyId)
  if (!job) {
    console.error(`[report] Job ${jobId} not found, skipping report`)
    return
  }

  if (!job.clientContactEmail) {
    console.log(`[report] No contact email for client "${job.clientName}", skipping report`)
    return
  }

  // Sign all photo URLs in parallel
  const itemsWithSignedPhotos = await Promise.all(
    job.checklistItems.map(async (item) => {
      const signedPhotos = await Promise.all(
        item.photos.map(async (photo) => {
          const { data } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(photo.storagePath, SIGNED_URL_EXPIRY)
          return data?.signedUrl ?? null
        }),
      )
      return { item, signedUrls: signedPhotos.filter((u): u is string => u !== null) }
    }),
  )

  const scheduledDate = new Date(job.scheduledAt)
  const completedDate = job.completedAt ? new Date(job.completedAt) : new Date()

  const html = buildEmailHtml({
    clientName: job.clientName,
    checklistName: job.checklistName,
    scheduledAt: scheduledDate,
    completedAt: completedDate,
    itemsWithPhotos: itemsWithSignedPhotos,
  })

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: job.clientContactEmail,
    subject: `Cleaning complete — ${job.clientName} · ${scheduledDate.toLocaleDateString()}`,
    html,
  })

  if (error) {
    console.error(`[report] Failed to send report for job ${jobId}:`, error)
  } else {
    console.log(`[report] Completion report sent to ${job.clientContactEmail} for job ${jobId}`)
  }
}

interface EmailData {
  clientName: string
  checklistName: string
  scheduledAt: Date
  completedAt: Date
  itemsWithPhotos: { item: JobChecklistItemDetail; signedUrls: string[] }[]
}

function buildEmailHtml(data: EmailData): string {
  const { clientName, checklistName, scheduledAt, completedAt, itemsWithPhotos } = data

  const checklistRows = itemsWithPhotos
    .map(({ item, signedUrls }) => {
      const tick = item.completed ? '✅' : '⬜'
      const photos =
        signedUrls.length > 0
          ? signedUrls
              .map(
                (url) =>
                  `<a href="${url}" target="_blank">
                    <img src="${url}" alt="Photo" width="160" height="120"
                      style="object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;margin:4px 4px 0 0;" />
                  </a>`,
              )
              .join('')
          : ''

      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;">
            <span style="font-size:16px;">${tick}</span>
          </td>
          <td style="padding:10px 0 10px 12px;border-bottom:1px solid #f3f4f6;">
            <p style="margin:0;font-size:14px;color:${item.completed ? '#374151' : '#9ca3af'};">
              ${item.label}
            </p>
            ${photos ? `<div style="margin-top:8px;">${photos}</div>` : ''}
          </td>
        </tr>`
    })
    .join('')

  const completedCount = itemsWithPhotos.filter((i) => i.item.completed).length
  const totalCount = itemsWithPhotos.length

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

    <!-- Header -->
    <div style="background:#2563eb;padding:32px 40px;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#93c5fd;letter-spacing:.05em;text-transform:uppercase;">
        Cleaning Complete
      </p>
      <h1 style="margin:8px 0 0;font-size:24px;font-weight:700;color:#ffffff;">
        ${clientName}
      </h1>
    </div>

    <!-- Summary -->
    <div style="padding:28px 40px;border-bottom:1px solid #f3f4f6;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:0 24px 0 0;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">Scheduled</p>
            <p style="margin:0;font-size:14px;color:#111827;">
              ${scheduledAt.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              at ${scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </td>
          <td style="padding:0 24px 0 0;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">Completed</p>
            <p style="margin:0;font-size:14px;color:#111827;">
              ${completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </td>
          <td>
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">Tasks</p>
            <p style="margin:0;font-size:14px;color:#111827;">${completedCount} / ${totalCount} completed</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Checklist -->
    <div style="padding:28px 40px;">
      <h2 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111827;">${checklistName}</h2>
      <table style="width:100%;border-collapse:collapse;">
        ${checklistRows}
      </table>
    </div>

    <!-- Footer -->
    <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        This report was automatically generated by Nimbus after your cleaning was completed.
      </p>
    </div>

  </div>
</body>
</html>`
}
