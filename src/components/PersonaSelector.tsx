'use client'

import { useState } from 'react'
import { useStore } from '@/store'
import { Bot, Check, ChevronDown } from 'lucide-react'

export function PersonaSelector() {
  const { personas, currentPersona, setCurrentPersona } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const activePersona = personas.find((persona) => persona.id === currentPersona) || personas[0]

  return (
    <div className="relative space-y-2">
      <label className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Mode</label>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-left transition hover:border-white/15 hover:bg-white/[0.06]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-300/20 bg-sky-300/10 text-sky-100">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{activePersona.name}</p>
            <p className="text-xs text-slate-400">Default assistant profile</p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-white/[0.09] bg-[var(--bg-panel)] shadow-2xl backdrop-blur-2xl">
            {personas.map((persona) => {
              const active = persona.id === currentPersona
              return (
                <button
                  key={persona.id}
                  onClick={() => {
                    setCurrentPersona(persona.id)
                    setIsOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-3 py-3 text-left transition ${active ? 'bg-sky-400/10 text-sky-100' : 'text-slate-300 hover:bg-white/[0.04]'}`}
                >
                  <div>
                    <p className="text-sm font-medium">{persona.name}</p>
                    <p className="text-xs text-slate-500">{persona.description}</p>
                  </div>
                  {active && <Check className="h-4 w-4 text-sky-300" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
