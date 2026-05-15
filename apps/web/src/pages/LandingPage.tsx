import { Link } from 'react-router-dom'
import { useRef, useCallback, type ReactNode } from 'react'
import { useTheme } from '../hooks/useTheme'
import { ShaderBackground } from '../components/ui/shader-background'
import { GlowCard } from '../components/ui/glow-card'
import NimbusTextLogo from '../assets/NimbusTextLogo.png'
import NimbusSymbolLogo from '../assets/NimbusSymbolLogo.png'

export default function LandingPage() {
  const { theme, toggle } = useTheme()
  const productRef = useRef<HTMLElement>(null)
  const dashboardRef = useRef<HTMLElement>(null)
  const aboutRef = useRef<HTMLElement>(null)
  const supportRef = useRef<HTMLElement>(null)

  const scrollTo = useCallback((ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <div className="min-h-screen font-plex uppercase tracking-widest text-gray-900 dark:text-gray-100" style={{ wordSpacing: '-0.3em' }}>
      <ShaderBackground isDark={theme === 'dark'} />
      <div className="pointer-events-none fixed inset-0 z-[-1] bg-white/60 dark:bg-black/60" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/90">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-3 items-center px-10">
          <img src={NimbusTextLogo} alt="Nimbus" className="h-5 w-auto" />

          <nav className="hidden items-center justify-center gap-8 md:flex">
            {[
              { label: 'Product', ref: productRef },
              { label: 'Dashboard', ref: dashboardRef },
              { label: 'About', ref: aboutRef },
              { label: 'Support', ref: supportRef },
            ].map(({ label, ref }) => (
              <button
                key={label}
                onClick={() => scrollTo(ref)}
                className="text-sm uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-5">
            <Link to="/login" className="text-sm uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Get started
            </Link>

            {/* Theme toggle — rightmost */}
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
      </header>

      {/* ── Hero — transparent so shader shows through ─────────────────────── */}
      <section className="flex min-h-[90vh] flex-col items-center justify-center px-6 text-center">
        <img
          src={NimbusSymbolLogo}
          alt="Nimbus"
          className="mb-12 h-20 w-auto animate-pulse-glow"
          style={{ filter: 'drop-shadow(0 0 12px rgba(100, 160, 255, 0.8)) drop-shadow(0 0 32px rgba(80, 140, 255, 0.4))' }}
        />

        <h1 className="mx-auto max-w-5xl text-5xl font-bold leading-[1.05] text-gray-950 dark:text-gray-50 md:text-6xl lg:text-[5.5rem]">
          Run your cleaning business without the chaos
        </h1>

        <div className="mt-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/signup"
            className="rounded-lg border border-gray-900 bg-gray-900/90 px-10 py-4 text-xs font-bold tracking-widest text-white transition-all hover:bg-gray-900 dark:border-white dark:bg-white/90 dark:text-gray-900 dark:hover:bg-white"
          >
            Start for free
          </Link>
          <Link
            to="/demo"
            className="rounded-lg border border-gray-400/50 bg-white/30 px-10 py-4 text-xs font-bold tracking-widest text-gray-800 transition-all hover:border-gray-700 hover:bg-white/60 dark:border-gray-600/50 dark:bg-black/20 dark:text-gray-200 dark:hover:border-gray-400 dark:hover:bg-black/40"
          >
            See the dashboard →
          </Link>
        </div>
      </section>

      {/* ── Product ────────────────────────────────────────────────────────── */}
      <section ref={productRef} className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Product</p>
            <p className="mx-auto max-w-2xl text-3xl font-bold leading-tight md:text-4xl">
              Nimbus handles the operational side so you can focus on doing great work.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <GlowCard key={f.title} customSize glowColor="blue" className="p-6 w-full h-auto aspect-auto">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-lg dark:bg-gray-700">
                  {f.icon}
                </div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{f.description}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard preview ──────────────────────────────────────────────── */}
      <section ref={dashboardRef} className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Dashboard</p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Every job, at a glance
            </h2>
          </div>

          {/* Browser mockup */}
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200 dark:border-gray-700 dark:shadow-gray-950">
            {/* Browser chrome — 3-col grid so URL bar is truly centered */}
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-600" />
                <div className="h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-600" />
                <div className="h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-600" />
              </div>
              <div className="flex items-center justify-center">
                <div className="flex w-64 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1 dark:border-gray-600 dark:bg-gray-700">
                  <div className="h-2 w-2 shrink-0 rounded-full bg-gray-300 dark:bg-gray-500" />
                  <span className="truncate text-xs text-gray-400 dark:text-gray-500">app.nimbus.ca/owner/dashboard</span>
                </div>
              </div>
              <div className="flex gap-1.5 opacity-0">
                <div className="h-3 w-3 rounded-full" />
                <div className="h-3 w-3 rounded-full" />
                <div className="h-3 w-3 rounded-full" />
              </div>
            </div>

            {/* Dashboard UI */}
            <div className="flex bg-white dark:bg-gray-900">
              {/* Sidebar */}
              <div className="w-44 shrink-0 border-r border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="flex h-11 items-center border-b border-gray-100 px-4 dark:border-gray-800">
                  <span className="text-sm font-bold">Nimbus</span>
                </div>
                <div className="p-2 pt-3">
                  {['Dashboard', 'Jobs', 'Clients', 'Crew', 'Invoices'].map((item, i) => (
                    <div
                      key={item}
                      className={`mb-0.5 rounded-md px-3 py-2 text-xs font-medium ${
                        i === 0
                          ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                          : 'text-gray-400 dark:text-gray-600'
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main content */}
              <div className="flex flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
                {/* Content top bar — same height as sidebar header */}
                <div className="flex h-11 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 dark:border-gray-800 dark:bg-gray-900">
                  <span className="text-sm font-bold">Dashboard</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gray-900 dark:bg-gray-100" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">3 jobs active today</span>
                  </div>
                </div>

                {/* Kanban */}
                <div className="flex gap-3 p-5">
                  {kanbanColumns.map((col) => (
                    <div key={col.label} className="flex-1 min-w-0">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{col.label}</span>
                        <span className="rounded-full border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500">{col.cards.length}</span>
                      </div>
                      <div className={`min-h-32 space-y-2 rounded-xl border p-2 ${col.bg} ${col.bgDark}`}>
                        {col.cards.map((card) => (
                          <div key={card.name} className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <p className="truncate text-xs font-semibold leading-tight text-gray-900 dark:text-gray-100">{card.name}</p>
                            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{card.time}</p>
                            {card.live && (
                              <div className="mt-1.5 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-900 dark:bg-gray-100" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">Live</span>
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
              to="/demo"
              className="inline-flex rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Test it out →
            </Link>
          </div>
        </div>
      </section>

      {/* ── About ──────────────────────────────────────────────────────────── */}
      <section ref={aboutRef} className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">About</p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Built by people who understand the job
              </h2>
              <p className="mt-5 leading-relaxed text-gray-500 dark:text-gray-400">
                Commercial cleaning is a trust business. Clients don't just want clean spaces, they want proof. And owners don't just need crew, they need visibility.
              </p>
              <p className="mt-4 leading-relaxed text-gray-500 dark:text-gray-400">
                Nimbus was built to give small cleaning companies the same operational clarity that enterprise facilities teams have, without the enterprise price tag or the month-long onboarding.
              </p>
              <p className="mt-4 leading-relaxed text-gray-500 dark:text-gray-400">
                We handle the software. You handle the cleaning.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <GlowCard key={s.label} customSize glowColor="blue" className="w-full h-auto aspect-auto flex flex-col items-center justify-center p-6 text-center">
                  <p className="text-3xl font-bold">{s.value}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
                </GlowCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Support ────────────────────────────────────────────────────────── */}
      <section ref={supportRef} className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Support</p>
            <h2 className="mb-8 text-3xl font-bold tracking-tight md:text-4xl">
              We're here when you need us
            </h2>
            <a
              href="mailto:support@nimbus.app"
              className="inline-flex rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Email us →
            </a>
          </div>

          <div className="p-8">
            <h3 className="mb-8 text-xl font-bold">Common questions</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {faqs.map((faq) => (
                <GlowCard key={faq.q} customSize glowColor="blue" className="w-full h-auto aspect-auto p-5">
                  <p className="mb-2 text-sm font-semibold">{faq.q}</p>
                  <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{faq.a}</p>
                </GlowCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to bring order to your operations?
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Set up your company, invite your crew, and schedule your first job in under 10 minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/signup"
              className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Get started for free
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-600 transition-colors hover:border-gray-500 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-100"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white/90 px-6 py-10 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/90">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <img src={NimbusSymbolLogo} alt="Nimbus" className="h-8 w-auto" />
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Nimbus. Built for commercial cleaning companies.
          </p>
          <div className="flex gap-6 text-xs text-gray-500">
            <Link to="/login" className="transition-colors hover:text-gray-900 dark:hover:text-gray-100">Sign in</Link>
            <Link to="/signup" className="transition-colors hover:text-gray-900 dark:hover:text-gray-100">Sign up</Link>
            <a href="mailto:support@nimbus.app" className="transition-colors hover:text-gray-900 dark:hover:text-gray-100">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}

// ── Feature / support icons ───────────────────────────────────────────────────

function ChecklistIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function FileTextIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function CreditCardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}


// ── Theme icons ───────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
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

// ── Data ──────────────────────────────────────────────────────────────────────

const features: { icon: ReactNode; title: string; description: string }[] = [
  {
    icon: <ChecklistIcon />,
    title: 'Digital checklists',
    description: 'Build custom task lists for each client. Crew work through them on their phones — no paper, no guessing.',
  },
  {
    icon: <ActivityIcon />,
    title: 'Real-time job tracking',
    description: "See every job's live status on a Kanban board. Know the moment a clean starts, progresses, or wraps up.",
  },
  {
    icon: <CameraIcon />,
    title: 'Photo proof of work',
    description: 'Crew attach photos to checklist items. Clients get visual evidence that every task was completed properly.',
  },
  {
    icon: <UsersIcon />,
    title: 'Crew management',
    description: 'Invite staff by email, assign them to jobs, and track completion — all from one place.',
  },
  {
    icon: <FileTextIcon />,
    title: 'Client reports',
    description: 'Completion reports are automatically emailed to clients after each job with a full checklist and photos.',
  },
  {
    icon: <CreditCardIcon />,
    title: 'Invoicing',
    description: 'Create and send Stripe-powered invoices directly from the platform. Clients pay online, you get notified.',
  },
]

const kanbanColumns = [
  {
    label: 'Scheduled',
    bg: 'bg-gray-50 border-gray-200',
    bgDark: 'dark:bg-gray-900 dark:border-gray-700',
    cards: [
      { name: 'CloudBase Tech', time: 'Tomorrow 9:00am', live: false },
      { name: 'Apex Financial', time: 'Thu 8:00am', live: false },
    ],
  },
  {
    label: 'In Progress',
    bg: 'bg-gray-100 border-gray-300',
    bgDark: 'dark:bg-gray-800 dark:border-gray-600',
    cards: [
      { name: 'Metro Fitness', time: 'Today 8:00am', live: true },
      { name: 'Apex Financial', time: 'Today 9:30am', live: true },
    ],
  },
  {
    label: 'Completed',
    bg: 'bg-white border-gray-200',
    bgDark: 'dark:bg-gray-900 dark:border-gray-700',
    cards: [
      { name: 'Apex Financial', time: 'Yesterday', live: false },
      { name: 'Riverside School', time: '2 days ago', live: false },
    ],
  },
  {
    label: 'Missed',
    bg: 'bg-gray-50 border-gray-200',
    bgDark: 'dark:bg-gray-900 dark:border-gray-700',
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
    a: "All data is stored in Supabase with row-level security — each company's data is completely isolated.",
  },
  {
    q: 'What happens if a crew member loses their phone?',
    a: 'You can sign them out remotely from the crew management page. Their job data is never stored locally.',
  },
]
