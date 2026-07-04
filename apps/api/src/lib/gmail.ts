import { createOAuth2Client } from './googleAuth.js'
import { AppError } from '../middleware/errorHandler.js'

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'

async function getAccessToken(refreshToken: string): Promise<string> {
  const client = createOAuth2Client()
  client.setCredentials({ refresh_token: refreshToken })
  const { token } = await client.getAccessToken()
  if (!token) throw new AppError('GMAIL_AUTH_FAILED', 'Could not refresh Gmail access token — try reconnecting Gmail', 401)
  return token
}

async function gmailFetch<T>(refreshToken: string, path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken(refreshToken)
  const res = await fetch(`${GMAIL_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new AppError('GMAIL_API_ERROR', body.error?.message ?? `Gmail API error (HTTP ${res.status})`, 502)
  }

  return res.json() as Promise<T>
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getGmailAddress(refreshToken: string): Promise<string> {
  const profile = await gmailFetch<{ emailAddress: string }>(refreshToken, '/profile')
  return profile.emailAddress
}

// ── Reading mail ──────────────────────────────────────────────────────────────

interface GmailHeader {
  name: string
  value: string
}

interface GmailMessagePart {
  mimeType?: string
  body?: { data?: string }
  parts?: GmailMessagePart[]
}

interface GmailMessage {
  id: string
  threadId: string
  labelIds?: string[]
  snippet?: string
  internalDate?: string
  payload?: GmailMessagePart & { headers?: GmailHeader[] }
}

interface GmailThread {
  id: string
  messages?: GmailMessage[]
}

function header(message: GmailMessage, name: string): string {
  return message.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
}

// Prefer text/plain; fall back to stripped text/html
function extractBody(part: GmailMessagePart | undefined): string {
  if (!part) return ''

  const findByType = (p: GmailMessagePart, type: string): string | null => {
    if (p.mimeType === type && p.body?.data) return decodeBase64Url(p.body.data)
    for (const child of p.parts ?? []) {
      const found = findByType(child, type)
      if (found) return found
    }
    return null
  }

  const plain = findByType(part, 'text/plain')
  if (plain) return plain.trim()

  const html = findByType(part, 'text/html')
  if (html) {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  if (part.body?.data) return decodeBase64Url(part.body.data).trim()
  return ''
}

// "Jane Doe <jane@x.com>" → { name: "Jane Doe", email: "jane@x.com" }
export function parseAddress(raw: string): { name: string; email: string } {
  const match = raw.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/)
  if (match) {
    return { name: (match[1] ?? '').trim() || (match[2] ?? '').trim(), email: (match[2] ?? '').trim().toLowerCase() }
  }
  const email = raw.trim().toLowerCase()
  return { name: email, email }
}

export interface ParsedThreadSummary {
  id: string
  subject: string
  fromName: string
  fromEmail: string
  snippet: string
  date: string
  unread: boolean
  messageCount: number
}

async function listThreadsByLabel(
  refreshToken: string,
  labelId: 'INBOX' | 'SENT',
  ownEmail: string,
  maxResults = 25,
): Promise<ParsedThreadSummary[]> {
  const list = await gmailFetch<{ threads?: { id: string }[] }>(
    refreshToken,
    `/threads?labelIds=${labelId}&maxResults=${maxResults}`,
  )
  const threadIds = (list.threads ?? []).map((t) => t.id)
  if (threadIds.length === 0) return []

  const threads = await Promise.all(
    threadIds.map((id) =>
      gmailFetch<GmailThread>(
        refreshToken,
        `/threads/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
      ),
    ),
  )

  return threads.map((thread) => {
    const messages = thread.messages ?? []
    const first = messages[0]
    const last = messages[messages.length - 1]
    const lastFrom = last ? parseAddress(header(last, 'From')) : { name: '', email: '' }
    // Row shows the *other* party — if the last message was sent by us, that's the "To" address
    const isOwnLast = last ? lastFrom.email === ownEmail.toLowerCase() : false
    const counterpart = isOwnLast ? parseAddress(header(last!, 'To')) : lastFrom

    return {
      id: thread.id,
      subject: first ? header(first, 'Subject') || '(no subject)' : '(no subject)',
      fromName: counterpart.name,
      fromEmail: counterpart.email,
      snippet: last?.snippet ?? '',
      date: last?.internalDate ? new Date(Number(last.internalDate)).toISOString() : '',
      unread: messages.some((m) => m.labelIds?.includes('UNREAD')),
      messageCount: messages.length,
    }
  })
}

export async function listInboxThreads(
  refreshToken: string,
  ownEmail: string,
  maxResults = 25,
): Promise<ParsedThreadSummary[]> {
  return listThreadsByLabel(refreshToken, 'INBOX', ownEmail, maxResults)
}

export async function listSentThreads(
  refreshToken: string,
  ownEmail: string,
  maxResults = 25,
): Promise<ParsedThreadSummary[]> {
  return listThreadsByLabel(refreshToken, 'SENT', ownEmail, maxResults)
}

export interface ParsedMessage {
  id: string
  fromName: string
  fromEmail: string
  to: string
  date: string
  body: string
  messageIdHeader: string
  references: string
}

export interface ParsedThread {
  id: string
  subject: string
  messages: ParsedMessage[]
}

export async function getThread(refreshToken: string, threadId: string): Promise<ParsedThread> {
  const thread = await gmailFetch<GmailThread>(refreshToken, `/threads/${threadId}?format=full`)
  const messages = thread.messages ?? []
  const first = messages[0]

  return {
    id: thread.id,
    subject: first ? header(first, 'Subject') || '(no subject)' : '(no subject)',
    messages: messages.map((m) => {
      const from = parseAddress(header(m, 'From'))
      return {
        id: m.id,
        fromName: from.name,
        fromEmail: from.email,
        to: header(m, 'To'),
        date: m.internalDate ? new Date(Number(m.internalDate)).toISOString() : '',
        body: extractBody(m.payload),
        messageIdHeader: header(m, 'Message-ID'),
        references: header(m, 'References'),
      }
    }),
  }
}

// ── Sending mail ──────────────────────────────────────────────────────────────

function encodeBase64Url(input: string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// RFC 2047 encoding so names/subjects with non-ASCII characters survive transit
function encodeHeaderWord(value: string): string {
  return /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${Buffer.from(value).toString('base64')}?=`
}

export async function sendGmail(
  refreshToken: string,
  input: {
    fromName: string
    fromEmail: string
    to: string
    subject: string
    body: string
    threadId?: string
    inReplyTo?: string
    references?: string
  },
): Promise<{ id: string; threadId: string }> {
  const headers = [
    `From: ${encodeHeaderWord(input.fromName)} <${input.fromEmail}>`,
    `To: ${input.to}`,
    `Subject: ${encodeHeaderWord(input.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
  ]
  if (input.inReplyTo) headers.push(`In-Reply-To: ${input.inReplyTo}`)
  if (input.references) headers.push(`References: ${input.references}`)

  const raw = encodeBase64Url(`${headers.join('\r\n')}\r\n\r\n${input.body}`)

  return gmailFetch<{ id: string; threadId: string }>(refreshToken, '/messages/send', {
    method: 'POST',
    body: JSON.stringify({ raw, ...(input.threadId && { threadId: input.threadId }) }),
  })
}
