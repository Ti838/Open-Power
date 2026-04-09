'use client'

import { useMemo, useState } from 'react'
import { useStore } from '@/store'
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  MessageSquareText,
  Settings,
  Trash2,
} from 'lucide-react'
import { PersonaSelector } from './PersonaSelector'
import { ModelSelector } from './ModelSelector'
import { AppLogo } from './BrandMarks'
import { useTranslation } from '@/hooks/useTranslation'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const {
    conversations,
    currentConversationId,
    createConversation,
    selectConversation,
    deleteConversation,
    setShowSettings,
  } = useStore()

  const t = useTranslation()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const groupedConversations = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000

    const sorted = [...conversations].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))

    const today = sorted.filter((c) => (c.updatedAt || c.createdAt) >= startOfToday)
    const yesterday = sorted.filter((c) => {
      const ts = c.updatedAt || c.createdAt
      return ts >= startOfYesterday && ts < startOfToday
    })
    const older = sorted.filter((c) => (c.updatedAt || c.createdAt) < startOfYesterday)

    return [
      { label: 'Today', items: today },
      { label: 'Yesterday', items: yesterday },
      { label: 'Older', items: older },
    ]
  }, [conversations])

  return (
    <>
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[var(--bg-panel)]/90 shadow-2xl backdrop-blur-xl transition-all hover:border-sky-400/30 hover:bg-white/10 hover:shadow-sky-400/10"
          aria-label="Open sidebar"
        >
          <PanelLeftOpen className="h-5 w-5 text-slate-300" />
        </button>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[300px] shrink-0 border-r border-[var(--border)] bg-[var(--bg-panel)]/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 md:relative ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:border-r-0'
        }`}
      >
        <div className={`flex h-full flex-col ${isOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>

          {/* Header */}
          <div className="border-b border-[var(--border)] px-4 pb-4 pt-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Logo mark */}
                <div className="group relative h-10 w-10 shrink-0 transition-transform hover:scale-105 active:scale-95">
                  <AppLogo className="h-10 w-10 rounded-2xl shadow-[0_0_20px_-5px_rgba(56,189,248,0.35)]" />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div>
                  <p className="theme-text text-sm font-semibold tracking-wide">{t('sidebar.appName')}</p>
                  <p className="theme-secondary text-[11px]">{t('sidebar.tagline')}</p>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--accent)] text-[var(--text-muted)] transition hover:bg-[var(--accent)]/80 hover:text-[var(--text)]"
                aria-label="Close sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={createConversation}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-400/15 bg-sky-400/8 px-4 py-2.5 text-sm font-medium text-sky-100 transition-all hover:border-sky-400/30 hover:bg-sky-400/15 hover:shadow-[0_0_16px_-4px_rgba(56,189,248,0.3)]"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              {t('sidebar.newChat')}
            </button>
          </div>

          {/* Model + Persona */}
          <div className="space-y-3 border-b border-[var(--border)] px-4 py-4">
            <ModelSelector />
            <PersonaSelector />
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="theme-secondary mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.14em]">
              Workspace Chats
            </div>
            {conversations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-10 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <MessageSquareText className="h-5 w-5 text-slate-500" />
                </div>
                <p className="theme-text text-sm font-medium">{t('sidebar.noChats')}</p>
                <p className="theme-secondary mt-1.5 text-xs leading-relaxed">{t('sidebar.noChatsHint')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedConversations.map((group) => (
                  group.items.length > 0 ? (
                    <div key={group.label} className="space-y-1">
                      <div className="theme-secondary px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
                        {group.label}
                      </div>
                      {group.items.map((conv) => {
                        const active = conv.id === currentConversationId
                        return (
                          <button
                            key={conv.id}
                            onClick={() => selectConversation(conv.id)}
                            onMouseEnter={() => setHoveredId(conv.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all ${
                              active
                                ? 'border-sky-400/20 bg-sky-400/[0.08] shadow-[0_0_20px_-10px_rgba(56,189,248,0.5)]'
                                : 'border-transparent bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-sky-400/15 text-sky-200' : 'bg-white/5 text-slate-400'}`}>
                              <MessageSquareText className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="theme-text truncate text-sm font-medium">{conv.title}</p>
                              <p className="theme-secondary truncate text-[11px]">{conv.model.split('/').pop()}</p>
                            </div>
                            {hoveredId === conv.id && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteConversation(conv.id)
                                }}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ) : null
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--border)] px-4 py-4">
            <button
              onClick={() => setShowSettings(true)}
              className="theme-text flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium transition-all hover:bg-[var(--accent)]/80"
            >
              <Settings className="h-4 w-4" />
              {t('sidebar.settings')}
            </button>
            <div className="theme-secondary mt-3 text-center text-[11px]">
              {t('sidebar.footer')} · v0.1
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
