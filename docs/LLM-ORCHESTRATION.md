# LLM Orchestration and Performance Design

Open Power does not run large language model weights locally in this repository. Instead, it runs a local orchestration layer that coordinates remote inference through model providers such as OpenRouter, plus the project’s own API pipeline. The local software is responsible for prompt shaping, routing, scoring, selection, post-processing, and caching of metadata.

## 1. What Runs Locally vs Remotely

| Layer | Runs Locally | Runs Remotely |
|---|---|---|
| Web UI | Yes | No |
| Terminal CLI | Yes | No |
| API orchestration | Yes | No |
| Prompt engineering / routing | Yes | No |
| Scoring / selection / post-processing | Yes | No |
| Model inference | No | Yes, through providers |
| Multi-model race collection | Orchestrated locally | Inference occurs remotely |

## 2. Why It Feels Fast

Open Power improves practical performance by reducing wasted waiting and making the first usable answer appear as early as possible.

| Technique | Effect |
|---|---|
| Streaming responses | Shortens time to first visible answer |
| ULTRAPLINIAN race mode | Picks the best model response instead of waiting for manual comparison |
| Early-exit collection | Stops waiting once enough good answers arrive |
| Liquid Response | Upgrades the answer live as better results finish |
| AutoTune | Selects better generation parameters for the current context |
| STM post-processing | Cleans output after generation so responses read more directly |
| Configurable tiers | Lets users choose speed-oriented or quality-oriented model sets |

## 3. Main Orchestration Pipelines

### 3.1 Standard Chat

| Step | Description |
|---|---|
| 1 | User sends a message in the web UI or CLI |
| 2 | The system builds the prompt and applies memory / system prompt rules |
| 3 | AutoTune optionally selects generation parameters |
| 4 | Parseltongue optionally transforms trigger words |
| 5 | A single remote model is called |
| 6 | STM optionally normalizes the response |
| 7 | The final answer is rendered to the user |

### 3.2 ULTRAPLINIAN Race Mode

| Step | Description |
|---|---|
| 1 | A model tier is selected (fast / standard / smart / power / ultra) |
| 2 | Multiple models are queried in parallel |
| 3 | Each response is scored on length, structure, refusal signals, directness, and relevance |
| 4 | The highest-scoring response wins |
| 5 | The winning answer is post-processed and shown live |

### 3.3 CONSORTIUM Mode

| Step | Description |
|---|---|
| 1 | Multiple responses are collected from the selected tier |
| 2 | Responses are scored and ordered |
| 3 | A synthesis prompt is built from the full set of results |
| 4 | A strong orchestrator model produces the final answer |
| 5 | The final output is returned with provenance metadata |

## 4. Algorithms Used

| Module | Algorithm / Strategy | Purpose |
|---|---|---|
| AutoTune | Regex-based context classification + parameter blending | Choose better sampling settings per prompt type |
| Feedback Loop | EMA-style online learning | Improve parameter selection from ratings |
| Parseltongue | Trigger detection + character-level obfuscation | Test robustness to transformed input text |
| STM | Sequential text transformation pipeline | Normalize response style for cleaner reading |
| ULTRAPLINIAN | Parallel model race + scoring function | Choose the best single answer quickly |
| CONSORTIUM | Parallel collection + synthesis orchestration | Distill a consensus answer from many models |

## 5. ULTRAPLINIAN Scoring Model

The race scorer favors answers that are:
- substantive
- structured
- direct
- relevant to the user query
- less refusal-heavy

### Score axes

| Axis | Max Points | What it rewards |
|---|---|---|
| Length | 25 | Detailed answers |
| Structure | 20 | Headers, lists, code blocks |
| Anti-refusal | 25 | Fewer refusal phrases |
| Directness | 15 | No preamble, no hedging |
| Relevance | 15 | Answer matches the query |

### Why this helps performance

This does not make the remote model itself faster. It makes the *system* more effective by ensuring the user sees the strongest answer sooner and by avoiding extra manual prompt iteration.

## 6. Configuration Files and Runtime State

| Item | Location | Role |
|---|---|---|
| Web app state | Browser local storage / Zustand | UI state, themes, settings, conversations |
| CLI config | `cli/config.json` in dev mode | Saved terminal API key, model, theme |
| Packaged EXE config | `%USERPROFILE%\.openpower\config.json` | Writable config for standalone distribution |
| API pipeline | `api/server.ts` and routes | Orchestration, scoring, response shaping |

## 7. Honest Summary

Open Power is best described as a **local orchestration system for remote LLM inference**.

That means:
- the app runs locally on the user’s machine,
- it can coordinate many models,
- it can score and compare results,
- it can post-process and visualize the response,
- but it does not host giant model weights inside this repository by default.

This architecture is what allows it to feel fast and flexible without requiring the user to run frontier models on their own hardware.
