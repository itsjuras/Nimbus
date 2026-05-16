import { createContext, useContext, useState, type ReactNode } from 'react'

interface SidebarContextValue {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  return (
    <SidebarContext.Provider value={{ sidebarOpen, toggleSidebar: () => setSidebarOpen((v) => !v) }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within a SidebarProvider')
  return ctx
}
