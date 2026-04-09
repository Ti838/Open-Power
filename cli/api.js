const fetch = require('node-fetch');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENPOWER_PROMPT = 'You are Open Power, a focused AI assistant. Answer clearly, directly, and helpfully.';

function parseApiError(errorData, status) {
  const raw = errorData?.error?.message || errorData?.error || errorData?.message || `HTTP ${status}`;
  return String(raw);
}

async function callModel(apiKey, model, message, useCorePrompt = false) {
  if (!apiKey) {
    throw new Error('No API key configured. Run: openpower config --key <your_openrouter_key>');
  }

  if (!message || !String(message).trim()) {
    throw new Error('Prompt cannot be empty.');
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'HTTP-Referer': 'https://openpower.app',
    'X-Title': 'Open Power CLI',
    'Content-Type': 'application/json',
  };

  const messages = [];
  if (useCorePrompt) {
    messages.push({ role: 'system', content: OPENPOWER_PROMPT });
  }
  messages.push({ role: 'user', content: message });

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature: useCorePrompt ? 0.9 : 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const reason = parseApiError(errorData, response.status);
      throw new Error(`OpenRouter request failed (${response.status}): ${reason}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Model returned an empty response.');
    }
    return content;
  } catch (error) {
    throw new Error(`${model}: ${error.message}`);
  }
}

async function runRaceMode(apiKey, message) {
  const models = [
    { name: 'Claude 3.5 Sonnet', id: 'anthropic/claude-3.5-sonnet' },
    { name: 'Gemini 2.5 Flash', id: 'google/gemini-2.5-flash' },
    { name: 'GPT-4o', id: 'openai/gpt-4o' },
  ];

  return Promise.all(
    models.map(async (model) => {
      const start = Date.now();
      let content = '';
      let ok = true;
      try {
        content = await callModel(apiKey, model.id, message, true);
      } catch (error) {
        ok = false;
        content = `[Error] ${error.message}`;
      }
      const duration = Date.now() - start;
      return { name: model.name, content, duration, ok };
    })
  );
}

async function runHealthCheck(apiKey, model = 'openai/gpt-4o-mini') {
  const ping = 'Reply only with: OK';
  const content = await callModel(apiKey, model, ping, false);
  return content;
}

module.exports = { callModel, runRaceMode, runHealthCheck };
