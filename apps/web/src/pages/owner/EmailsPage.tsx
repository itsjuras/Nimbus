import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SidebarToggle } from '../../components/ui/SidebarToggle'
import { InboxTab } from '../../components/emails/InboxTab'
import { useClients } from '../../hooks/useClients'
import { useGenerateDraft, useSendEmail, useGmailStatus, useDisconnectGmail } from '../../hooks/useEmails'
import { useTheme } from '../../hooks/useTheme'

type Step = 'compose' | 'draft'
type Tab = 'inbox' | 'compose'

export default function EmailsPage() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(searchParams.get('gmail') ? 'inbox' : 'compose')
  const { data: gmailStatus } = useGmailStatus()
  const disconnectGmail = useDisconnectGmail()
  const [step, setStep] = useState<Step>('compose')
  const [clientId, setClientId] = useState('')
  const [showClientPicker, setShowClientPicker] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sentMessage, setSentMessage] = useState('')

  const { data: clients = [] } = useClients()
  const generateDraft = useGenerateDraft()
  const sendEmail = useSendEmail()
  const { theme, toggle } = useTheme()

  const selectedClient = clients.find((c) => c.id === clientId)

  async function handleGenerate() {
    if (!clientId || !prompt.trim()) return
    setSentMessage('')
    const draft = await generateDraft.mutateAsync({ clientId, prompt: prompt.trim() })
    setSubject(draft.subject)
    setBody(draft.body)
    setStep('draft')
  }

  async function handleSend() {
    if (!clientId || !subject.trim() || !body.trim()) return
    await sendEmail.mutateAsync({ clientId, subject: subject.trim(), body: body.trim() })
    setSentMessage(`Email sent to ${selectedClient?.contactEmail ?? selectedClient?.name ?? 'client'}.`)
    setStep('compose')
    setPrompt('')
    setSubject('')
    setBody('')
  }

  function handleBack() {
    setStep('compose')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Emails</h1>
        <div className="flex items-center gap-3">
          <SidebarToggle />
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className={`relative flex h-8 w-16 shrink-0 items-center rounded-full transition-colors duration-300 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          >
            <span
              className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-500 shadow transition-transform duration-300 ${
                theme === 'dark' ? 'translate-x-9' : 'translate-x-1'
              }`}
            >
              {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
            </span>
          </button>
        </div>
      </div>

      {sentMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 px-5 py-4">
          <span className="text-emerald-600 dark:text-emerald-400 text-sm normal-case tracking-normal">{sentMessage}</span>
          <button onClick={() => setSentMessage('')} className="ml-auto text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 text-lg leading-none">×</button>
        </div>
      )}

      {searchParams.get('gmail') === 'error' && (
        <div className="mb-6 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-5 py-4">
          <span className="text-sm text-red-600 dark:text-red-400 normal-case tracking-normal">
            Gmail connection failed — please try again.
          </span>
        </div>
      )}

      {/* Tabs + Gmail account line */}
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1">
            {(['inbox', 'compose'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-5 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                  tab === t
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {t}
              </button>
            ))}
          </div>
          {gmailStatus?.connected && (
            <p className="ml-auto text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">
              {gmailStatus.email}
              <button
                onClick={() => disconnectGmail.mutate()}
                disabled={disconnectGmail.isPending}
                className="ml-2 underline hover:text-gray-600 dark:hover:text-gray-300"
              >
                Disconnect
              </button>
            </p>
          )}
        </div>

        {tab === 'inbox' && <InboxTab gmailStatus={gmailStatus} />}
      </div>

      <div className={`mx-auto max-w-2xl ${tab !== 'compose' ? 'hidden' : ''}`}>
        {step === 'compose' ? (
          <ComposeStep
            clients={clients}
            clientId={clientId}
            showClientPicker={showClientPicker}
            prompt={prompt}
            onClientChange={setClientId}
            onOpenPicker={() => setShowClientPicker(true)}
            onClosePicker={() => setShowClientPicker(false)}
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
            isGenerating={generateDraft.isPending}
            error={generateDraft.error instanceof Error ? generateDraft.error.message : null}
          />
        ) : (
          <DraftStep
            clientName={selectedClient?.name ?? ''}
            clientEmail={selectedClient?.contactEmail ?? ''}
            subject={subject}
            body={body}
            onSubjectChange={setSubject}
            onBodyChange={setBody}
            onBack={handleBack}
            onSend={handleSend}
            isSending={sendEmail.isPending}
            error={sendEmail.error instanceof Error ? sendEmail.error.message : null}
          />
        )}
      </div>
    </div>
  )
}

