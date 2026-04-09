'use client'

import { useState, useRef, useEffect, useCallback, type KeyboardEvent as ReactKeyboardEvent, type ChangeEvent } from 'react'
import { useStore } from '@/store'
import { sendMessageViaProxy, streamMessage, streamUltraplinian, streamConsortium } from '@/lib/openrouter'
import { recordChatEvent } from '@/lib/telemetry'
import { classifyPrompt } from '@/lib/classify'
import { classifyWithLLM } from '@/lib/classify-llm'
import type { ClassificationResult } from '@/lib/classify'
import { computeAutoTuneParams, getContextLabel, getStrategyLabel, PARAM_META } from '@/lib/autotune'
import type { AutoTuneResult } from '@/lib/autotune'
import { applyParseltongue, detectTriggers } from '@/lib/parseltongue'
import { Send, Loader2, StopCircle, SlidersHorizontal, ImagePlus, X, Mic, MicOff } from 'lucide-react'

const QUICK_PROMPTS = [
  'Summarize this topic in simple bullets',
  'Give me a step-by-step plan for today',
  'Rewrite this text to sound professional',
  'Debug this code and explain the root cause',
  'Create a checklist I can follow quickly',
]

type VoiceLocale = 'auto' | 'en-US' | 'bn-BD'

type VoiceRecognitionEvent = {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string }
  }>
}

type VoiceRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: VoiceRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechCtor = new () => VoiceRecognition

type WindowWithSpeech = Window & {
  SpeechRecognition?: SpeechCtor
  webkitSpeechRecognition?: SpeechCtor
}

