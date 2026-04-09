# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for Open Power, a web and terminal AI workspace that supports standard chat, model racing, and advanced response controls.

### 1.2 Scope
Open Power provides:
- Web chat workspace
- Terminal CLI (`openpower`)
- OpenRouter-based AI model access
- Multi-mode response execution (standard, race, consortium)
- Voice typing, image-assisted chat, and personalization controls

### 1.3 Definitions
- Standard Mode: Single model response flow.
- Ultraplinian/Race Mode: Multiple models queried, fastest/highest-scoring response preferred.
- Consortium Mode: Multi-model collection and synthesis.
- AutoTune: Context-based tuning of generation parameters.

## 2. Overall Description

### 2.1 Product Perspective
Open Power is a standalone full-stack application:
- Frontend: Next.js + React
- API backend: Express + TypeScript
- CLI: Node.js command interface

### 2.2 User Classes
- End users needing AI chat UI
- Power users requiring model routing and tuning controls
- Developers using terminal-based workflows

### 2.3 Operating Environment
- OS: Windows, Linux, macOS
- Runtime: Node.js 18+
- Browser: Modern Chromium/Firefox/Safari

## 3. Functional Requirements

### FR-1: User Chat
The system shall allow users to send text prompts and receive model responses in the web UI.

### FR-2: Conversation Management
The system shall support creating, selecting, and deleting conversations.

### FR-3: Image Attachment
The system shall allow image upload in standard mode and send image + text payload to compatible models.

### FR-4: Voice Typing
The system shall provide microphone-based dictation in the chat input, including:
- toggle mic mode
- language selection (Auto/EN/BN)
- push-to-talk shortcut on desktop
- hold-to-talk on mobile

### FR-5: Theme and Language Settings
The system shall support theme switching and language switching via settings.

### FR-6: CLI Configuration
The CLI shall support persistent local config for API key, model, and theme.

### FR-7: CLI Chat Command
The CLI shall support single-model chat execution using stored config or command overrides.

### FR-8: CLI Race Command
The CLI shall support race mode across multiple models and display ranked outputs.

### FR-9: CLI Doctor Command
The CLI shall provide a diagnostic command that validates local configuration and API connectivity.

### FR-10: Standalone Executable Distribution
The system shall support packaging the CLI as a standalone Windows executable (`openpower.exe`) that can run without global npm linking.

### FR-11: Documentation
The repository shall provide setup documentation, command references, API docs, and this SRS.

## 4. Non-Functional Requirements

### NFR-1: Usability
The UI shall provide clear controls for chat, settings, and command actions.

### NFR-2: Performance
Typical UI interactions shall remain responsive under normal desktop and mobile usage.

### NFR-3: Reliability
CLI and API calls shall provide explicit error messages when requests fail.

### NFR-4: Security
API keys shall be stored locally and never transmitted to unrelated third-party services beyond intended model providers.

### NFR-5: Maintainability
Code and docs shall stay consistent with implemented commands and product naming.

## 5. External Interface Requirements

### 5.1 User Interface
- Browser-based chat area, sidebar, settings modal, command palette
- Chat input with text, image, and voice controls

### 5.2 CLI Interface
- Command pattern: `openpower <command> [options]`
- Primary commands: `config`, `theme`, `model`, `chat`, `race`, `doctor`

### 5.3 API Interface
- OpenRouter chat completions integration
- Local API endpoints documented in `API.md`

## 6. Constraints
- Requires internet access for hosted model inference.
- Browser voice typing depends on Web Speech API support.
- Some advanced features depend on valid model provider credentials.

## 7. Assumptions and Dependencies
- Users provide valid OpenRouter keys.
- Node.js environment is available for build/run/CLI.
- Model/provider availability is external and may vary.

## 8. Future Enhancements
- Expanded multimodal support in all response modes
- Richer CLI interactive mode
- Automated regression tests for UI and CLI command flows
