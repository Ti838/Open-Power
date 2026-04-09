'use client'

import { useStore } from '@/store'
import { Zap, Sparkles, Command, Cpu, Gauge, Check } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { AppLogo, ProviderMark, PROVIDER_LOGOS } from './BrandMarks'
import { ModelSelector } from './ModelSelector'

interface WelcomeScreenProps {
  onOpenSettings: () => void
}

export function WelcomeScreen({ onOpenSettings }: WelcomeScreenProps) {
  const { 
    apiKey, 
    ultraplinianEnabled, 
    setUltraplinianEnabled,
    ultraplinianTier,
    setUltraplinianTier,
    setConsortiumEnabled,
    ultraplinianApiUrl,
    ultraplinianApiKey
  } = useStore()
  const t = useTranslation()

  const proxyMode = !apiKey && !!ultraplinianApiUrl && !!ultraplinianApiKey

  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center sm:py-20">
      {/* Animated Background Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Brand Badge */}
        <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 pl-2.5 pr-4 py-1.5 backdrop-blur-xl">
          <AppLogo className="h-5 w-5 rounded-full" />
          <span className="text-xs font-bold uppercase tracking-widest text-sky-300">
            {t('welcome.badge')}
          </span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
          {t('welcome.headline')}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
          {t('welcome.subheadline')}
        </p>

        {/* Direct model picker on main view */}
        <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl">
          <ModelSelector />
        </div>

        {/* Tier Cards */}
        <div className="mx-auto mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <TierCard
            icon={<Cpu className="h-5 w-5 text-slate-400" />}
            title={t('welcome.tierFast')}
            description="Minimal latency, core models."
            onClick={() => {
              setUltraplinianEnabled(true)
              setUltraplinianTier('fast')
              setConsortiumEnabled(false)
            }}
            active={ultraplinianEnabled && ultraplinianTier === 'fast'}
          />
          <TierCard
            icon={<Cpu className="h-5 w-5 text-blue-400" />}
            title={t('welcome.tierStandard')}
            description="Balanced speed and quality."
            onClick={() => {
              setUltraplinianEnabled(true)
              setUltraplinianTier('standard')
              setConsortiumEnabled(false)
            }}
            active={ultraplinianEnabled && ultraplinianTier === 'standard'}
          />
          <TierCard
            icon={<Gauge className="h-5 w-5 text-sky-400" />}
            title={t('welcome.tierSmart')}
            description="3 top models race for speed."
            onClick={() => {
              setUltraplinianEnabled(true)
              setUltraplinianTier('smart')
              setConsortiumEnabled(false)
            }}
            active={ultraplinianEnabled && ultraplinianTier === 'smart'}
          />
          <TierCard
            icon={<Zap className="h-5 w-5 text-purple-400" />}
            title={t('welcome.tierPower')}
            description="High-density reasoning race."
            onClick={() => {
              setUltraplinianEnabled(true)
              setUltraplinianTier('power')
              setConsortiumEnabled(false)
            }}
            active={ultraplinianEnabled && ultraplinianTier === 'power'}
          />
          <TierCard
            icon={<Sparkles className="h-5 w-5 text-emerald-400" />}
            title={t('welcome.tierUltra')}
            description="5+ models orchestrated."
            onClick={() => {
              setUltraplinianEnabled(true)
              setUltraplinianTier('ultra')
              setConsortiumEnabled(false)
            }}
            active={ultraplinianEnabled && ultraplinianTier === 'ultra'}
          />
        </div>

        {/* Setup Status / CTA */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {(!apiKey && !proxyMode) ? (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-slate-950 shadow-2xl transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Command className="h-4 w-4" />
              {t('welcome.setupApi')}
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-6 py-4 backdrop-blur-xl">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400">
                <Check className="h-3.5 w-3.5 text-slate-950 font-bold" />
              </div>
              <span className="text-sm font-semibold text-emerald-300">
                {proxyMode ? 'Network Proxy Active' : 'API Service Ready'}
              </span>
            </div>
          )}
        </div>

        {/* Provider Logos */}
        <div className="mt-20">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-8">
            Powered by World Class Intelligence
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {Object.entries(PROVIDER_LOGOS).map(([name, data]) => (
              <div
                key={name}
                className="flex items-center gap-2 rounded-full border px-3 py-2 shadow-[0_0_20px_-18px_rgba(255,255,255,0.2)] transition-colors hover:bg-white/[0.05]"
                style={{
                  borderColor: `${data.color}33`,
                  background: `linear-gradient(135deg, ${data.color}18, rgba(255,255,255,0.03))`,
                }}
              >
                <ProviderMark provider={name} size="sm" />
                <span className="text-[11px] font-medium text-slate-200">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TierCard({ 
  icon, 
  title, 
  description, 
  onClick, 
  active 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  onClick: () => void; 
  active: boolean 
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start rounded-3xl border p-6 text-left transition-all duration-300 ${
        active 
          ? 'border-sky-400/40 bg-sky-400/10 shadow-[0_0_40px_-15px_rgba(56,189,248,0.4)]' 
          : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
      }`}
    >
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border ${active ? 'border-sky-400/30 bg-sky-400/20' : 'border-white/10 bg-white/5'}`}>
        {icon}
      </div>
      <h3 className="mb-2 text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
      <p className="text-xs leading-relaxed text-slate-500">{description}</p>
      {active && (
        <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-sky-400 uppercase tracking-tighter">
          <div className="h-1 w-1 rounded-full bg-sky-400" />
          Active Mode
        </div>
      )}
    </button>
  )
}
