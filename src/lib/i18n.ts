/**
 * Open Power — Internationalization (i18n)
 * Supports English (en) and Bengali (bn)
 */

export type Language = 'en' | 'bn'

const translations: Record<string, Record<Language, string>> = {
  // Sidebar
  'sidebar.appName': { en: 'Open Power', bn: 'ওপেন পাওয়ার' },
  'sidebar.tagline': { en: 'Local-first AI workspace', bn: 'লোকাল-ফার্স্ট AI ওয়ার্কস্পেস' },
  'sidebar.newChat': { en: 'New chat', bn: 'নতুন চ্যাট' },
  'sidebar.noChats': { en: 'No chats yet', bn: 'এখনো কোনো চ্যাট নেই' },
  'sidebar.noChatsHint': { en: 'Start a conversation to build your workspace history.', bn: 'আপনার ওয়ার্কস্পেস ইতিহাস তৈরি করতে একটি কথোপকথন শুরু করুন।' },
  'sidebar.settings': { en: 'Settings', bn: 'সেটিংস' },
  'sidebar.footer': { en: 'Open Power', bn: 'ওপেন পাওয়ার' },
  'sidebar.model': { en: 'Model', bn: 'মডেল' },

  // Welcome Screen
  'welcome.badge': { en: 'Open Power', bn: 'ওপেন পাওয়ার' },
  'welcome.badgeSub': { en: 'AI Workspace', bn: 'AI ওয়ার্কস্পেস' },
  'welcome.headline': { en: 'One interface. Every frontier model. Full control.', bn: 'একটি ইন্টারফেস। সব ফ্রন্টিয়ার মডেল। সম্পূর্ণ নিয়ন্ত্রণ।' },
  'welcome.subheadline': { en: 'Fast chat, multi-model racing, local-first settings, and performance visibility — all in one clean workspace.', bn: 'দ্রুত চ্যাট, মাল্টি-মডেল রেসিং, লোকাল-ফার্স্ট সেটিংস, এবং পারফরম্যান্স ভিজিবিলিটি — সব একটি পরিষ্কার ওয়ার্কস্পেসে।' },
  'welcome.setupApi': { en: 'Connect API to Start', bn: 'শুরু করতে API কানেক্ট করুন' },
  'welcome.tierFast': { en: 'Fast', bn: 'ফাস্ট' },
  'welcome.tierStandard': { en: 'Standard', bn: 'স্ট্যান্ডার্ড' },
  'welcome.tierSmart': { en: 'Smart Race', bn: 'স্মার্ট রেস' },
  'welcome.tierPower': { en: 'Power', bn: 'পাওয়ার' },
  'welcome.tierUltra': { en: 'Ultra Power', bn: 'আল্ট্রা পাওয়ার' },

  // Chat Area & HUD
  'chat.empty': { en: 'Start the conversation', bn: 'কথোপকথন শুরু করুন' },
  'chat.emptyHint': { en: 'Open Power is ready. Ask something, test a model, or run a multi-model race.', bn: 'ওপেন পাওয়ার প্রস্তুত। কিছু জিজ্ঞেস করুন, একটি মডেল পরীক্ষা করুন, বা মাল্টি-মডেল রেস চালান।' },
  'chat.performance': { en: 'Performance HUD', bn: 'পারফরম্যান্স HUD' },
  'chat.leaderboard': { en: 'Leaderboard', bn: 'লিডারবোর্ড' },
  'chat.raceTime': { en: 'Race Time', bn: 'রেস টাইম' },
  'chat.coverage': { en: 'Global Coverage', bn: 'গ্লোবাল কভারেজ' },
  'chat.mode': { en: 'Mode', bn: 'মোড' },
  'chat.prompts': { en: 'Prompts', bn: 'প্রম্পট' },
  'chat.liquid': { en: 'Liquid', bn: 'লিকুইড' },
  'chat.on': { en: 'on', bn: 'চালু' },
  'chat.off': { en: 'off', bn: 'বন্ধ' },
  'chat.modeStandard': { en: 'Standard', bn: 'স্ট্যান্ডার্ড' },
  'chat.modeRace': { en: 'Speed Race', bn: 'স্পিড রেস' },
  'chat.modeMulti': { en: 'Multi-Model', bn: 'মাল্টি-মডেল' },
  'chat.versionNotice': { en: 'Version browsing and race stats stay visible in-chat', bn: 'ভার্সন ব্রাউজিং এবং রেস স্ট্যাটস চ্যাটে দৃশ্যমান থাকে' },

  // Settings Modal
  'settings.title': { en: 'Settings', bn: 'সেটিংস' },
  'settings.apiKey': { en: 'API Key', bn: 'API কী' },
  'settings.systemPrompt': { en: 'System Prompt', bn: 'সিস্টেম প্রম্পট' },
  'settings.autotune': { en: 'AutoTune', bn: 'অটোটিউন' },
  'settings.appearance': { en: 'Appearance', bn: 'চেহারা' },
  'settings.privacy': { en: 'Privacy', bn: 'গোপনীয়তা' },
  'settings.liquid': { en: 'Liquid', bn: 'লিকুইড' },
  'settings.stealth': { en: 'Stealth Mode', bn: 'স্টেলথ মোড' },
  'settings.stm': { en: 'STM Modules', bn: 'STM মডিউল' },
  'settings.memory': { en: 'Memory', bn: 'মেমরি' },
  'settings.speedRace': { en: 'Speed Race', bn: 'স্পিড রেস' },
  'settings.multiModel': { en: 'Multi-Model', bn: 'মাল্টি-মডেল' },
  'settings.plan': { en: 'Plan', bn: 'প্ল্যান' },
  'settings.data': { en: 'Data', bn: 'ডেটা' },
  'settings.language': { en: 'Language', bn: 'ভাষা' },
  'settings.theme': { en: 'Theme', bn: 'থিম' },

  // Common
  'common.you': { en: 'You', bn: 'আপনি' },
  'common.search': { en: 'Search models or providers', bn: 'মডেল বা প্রদানকারী খুঁজুন' },
  'common.noResults': { en: 'No models match your search.', bn: 'আপনার অনুসন্ধানের সাথে কোনো মডেল মেলে না।' },
  'common.save': { en: 'Save', bn: 'সংরক্ষণ করুন' },
  'common.cancel': { en: 'Cancel', bn: 'বাতিল' },
  'common.reset': { en: 'Reset', bn: 'রিসেট' },
  'common.on': { en: 'On', bn: 'চালু' },
  'common.off': { en: 'Off', bn: 'বন্ধ' },
  'common.enabled': { en: 'Enabled', bn: 'সক্রিয়' },
  'common.disabled': { en: 'Disabled', bn: 'নিষ্ক্রিয়' },
  'common.loading': { en: 'Loading Open Power', bn: 'ওপেন পাওয়ার লোড হচ্ছে' },
}

export function t(key: string, lang: Language): string {
  const entry = translations[key]
  if (!entry) return key
  return entry[lang] ?? entry['en'] ?? key
}

/** Hook-friendly version — returns a bound t() for a given language */
export function createTranslator(lang: Language) {
  return (key: string) => t(key, lang)
}
