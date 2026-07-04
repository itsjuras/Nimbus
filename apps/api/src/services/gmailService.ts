import { createOAuth2Client, generateOAuthState, consumeOAuthState } from '../lib/googleAuth.js'
import { getGmailAddress, listInboxThreads, listSentThreads, getThread, sendGmail, parseAddress } from '../lib/gmail.js'
import { getGoogleAuth, setGoogleAuth, clearGoogleAuth, getCompanySettings } from '../db/queries/company.js'
import { getClientsByCompany } from '../db/queries/clients.js'
import { AppError } from '../middleware/errorHandler.js'
import type { GmailStatus, InboxThread, InboxThreadDetail, ReplyEmailRequest } from '@nimbus/shared'

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
]

// ── Connection lifecycle ──────────────────────────────────────────────────────

export async function getGmailStatus(companyId: string): Promise<GmailStatus> {
  const auth = await getGoogleAuth(companyId)
  return {
    connected: Boolean(auth?.googleRefreshToken),
    email: auth?.googleEmail ?? null,
  }
}

export function buildConnectUrl(companyId: string): { url: string } {
  const state = generateOAuthState(companyId)
  const url = createOAuth2Client().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GMAIL_SCOPES,
    state,
  })
  return { url }
}

export async function handleOAuthCallback(code: string, state: string): Promise<void> {
  const companyId = consumeOAuthState(state)
  if (!companyId) throw new AppError('OAUTH_STATE_INVALID', 'OAuth session expired — try connecting again', 400)

  const { tokens } = await createOAuth2Client().getToken(code)
  if (!tokens.refresh_token) {
    throw new AppError('OAUTH_NO_REFRESH_TOKEN', 'Google did not return a refresh token — try connecting again', 400)
  }

  const email = await getGmailAddress(tokens.refresh_token)
  await setGoogleAuth(companyId, email, tokens.refresh_token)
}

export async function disconnectGmail(companyId: string): Promise<void> {
  const auth = await getGoogleAuth(companyId)
  if (auth?.googleRefreshToken) {
    // Best-effort revoke; clearing our copy is what matters
    try {
      await createOAuth2Client().revokeToken(auth.googleRefreshToken)
    } catch {
      // token may already be revoked or expired
    }
  }
  await clearGoogleAuth(companyId)
}

async function requireGmail(companyId: string): Promise<{ refreshToken: string; email: string }> {
  const auth = await getGoogleAuth(companyId)
  if (!auth?.googleRefreshToken) {
    throw new AppError('GMAIL_NOT_CONNECTED', 'Connect your Gmail account in the Emails page first', 400)
  }
  return { refreshToken: auth.googleRefreshToken, email: auth.googleEmail ?? '' }
}

// ── Inbox ─────────────────────────────────────────────────────────────────────

async function buildClientEmailMap(companyId: string): Promise<Map<string, { id: string; name: string }>> {
  const clients = await getClientsByCompany(companyId)
  const map = new Map<string, { id: string; name: string }>()
  for (const client of clients) {
    if (client.contactEmail) {
      map.set(client.contactEmail.toLowerCase(), { id: client.id, name: client.name })
    }
  }
  return map
}

export async function getInbox(companyId: string): Promise<InboxThread[]> {
  const { refreshToken, email } = await requireGmail(companyId)
  const [threads, clientMap] = await Promise.all([
    listInboxThreads(refreshToken, email),
    buildClientEmailMap(companyId),
  ])

  return threads.map((thread) => {
    const client = clientMap.get(thread.fromEmail)
    return {
      ...thread,
      clientId: client?.id ?? null,
      clientName: client?.name ?? null,
    }
  })
}

export async function getSentEmails(companyId: string): Promise<InboxThread[]> {
  const { refreshToken, email } = await requireGmail(companyId)
  const [threads, clientMap] = await Promise.all([
    listSentThreads(refreshToken, email),
    buildClientEmailMap(companyId),
  ])

  return threads.map((thread) => {
    const client = clientMap.get(thread.fromEmail)
    return {
      ...thread,
      clientId: client?.id ?? null,
      clientName: client?.name ?? null,
    }
  })
}

export async function getInboxThread(companyId: string, threadId: string): Promise<InboxThreadDetail> {
  const { refreshToken, email: ownEmail } = await requireGmail(companyId)
  const [thread, clientMap] = await Promise.all([
    getThread(refreshToken, threadId),
    buildClientEmailMap(companyId),
  ])

  // Match the thread to a client via any non-own participant
  let clientMatch: { id: string; name: string } | null = null
  for (const message of thread.messages) {
    const candidate = clientMap.get(message.fromEmail)
    if (candidate) {
      clientMatch = candidate
      break
    }
  }

  return {
    id: thread.id,
    subject: thread.subject,
    clientId: clientMatch?.id ?? null,
    clientName: clientMatch?.name ?? null,
    messages: thread.messages.map((m) => ({
      id: m.id,
      fromName: m.fromName,
      fromEmail: m.fromEmail,
      to: m.to,
      date: m.date,
      body: m.body,
      isOwn: m.fromEmail === ownEmail.toLowerCase(),
    })),
  }
}

// ── Sending ───────────────────────────────────────────────────────────────────

async function getSenderName(companyId: string): Promise<string> {
  const settings = await getCompanySettings(companyId)
  return settings?.companyName ?? settings?.name ?? 'Nimbus'
}

export async function replyToThread(companyId: string, input: ReplyEmailRequest): Promise<void> {
  const { refreshToken, email: ownEmail } = await requireGmail(companyId)
  const thread = await getThread(refreshToken, input.threadId)

  const lastMessage = thread.messages[thread.messages.length - 1]
  if (!lastMessage) throw new AppError('THREAD_EMPTY', 'Thread has no messages', 400)

  // Reply to the most recent participant who isn't us
  const lastFromOther = [...thread.messages].reverse().find((m) => m.fromEmail !== ownEmail.toLowerCase())
  const to = lastFromOther ? lastFromOther.fromEmail : parseAddress(lastMessage.to).email

  const subject = thread.subject.toLowerCase().startsWith('re:') ? thread.subject : `Re: ${thread.subject}`
  const references = [lastMessage.references, lastMessage.messageIdHeader].filter(Boolean).join(' ')

  await sendGmail(refreshToken, {
    fromName: await getSenderName(companyId),
    fromEmail: ownEmail,
    to,
    subject,
    body: input.body,
    threadId: input.threadId,
    inReplyTo: lastMessage.messageIdHeader,
    references,
  })
}

// Used by emailService: send a new email through Gmail when connected.
// Returns false when Gmail isn't connected so the caller can fall back to Resend.
export async function trySendViaGmail(
  companyId: string,
  to: string,
  subject: string,
  body: string,
): Promise<boolean> {
  const auth = await getGoogleAuth(companyId)
  if (!auth?.googleRefreshToken || !auth.googleEmail) return false

  await sendGmail(auth.googleRefreshToken, {
    fromName: await getSenderName(companyId),
    fromEmail: auth.googleEmail,
    to,
    subject,
    body,
  })
  return true
}
