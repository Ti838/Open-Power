const fs = require('fs');
const path = require('path');
const os = require('os');

const IS_PACKAGED = Boolean(process.pkg);
const CONFIG_DIR = IS_PACKAGED ? path.join(os.homedir(), '.openpower') : __dirname;
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = {
  apiKey: '',
  defaultModel: 'anthropic/claude-3.5-sonnet',
  theme: 'power',
};

const THEMES = {
  power: {
    label: 'Power',
    accent: '#22d3ee',
    accentSoft: '#0f172a',
    highlight: '#38bdf8',
  },
  midnight: {
    label: 'Midnight',
    accent: '#c4b5fd',
    accentSoft: '#0f172a',
    highlight: '#8b5cf6',
  },
  ocean: {
    label: 'Ocean',
    accent: '#67e8f9',
    accentSoft: '#042f2e',
    highlight: '#06b6d4',
  },
  forest: {
    label: 'Forest',
    accent: '#86efac',
    accentSoft: '#052e16',
    highlight: '#22c55e',
  },
  sunset: {
    label: 'Sunset',
    accent: '#fdba74',
    accentSoft: '#431407',
    highlight: '#f97316',
  },
  terminal: {
    label: 'Terminal',
    accent: '#4ade80',
    accentSoft: '#020617',
    highlight: '#22c55e',
  },
};

function normalizeTheme(theme) {
  if (!theme) return DEFAULT_CONFIG.theme;
  const key = String(theme).toLowerCase();
  return THEMES[key] ? key : DEFAULT_CONFIG.theme;
}

function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const saved = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      return {
        ...DEFAULT_CONFIG,
        ...saved,
        theme: normalizeTheme(saved.theme),
      };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config) {
  const nextConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    theme: normalizeTheme(config.theme),
  };

  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(nextConfig, null, 2));
}

module.exports = { loadConfig, saveConfig, THEMES, normalizeTheme, DEFAULT_CONFIG };
