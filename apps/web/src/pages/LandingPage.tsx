import { Link } from 'react-router-dom'
import { useRef } from 'react'

export default function LandingPage() {
  const productRef = useRef<HTMLElement>(null)
  const dashboardRef = useRef<HTMLElement>(null)
  const aboutRef = useRef<HTMLElement>(null)
  const supportRef = useRef<HTMLElement>(null)

  function scrollTo(ref: React.RefObject<HTMLElement | null>) {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-xl font-bold tracking-tight">Nimbus</span>

          <nav className="hidden items-center gap-8 md:flex">
            <button onClick={() => scrollTo(productRef)} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Product
            </button>
            <button onClick={() => scrollTo(dashboardRef)} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Dashboard
            </button>
            <button onClick={() => scrollTo(aboutRef)} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              About
            </button>
            <button onClick={() => scrollTo(supportRef)} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Support
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-xs font-medium text-gray-500 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-900" />
          Built for commercial cleaning companies
        </div>

        <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-tight tracking-tight text-gray-900 md:text-6xl">
          Run your cleaning business without the chaos
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-500 leading-relaxed">
          Nimbus replaces the WhatsApp groups, paper checklists, and chasing clients for payment — with one clean tool your whole team actually uses.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/signup"
            className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            Start for free
          </Link>
          <button
            onClick={() => scrollTo(dashboardRef)}
            className="rounded-lg border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            See the dashboard →
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-400">No credit card required · Set up in under 5 minutes</p>
      </section>

      {/* ── Product ────────────────────────────────────────────────────────── */}
      <section ref={productRef} className="border-t border-gray-100 bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Product</p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              Everything your team needs, nothing they don't
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              From scheduling to client sign-off, Nimbus handles the operational side so you can focus on doing great work.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-lg">
                  {f.icon}
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard preview ──────────────────────────────────────────────── */}
      <section ref={dashboardRef} className="border-t border-gray-100 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Dashboard</p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              Every job, at a glance
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              A live Kanban board shows you exactly where every job stands — scheduled, in progress, completed, or missed — updating in real time as your crew works.
            </p>
          </div>

          {/* Browser mockup */}
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-gray-200" />
                <div className="h-3 w-3 rounded-full bg-gray-200" />
                <div className="h-3 w-3 rounded-full bg-gray-200" />
              </div>
              <div className="mx-auto flex w-64 items-center gap-2 rounded-md bg-white border border-gray-200 px-3 py-1">
                <div className="h-2 w-2 rounded-full bg-gray-300" />
                <span className="text-xs text-gray-400">app.nimbus.ca/owner/dashboard</span>
              </div>
            </div>

            {/* Dashboard UI */}
            <div className="flex bg-white">
              {/* Sidebar */}
              <div className="w-44 shrink-0 border-r border-gray-100 bg-white py-4">
                <div className="mb-6 border-b border-gray-100 px-4 pb-4">
                  <span className="text-sm font-bold text-gray-900">Nimbus</span>
                </div>
                {['Dashboard', 'Jobs', 'Clients', 'Crew', 'Invoices'].map((item, i) => (
                  <div
                    key={item}
                    className={`mx-2 mb-0.5 rounded-md px-3 py-2 text-xs font-medium ${i === 0 ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}
                  >
                    {item}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 overflow-hidden bg-gray-50 p-5">
                {/* Top bar */}
                <div className="mb-4 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 -mx-5 -mt-5 mb-5">
                  <span className="text-sm font-bold text-gray-900">Dashboard</span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-gray-900" />
                    <span className="text-xs text-gray-500">3 jobs active today</span>
                  </div>
                </div>

                {/* Kanban columns */}
                <div className="flex gap-3 overflow-hidden">
                  {kanbanColumns.map((col) => (
                    <div key={col.label} className="w-40 shrink-0">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">{col.label}</span>
                        <span className="rounded-full bg-white border border-gray-200 px-1.5 py-0.5 text-xs text-gray-400">{col.cards.length}</span>
                      </div>
                      <div className={`rounded-xl border p-2 ${col.bg} space-y-2 min-h-32`}>
                        {col.cards.map((card) => (
                          <div key={card.name} className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm">
                            <p className="text-xs font-semibold text-gray-900 leading-tight">{card.name}</p>
                            <p className="mt-0.5 text-xs text-gray-400">{card.time}</p>
                            {card.live && (
                              <div className="mt-1.5 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-gray-900 animate-pulse" />
                                <span className="text-xs text-gray-500">Live</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/signup"
              className="inline-flex rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
            >
              Try it yourself →
            </Link>
          </div>
        </div>
      </section>

      {/* ── About ──────────────────────────────────────────────────────────── */}
      <section ref={aboutRef} className="border-t border-gray-100 bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">About</p>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                Built by people who understand the job
              </h2>
              <p className="mt-5 text-gray-500 leading-relaxed">
                Commercial cleaning is a trust business. Clients don't just want clean spaces — they want proof. And owners don't just need crew — they need visibility.
              </p>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Nimbus was built to give small cleaning companies the same operational clarity that enterprise facilities teams have — without the enterprise price tag or the month-long onboarding.
              </p>
              <p className="mt-4 text-gray-500 leading-relaxed">
                We handle the software. You handle the cleaning.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-6">
                  <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                  <p className="mt-1 text-sm text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Support ────────────────────────────────────────────────────────── */}
      <section ref={supportRef} className="border-t border-gray-100 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Support</p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              We're here when you need us
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              Whether you're onboarding your first crew member or troubleshooting a webhook, we respond fast.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {supportOptions.map((s) => (
              <div key={s.title} className="rounded-2xl border border-gray-200 p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-lg">
                  {s.icon}
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">{s.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{s.description}</p>
                {s.action && (
                  <a
                    href={s.href}
                    className="mt-4 inline-block text-sm font-medium text-gray-900 hover:underline"
                  >
                    {s.action} →
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-16 rounded-2xl border border-gray-200 bg-gray-50 p-8">
            <h3 className="mb-8 text-xl font-bold text-gray-900">Common questions</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {faqs.map((faq) => (
                <div key={faq.q}>
                  <p className="mb-1 font-semibold text-gray-900 text-sm">{faq.q}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-gray-900 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Ready to bring order to your operations?
          </h2>
          <p className="mt-4 text-gray-400">
            Set up your company, invite your crew, and schedule your first job in under 10 minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/signup"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Get started for free
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-gray-700 px-6 py-3 text-sm font-semibold text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 bg-gray-900 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <span className="text-sm font-bold text-white">Nimbus</span>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Nimbus. Built for commercial cleaning companies.
          </p>
          <div className="flex gap-6 text-xs text-gray-500">
            <Link to="/login" className="hover:text-gray-300 transition-colors">Sign in</Link>
            <Link to="/signup" className="hover:text-gray-300 transition-colors">Sign up</Link>
            <a href="mailto:support@nimbus.app" className="hover:text-gray-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: '📋',
    title: 'Digital checklists',
    description: 'Build custom task lists for each client. Crew work through them on their phones — no paper, no guessing.',
  },
  {
    icon: '📍',
    title: 'Real-time job tracking',
    description: 'See every job\'s live status on a Kanban board. Know the moment a clean starts, progresses, or wraps up.',
  },
  {
    icon: '📸',
    title: 'Photo proof of work',
    description: 'Crew attach photos to checklist items. Clients get visual evidence that every task was completed properly.',
  },
  {
    icon: '👥',
    title: 'Crew management',
    description: 'Invite staff by email, assign them to jobs, and track completion — all from one place.',
  },
  {
    icon: '📄',
    title: 'Client reports',
    description: 'Completion reports are automatically emailed to clients after each job with a full checklist and photos.',
  },
  {
    icon: '💳',
    title: 'Invoicing',
    description: 'Create and send Stripe-powered invoices directly from the platform. Clients pay online, you get notified.',
  },
]

const kanbanColumns = [
  {
    label: 'Scheduled',
    bg: 'bg-gray-50 border-gray-200',
    cards: [
      { name: 'CloudBase Tech', time: 'Tomorrow 9:00am', live: false },
      { name: 'Apex Financial', time: 'Thu 8:00am', live: false },
    ],
  },
  {
    label: 'In Progress',
    bg: 'bg-gray-100 border-gray-300',
    cards: [
      { name: 'Metro Fitness', time: 'Today 8:00am', live: true },
      { name: 'Apex Financial', time: 'Today 9:30am', live: true },
    ],
  },
  {
    label: 'Completed',
    bg: 'bg-white border-gray-200',
    cards: [
      { name: 'Apex Financial', time: 'Yesterday', live: false },
      { name: 'Riverside School', time: '2 days ago', live: false },
    ],
  },
  {
    label: 'Missed',
    bg: 'bg-gray-50 border-gray-200',
    cards: [
      { name: 'CloudBase Tech', time: '6 days ago', live: false },
    ],
  },
]

const stats = [
  { value: '< 5min', label: 'Average setup time' },
  { value: '100%', label: 'Mobile-ready for crew' },
  { value: '0', label: 'Paper checklists needed' },
  { value: '24/7', label: 'Real-time visibility' },
]

const supportOptions = [
  {
    icon: '✉️',
    title: 'Email support',
    description: 'Send us a message and we\'ll get back to you within one business day — usually sooner.',
    action: 'Send a message',
    href: 'mailto:support@nimbus.app',
  },
  {
    icon: '📖',
    title: 'Documentation',
    description: 'Step-by-step guides for setting up your company, inviting crew, scheduling jobs, and more.',
    action: null,
    href: '#',
  },
  {
    icon: '🚀',
    title: 'Onboarding call',
    description: 'New to Nimbus? Book a 20-minute call and we\'ll walk you through everything live.',
    action: 'Book a call',
    href: 'mailto:support@nimbus.app?subject=Onboarding call request',
  },
]

const faqs = [
  {
    q: 'How do crew members access Nimbus?',
    a: 'You invite them by email. They set a password and immediately see their assigned jobs on mobile.',
  },
  {
    q: 'Do clients need an account?',
    a: 'No. Clients receive automated completion reports and Stripe invoice links by email — no login required.',
  },
  {
    q: 'Can I use Nimbus for multiple client locations?',
    a: 'Yes. You can manage unlimited client locations, each with its own custom checklist.',
  },
  {
    q: 'How does invoicing work?',
    a: 'Nimbus creates a Stripe invoice and emails the client a hosted payment link. When they pay, your dashboard updates automatically.',
  },
  {
    q: 'Is my data secure?',
    a: 'All data is stored in Supabase with row-level security — each company\'s data is completely isolated.',
  },
  {
    q: 'What happens if a crew member loses their phone?',
    a: 'You can sign them out remotely from the crew management page. Their job data is never stored locally.',
  },
]
