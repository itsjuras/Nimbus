import { useState, useRef } from 'react'
import { SidebarToggle } from '../../components/ui/SidebarToggle'
import { useTheme } from '../../hooks/useTheme'

const DEMO_CLIENTS = [
  { id: 'c1', name: 'Apex Financial',    email: 'facilities@apexfinancial.com' },
  { id: 'c2', name: 'Metro Fitness',     email: 'ops@metrofitness.com' },
  { id: 'c3', name: 'Riverside School',  email: 'admin@riversideschool.edu' },
  { id: 'c4', name: 'Oakwood Offices',   email: 'building@oakwoodoffices.com' },
]

const DEMO_DRAFT = {
  subject: 'Cleaning Service Follow-Up — Apex Financial',
  body: `Hi Sarah,

I hope this message finds you well. I wanted to follow up on last Tuesday's evening clean at your Apex Financial offices.

Our team completed a full walkthrough of all three floors, including the conference rooms, break areas, and restrooms. Please let us know if anything was missed or if any areas need extra attention going forward.

We'd love to get next month's schedule locked in. Would the same Tuesday slot work for you, or would you prefer a different day?

Looking forward to hearing from you.

Warm regards,
Tom
Brightline Cleaning Co.`,
}

type Step = 'compose' | 'draft'

export default function DemoEmailsPage() {
  const { theme, toggle } = useTheme()
  const [step, setStep] = useState<Step>('compose')
  const [clientId, setClientId] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sentBanner, setSentBanner] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedClient = DEMO_CLIENTS.find((c) => c.id === clientId)

  function handleGenerate() {
    if (!clientId || !prompt.trim()) return
    setGenerating(true)
    timerRef.current = setTimeout(() => {
      setSubject(DEMO_DRAFT.subject.replace('Apex Financial', selectedClient?.name ?? 'Client'))
      setBody(DEMO_DRAFT.body)
      setGenerating(false)
      setStep('draft')
    }, 1400)
  }

  function handleSend() {
    setSentBanner(true)
    setStep('compose')
    setPrompt('')
    setSubject('')
    setBody('')
    setClientId('')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Emails</h1>
        <div className="flex items-center gap-3">
          <SidebarToggle />
          <button onClick={toggle} aria-label="Toggle dark mode" className={`relative flex h-8 w-16 shrink-0 items-center rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <span className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-500 shadow transition-transform duration-300 ${theme === 'dark' ? 'translate-x-9' : 'translate-x-1'}`}>
              {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
            </span>
          </button>
        </div>
      </div>

      {/* Sent banner */}
      {sentBanner && (
        <div className="mx-auto mb-6 max-w-2xl flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Email sent to {selectedClient?.email ?? 'client'}.
          </p>
          <button onClick={() => setSentBanner(false)} className="text-emerald-400 hover:text-emerald-600 text-lg leading-none">×</button>
        </div>
      )}

      {step === 'compose' ? (
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Card */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-6">
            {/* To */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">To</p>
              {selectedClient ? (
                <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedClient.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{selectedClient.email}</p>
                  </div>
                  <button onClick={() => setClientId('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none ml-4">×</button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPicker(true)}
                  className="w-full rounded-xl border border-dashed border-gray-300 dark:border-gray-600 px-4 py-3 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                >
                  + Select Client
                </button>
              )}
            </div>

            {/* Prompt */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">What should the email say?</p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                placeholder={`Describe what you want the email to cover.\n\nFor example: "Follow up on last week's cleaning and ask if they'd like to schedule next month."`}
                className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 transition"
              />
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !clientId || !prompt.trim()}
            className="w-full rounded-xl bg-gray-900 dark:bg-gray-100 px-4 py-4 text-xs font-bold uppercase tracking-widest text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Spinner />
                Generating…
              </>
            ) : (
              '✦ Generate Draft'
            )}
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-4">
          <button onClick={() => setStep('compose')} className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            ← Back
          </button>

          {/* Draft card */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            {/* Meta */}
            <div className="border-b border-gray-200 dark:border-gray-800 px-5 py-4 space-y-3">
              <div className="flex items-center gap-4">
                <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">To</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {selectedClient?.name}{selectedClient?.email ? ` <${selectedClient.email}>` : ''}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Subject</span>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex-1 text-sm text-gray-900 dark:text-gray-100 bg-transparent focus:outline-none placeholder-gray-400"
                  placeholder="Subject…"
                />
              </div>
            </div>

            {/* Body */}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="w-full resize-none px-5 py-4 text-sm text-gray-900 dark:text-gray-100 bg-transparent leading-relaxed focus:outline-none placeholder-gray-400"
              placeholder="Email body…"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep('compose')}
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Regenerate
            </button>
            <div className="relative flex-1 group">
              <button
                onClick={handleSend}
                className="w-full rounded-xl bg-gray-900 dark:bg-gray-100 px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Send Email
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Email sending is simulated in the demo.
          </p>
        </div>
      )}

      {/* Client picker overlay */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-5"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-900 dark:text-gray-100">Select Client</p>
              <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none">×</button>
            </div>
            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
              {DEMO_CLIENTS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setClientId(c.id); setShowPicker(false) }}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{c.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{c.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
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
