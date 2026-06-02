import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { ShaderBackground } from '../components/ui/shader-background'
import NimbusSymbolLogo from '../assets/NimbusSymbolLogo.png'

const CALENDLY_URL = 'https://calendly.com/jurasmakselis1/30min'

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (opts: { url: string; parentElement: HTMLElement }) => void
    }
  }
}

export default function BookPage() {
  const { theme, toggle } = useTheme()
  const widgetRef = useRef<HTMLDivElement>(null)

  const calendlyUrl = theme === 'dark'
    ? `${CALENDLY_URL}?hide_gdpr_banner=1&background_color=111827&text_color=f9fafb&primary_color=f9fafb`
    : `${CALENDLY_URL}?hide_gdpr_banner=1`

  useEffect(() => {
    function init() {
      if (widgetRef.current && window.Calendly) {
        widgetRef.current.innerHTML = ''
        window.Calendly.initInlineWidget({
          url: calendlyUrl,
          parentElement: widgetRef.current,
        })
      }
    }

    const existing = document.querySelector('script[src*="calendly"]')
    if (existing) {
      init()
    } else {
      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.async = true
      script.onload = init
      document.body.appendChild(script)
    }
  }, [calendlyUrl])

  return (
    <div className="relative min-h-screen flex flex-col font-plex uppercase tracking-widest" style={{ wordSpacing: '-0.3em' }}>
      <ShaderBackground isDark={theme === 'dark'} />

      {/* Dark mode toggle — top right */}
      <div className="absolute top-4 right-6 z-20">
        <button
          onClick={toggle}
          aria-label="Toggle dark mode"
          className={`relative flex h-8 w-16 shrink-0 items-center rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}
        >
          <span className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-500 shadow transition-transform duration-300 ${theme === 'dark' ? 'translate-x-9' : 'translate-x-1'}`}>
            {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
          </span>
        </button>
      </div>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-16 pb-6">
        <div className="w-full max-w-3xl flex flex-col items-center">
          <Link to="/"><img src={NimbusSymbolLogo} alt="Nimbus" className="mb-6 h-16 w-auto animate-pulse-glow" /></Link>
          <h1 className="mb-10 text-2xl font-bold text-gray-900 dark:text-gray-100">Book a Free Consultation</h1>

          <div
            ref={widgetRef}
            className="w-full"
            style={{ minWidth: 320, height: 1100 }}
          />
        </div>
      </main>
    </div>
  )
}

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
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
