#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const { loadConfig, saveConfig, THEMES, normalizeTheme } = require('./config');
const { callModel, runRaceMode, runHealthCheck } = require('./api');

const MODEL_PRESETS = [
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3.7-sonnet',
  'google/gemini-2.5-flash',
  'deepseek/deepseek-chat',
];

function printRaceSummary(theme, results) {
  printSection(theme, 'Race summary');
  console.log(chalk.gray('Rank  Model                    Time   Status'));
  console.log(chalk.gray('----  -----------------------  -----  ------'));

  results.forEach((result, idx) => {
    const rank = String(idx + 1).padEnd(4, ' ');
    const model = String(result.name).padEnd(23, ' ').slice(0, 23);
    const ms = `${result.duration}ms`.padEnd(5, ' ');
    const status = result.ok ? chalk.green('OK') : chalk.red('ERR');
    console.log(`${rank}  ${model}  ${ms}  ${status}`);
  });
}

function getTheme(config) {
  return THEMES[normalizeTheme(config.theme)] || THEMES.power;
}

function paint(theme, role, value) {
  return chalk.hex(theme[role] || theme.accent)(value);
}

function printBanner(config) {
  const theme = getTheme(config);
  const border = chalk.hex(theme.accent)('═'.repeat(74));
  const titleLines = [
    '  ____                   ____',
    ' / __ \\___  ___  ____   / __ \____ _      _____  _____',
    '/ / / / _ \\/ _ \\/ __ \\ / /_/ / __ \\ | /| / / _ \\/ ___/',
    '/ /_/ /  __/  __/ / / // ____/ /_/ / |/ |/ /  __/ /',
    '\\____/\\___/\\___/_/ /_//_/    \\____/|__/|__/\\___/_/',
    'Open Power CLI',
  ];
  const subtitle = chalk.hex(theme.accent)('Terminal chat, theme control, and fast model racing');

  console.log(`\n${border}`);
  titleLines.forEach((line, idx) => {
    const painter = idx === titleLines.length - 1 ? 'highlight' : 'accent';
    console.log(paint(theme, painter, line));
  });
  console.log(`${subtitle}`);
  console.log(chalk.gray(`Theme: ${theme.label} • Model: ${config.defaultModel}`));
  console.log(border);
}

function printSection(theme, label) {
  console.log(`\n${paint(theme, 'accent', label)}`);
  console.log(chalk.hex(theme.accent)('─'.repeat(Math.max(label.length, 20))));
}

function printThemeList() {
  const themeRows = Object.entries(THEMES).map(([key, theme]) => {
    const swatch = chalk.hex(theme.accent)('●');
    return `${swatch} ${chalk.bold(theme.label)} ${chalk.gray(`(${key})`)}`;
  });

  console.log(chalk.cyanBright.bold('\nAvailable themes'));
  console.log(chalk.gray('Use `openpower theme <name>` or `openpower config --theme <name>`.\n'));
  themeRows.forEach((row) => console.log(row));
  console.log('');
}

function formatMessageBlock(theme, label, content) {
  printSection(theme, label);
  console.log(chalk.white(content));
}

function requireApiKey(config) {
  if (!config.apiKey) {
    console.log(chalk.red('No API key set. Run `openpower config --key <your_key>` first.'));
    return false;
  }
  return true;
}

program
  .name('openpower')
  .version('0.1.0')
  .description(chalk.cyan('Open Power terminal interface'));

program.addHelpText(
  'after',
  `\nExamples:\n  openpower config --key sk-or-v1-...\n  openpower config --theme power\n  openpower model openai/gpt-4o-mini\n  openpower chat "Explain embeddings"\n  openpower race "REST vs GraphQL"\n  openpower doctor\n`
);

program
  .command('config')
  .description('Configure your API key, default model, and terminal theme')
  .option('-k, --key <key>', 'Set your OpenRouter API key')
  .option('-m, --model <model>', 'Set the default model')
  .option('-t, --theme <theme>', 'Set the terminal theme')
  .action((options) => {
    const config = loadConfig();
    let updated = false;

    if (options.key) {
      config.apiKey = options.key;
      console.log(chalk.green('API key saved.'));
      updated = true;
    }

    if (options.model) {
      config.defaultModel = options.model;
      console.log(chalk.green(`Default model saved: ${options.model}`));
      updated = true;
    }

    if (options.theme) {
      config.theme = normalizeTheme(options.theme);
      console.log(chalk.green(`Theme saved: ${getTheme(config).label}`));
      updated = true;
    }

    if (updated) {
      saveConfig(config);
      return;
    }

    const theme = getTheme(config);
    printBanner(config);
    printSection(theme, 'Current configuration');
    console.log(`API Key: ${config.apiKey ? chalk.green('Set') : chalk.red('Not set')}`);
    console.log(`Default Model: ${chalk.white(config.defaultModel)}`);
    console.log(`Theme: ${paint(theme, 'highlight', theme.label)}`);
  });

