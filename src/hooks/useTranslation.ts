'use client'

import { useStore } from '@/store'
import { createTranslator } from '@/lib/i18n'

/**
 * Hook that returns a `t(key)` function bound to the current language.
 * Usage:  const t = useTranslation()
 *         <p>{t('sidebar.newChat')}</p>
 */
export function useTranslation() {
  const language = useStore((s) => s.language)
  return createTranslator(language)
}
