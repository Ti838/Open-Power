'use client'

import { useState } from 'react'
import { useStore } from '@/store'
import { Check, ChevronDown, Search } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { ProviderMark, PROVIDER_LOGOS } from './BrandMarks'

interface ModelInfo {
  id: string
  name: string
  provider: string
  description: string
  context: string
}

const MODELS: ModelInfo[] = [
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Strong reasoning + coding', context: '1M' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Fast and efficient', context: '1M' },
  { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro', provider: 'Google', description: 'Frontier multimodal reasoning', context: '1M' },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'Google', description: 'Fast agentic model', context: '1M' },
  { id: 'x-ai/grok-4', name: 'Grok 4', provider: 'xAI', description: 'Frontier reasoning', context: '256K' },
  { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast', provider: 'xAI', description: 'Fast reasoning', context: '2M' },
  { id: 'x-ai/grok-code-fast-1', name: 'Grok Code Fast', provider: 'xAI', description: 'Fast coding model', context: '128K' },
  { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', description: 'Best balance of speed + quality', context: '200K' },
  { id: 'anthropic/claude-opus-4.6', name: 'Claude Opus 4.6', provider: 'Anthropic', description: 'Latest flagship model', context: '200K' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Reliable workhorse', context: '200K' },
  { id: 'openai/gpt-5', name: 'GPT-5', provider: 'OpenAI', description: 'OpenAI flagship', context: '128K' },
  { id: 'openai/gpt-5.2', name: 'GPT-5.2', provider: 'OpenAI', description: 'Strong flagship model', context: '128K' },
  { id: 'openai/gpt-5.3-chat', name: 'GPT-5.3 Chat', provider: 'OpenAI', description: 'Latest non-reasoning flagship', context: '128K' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Reliable workhorse', context: '128K' },
  { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2', provider: 'DeepSeek', description: 'Strong low-cost model', context: '128K' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', description: 'Reasoning-focused model', context: '128K' },
  { id: 'qwen/qwen3.5-plus-02-15', name: 'Qwen 3.5 Plus', provider: 'Alibaba', description: 'Latest Qwen flagship', context: '131K' },
  { id: 'qwen/qwen3-coder', name: 'Qwen3 Coder 480B', provider: 'Alibaba', description: 'Frontier coding MoE', context: '262K' },
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', provider: 'Meta', description: 'Latest Meta flagship', context: '128K' },
  { id: 'meta-llama/llama-4-scout', name: 'Llama 4 Scout', provider: 'Meta', description: 'Efficient Meta model', context: '128K' },
  { id: 'google/gemma-3-27b-it', name: 'Gemma 3 27B', provider: 'Google', description: 'Open multimodal model', context: '128K' },
  { id: 'mistralai/mistral-large-2512', name: 'Mistral Large 3', provider: 'Mistral', description: 'Large multimodal MoE', context: '262K' },
  { id: 'mistralai/mistral-medium-3.1', name: 'Mistral Medium 3.1', provider: 'Mistral', description: 'Balanced Mistral model', context: '128K' },
  { id: 'moonshotai/kimi-k2.5', name: 'Kimi K2.5', provider: 'Moonshot AI', description: 'Native multimodal reasoning', context: '256K' },
  { id: 'perplexity/sonar', name: 'Perplexity Sonar', provider: 'Perplexity', description: 'Web-grounded answers', context: '128K' },
  { id: 'minimax/minimax-m2.5', name: 'MiniMax M2.5', provider: 'MiniMax', description: 'Agentic coding focused', context: '205K' },
  { id: 'nvidia/nemotron-3-super-120b-a12b', name: 'Nemotron 3 Super', provider: 'NVIDIA', description: 'Long-context hybrid model', context: '262K' },
  { id: 'nousresearch/hermes-4-70b', name: 'Hermes 4 70B', provider: 'Nous Research', description: 'Open model with strong coverage', context: '128K' },
  { id: 'stepfun/step-3.5-flash', name: 'Step 3.5 Flash', provider: 'StepFun', description: 'Fast open MoE', context: '256K' },
  { id: 'xiaomi/mimo-v2-pro', name: 'MiMo-V2 Pro', provider: 'Xiaomi', description: 'Large MoE programming model', context: '1M' },
]

export function ModelSelector() {
  const { defaultModel, setDefaultModel } = useStore()
  const t = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const activeModel = MODELS.find((m) => m.id === defaultModel) || MODELS[0]
  const filteredModels = MODELS.filter((m) =>
    `${m.name} ${m.provider} ${m.description}`.toLowerCase().includes(query.toLowerCase())
  )

  // Group models by provider
  const grouped = filteredModels.reduce<Record<string, ModelInfo[]>>((acc, m) => {
    if (!acc[m.provider]) acc[m.provider] = []
    acc[m.provider].push(m)
    return acc
  }, {})

  return (
    <div className="relative space-y-1.5">
      <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
        {t('sidebar.model')}
      </label>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm transition-all hover:border-white/15 hover:bg-white/[0.06]"
      >
        <div className="flex items-center gap-2.5">
          <ProviderMark provider={activeModel.provider} size="sm" />
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-medium text-white">{activeModel.name}</p>
            <p className="truncate text-[11px] text-slate-500">{activeModel.provider}</p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-[20px] border border-white/[0.09] bg-[var(--bg-panel)] shadow-2xl backdrop-blur-2xl">
            {/* Search */}
            <div className="border-b border-white/[0.07] p-3">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('common.search')}
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Model list */}
            <div className="max-h-80 overflow-y-auto p-2">
              {Object.keys(grouped).length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">{t('common.noResults')}</div>
              ) : (
                Object.entries(grouped).map(([provider, models]) => (
                  <div key={provider} className="mb-1">
                    {/* Provider group header */}
                    <div className="mb-1 mt-2 flex items-center gap-2 px-3">
                      <ProviderMark provider={provider} size="xs" />
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{provider}</span>
                    </div>
                    {models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => { setDefaultModel(model.id); setIsOpen(false) }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                          defaultModel === model.id
                            ? 'bg-sky-400/10 text-white'
                            : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">{model.name}</span>
                            <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-400">
                              {model.context}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500">{model.description}</p>
                        </div>
                        {defaultModel === model.id && <Check className="h-3.5 w-3.5 shrink-0 text-sky-300" />}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export { MODELS, PROVIDER_LOGOS }
