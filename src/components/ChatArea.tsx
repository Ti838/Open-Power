'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useStore } from '@/store'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { WelcomeScreen } from './WelcomeScreen'
import { ArrowDown, Droplets, Gauge, Hash, Zap, Trophy, Timer, Globe, Cpu, Activity, Search } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

const COMMAND_HISTORY_KEY = 'open-power.command-history'

type CommandItem = {
  action: string
  label: string
  hint: string
  recent?: boolean
}

export function ChatArea() {
  const {
    currentConversation,
    conversations,
    currentConversationId,
    selectConversation,
    personas,
    liquidResponseEnabled,
    setLiquidResponseEnabled,
    promptsTried,
    ultraplinianEnabled,
    consortiumEnabled,
    ultraplinianModelsResponded,
    ultraplinianModelsTotal,
    consortiumModelsCollected,
    consortiumModelsTotal,
    ultraplinianRacing,
    ultraplinianLiveModel,
    ultraplinianLiveScore,
    setUltraplinianEnabled,
    setConsortiumEnabled,
    setShowSettings,
    createConversation,
  } = useStore()

  const t = useTranslation()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [showHud, setShowHud] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const [recentCommands, setRecentCommands] = useState<string[]>([])
  const commandInputRef = useRef<HTMLInputElement>(null)

  const effectiveConversation = useMemo(() => {
    if (currentConversation) return currentConversation
    if (currentConversationId) {
      const byId = conversations.find((c) => c.id === currentConversationId)
      if (byId) return byId
    }
    return conversations[0] || null
  }, [currentConversation, currentConversationId, conversations])

  useEffect(() => {
    if (!currentConversationId && conversations.length > 0) {
      selectConversation(conversations[0].id)
    }
  }, [currentConversationId, conversations, selectConversation])

  // Derived state
  const isRacing = ultraplinianEnabled || consortiumEnabled
  const modeLabel = consortiumEnabled
    ? t('chat.modeMulti')
    : ultraplinianEnabled
    ? t('chat.modeRace')
    : t('chat.modeStandard')

  const responded = consortiumEnabled ? consortiumModelsCollected : ultraplinianModelsResponded
  const total = consortiumEnabled ? consortiumModelsTotal : ultraplinianModelsTotal
  const performanceValue = total > 0 ? `${responded}/${total}` : isRacing ? '–/–' : '1/1'
  const progressPct = total > 0 ? Math.round((responded / total) * 100) : isRacing ? 0 : 100

  const persona = useMemo(() => 
    personas.find((p) => p.id === effectiveConversation?.persona) || personas[0]
  , [personas, effectiveConversation?.persona])

  // Handlers
  const checkIfNearBottom = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return true
    return container.scrollHeight - container.scrollTop - container.clientHeight < 120
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setIsNearBottom(true)
  }, [])

  // Effects
  useEffect(() => {
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [effectiveConversation?.messages, isNearBottom])

  // Timer logic for Performance HUD
  const [raceStartTime, setRaceStartTime] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (ultraplinianRacing && !raceStartTime) {
      setRaceStartTime(Date.now())
    } else if (!ultraplinianRacing) {
      setRaceStartTime(null)
      setElapsed(0)
    }
  }, [ultraplinianRacing, raceStartTime])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (raceStartTime) {
      interval = setInterval(() => {
        setElapsed(Date.now() - raceStartTime)
      }, 100)
    }
    return () => clearInterval(interval)
  }, [raceStartTime])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMMAND_HISTORY_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed)) {
        setRecentCommands(parsed.filter((v) => typeof v === 'string').slice(0, 6))
      }
    } catch {
      // Ignore malformed local history
    }
  }, [])

  useEffect(() => {
    if (commandOpen) {
      setTimeout(() => commandInputRef.current?.focus(), 0)
    } else {
      setCommandQuery('')
    }
  }, [commandOpen])

  useEffect(() => {
    setSelectedCommandIndex(0)
  }, [commandQuery, commandOpen])

  const pushRecentCommand = useCallback((action: string) => {
    setRecentCommands((prev) => {
      const next = [action, ...prev.filter((a) => a !== action)].slice(0, 6)
      try {
        localStorage.setItem(COMMAND_HISTORY_KEY, JSON.stringify(next))
      } catch {
        // Ignore storage write errors
      }
      return next
    })
  }, [])

  const runCommand = useCallback((action: string) => {
    if (action === 'new-chat') {
      createConversation()
    } else if (action === 'focus-input') {
      const input = document.getElementById('chat-main-input') as HTMLTextAreaElement | null
      input?.focus()
    } else if (action === 'open-settings') {
      setShowSettings(true)
    } else if (action === 'standard-mode') {
      setUltraplinianEnabled(false)
      setConsortiumEnabled(false)
    } else if (action === 'speed-race-mode') {
      setUltraplinianEnabled(true)
      setConsortiumEnabled(false)
    } else if (action === 'multi-model-mode') {
      setConsortiumEnabled(true)
      setUltraplinianEnabled(false)
    } else if (action === 'toggle-hud') {
      setShowHud((prev) => !prev)
    }

    pushRecentCommand(action)
    setCommandOpen(false)
  }, [createConversation, setShowSettings, setUltraplinianEnabled, setConsortiumEnabled, pushRecentCommand])

  const commandItems = useMemo(() => {
    const items: CommandItem[] = [
      { action: 'new-chat', label: 'New Chat', hint: 'Create a fresh conversation' },
      { action: 'focus-input', label: 'Focus Input', hint: 'Jump to message composer' },
      { action: 'open-settings', label: 'Open Settings', hint: 'Configure API and behavior' },
      { action: 'standard-mode', label: 'Switch to Standard', hint: 'Single model mode' },
      { action: 'speed-race-mode', label: 'Switch to Speed Race', hint: 'Race models by score' },
      { action: 'multi-model-mode', label: 'Switch to Multi-Model', hint: 'Consortium synthesis mode' },
      { action: 'toggle-hud', label: showHud ? 'Hide HUD' : 'Show HUD', hint: 'Toggle side performance panel' },
    ]

    const q = commandQuery.trim().toLowerCase()
    const filtered = !q
      ? items
      : items.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(q))

    if (q) return filtered

    const recentLookup = new Set(recentCommands)
    const recent = recentCommands
      .map((action) => filtered.find((item) => item.action === action))
      .filter((item): item is CommandItem => Boolean(item))
      .map((item) => ({ ...item, recent: true }))

    const remaining = filtered.filter((item) => !recentLookup.has(item.action))
    return [...recent, ...remaining]
  }, [commandQuery, showHud, recentCommands])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (commandOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedCommandIndex((prev) => Math.min(prev + 1, Math.max(commandItems.length - 1, 0)))
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedCommandIndex((prev) => Math.max(prev - 1, 0))
          return
        }
        if (e.key === 'Enter' && commandItems.length > 0) {
          e.preventDefault()
          runCommand(commandItems[selectedCommandIndex].action)
          return
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setCommandOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [commandOpen, commandItems, selectedCommandIndex, runCommand])

  return (
    <div className="flex h-full min-h-0 flex-row overflow-hidden">
      {commandOpen && (
        <div className="absolute inset-0 z-[80] flex items-start justify-center bg-black/45 px-4 pt-20 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[var(--bg-panel)]/95 p-3 shadow-2xl">
            <div className="mb-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                ref={commandInputRef}
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Search commands..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
              <span className="text-[10px] text-slate-500">Esc</span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {commandItems.length > 0 ? (
                commandItems.map((item, idx) => (
                  <button
                    key={item.action}
                    onClick={() => runCommand(item.action)}
                    onMouseEnter={() => setSelectedCommandIndex(idx)}
                    className={`mb-1 flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${
                      idx === selectedCommandIndex
                        ? 'border-sky-300/30 bg-sky-300/[0.12]'
                        : 'border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-100">
                      {item.label}
                      {item.recent && (
                        <span className="ml-2 rounded-full border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-slate-400">
                          Recent
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-500">{item.hint}</span>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-4 text-sm text-slate-400">
                  No matching commands.
                </div>
              )}
            </div>
            <div className="mt-1 px-1 text-[11px] text-slate-500">Ctrl+K open · ↑↓ navigate · Enter run · Esc close</div>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col min-w-0 relative">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-elevated)]/95 px-4 py-3 backdrop-blur-2xl sm:px-6">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            {/* Conversation identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/[0.08]">
                <Zap className="h-5 w-5 text-sky-300" fill="currentColor" />
                {isRacing && ultraplinianRacing && (
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[var(--bg-elevated)] bg-emerald-400 animate-pulse" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="theme-text truncate text-base font-semibold">
                  {effectiveConversation?.title || 'Open Power Chat'}
                </h2>
                <p className="theme-secondary truncate text-[11px]">
                  {persona.name} · {effectiveConversation?.model.split('/').pop() || 'Auto-select'}
                </p>
              </div>
            </div>

            {/* HUD stats */}
            <div className="flex flex-wrap gap-2">
              <HudStat
                icon={<Gauge className="h-3.5 w-3.5" />}
                label={t('chat.mode')}
                value={modeLabel}
                active={isRacing}
                pulse={isRacing && ultraplinianRacing}
              />
              <HudStat
                icon={<Zap className="h-3.5 w-3.5" />}
                label={t('chat.performance')}
                value={performanceValue}
                progress={progressPct}
                active={isRacing}
                pulse={isRacing && ultraplinianRacing}
              />
              <HudStat
                icon={<Hash className="h-3.5 w-3.5" />}
                label={t('chat.prompts')}
                value={String(promptsTried)}
                active={false}
              />
            </div>
          </div>

          {/* Sub-toolbar */}
          <div className="mx-auto mt-3 flex w-full max-w-5xl flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setUltraplinianEnabled(false)
                setConsortiumEnabled(false)
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                !ultraplinianEnabled && !consortiumEnabled
                  ? 'border-emerald-400/25 bg-emerald-400/[0.12] text-emerald-200'
                  : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-slate-200'
              }`}
            >
              Standard
            </button>

            <button
              onClick={() => {
                setUltraplinianEnabled(true)
                setConsortiumEnabled(false)
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                ultraplinianEnabled && !consortiumEnabled
                  ? 'border-orange-400/25 bg-orange-400/[0.12] text-orange-200'
                  : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-slate-200'
              }`}
            >
              Speed Race
            </button>

            <button
              onClick={() => {
                setConsortiumEnabled(true)
                setUltraplinianEnabled(false)
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                consortiumEnabled
                  ? 'border-amber-400/25 bg-amber-400/[0.12] text-amber-200'
                  : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-slate-200'
              }`}
            >
              Multi-Model
            </button>

            <button
              onClick={() => setLiquidResponseEnabled(!liquidResponseEnabled)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                liquidResponseEnabled
                  ? 'border-sky-400/20 bg-sky-400/[0.08] text-sky-200'
                  : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-slate-200'
              }`}
            >
              <Droplets className="h-3 w-3" />
              {t('chat.liquid')} {liquidResponseEnabled ? t('chat.on') : t('chat.off')}
            </button>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 text-xs text-slate-500">
              {t('chat.versionNotice')}
            </div>
            <button
              onClick={() => setShowHud((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 text-xs text-slate-500 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-slate-300"
            >
              {showHud ? 'Hide HUD' : 'Show HUD'}
            </button>
          </div>
        </header>

        {/* ── Content Area ──────────────────────────────────────────────── */}
        <div
          ref={scrollContainerRef}
          onScroll={() => setIsNearBottom(checkIfNearBottom())}
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            {!effectiveConversation ? (
              <WelcomeScreen onOpenSettings={() => setShowSettings(true)} />
            ) : effectiveConversation.messages.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {effectiveConversation.messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Scroll to bottom */}
        {!isNearBottom && effectiveConversation && effectiveConversation.messages.length > 0 && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-28 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[var(--bg-panel)]/90 shadow-xl backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.08]"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        )}

        <ChatInput />
      </div>

      {/* ── Side Performance HUD ────────────────────────────────────── */}
      {/* ── Side Performance HUD ────────────────────────────────────── */}
      {showHud && (
      <aside className="hidden xl:flex w-60 flex-col border-l border-white/[0.07] bg-[var(--bg-panel)]/40 backdrop-blur-3xl shrink-0">
        <div className="flex flex-col h-full">
          <div className="px-6 py-6 border-b border-white/[0.07]">
            <div className="flex items-center gap-3 mb-1">
              <Activity className="h-5 w-5 text-sky-400" />
              <h3 className="font-bold text-white tracking-tight uppercase text-sm">Performance HUD</h3>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Real-time model synthesis tracker</p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
            {/* Live Timer */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Timer className="h-4 w-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Race Time</span>
                </div>
                <span className={`font-mono text-sm ${ultraplinianRacing ? 'text-emerald-400 glow-primary' : 'text-slate-500'}`}>
                  {(elapsed / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05]">
                <div 
                  className={`h-full transition-all duration-300 ${ultraplinianRacing ? 'bg-gradient-to-r from-sky-500 to-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]' : 'bg-slate-700'}`}
                  style={{ width: `${ultraplinianRacing ? Math.min(100, (elapsed / 45000) * 100) : responded > 0 ? 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Coverage Grid */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Globe className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Global Coverage</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex flex-col items-center justify-center text-center group hover:bg-white/[0.05] transition-all">
                  <span className="text-xl font-bold text-white mb-1 group-hover:scale-110 transition-transform">{responded}</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-tighter">Models Sync</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex flex-col items-center justify-center text-center group hover:bg-white/[0.05] transition-all">
                  <span className="text-xl font-bold text-white mb-1 group-hover:scale-110 transition-transform">{total || '-'}</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-tighter">Live Target</span>
                </div>
              </div>
            </div>

            {/* Live Leaderboard/Winner */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Trophy className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Current Leader</span>
              </div>
              <div className={`p-5 rounded-2xl border transition-all duration-500 ${ultraplinianLiveModel ? 'border-sky-400/30 bg-sky-400/10 shadow-[0_0_30px_-10px_rgba(56,189,248,0.3)]' : 'border-white/[0.05] bg-white/[0.02]'}`}>
                {ultraplinianLiveModel ? (
                  <div className="fade-in">
                    <div className="flex items-center gap-2 mb-2">
                       <Cpu className="h-3 w-3 text-sky-300" />
                       <span className="text-[10px] font-bold text-sky-200 uppercase truncate">{ultraplinianLiveModel.split('/').pop()}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-2xl font-bold text-white">{(ultraplinianLiveScore || 0).toFixed(1)}<span className="text-xs text-slate-400 ml-1">/10</span></div>
                      <div className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">LEADING</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-slate-600">
                    <Zap className="h-6 w-6 mb-2 opacity-20" />
                    <span className="text-[10px] font-medium italic">Waiting for models...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Feature Status */}
            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Liquid Refine</span>
                <div className={`h-1.5 w-1.5 rounded-full ${liquidResponseEnabled ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 'bg-slate-700'}`} />
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Multi-Orch</span>
                <div className={`h-1.5 w-1.5 rounded-full ${consortiumEnabled ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'bg-slate-700'}`} />
              </div>
            </div>
          </div>

          <div className="mt-auto px-6 py-6 border-t border-white/[0.07]">
             <div className="p-4 rounded-xl bg-sky-400/[0.05] border border-sky-400/10">
                <p className="text-[10px] leading-relaxed text-sky-200/60 font-medium">
                  {isRacing ? "Racing mode active. Best response is promoted live." : "Standard mode active. Single model direct response."}
                </p>
             </div>
          </div>
        </div>
      </aside>
      )}
    </div>
  )
}

/* ── HUD Stat card ─────────────────────────────────────────────────── */
function HudStat({
  icon,
  label,
  value,
  active,
  pulse,
  progress,
}: {
  icon: React.ReactNode
  label: string
  value: string
  active: boolean
  pulse?: boolean
  progress?: number
}) {
  return (
    <div
      className={`flex min-w-[120px] items-center gap-2.5 rounded-xl border px-3 py-2 transition-all ${
        active
          ? `border-sky-400/20 bg-sky-400/[0.06] ${pulse ? 'hud-race-active' : ''}`
          : 'border-white/[0.07] bg-white/[0.03]'
      }`}
    >
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] ${active ? 'text-sky-300' : 'text-slate-500'}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
        <p className={`hud-counter text-sm font-bold ${active ? 'text-sky-200' : 'text-white'}`}>{value}</p>
        {progress !== undefined && (
          <div className="mt-0.5 h-0.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full progress-fill ${active ? 'bg-sky-400' : 'bg-slate-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Empty state ───────────────────────────────────────────────────── */
function EmptyState() {
  const { currentConversationId, addMessage } = useStore()
  const t = useTranslation()

  const prompts = [
    'Compare GPT-5 vs Claude Opus vs Gemini for code generation',
    'Write a clean system design for a URL shortener',
    'Explain transformer architecture intuitively',
    'Draft a product spec for an AI-powered note-taking app',
  ]

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-sky-400/20 bg-sky-400/[0.08] shadow-[0_0_40px_-12px_rgba(56,189,248,0.4)]">
        <Zap className="h-8 w-8 text-sky-300" fill="currentColor" />
      </div>
      <h3 className="text-xl font-semibold text-white">{t('chat.empty')}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {t('chat.emptyHint')}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => currentConversationId && addMessage(currentConversationId, { role: 'user', content: prompt })}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-slate-300 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
