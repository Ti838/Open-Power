'use client'

import { useEffect, useState } from 'react'

type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg'

const PROVIDER_LOGOS: Record<string, { url: string; color: string; initials: string }> = {
  Google: { url: 'https://cdn.simpleicons.org/google/4285F4', color: '#4285f4', initials: 'G' },
  xAI: { url: 'https://cdn.simpleicons.org/x/111111', color: '#111111', initials: 'xA' },
  Anthropic: { url: 'https://cdn.simpleicons.org/anthropic/d97757', color: '#d97757', initials: 'An' },
  OpenAI: { url: 'https://cdn.simpleicons.org/openai/10a37f', color: '#10a37f', initials: 'OA' },
  DeepSeek: { url: 'https://cdn.simpleicons.org/deepseek/4d6bfe', color: '#4d6bfe', initials: 'DS' },
  Alibaba: { url: 'https://cdn.simpleicons.org/alibabacloud/ff6a00', color: '#ff6a00', initials: 'AL' },
  Meta: { url: 'https://cdn.simpleicons.org/meta/0668e1', color: '#0668e1', initials: 'M' },
  Mistral: { url: 'https://cdn.simpleicons.org/mistralai/ff7000', color: '#ff7000', initials: 'Mi' },
  Perplexity: { url: 'https://cdn.simpleicons.org/perplexity/20b8cd', color: '#20b8cd', initials: 'Px' },
  NVIDIA: { url: 'https://cdn.simpleicons.org/nvidia/76b900', color: '#76b900', initials: 'NV' },
  Xiaomi: { url: 'https://cdn.simpleicons.org/xiaomi/ff6900', color: '#ff6900', initials: 'Xi' },
  Cohere: { url: '', color: '#39594d', initials: 'Co' },
  'Moonshot AI': { url: '', color: '#6366f1', initials: 'KM' },
  MiniMax: { url: '', color: '#8b5cf6', initials: 'MM' },
  'Nous Research': { url: '', color: '#f59e0b', initials: 'NR' },
  StepFun: { url: '', color: '#06b6d4', initials: 'SF' },
}

export function AppLogo({ className = '' }: { className?: string }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [])

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-sky-400/20 bg-[linear-gradient(145deg,rgba(56,189,248,0.18),rgba(15,23,42,0.92))] ${className}`}
    >
      {!failed ? (
        <img
          src="/logo.png"
          alt="Open Power"
          className="h-full w-full object-contain p-1.5"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[0.65rem] font-black uppercase tracking-[0.24em] text-sky-100">
          OP
        </span>
      )}
    </div>
  )
}

export function ProviderMark({ provider, size = 'sm' }: { provider: string; size?: BrandLogoSize }) {
  const info = PROVIDER_LOGOS[provider]
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [provider])

  const outerSize = size === 'xs' ? 'h-5 w-5' : size === 'sm' ? 'h-8 w-8' : size === 'md' ? 'h-9 w-9' : 'h-10 w-10'
  const innerSize = size === 'xs' ? 'h-3 w-3 text-[9px]' : size === 'sm' ? 'h-4 w-4 text-[10px]' : size === 'md' ? 'h-5 w-5 text-[11px]' : 'h-6 w-6 text-xs'

  if (info?.url && !failed) {
    return (
      <div className={`relative flex ${outerSize} shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.06]`}>
        <img
          src={info.url}
          alt={`${provider} logo`}
          className={`${innerSize} object-contain`}
          onError={() => setFailed(true)}
        />
      </div>
    )
  }

  const initials = info?.initials ?? provider.slice(0, 2).toUpperCase()
  const color = info?.color ?? '#94a3b8'

  return (
    <div
      className={`flex ${outerSize} shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold uppercase tracking-wide`}
      style={{ background: `${color}18`, color, borderColor: `${color}33` }}
    >
      <span className={innerSize}>{initials}</span>
    </div>
  )
}

export { PROVIDER_LOGOS }