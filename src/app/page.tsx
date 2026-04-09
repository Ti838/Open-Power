'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { ChatArea } from '@/components/ChatArea'
import { SettingsModal } from '@/components/SettingsModal'
import { useStore } from '@/store'
import { useEasterEggs } from '@/hooks/useEasterEggs'
import { useApiAutoDetect } from '@/hooks/useApiAutoDetect'

export default function Home() {
  const {
    theme,
    showSettings,
    setShowSettings,
    isHydrated
  } = useStore()

  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Initialize easter eggs
  useEasterEggs()

  // Auto-detect self-hosted API server at same origin
  useApiAutoDetect()

  // Sync theme class to <html>
  useEffect(() => {
    const root = document.documentElement
    const allThemes = ['light','power','dark','neon','sunset','forest','ocean','sakura','midnight','terminal',
      'matrix','hacker','glyph','minimal'] // include old names for migration
    root.classList.remove(...allThemes.map(t => `theme-${t}`))
    root.classList.add(`theme-${theme}`)
    root.setAttribute('lang', 'en')
    root.classList.remove('lang-bn')
  }, [theme])

  // Don't render until hydrated to prevent mismatch
  if (!isHydrated) {
    return (
      <div className={`theme-${theme} min-h-screen flex items-center justify-center`} style={{ background: 'var(--gradient-hero)' }}>
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-lg font-medium shadow-2xl backdrop-blur-xl">
          <span className="loading-dots">Loading Open Power</span>
        </div>
      </div>
    )
  }

  return (
    <main className={`theme-${theme} min-h-screen flex relative overflow-hidden`}
      style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {theme === 'terminal' && (
        <div className="scanlines pointer-events-none absolute inset-0 z-50" />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col">
        <ChatArea />
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </main>
  )
}