program
  .command('theme [name]')
  .aliases(['themes'])
  .description('Show or set the terminal theme')
  .option('-l, --list', 'List available themes')
  .action((name, options) => {
    const config = loadConfig();
    const requested = (name || '').toLowerCase();

    if (options.list || !name || requested === 'list' || requested === 'ls' || requested === 'show') {
      printThemeList();
      return;
    }

    const nextTheme = normalizeTheme(name);
    if (!THEMES[requested]) {
      console.log(chalk.yellow(`Unknown theme "${name}". Showing available themes instead.`));
      printThemeList();
      return;
    }

    config.theme = nextTheme;
    saveConfig(config);

    const theme = getTheme(config);
    console.log(chalk.green(`Theme saved: ${theme.label}`));
    printBanner(config);
  });

program
  .command('chat <message...>')
  .description('Send a single-model chat request')
  .option('-m, --model <model>', 'Override model for this request')
  .action(async (messageParts, options) => {
    const config = loadConfig();
    const theme = getTheme(config);
    if (!requireApiKey(config)) {
      return;
    }

    const message = messageParts.join(' ');
    const model = options.model || config.defaultModel;
    printBanner(config);
    printSection(theme, 'Chat request');
    console.log(chalk.gray(message));
    const spinner = ora({
      text: chalk.hex(theme.accent)('Waiting for model response...'),
      color: 'cyan',
    }).start();
    try {
      const result = await callModel(config.apiKey, model, message, false);
      spinner.stop();
      formatMessageBlock(theme, `[${model}]`, result);
    } catch (error) {
      spinner.stop();
      console.log(chalk.red(`Error: ${error.message}`));
    }
  });

program
  .command('race <message...>')
  .description('Run a fast three-model race and compare outputs')
  .action(async (messageParts) => {
    const config = loadConfig();
    const theme = getTheme(config);
    if (!requireApiKey(config)) {
      return;
    }

    const message = messageParts.join(' ');
    printBanner(config);
    printSection(theme, 'Race prompt');
    console.log(chalk.gray(message));
    const spinner = ora({
      text: chalk.hex(theme.highlight)('Running model race...'),
      color: 'magenta',
    }).start();
    let results = [];
    try {
      results = await runRaceMode(config.apiKey, message);
      spinner.stop();
    } catch (error) {
      spinner.stop();
      console.log(chalk.red(`Race failed: ${error.message}`));
      return;
    }

    const sorted = [...results].sort((a, b) => a.duration - b.duration);

    printRaceSummary(theme, sorted);

    sorted.forEach((result, index) => {
      const heading =
        index === 0
          ? chalk.hex(theme.highlight)(`Winner: ${result.name} (${result.duration}ms)`)
          : chalk.hex(theme.accent)(`${index + 1}. ${result.name} (${result.duration}ms)`);

      console.log(`\n${heading}`);
      console.log(chalk.hex(theme.accent)('─'.repeat(44)));
      console.log(chalk.white(result.content));
    });

    console.log('');
  });

program
  .command('model [id]')
  .description('Show or set the default chat model')
  .action((id) => {
    const config = loadConfig();

    if (!id) {
      console.log(chalk.cyanBright.bold('\nDefault model'));
      console.log(chalk.white(config.defaultModel));
      console.log(chalk.gray('\nPopular models:'));
      MODEL_PRESETS.forEach((m) => console.log(`- ${m}`));
      console.log('');
      return;
    }

    config.defaultModel = id;
    saveConfig(config);
    console.log(chalk.green(`Default model saved: ${id}`));
  });

program
  .command('doctor')
  .description('Check CLI setup and API connectivity')
  .action(async () => {
    const config = loadConfig();
    const theme = getTheme(config);
    printBanner(config);

    printSection(theme, 'Environment checks');
    console.log(`Config file: ${chalk.green('OK')}`);
    console.log(`API key: ${config.apiKey ? chalk.green('Set') : chalk.red('Not set')}`);
    console.log(`Default model: ${chalk.white(config.defaultModel)}`);

    if (!config.apiKey) {
      console.log(chalk.yellow('\nSkipping API connectivity test (no key set).'));
      return;
    }

    const spinner = ora({
      text: chalk.hex(theme.accent)('Testing OpenRouter connectivity...'),
      color: 'cyan',
    }).start();

    try {
      const res = await runHealthCheck(config.apiKey, config.defaultModel);
      spinner.stop();
      console.log(chalk.green('Connectivity: OK'));
      console.log(chalk.gray(`Model response: ${String(res).slice(0, 80)}`));
    } catch (error) {
      spinner.stop();
      console.log(chalk.red(`Connectivity: FAILED`));
      console.log(chalk.red(error.message));
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  const config = loadConfig();
  printBanner(config);
  program.outputHelp();
}
