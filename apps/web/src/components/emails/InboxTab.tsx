import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInbox, useSentEmails, useInboxThread, useReplyToThread, useGenerateDraft, useConnectGmail } from '../../hooks/useEmails'
import type { GmailStatus, InboxThread, InboxThreadDetail } from '@nimbus/shared'

const inputClass =
  'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm normal-case tracking-normal text-gray-900 dark:text-gray-100 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800'

function formatDate(iso: string) {
  if (!iso) return ''
  const date = new Date(iso)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function InboxTab({ gmailStatus }: { gmailStatus: GmailStatus | undefined }) {
  const connected = Boolean(gmailStatus?.connected)
  const { data: threads, isLoading, error } = useInbox(connected)

  return (
    <MailListView
      connected={connected}
      threads={threads}
      isLoading={isLoading}
      error={error}
      emptyMessage="Your inbox is empty."
      direction="inbox"
    />
  )
}

export function SentTab({ gmailStatus }: { gmailStatus: GmailStatus | undefined }) {
  const connected = Boolean(gmailStatus?.connected)
  const { data: threads, isLoading, error } = useSentEmails(connected)

  return (
    <MailListView
      connected={connected}
      threads={threads}
      isLoading={isLoading}
      error={error}
      emptyMessage="You haven't sent any emails yet."
      direction="sent"
    />
  )
}

function MailListView({
  connected,
  threads,
  isLoading,
  error,
  emptyMessage,
  direction,
}: {
  connected: boolean
  threads: InboxThread[] | undefined
  isLoading: boolean
  error: unknown
  emptyMessage: string
  direction: 'inbox' | 'sent'
}) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)

  if (!connected) {
    return <ConnectGmailCard />
  }

  if (selectedThreadId) {
    return <ThreadView threadId={selectedThreadId} onBack={() => setSelectedThreadId(null)} />
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    )
  }

  if (error instanceof Error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-6">
        <p className="text-sm text-red-600 dark:text-red-400 normal-case tracking-normal">{error.message}</p>
      </div>
    )
  }

  if (!threads || threads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 normal-case tracking-normal">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {threads.map((thread, i) => (
        <ThreadRow
          key={thread.id}
          thread={thread}
          showBorder={i < threads.length - 1}
          direction={direction}
          onClick={() => setSelectedThreadId(thread.id)}
        />
      ))}
    </div>
  )
}

function ConnectGmailCard() {
  const connect = useConnectGmail()

  async function handleConnect() {
    const { url } = await connect.mutateAsync()
    window.location.href = url
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">
        See all your business email in Nimbus
      </h2>
      <p className="mx-auto max-w-md text-sm text-gray-500 dark:text-gray-400 normal-case tracking-normal">
        Connect your Gmail account to read and reply to client emails right here — sent from your real
        address, synced with your Gmail inbox. Nimbus only accesses mail while you use the app.
      </p>
      {connect.error instanceof Error && (
        <p className="text-sm text-red-600 dark:text-red-400 normal-case tracking-normal">{connect.error.message}</p>
      )}
      <button
        onClick={handleConnect}
        disabled={connect.isPending}
        className="rounded-xl bg-gray-900 dark:bg-gray-100 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-40 transition-colors"
        style={{ fontFamily: 'IBM Plex Mono, monospace' }}
      >
        {connect.isPending ? 'Opening…' : 'Connect Gmail'}
      </button>
    </div>
  )
}

