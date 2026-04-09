'use client'

import { useEffect } from 'react'
import { useStore } from '@/store'

/**
 * Auto-detect a self-hosted Open Power API server at the same origin.
 *
 * When the frontend is served behind the docker-compose nginx proxy,
 * /v1/health is available on the same origin. If detected and auth
 * is open (no GODMODE_API_KEY configured), proxy mode activates
 * automatically — users can chat without entering any API keys.
 */
export function useApiAutoDetect() {
  const {
    apiKey,
    ultraplinianApiUrl,
    ultraplinianApiKey,
    setUltraplinianApiUrl,
    setUltraplinianApiKey,
    isHydrated,
  } = useStore()

  useEffect(() => {
    if (!isHydrated) return

    // Skip if user already has a personal OpenRouter key
    if (apiKey) return

    // Skip if user already configured a working non-default API URL
    if (ultraplinianApiUrl && ultraplinianApiUrl !== 'http://localhost:7860' && ultraplinianApiKey) return

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)

    async function checkCandidate(baseUrl: string) {
      const healthRes = await fetch(`${baseUrl}/v1/health`, { signal: controller.signal })
      if (!healthRes.ok) return null
      const healthData = await healthRes.json().catch(() => null)
      if (healthData?.status !== 'ok') return null

      const tierRes = await fetch(`${baseUrl}/v1/tier`, {
        headers: { 'Authorization': 'Bearer self-hosted' },
        signal: controller.signal,
      })

      return {
        baseUrl,
        tierStatus: tierRes.status,
      }
    }

    async function detect() {
      try {
        const sameOrigin = window.location.origin
        const localhostApi = `${window.location.protocol}//${window.location.hostname}:7860`
        const candidates = [sameOrigin, localhostApi]

        let detected: { baseUrl: string; tierStatus: number } | null = null
        for (const candidate of candidates) {
          // eslint-disable-next-line no-await-in-loop
          const result = await checkCandidate(candidate)
          if (result) {
            detected = result
            break
          }
        }

        if (!detected) return

        if (detected.tierStatus === 200 || detected.tierStatus === 429) {
          // Auth is open or rate-limited (still means auth passed)
          setUltraplinianApiUrl(detected.baseUrl)
          if (!ultraplinianApiKey) {
            setUltraplinianApiKey('self-hosted')
          }
          console.log('[Open Power] Self-hosted API detected (open auth) at', detected.baseUrl)
        } else if (detected.tierStatus === 403 || detected.tierStatus === 401) {
          // Auth is enabled — user needs a real API key from the host
          // Still set the URL so they only need to enter the key in settings
          setUltraplinianApiUrl(detected.baseUrl)
          console.log('[Open Power] Self-hosted API detected (auth required) at', detected.baseUrl)
        }
      } catch {
        // No API at same origin — normal mode
      } finally {
        clearTimeout(timer)
      }
    }

    detect()

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [isHydrated, apiKey, ultraplinianApiUrl, ultraplinianApiKey, setUltraplinianApiUrl, setUltraplinianApiKey])
}