// ── Step 1: Compose ───────────────────────────────────────────────────────────

function ComposeStep({
  clients,
  clientId,
  showClientPicker,
  prompt,
  onClientChange,
  onOpenPicker,
  onClosePicker,
  onPromptChange,
  onGenerate,
  isGenerating,
  error,
}: {
  clients: { id: string; name: string; contactEmail: string | null }[]
  clientId: string
  showClientPicker: boolean
  prompt: string
  onClientChange: (id: string) => void
  onOpenPicker: () => void
  onClosePicker: () => void
  onPromptChange: (v: string) => void
  onGenerate: () => void
  isGenerating: boolean
  error: string | null
}) {
  const selectedClient = clients.find((c) => c.id === clientId)

  return (
    <div className="space-y-6">
      {showClientPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClosePicker} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-5 py-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-gray-100" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Select Client</h3>
              <button type="button" onClick={onClosePicker} className="text-xl leading-none text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">×</button>
            </div>
            <div className="max-h-72 overflow-y-auto p-3 space-y-1">
              {clients.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onClientChange(c.id); onClosePicker() }}
                  className="w-full rounded-xl px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{c.name}</p>
                  {c.contactEmail && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal mt-0.5">{c.contactEmail}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-5">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
            To
          </p>
          {selectedClient ? (
            <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{selectedClient.name}</p>
                {selectedClient.contactEmail && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal mt-0.5">{selectedClient.contactEmail}</p>
                )}
              </div>
              <button type="button" onClick={() => onClientChange('')} className="ml-3 text-xl leading-none text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">×</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenPicker}
              className="w-full rounded-xl border border-dashed border-gray-300 dark:border-gray-700 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors text-center"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              + Select Client
            </button>
          )}
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            What should the email say?
          </p>
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={5}
            placeholder={`Describe what you want the email to cover. For example:\n"Follow up on last week's cleaning, mention we noticed the AC filter needs attention, and ask if they'd like to add a monthly deep clean."`}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 normal-case tracking-normal">{error}</p>
      )}

      <button
        onClick={onGenerate}
        disabled={isGenerating || !clientId || !prompt.trim()}
        className="w-full rounded-xl bg-gray-900 dark:bg-gray-100 py-3.5 text-sm font-bold uppercase tracking-widest text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        style={{ fontFamily: 'IBM Plex Mono, monospace' }}
      >
        {isGenerating ? (
          <>
            <SpinnerIcon />
            Generating Draft…
          </>
        ) : (
          <>
            <SparkleIcon />
            Generate Draft
          </>
        )}
      </button>
    </div>
  )
}

// ── Step 2: Draft ─────────────────────────────────────────────────────────────

function DraftStep({
  clientName,
  clientEmail,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
  onBack,
  onSend,
  isSending,
  error,
}: {
  clientName: string
  clientEmail: string
  subject: string
  body: string
  onSubjectChange: (v: string) => void
  onBodyChange: (v: string) => void
  onBack: () => void
  onSend: () => void
  isSending: boolean
  error: string | null
}) {
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors normal-case tracking-normal"
      >
        ← Back
      </button>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        {/* Email meta */}
        <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4 space-y-3">
          <div className="flex items-baseline gap-3">
            <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>To</span>
            <span className="text-sm text-gray-700 dark:text-gray-300 normal-case tracking-normal">
              {clientName}{clientEmail ? ` <${clientEmail}>` : ''}
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Subject</span>
            <input
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 normal-case tracking-normal outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
              placeholder="Subject…"
            />
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <textarea
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            rows={14}
            className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-200 normal-case tracking-normal leading-relaxed outline-none resize-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
            placeholder="Email body…"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 normal-case tracking-normal">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 py-3.5 text-sm font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          Regenerate
        </button>
        <button
          onClick={onSend}
          disabled={isSending || !subject.trim() || !body.trim()}
          className="flex-2 flex-1 rounded-xl bg-gray-900 dark:bg-gray-100 py-3.5 text-sm font-bold uppercase tracking-widest text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          {isSending ? (
            <>
              <SpinnerIcon />
              Sending…
            </>
          ) : (
            <>
              <SendIcon />
              Send Email
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Shared styles & icons ─────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm normal-case tracking-normal text-gray-900 dark:text-gray-100 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800'


function SparkleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L13.5 8.5H19L14.5 12L16 17.5L12 14L8 17.5L9.5 12L5 8.5H10.5L12 3Z" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
