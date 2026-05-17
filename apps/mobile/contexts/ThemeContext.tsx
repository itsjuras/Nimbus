import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import * as SecureStore from 'expo-secure-store'

type Scheme = 'light' | 'dark'
type Pref = Scheme | 'system'

interface ThemeValue {
  scheme: Scheme
  dark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeValue | null>(null)
const STORAGE_KEY = 'nimbus.themePref'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const [pref, setPref] = useState<Pref>('system')

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setPref(v)
    })
  }, [])

  const scheme: Scheme = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref

  function toggle() {
    const next: Pref = scheme === 'dark' ? 'light' : 'dark'
    setPref(next)
    SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {})
  }

  return (
    <ThemeContext.Provider value={{ scheme, dark: scheme === 'dark', toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