function ThreadRow({
  thread,
  showBorder,
  direction,
  onClick,
}: {
  thread: InboxThread
  showBorder: boolean
  direction: 'inbox' | 'sent'
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`block w-full px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
        showBorder ? 'border-b border-gray-100 dark:border-gray-800' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={`truncate text-sm normal-case tracking-normal ${thread.unread ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
          {direction === 'sent' ? `To: ${thread.fromName}` : thread.fromName}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {thread.clientName && (
            <span className="rounded-full bg-gray-900 dark:bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white dark:text-gray-900" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              {thread.clientName}
            </span>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">{formatDate(thread.date)}</span>
        </div>
      </div>
      <p className={`mt-0.5 truncate text-sm normal-case tracking-normal ${thread.unread ? 'font-semibold text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
        {thread.subject}
        {thread.messageCount > 1 && (
          <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">({thread.messageCount})</span>
        )}
      </p>
      <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">{thread.snippet}</p>
    </button>
  )
}

// ── Thread detail + reply ─────────────────────────────────────────────────────

function ThreadView({ threadId, onBack }: { threadId: string; onBack: () => void }) {
  const { data: thread, isLoading, error } = useInboxThread(threadId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <button onClick={onBack} className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 normal-case tracking-normal">← Inbox</button>
        <div className="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
    )
  }

  if (error instanceof Error || !thread) {
    return (
      <div className="space-y-3">
        <button onClick={onBack} className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 normal-case tracking-normal">← Inbox</button>
        <p className="text-sm text-red-600 dark:text-red-400 normal-case tracking-normal">
          {error instanceof Error ? error.message : 'Could not load thread.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 normal-case tracking-normal">
        ← Inbox
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{thread.subject}</h2>
        {thread.clientId && thread.clientName && (
          <Link
            to={`/owner/clients/${thread.clientId}`}
            className="rounded-full bg-gray-900 dark:bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white dark:text-gray-900 hover:opacity-80"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}
          >
            {thread.clientName}
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {thread.messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-xl border p-5 ${
              message.isOwn
                ? 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
            }`}
          >
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">
                {message.isOwn ? 'You' : message.fromName}
                <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">{message.fromEmail}</span>
              </p>
              <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">
                {message.date ? new Date(message.date).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300 normal-case tracking-normal">
              {message.body || '(no text content)'}
            </p>
          </div>
        ))}
      </div>

      <ReplyBox thread={thread} />
    </div>
  )
}

function ReplyBox({ thread }: { thread: InboxThreadDetail }) {
  const [body, setBody] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [showAi, setShowAi] = useState(false)
  const [sent, setSent] = useState(false)
  const reply = useReplyToThread()
  const generateDraft = useGenerateDraft()

  const otherParty = thread.messages.find((m) => !m.isOwn)

  async function handleAiDraft() {
    if (!aiPrompt.trim()) return
    const threadContext = thread.messages
      .slice(-3)
      .map((m) => `${m.isOwn ? 'Me' : m.fromName}: ${m.body.slice(0, 1500)}`)
      .join('\n---\n')

    const draft = await generateDraft.mutateAsync({
      ...(thread.clientId ? { clientId: thread.clientId } : {}),
      ...(otherParty ? { recipientName: otherParty.fromName } : {}),
      prompt: aiPrompt.trim(),
      threadContext,
    })
    setBody(draft.body)
    setShowAi(false)
    setAiPrompt('')
  }

  async function handleSend() {
    if (!body.trim()) return
    await reply.mutateAsync({ threadId: thread.id, body: body.trim() })
    setBody('')
    setSent(true)
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          Reply{otherParty ? ` to ${otherParty.fromName}` : ''}
        </p>
        <button
          onClick={() => setShowAi((v) => !v)}
          className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 normal-case tracking-normal"
        >
          {showAi ? 'Hide AI' : '✦ Draft with AI'}
        </button>
      </div>

      {showAi && (
        <div className="flex gap-2">
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleAiDraft() }}
            placeholder='What should the reply say? e.g. "Confirm we can add Friday deep cleans starting next month"'
            className={inputClass}
          />
          <button
            onClick={handleAiDraft}
            disabled={generateDraft.isPending || !aiPrompt.trim()}
            className="shrink-0 rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-40 transition-colors"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}
          >
            {generateDraft.isPending ? 'Drafting…' : 'Draft'}
          </button>
        </div>
      )}
      {generateDraft.error instanceof Error && (
        <p className="text-xs text-red-600 dark:text-red-400 normal-case tracking-normal">{generateDraft.error.message}</p>
      )}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        placeholder="Write your reply…"
        className={`${inputClass} resize-none`}
      />

      {reply.error instanceof Error && (
        <p className="text-xs text-red-600 dark:text-red-400 normal-case tracking-normal">{reply.error.message}</p>
      )}
      {sent && <p className="text-xs text-emerald-600 dark:text-emerald-400 normal-case tracking-normal">Reply sent.</p>}

      <button
        onClick={handleSend}
        disabled={reply.isPending || !body.trim()}
        className="rounded-lg bg-gray-900 dark:bg-gray-100 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-40 transition-colors"
        style={{ fontFamily: 'IBM Plex Mono, monospace' }}
      >
        {reply.isPending ? 'Sending…' : 'Send Reply'}
      </button>
    </div>
  )
}
