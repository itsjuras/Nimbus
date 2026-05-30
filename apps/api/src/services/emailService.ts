import { anthropic } from '../lib/anthropic.js'
import { resend, platformFromEmail } from '../lib/resend.js'
import { getClientById } from '../db/queries/clients.js'
import { getProfilesByCompany } from '../db/queries/profiles.js'
import { getCompanySettings } from '../db/queries/company.js'
import { AppError } from '../middleware/errorHandler.js'
import type { EmailDraft, GenerateEmailDraftRequest, SendEmailRequest } from '@nimbus/shared'

export async function generateDraft(
  companyId: string,
  input: GenerateEmailDraftRequest,
): Promise<EmailDraft> {
  const client = await getClientById(input.clientId, companyId)
  if (!client) throw new AppError('CLIENT_NOT_FOUND', 'No client found with that ID', 404)

  const profiles = await getProfilesByCompany(companyId)
  const owner = profiles.find((p) => p.role === 'owner') ?? profiles[0]
  const companyName = owner?.fullName ?? 'your cleaning company'

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `You are an assistant helping a commercial cleaning company owner write professional emails to their clients.
The cleaning company representative is: ${companyName}.
Always write in a professional yet friendly tone. Keep emails concise and actionable.
Respond ONLY with a JSON object in this exact format, no markdown, no extra text:
{"subject": "...", "body": "..."}
The body should use plain text with line breaks (\\n) for paragraphs. Do not use HTML.`,
    messages: [
      {
        role: 'user',
        content: `Write an email to ${client.name} (contact: ${client.contactName ?? 'the team'}).

Instructions from the user: ${input.prompt}`,
      },
    ],
  })

  const raw = message.content[0]
  if (!raw || raw.type !== 'text') {
    throw new AppError('AI_ERROR', 'Failed to generate email draft', 500)
  }

  let draft: EmailDraft
  try {
    const cleaned = raw.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    draft = JSON.parse(cleaned) as EmailDraft
  } catch {
    throw new AppError('AI_PARSE_ERROR', 'Failed to parse generated draft', 500)
  }

  if (!draft.subject || !draft.body) {
    throw new AppError('AI_PARSE_ERROR', 'Generated draft is missing subject or body', 500)
  }

  return draft
}

export async function sendEmail(
  companyId: string,
  input: SendEmailRequest,
): Promise<void> {
  const [client, settings] = await Promise.all([
    getClientById(input.clientId, companyId),
    getCompanySettings(companyId),
  ])

  if (!client) throw new AppError('CLIENT_NOT_FOUND', 'No client found with that ID', 404)

  if (!client.contactEmail) {
    throw new AppError('NO_EMAIL', 'This client has no contact email address', 400)
  }

  const displayName = settings?.companyName ?? settings?.name ?? 'Nimbus'
  const from = `${displayName} <${platformFromEmail}>`

  const payload: Parameters<typeof resend.emails.send>[0] = {
    from,
    to: client.contactEmail,
    subject: input.subject,
    html: bodyToHtml(input.body),
    ...(settings?.replyToEmail ? { replyTo: settings.replyToEmail } : {}),
  }

  const { error } = await resend.emails.send(payload)

  if (error) {
    throw new AppError('EMAIL_SEND_FAILED', `Failed to send email: ${error.message}`, 500)
  }
}

function bodyToHtml(body: string): string {
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const paragraphs = escaped
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;padding:40px;">
    ${paragraphs}
  </div>
</body>
</html>`
}