export function ChatInput() {
  const {
    currentConversationId,
    currentConversation,
    addMessage,
    updateMessageContent,
    apiKey,
    isStreaming,
    setIsStreaming,
    personas,
    stmModules,
    noLogMode,
    autoTuneEnabled,
    autoTuneStrategy,
    autoTuneOverrides,
    autoTuneLastResult,
    setAutoTuneLastResult,
    feedbackState,
    memories,
    memoriesEnabled,
    parseltongueConfig,
    customSystemPrompt,
    useCustomSystemPrompt,
    // Liquid Response (universal)
    liquidResponseEnabled,
    liquidMinDelta,
    incrementPromptsTried,
    // ULTRAPLINIAN
    ultraplinianEnabled,
    ultraplinianTier,
    ultraplinianApiUrl,
    ultraplinianApiKey,
    ultraplinianRacing,
    ultraplinianModelsResponded,
    ultraplinianModelsTotal,
    ultraplinianLiveModel,
    ultraplinianLiveScore,
    setUltraplinianLive,
    setUltraplinianProgress,
    setUltraplinianRacing,
    resetUltraplinianRace,
    // CONSORTIUM
    consortiumEnabled,
    consortiumTier,
    consortiumPhase,
    consortiumModelsCollected,
    consortiumModelsTotal,
    setConsortiumPhase,
    setConsortiumProgress,
    resetConsortium,
  } = useStore()

  const [input, setInput] = useState('')
  const [attachedImage, setAttachedImage] = useState<string | null>(null)
  const [attachedImageName, setAttachedImageName] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [voiceError, setVoiceError] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [voiceLocale, setVoiceLocale] = useState<VoiceLocale>('auto')
  const [pushToTalkActive, setPushToTalkActive] = useState(false)
  const [showTuneDetails, setShowTuneDetails] = useState(false)
  const [parseltonguePreview, setParseltonguePreview] = useState<{
    triggersFound: string[]
    transformed: boolean
  } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const recognitionRef = useRef<VoiceRecognition | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const speechWindow = window as WindowWithSpeech
    const speechCtor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    setVoiceSupported(Boolean(speechCtor))
  }, [])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  // Live preview: compute autotune params as user types (debounced)
  const [livePreview, setLivePreview] = useState<AutoTuneResult | null>(null)
  useEffect(() => {
    if (!autoTuneEnabled || !input.trim()) {
      setLivePreview(null)
      return
    }

    const timer = setTimeout(() => {
      const history = (currentConversation?.messages || []).map(m => ({
        role: m.role,
        content: m.content
      }))

      const result = computeAutoTuneParams({
        strategy: autoTuneStrategy,
        message: input.trim(),
        conversationHistory: history,
        overrides: autoTuneOverrides,
        learnedProfiles: feedbackState.learnedProfiles
      })

      setLivePreview(result)
    }, 300)

    return () => clearTimeout(timer)
  }, [input, autoTuneEnabled, autoTuneStrategy, autoTuneOverrides, currentConversation, personas, feedbackState])

  // Live preview: detect triggers as user types (debounced)
  useEffect(() => {
    if (!parseltongueConfig.enabled || !input.trim()) {
      setParseltonguePreview(null)
      return
    }

    const timer = setTimeout(() => {
      const triggers = detectTriggers(input.trim(), parseltongueConfig.customTriggers)
      if (triggers.length > 0) {
        setParseltonguePreview({
          triggersFound: triggers,
          transformed: true
        })
      } else {
        setParseltonguePreview(null)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [input, parseltongueConfig])

  // Proxy mode: when no personal OpenRouter key, route through self-hosted API
  const proxyMode = !apiKey && !!ultraplinianApiUrl && !!ultraplinianApiKey

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')

    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are supported.')
      e.target.value = ''
      return
    }

    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      setUploadError('Image is too large. Maximum size is 5 MB.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        setAttachedImage(result)
        setAttachedImageName(file.name)
      } else {
        setUploadError('Failed to read image file.')
      }
    }
    reader.onerror = () => setUploadError('Failed to read image file.')
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const clearImageAttachment = () => {
    setAttachedImage(null)
    setAttachedImageName('')
    setUploadError('')
  }

  const resolveVoiceLocale = useCallback((): string => {
    if (voiceLocale !== 'auto') return voiceLocale
    return document.documentElement.lang === 'bn' ? 'bn-BD' : 'en-US'
  }, [voiceLocale])

  const stopVoiceTyping = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsListening(false)
    setPushToTalkActive(false)
  }, [])

  const startVoiceTyping = useCallback((fromPushToTalk = false) => {
    setVoiceError('')

    if (!voiceSupported) {
      setVoiceError('Voice typing is not supported in this browser.')
      return
    }

    if (isListening) return

    try {
      const speechWindow = window as WindowWithSpeech
      const speechCtor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
      if (!speechCtor) {
        setVoiceError('Voice typing is not supported in this browser.')
        return
      }
      const recognition = new speechCtor()
      recognition.lang = resolveVoiceLocale()
      recognition.continuous = true
      recognition.interimResults = false

      recognition.onresult = (event: VoiceRecognitionEvent) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          if (event.results[i].isFinal) {
            transcript += `${event.results[i][0].transcript} `
          }
        }

        const clean = transcript.trim()
        if (clean) {
          setInput((prev) => (prev ? `${prev} ${clean}` : clean))
        }
      }

      recognition.onerror = () => {
        setVoiceError('Voice typing failed. Please try again.')
        setIsListening(false)
        setPushToTalkActive(false)
      }

      recognition.onend = () => {
        setIsListening(false)
        setPushToTalkActive(false)
      }

      recognitionRef.current = recognition
      recognition.start()
      setIsListening(true)
      setPushToTalkActive(fromPushToTalk)
    } catch {
      setVoiceError('Unable to start voice typing on this device.')
      setIsListening(false)
      setPushToTalkActive(false)
    }
  }, [isListening, voiceSupported, resolveVoiceLocale])

  const toggleVoiceTyping = () => {
    if (isListening) {
      stopVoiceTyping()
      return
    }

    startVoiceTyping(false)
  }

  const handleMobileHoldStart = () => {
    if (isStreaming || (!apiKey && !proxyMode) || !voiceSupported || isListening) return
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
    startVoiceTyping(true)
  }

  const handleMobileHoldEnd = () => {
    if (!pushToTalkActive) return
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(8)
    }
    stopVoiceTyping()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (!(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v')) return
      if (isStreaming || (!apiKey && !proxyMode) || !voiceSupported) return

      e.preventDefault()
      startVoiceTyping(true)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!(e.key.toLowerCase() === 'v')) return
      if (pushToTalkActive) {
        e.preventDefault()
        stopVoiceTyping()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [apiKey, proxyMode, isStreaming, voiceSupported, pushToTalkActive, startVoiceTyping, stopVoiceTyping])

  const handleSubmit = async () => {
    const textInput = input.trim()
    if ((!textInput && !attachedImage) || isStreaming) return
    if (!apiKey && !proxyMode) return

    if (isListening) {
      stopVoiceTyping()
    }

    if (attachedImage && (proxyMode || ultraplinianEnabled || consortiumEnabled)) {
      setUploadError('Image upload currently works in standard OpenRouter mode only.')
      return
    }

    let activeId = currentConversationId
    if (!activeId) {
      const { createConversation } = useStore.getState()
      activeId = createConversation()
    }

    const originalMessage = textInput
    const imagePayload = attachedImage
    const imageName = attachedImageName || 'image'

    setInput('')
    setAttachedImage(null)
    setAttachedImageName('')
    setUploadError('')
    setIsStreaming(true)
    incrementPromptsTried()

    // Apply parseltongue obfuscation if enabled
    const parseltongueResult = applyParseltongue(originalMessage, parseltongueConfig)
    const userMessage = parseltongueResult.transformedText

    const userVisibleContent = originalMessage || 'Image attached.'

    // Add user message (show original to user, send transformed to API)
    addMessage(activeId, {
      role: 'user',
      content: userVisibleContent,  // Show original message in UI
      ...(imagePayload ? { imageUrl: imagePayload, imageName } : {}),
    })

    // Get current state for model/persona
    const state = useStore.getState()
    const conv = state.conversations.find(c => c.id === activeId)
    const persona = personas.find(p => p.id === conv?.persona) || personas[0]
    const model = conv?.model || 'anthropic/claude-3-opus'

    // Build memory context if enabled
    const activeMemories = memoriesEnabled ? memories.filter(m => m.active) : []
    let memoryContext = ''
    if (activeMemories.length > 0) {
      const facts = activeMemories.filter(m => m.type === 'fact')
      const preferences = activeMemories.filter(m => m.type === 'preference')
      const instructions = activeMemories.filter(m => m.type === 'instruction')

      memoryContext = '\n\n<user_memory>\n'
      if (facts.length > 0) {
        memoryContext += '## About the User\n'
        facts.forEach(f => { memoryContext += `- ${f.content}\n` })
      }
      if (preferences.length > 0) {
        memoryContext += '\n## User Preferences\n'
        preferences.forEach(p => { memoryContext += `- ${p.content}\n` })
      }
      if (instructions.length > 0) {
        memoryContext += '\n## Always Follow\n'
        instructions.forEach(i => { memoryContext += `- ${i.content}\n` })
      }
      memoryContext += '</user_memory>\n'
    }

    // Build system prompt with the app prompt + memory
    const basePrompt = useCustomSystemPrompt ? customSystemPrompt : (persona.systemPrompt || persona.coreDirective || '')
    const systemPrompt = basePrompt + memoryContext

    // Build messages array
    const latestUserMessage = imagePayload
      ? {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: userMessage || 'Please analyze this image.' },
            { type: 'image_url' as const, image_url: { url: imagePayload } },
          ],
        }
      : { role: 'user' as const, content: userMessage }

    const messages = [
      // System prompt from persona + memory
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      // Conversation history
      ...((conv?.messages || []).map(m => {
        if (m.role === 'user' && m.imageUrl) {
          return {
            role: 'user' as const,
            content: [
              { type: 'text' as const, text: m.content || 'Please analyze this image.' },
              { type: 'image_url' as const, image_url: { url: m.imageUrl } },
            ],
          }
        }

        return {
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }
      })),
      // New user message
      latestUserMessage
    ]

    // Classify prompt for research telemetry
    const classificationSeed = userMessage || 'image upload'
    let promptClassification: ClassificationResult = classifyPrompt(classificationSeed)
    const llmClassifyPromise = apiKey
      ? classifyWithLLM(classificationSeed, apiKey).then(result => { promptClassification = result })
      : Promise.resolve()

    // Compute AutoTune parameters if enabled
    let tuneResult: AutoTuneResult | null = null
    if (autoTuneEnabled) {
      const history = (conv?.messages || []).map(m => ({
        role: m.role,
        content: m.content
      }))

      tuneResult = computeAutoTuneParams({
        strategy: autoTuneStrategy,
        message: userMessage || 'analyze image',
        conversationHistory: history,
        overrides: autoTuneOverrides,
        learnedProfiles: feedbackState.learnedProfiles
      })

      setAutoTuneLastResult(tuneResult)
    }

    try {
      abortControllerRef.current = new AbortController()

      // ── CONSORTIUM PATH: Hive-mind synthesis ──────────────────────
      if (consortiumEnabled && ultraplinianApiUrl && ultraplinianApiKey && !ultraplinianEnabled) {
        const assistantMsgId = addMessage(activeId, {
          role: 'assistant',
          content: '',
          model: 'consortium',
          persona: persona.id,
        })

        setConsortiumPhase('collecting')
        resetConsortium()

        await streamConsortium(
          {
            messages,
            openrouterApiKey: apiKey,
            apiBaseUrl: ultraplinianApiUrl,
            godmodeApiKey: ultraplinianApiKey,
            tier: consortiumTier,
            stm_modules: stmModules.filter(m => m.enabled).map(m => m.id),
            liquid: liquidResponseEnabled,
            liquid_min_delta: liquidMinDelta,
            signal: abortControllerRef.current.signal,
          },
          {
            onStart: (data) => {
              setConsortiumProgress(0, data.models_queried)
              updateMessageContent(activeId!, assistantMsgId,
                `*Collecting from ${data.models_queried} models...*`)
            },
            onModelResult: (data) => {
              setConsortiumProgress(data.models_collected, data.models_total)
              if (!liquidResponseEnabled) {
                updateMessageContent(activeId!, assistantMsgId,
                  `*Collecting responses... ${data.models_collected}/${data.models_total} models*`)
              }
            },
            onBestResponse: (data) => {
              updateMessageContent(activeId!, assistantMsgId, data.content, {
                model: `${data.model} (${data.score}pts — synthesizing...)`,
              })
            },
            onSynthesisStart: (data) => {
              setConsortiumPhase('synthesizing')
              if (!liquidResponseEnabled) {
                updateMessageContent(activeId!, assistantMsgId,
                  `*${data.responses_collected} models collected. Orchestrator synthesizing ground truth...*`)
              }
            },
            onComplete: (data) => {
              const finalContent = data.synthesis || ''
              const orchModel = data.orchestrator?.model || 'consortium'
              setConsortiumPhase('done')

              updateMessageContent(activeId!, assistantMsgId, finalContent, {
                model: `consortium (${orchModel})`,
                ...(tuneResult ? {
                  autoTuneParams: tuneResult.params,
                  autoTuneContext: tuneResult.detectedContext,
                  autoTuneContextScores: tuneResult.contextScores,
                  autoTunePatternMatches: tuneResult.patternMatches,
                  autoTuneDeltas: tuneResult.paramDeltas,
                } : {}),
              })
            },
            onError: (error) => {
              updateMessageContent(activeId!, assistantMsgId,
                `CONSORTIUM error: ${error}`)
              setConsortiumPhase('idle')
            },
          },
        )

        setIsStreaming(false)
        setConsortiumPhase('idle')
        return
      }

      // ── ULTRAPLINIAN PATH: Multi-model race with liquid response ──
      if (ultraplinianEnabled && ultraplinianApiUrl && ultraplinianApiKey) {
        const assistantMsgId = addMessage(activeId, {
          role: 'assistant',
          content: '',
          model: 'ultraplinian',
          persona: persona.id,
        })

        setUltraplinianRacing(true)
        resetUltraplinianRace()

        const collectedResponses: Array<{ model: string; content: string; score: number; duration_ms: number }> = []

        await streamUltraplinian(
          {
            messages,
            openrouterApiKey: apiKey,
            apiBaseUrl: ultraplinianApiUrl,
            godmodeApiKey: ultraplinianApiKey,
            tier: ultraplinianTier,
            stm_modules: stmModules.filter(m => m.enabled).map(m => m.id),
            liquid: liquidResponseEnabled,
            liquid_min_delta: liquidMinDelta,
            signal: abortControllerRef.current.signal,
          },
          {
            onRaceStart: (data) => {
              setUltraplinianProgress(0, data.models_queried)
              updateMessageContent(activeId!, assistantMsgId,
                `*Racing ${data.models_queried} models...*`)
            },
            onModelResult: (data) => {
              setUltraplinianProgress(data.models_responded, data.models_total)
            },
            onLeaderChange: (data) => {
              collectedResponses.push({
                model: data.model,
                content: data.content,
                score: data.score,
                duration_ms: data.duration_ms,
              })
              setUltraplinianLive(data.content, data.model, data.score)
              updateMessageContent(activeId!, assistantMsgId, data.content, {
                model: data.model,
              })
            },
            onComplete: async (data) => {
              const finalContent = data.response || ''
              const winnerModel = data.winner?.model || 'ultraplinian'

              const rankingResponses = (data.race?.rankings ?? [])
                .filter(r => r.success && r.content)
                .map(r => ({
                  model: r.model,
                  content: r.content!,
                  score: r.score,
                  duration_ms: r.duration_ms,
                  isWinner: r.model === winnerModel,
                }))
                .sort((a, b) => b.score - a.score)

              const raceResponses = rankingResponses.length > 0
                ? rankingResponses
                : collectedResponses.map(r => ({
                    ...r,
                    isWinner: r.model === winnerModel,
                  }))

              updateMessageContent(activeId!, assistantMsgId, finalContent, {
                model: winnerModel,
                raceResponses: raceResponses.length > 1 ? raceResponses : undefined,
                ...(tuneResult ? {
                  autoTuneParams: tuneResult.params,
                  autoTuneContext: tuneResult.detectedContext,
                  autoTuneContextScores: tuneResult.contextScores,
                  autoTunePatternMatches: tuneResult.patternMatches,
                  autoTuneDeltas: tuneResult.paramDeltas,
                } : {}),
              })
              resetUltraplinianRace()

              await llmClassifyPromise

              recordChatEvent({
                mode: 'ultraplinian',
                model: winnerModel,
                duration_ms: data.race?.total_duration_ms || 0,
                response_length: finalContent.length,
                success: true,
                pipeline: {
                  autotune: autoTuneEnabled,
                  parseltongue: parseltongueConfig.enabled,
                  stm_modules: stmModules.filter(m => m.enabled).map(m => m.id),
                  strategy: autoTuneStrategy,
                  godmode: true,
                },
                ...(tuneResult ? {
                  autotune: {
                    detected_context: tuneResult.detectedContext,
                    confidence: tuneResult.confidence,
                  },
                } : {}),
                parseltongue: parseltongueConfig.enabled ? {
                  triggers_found: parseltongueResult.triggersFound.length,
                  technique: parseltongueConfig.technique,
                  intensity: parseltongueConfig.intensity,
                } : undefined,
                ultraplinian: {
                  tier: ultraplinianTier,
                  models_queried: data.race?.models_queried || 0,
                  models_succeeded: data.race?.models_succeeded || 0,
                  winner_model: winnerModel,
                  winner_score: data.winner?.score || 0,
                  total_duration_ms: data.race?.total_duration_ms || 0,
                },
                classification: promptClassification,
                persona: persona.id,
                prompt_length: originalMessage.length,
                conversation_depth: conv?.messages?.length || 0,
                memory_count: activeMemories.length,
                no_log: noLogMode,
                parseltongue_transformed: parseltongueResult.triggersFound.length > 0,
              })
            },
            onError: (error) => {
              updateMessageContent(activeId!, assistantMsgId,
                `**ULTRAPLINIAN Error:** ${error}`)
              resetUltraplinianRace()
            },
          },
        )
      } else {
        // ── STANDARD PATH: Single model ────────────────────────────
        const startTime = Date.now()
        const assistantMsgId = addMessage(activeId, {
          role: 'assistant',
          content: '',
          model,
          persona: persona.id,
        })

        let response = ''
        if (proxyMode) {
          response = await sendMessageViaProxy({
            messages,
            model,
            apiBaseUrl: ultraplinianApiUrl,
            godmodeApiKey: ultraplinianApiKey,
            signal: abortControllerRef.current.signal,
            stm_modules: stmModules.filter(m => m.enabled).map(m => m.id),
            ...(tuneResult ? {
              temperature: tuneResult.params.temperature,
              top_p: tuneResult.params.top_p,
              top_k: tuneResult.params.top_k,
              frequency_penalty: tuneResult.params.frequency_penalty,
              presence_penalty: tuneResult.params.presence_penalty,
              repetition_penalty: tuneResult.params.repetition_penalty,
            } : {}),
          })
          updateMessageContent(activeId, assistantMsgId, response, { model })
        } else {
          for await (const chunk of streamMessage({
            messages,
            model,
            apiKey,
            noLog: noLogMode,
            signal: abortControllerRef.current.signal,
            ...(tuneResult ? {
              temperature: tuneResult.params.temperature,
              top_p: tuneResult.params.top_p,
              top_k: tuneResult.params.top_k,
              frequency_penalty: tuneResult.params.frequency_penalty,
              presence_penalty: tuneResult.params.presence_penalty,
              repetition_penalty: tuneResult.params.repetition_penalty
            } : {})
          })) {
            response += chunk
            updateMessageContent(activeId, assistantMsgId, response, { model })
          }
        }

        const durationMs = Date.now() - startTime

        // Apply STM transformations
        let transformedResponse = response
        for (const stm of stmModules) {
          if (stm.enabled) {
            transformedResponse = stm.transformer(transformedResponse)
          }
        }

        updateMessageContent(activeId, assistantMsgId, transformedResponse, {
          model,
          ...(tuneResult ? {
            autoTuneParams: tuneResult.params,
            autoTuneContext: tuneResult.detectedContext,
            autoTuneContextScores: tuneResult.contextScores,
            autoTunePatternMatches: tuneResult.patternMatches,
            autoTuneDeltas: tuneResult.paramDeltas
          } : {})
        })

        await llmClassifyPromise

        recordChatEvent({
          mode: 'standard',
          model,
          duration_ms: durationMs,
          response_length: transformedResponse.length,
          success: true,
          pipeline: {
            autotune: autoTuneEnabled,
            parseltongue: parseltongueConfig.enabled,
            stm_modules: stmModules.filter(m => m.enabled).map(m => m.id),
            strategy: autoTuneStrategy,
            godmode: useCustomSystemPrompt,
          },
          ...(tuneResult ? {
            autotune: {
              detected_context: tuneResult.detectedContext,
              confidence: tuneResult.confidence,
            },
          } : {}),
          parseltongue: parseltongueConfig.enabled ? {
            triggers_found: parseltongueResult.triggersFound.length,
            technique: parseltongueConfig.technique,
            intensity: parseltongueConfig.intensity,
          } : undefined,
          classification: promptClassification,
          persona: persona.id,
          prompt_length: originalMessage.length,
          conversation_depth: conv?.messages?.length || 0,
          memory_count: activeMemories.length,
          no_log: noLogMode,
          parseltongue_transformed: parseltongueResult.triggersFound.length > 0,
        })
      }
    } catch (error: unknown) {
      resetUltraplinianRace()
      const errorName = error instanceof Error ? error.name : ''
      if (errorName === 'AbortError') {
        addMessage(activeId, {
          role: 'assistant',
          content: '_[Response stopped by user]_',
          model,
          persona: persona.id
        })
        recordChatEvent({
          mode: ultraplinianEnabled ? 'ultraplinian' : 'standard',
          model,
          duration_ms: 0,
          response_length: 0,
          success: false,
          error_type: 'abort',
          pipeline: {
            autotune: autoTuneEnabled,
            parseltongue: parseltongueConfig.enabled,
            stm_modules: stmModules.filter(m => m.enabled).map(m => m.id),
            strategy: autoTuneStrategy,
            godmode: useCustomSystemPrompt,
          },
          classification: promptClassification,
          persona: persona.id,
          prompt_length: originalMessage.length,
          conversation_depth: conv?.messages?.length || 0,
          memory_count: activeMemories.length,
          no_log: noLogMode,
          parseltongue_transformed: parseltongueResult.triggersFound.length > 0,
        })
      } else {
        console.error('Error sending message:', error)
        const errMsg = error instanceof Error
          ? error.message
          : 'Failed to get response. Check your API key in Settings and try again.'
        const errLower = errMsg.toLowerCase()
        const errorType = errLower.includes('api key') || errLower.includes('expired') || errLower.includes('denied') || errLower.includes('permission')
          ? 'auth'
          : errLower.includes('rate limit') || errLower.includes('wait')
          ? 'rate_limit'
          : errLower.includes('timeout') || errLower.includes('timed out')
          ? 'timeout'
          : errLower.includes('unavailable') || errLower.includes('overloaded')
          ? 'model_error'
          : errLower.includes('credit') || errLower.includes('insufficient')
          ? 'billing'
          : 'unknown'
        addMessage(activeId, {
          role: 'assistant',
          content: `**Error:** ${errMsg}`,
          model,
          persona: persona.id
        })
        recordChatEvent({
          mode: ultraplinianEnabled ? 'ultraplinian' : 'standard',
          model,
          duration_ms: 0,
          response_length: 0,
          success: false,
          error_type: errorType,
          pipeline: {
            autotune: autoTuneEnabled,
            parseltongue: parseltongueConfig.enabled,
            stm_modules: stmModules.filter(m => m.enabled).map(m => m.id),
            strategy: autoTuneStrategy,
            godmode: useCustomSystemPrompt,
          },
          classification: promptClassification,
          persona: persona.id,
          prompt_length: originalMessage.length,
          conversation_depth: conv?.messages?.length || 0,
          memory_count: activeMemories.length,
          no_log: noLogMode,
          parseltongue_transformed: parseltongueResult.triggersFound.length > 0,
        })
      }
    } finally {
      setIsStreaming(false)
      setUltraplinianRacing(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Determine which result to show (live preview while typing, last result after send)
  const displayResult = livePreview || autoTuneLastResult

  // Count active memories for display
  const activeMemoryCount = memoriesEnabled ? memories.filter(m => m.active).length : 0

  return (
    <div className="border-t border-white/10 bg-[var(--bg-elevated)]/92 px-4 py-4 backdrop-blur-2xl sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* AutoTune live parameter display */}
        {autoTuneEnabled && displayResult && showTuneDetails && (
          <div className="mb-3 space-y-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold theme-primary">
                <SlidersHorizontal className="w-3 h-3" />
                AUTOTUNE {autoTuneStrategy === 'adaptive'
                  ? `// ${getContextLabel(displayResult.detectedContext)} (${Math.round(displayResult.confidence * 100)}%)`
                  : `// ${getStrategyLabel(autoTuneStrategy)}`
                }
              </div>
            </div>

            {/* Context Competition - show all context scores */}
            {displayResult.contextScores && displayResult.contextScores.length > 1 && (
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <span className="theme-secondary mr-1">CONTEXT:</span>
                {displayResult.contextScores
                  .filter(s => s.percentage > 0)
                  .slice(0, 4)
                  .map((s, i) => (
                    <span key={s.type} className="flex items-center">
                      {i > 0 && <span className="text-gray-600 mx-1">&gt;</span>}
                      <span className={i === 0 ? 'text-cyan-400 font-bold' : 'theme-secondary'}>
                        {getContextLabel(s.type)} {s.percentage}%
                      </span>
                    </span>
                  ))}
              </div>
            )}

            {/* Pattern Match Reasoning - why this context was detected */}
            {displayResult.patternMatches && displayResult.patternMatches.length > 0 && (
              <div className="text-[10px] font-mono">
                <span className="theme-secondary">MATCHED: </span>
                <span className="text-purple-400">
                  {displayResult.patternMatches
                    .slice(0, 3)
                    .map(p => p.pattern)
                    .join(' | ')}
                  {displayResult.patternMatches.length > 3 && ` +${displayResult.patternMatches.length - 3} more`}
                </span>
              </div>
            )}

            {/* Parameter Grid with Deltas */}
            <div className="grid grid-cols-6 gap-2">
              {(Object.entries(displayResult.params) as [keyof typeof PARAM_META, number][]).map(
                ([key, value]) => {
                  // Find if there's a delta for this param
                  const delta = displayResult.paramDeltas?.find(d => d.param === key)
                  const hasDelta = delta && Math.abs(delta.delta) > 0.001

                  return (
                    <div
                      key={key}
                      className={`text-center p-1.5 rounded border transition-all
                        ${hasDelta
                          ? 'bg-cyan-500/10 border-cyan-500/30'
                          : 'bg-theme-dim border-theme-primary/30'
                        }`}
                      title={delta?.reason || PARAM_META[key].description}
                    >
                      <div className="text-[10px] theme-secondary font-mono">
                        {PARAM_META[key].short}
                      </div>
                      <div className="text-sm font-bold theme-primary font-mono">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </div>
                      {hasDelta && (
                        <div className={`text-[9px] font-mono ${delta.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {delta.delta > 0 ? '+' : ''}{delta.delta.toFixed(2)}
                        </div>
                      )}
                    </div>
                  )
                }
              )}
            </div>

            {/* Delta Explanations - what changed and why */}
            {displayResult.paramDeltas && displayResult.paramDeltas.length > 0 && (
              <div className="text-[10px] font-mono space-y-0.5 pt-1 border-t border-theme-primary/20">
                <span className="theme-secondary">TUNING:</span>
                {displayResult.paramDeltas.slice(0, 4).map((d, i) => (
                  <div key={`${d.param}-${i}`} className="flex items-center gap-1 pl-2">
                    <span className="text-cyan-400">{PARAM_META[d.param].short}</span>
                    <span className="theme-secondary">
                      {d.before.toFixed(2)} → {d.after.toFixed(2)}
                    </span>
                    <span className={d.delta > 0 ? 'text-green-400' : 'text-red-400'}>
                      ({d.delta > 0 ? '+' : ''}{d.delta.toFixed(2)})
                    </span>
                    <span className="text-purple-400">{d.reason}</span>
                  </div>
                ))}
                {displayResult.paramDeltas.length > 4 && (
                  <div className="pl-2 theme-secondary">+{displayResult.paramDeltas.length - 4} more adjustments</div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-3 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.95)]">
          {!isStreaming && !input.trim() && (
            <div className="mb-2 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setInput(prompt)
                    textareaRef.current?.focus()
                  }}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-slate-300 transition hover:border-sky-300/25 hover:bg-sky-300/[0.09] hover:text-sky-100"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming || (!apiKey && !proxyMode)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-slate-300 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Upload image"
            title="Upload image"
          >
            <ImagePlus className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={toggleVoiceTyping}
            disabled={!voiceSupported || isStreaming || (!apiKey && !proxyMode)}
            className={`rounded-2xl border p-3 transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isListening
                ? 'border-emerald-400/30 bg-emerald-400/12 text-emerald-300'
                : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
            }`}
            aria-label={isListening ? 'Stop voice typing' : 'Start voice typing'}
            title={voiceSupported ? (isListening ? 'Stop voice typing' : 'Start voice typing') : 'Voice typing not supported'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <div className="hidden items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 sm:flex">
            {([
              { id: 'auto', label: 'Auto' },
              { id: 'en-US', label: 'EN' },
              { id: 'bn-BD', label: 'BN' },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setVoiceLocale(opt.id)}
                className={`rounded-lg px-2 py-1 text-[10px] font-medium transition ${
                  voiceLocale === opt.id
                    ? 'bg-sky-400/20 text-sky-200'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1">
            {attachedImage && (
              <div className="mb-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2">
                <img
                  src={attachedImage}
                  alt="Attachment preview"
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-200">{attachedImageName || 'Image attachment'}</p>
                  <p className="text-[11px] text-slate-500">Will be sent with this message</p>
                </div>
                <button
                  type="button"
                  onClick={clearImageAttachment}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <textarea
              id="chat-main-input"
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={(apiKey || proxyMode) ? 'Ask anything... (Shift+Enter for new line)' : 'Add your API key in Settings to start'}
              disabled={(!apiKey && !proxyMode) || isStreaming}
              rows={1}
              className="w-full resize-none rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 pr-14 text-sm text-white transition-all duration-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-300/20 disabled:opacity-50"
              style={{ minHeight: '48px', maxHeight: '200px' }}
            />

            {/* Character count */}
            {input.length > 0 && (
              <div className="absolute bottom-3 right-4 text-xs text-slate-500">
                {input.length}
              </div>
            )}
          </div>

          {/* Submit/Stop button */}
          {isStreaming ? (
            <button
              onClick={handleStop}
              className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3 transition hover:bg-rose-400/20"
              aria-label="Stop generation"
            >
              <StopCircle className="w-5 h-5 text-red-500" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={(!input.trim() && !attachedImage) || (!apiKey && !proxyMode)}
              className="rounded-2xl border border-white/10 bg-white px-3 py-3 text-slate-950 transition hover:translate-y-[-1px] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              {isStreaming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          )}
          </div>

          <div className="mt-2 px-1 text-[11px] text-slate-500">
            Enter to send, Shift+Enter for newline.
          </div>

          {voiceSupported && (
            <button
              type="button"
              onPointerDown={handleMobileHoldStart}
              onPointerUp={handleMobileHoldEnd}
              onPointerCancel={handleMobileHoldEnd}
              onPointerLeave={handleMobileHoldEnd}
              disabled={isStreaming || (!apiKey && !proxyMode)}
              className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition sm:hidden disabled:cursor-not-allowed disabled:opacity-50 ${
                isListening && pushToTalkActive
                  ? 'border-emerald-400/35 bg-emerald-400/15 text-emerald-200'
                  : 'border-white/10 bg-white/[0.03] text-slate-200'
              }`}
              aria-label="Hold to talk"
            >
              {isListening && pushToTalkActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isListening && pushToTalkActive ? 'Release to stop' : 'Hold to talk'}
            </button>
          )}
        </div>

        {/* Status indicators */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            {uploadError && (
              <span className="text-rose-400">{uploadError}</span>
            )}
            {voiceError && (
              <span className="text-rose-400">{voiceError}</span>
            )}
            {isListening && !voiceError && (
              <span className="text-emerald-400">Listening...</span>
            )}
            {voiceSupported && !isListening && (
              <span className="text-slate-500">Hold Ctrl+Shift+V to push-to-talk</span>
            )}
            {autoTuneEnabled && (
              <button
                onClick={() => setShowTuneDetails(!showTuneDetails)}
                className={`flex items-center gap-1 transition-colors hover:text-cyan-400
                  ${showTuneDetails ? 'text-cyan-400' : ''}`}
              >
                <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                AutoTune {autoTuneStrategy === 'adaptive' && displayResult
                  ? `[${getContextLabel(displayResult.detectedContext)}]`
                  : `[${getStrategyLabel(autoTuneStrategy)}]`
                }
              </button>
            )}
            {noLogMode && (
              <span className="flex items-center gap-1">
                <span className="text-yellow-500 text-[10px]">&#x25C8;</span>
                No-Log Mode
              </span>
            )}
            {stmModules.some(m => m.enabled) && (
              <span className="flex items-center gap-1">
                <span className="text-purple-500 text-[10px]">&#x2B23;</span>
                {stmModules.filter(m => m.enabled).length} STM Active
              </span>
            )}
            {activeMemoryCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-cyan-400 text-[10px]">&#x2726;</span>
                {activeMemoryCount} Memories
              </span>
            )}
            {parseltongueConfig.enabled && (
              <span className={`flex items-center gap-1 ${parseltonguePreview ? 'text-green-400' : ''}`}>
                <span className="text-green-500 text-[10px]">&#x2621;</span>
                Parseltongue
                {parseltonguePreview && ` [${parseltonguePreview.triggersFound.length} triggers]`}
              </span>
            )}
            {ultraplinianEnabled && (
              <span className="flex items-center gap-1 text-orange-400">
                <span className="text-[10px]">&#x2694;</span>
                ULTRAPLINIAN [{ultraplinianTier}]
              </span>
            )}
          </div>
          {isStreaming && (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {consortiumPhase === 'collecting'
                ? `Collecting ${consortiumModelsCollected}/${consortiumModelsTotal} models...`
                : consortiumPhase === 'synthesizing'
                ? `Synthesizing ground truth...`
                : ultraplinianRacing
                ? `Racing ${ultraplinianModelsResponded}/${ultraplinianModelsTotal} models${ultraplinianLiveModel ? ` // Leader: ${ultraplinianLiveModel.split('/').pop()} (${ultraplinianLiveScore})` : '...'}`
                : autoTuneEnabled && autoTuneLastResult
                  ? `Tuned @ T=${autoTuneLastResult.params.temperature.toFixed(2)}...`
                  : 'Thinking...'
              }
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
