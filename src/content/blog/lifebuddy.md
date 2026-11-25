---
title: "LifeBuddy: A Personal On-Device Android AI Assistant"
description: "Design philosophy, core capabilities, live QQ messaging walkthrough, and architecture of LifeBuddy—an open-source Android AI assistant with on-device execution, learned skills, and MCP extensions."
pubDate: 2026-11-25
tags: ["android", "ai-agents", "mcp", "open-source"]
zhUrl: "https://www.xuanworld.top/2026/11/25/lifebuddy/"
---

I have been building my own personal Android AI assistant—**LifeBuddy** (currently at `0.2.0-alpha18`)—and open-sourced it on GitHub. This post walks through its motivation, core capabilities, a real end-to-end demo on QQ, its architecture, and how to try or build it yourself.

- **GitHub Repository**: [https://github.com/RytterMohn/LifeBuddy](https://github.com/RytterMohn/LifeBuddy)
- **Preview APK Downloads**: [Releases](https://github.com/RytterMohn/LifeBuddy/releases)
- **License**: MIT

---

## 1. Why Build LifeBuddy?

Desktop AI agent tooling has exploded, yet on mobile most solutions fall into one of three buckets: thin chat wrappers, cloud-relayed automation services, or brittle app-specific scripts with hardcoded flows.

My goal with LifeBuddy is straightforward: **keep the agent loop, tool execution, memory, skills, and history running locally on Android, and send only conversation and single-step planning to a cloud LLM configured directly by the user.**

Give it a natural-language goal, and it reads the visible UI hierarchy through Android's Accessibility Service, picks the right tool for the next step, executes it locally, and re-observes and verifies the screen after every step. You do not need to download a multi-gigabyte local model onto your phone to get started.

---

## 2. Core Capabilities

LifeBuddy keeps only two modes—**Chat** (Q&A, writing, reading imported skills) and **Operate** (the model autonomously chooses apps and tools for your goal)—instead of forcing rigid "QQ mode" or "food delivery mode" toggles.

| Module | Current Implementation |
| --- | --- |
| **Multi-turn Chat** | Streaming responses (SSE), Markdown rendering, multi-turn context management, built-in calculator & clock tools |
| **Phone Automation** | Open apps, inspect/search controls, tap, type, submit search, scroll, go back, and cross-app workflows |
| **System Tools** | Alarms, timers, common system settings shortcuts, plus switch toggles and sliders exposed on screen |
| **History & Memory** | Local SQLite conversation history with search & continuation; editable long-term memory and habit notes |
| **Learning from Tasks** | Extracts parameterized trial skills from verified runs, reuses them on demand, and pauses broken versions |
| **External Extensions** | Import `SKILL.md` / ZIP skill packages and connect to remote HTTPS MCP tool servers |
| **Bilingual UI** | Follow system, Chinese, or English—switching languages preserves the active conversation |

---

## 3. Live Walkthrough: Sending a QQ Message in One Sentence

Here is a real run in **Operate** mode triggered by a single natural-language instruction:

> "Use QQ to send 'Hello' to Rytter" *(Chinese prompt: “用 QQ 给 Rytter 发送一个 你好”)*

### 1. Entering the Goal
Type the goal directly in Operate mode. There is no app-specific mode picker or form—the planner decides which app and tools to use:

![LifeBuddy Operate mode home screen](https://cdn.jsdelivr.net/gh/RytterMohn/img/lifebuddy-home-operate.jpg)

### 2. Running State & Floating Control Overlay
Once execution begins, a top floating status bar (`LifeBuddy · Running`) displays the active step in real time, with one-tap **Pause** and **Stop** controls to take over at any moment:

![Running task with floating control overlay](https://cdn.jsdelivr.net/gh/RytterMohn/img/lifebuddy-running-overlay.jpg)

### 3. Full Execution Trace & Local Verification
The entire run finished in **16 seconds** (4 planning calls, 0 replans, 5 steps). Every tool invocation, latency breakdown, and verification outcome is recorded in local history:

- **Step 1 (`phone_open_app`)**: Launch QQ.
- **Step 2 (`phone_prepare_message`)**: Extract the recipient and exact message body.

![Steps 1–2: Opening QQ and preparing the message](https://cdn.jsdelivr.net/gh/RytterMohn/img/lifebuddy-steps-1.jpg)

- **Step 3 (`phone_type`)**: Type the message into the verified chat input for Rytter and read it back (`Entered text verified`).
- **Step 4 (`phone_send_message`)**: Locally verify the recipient header and input text before tapping send.
- **Step 5 (`phone_verify_message`)**: Check the visible chat thread on-device while strictly honoring the "never blindly auto-resend" safety policy.

![Steps 3–5: Typing, sending, and verifying the outcome](https://cdn.jsdelivr.net/gh/RytterMohn/img/lifebuddy-steps-2.jpg)

### 4. Final Result
Opening the QQ conversation confirms the message was sent:

![Final sent message in QQ](https://cdn.jsdelivr.net/gh/RytterMohn/img/lifebuddy-qq-result-v2.jpg)

---

## 4. Architecture & Key Mechanisms

LifeBuddy draws inspiration from agent harnesses like Hermes, OpenCode, and OpenClaw for context, memory, and tool organization, re-engineered from the ground up for Android.

```text
User Request ──▶ Same Session & History ──▶ Cloud Model (Chat / Single-Step Planner)
                                                  ▲              │
                                  On-demand skills & memory      ▼
                                                       Local Parameter & Policy Check
                                                                 │
                                                                 ▼
                                                        Persist Execution Intent
                                                            ╱          ╲
                                                           ▼            ▼
                                               Accessibility / OS    HTTPS MCP Server
                                                           ╲            ╱
                                                            ▼          ▼
                                                 Screen Observation & Verification ──▶ Write Back
```

### 1. Module Layout

```text
app/       Android UI, AccessibilityService executor, local storage, HTTP & runtime control
core/      Agent loop, screen & action protocol, context compaction, memory, skills, MCP & unit tests
fixture/   Offline test fixture app (excluded from the main APK)
cli/       Desktop CLI entry point for debugging the local text agent
native/    Optional experimental llama.cpp JNI path
examples/  Ready-to-import skill packages and MCP JSON templates
docs/      Setup guides, architecture semantics, extension authoring & testing docs
```

Inside `core/`, responsibilities are cleanly separated into `core/cloud` (SSE streaming, tool pairing, context budgeting, and rolling summaries), `core/phone` (screen protocol, runner, recovery budgets, and completion evidence), `core/learning` (parameterized skill extraction and invalidation), and `core/extensions` (skill import, paginated discovery, and MCP lifecycle).

### 2. Lazy Loading for Skills and MCP Tools

Dumping dozens of skills and MCP schemas into every request quickly blows up context windows. LifeBuddy uses **on-demand retrieval**:

1. Search compact skill and tool summaries first.
2. Read the full skill document or a single tool's exact `inputSchema` only when needed.
3. Execute the tool call.

No matter how many tools a remote MCP server exposes, the model only sees a fixed search/read/call gateway. The repository ships a ready-to-import [daily brief skill package](https://github.com/RytterMohn/LifeBuddy/blob/main/examples/extensions/daily-brief.zip) and an [MCP configuration template](https://github.com/RytterMohn/LifeBuddy/blob/main/examples/extensions/mcp.example.json).

### 3. Single-Step Planning & Action Consistency

Mobile UIs change constantly—a ten-step static plan usually breaks on step two. LifeBuddy enforces three execution invariants:

- **Single-step planning + live screen checks**: The model plans one step at a time. If the screen fingerprint changes before execution, the local policy rejects the stale action and replans within a bounded budget (40 step slots and a 10-minute cap per run).
- **Persist intent before side effects**: Every external action is persisted before dispatch. If a connection drops, a run is cancelled, or evidence is missing, the step remains unconfirmed—and the runtime never blindly retries `tools/call` or message sends.
- **Take over anytime**: Pause or stop immediately from the overlay, and optionally restrict allowed apps to an explicit whitelist in Settings.

### 4. Long-Term Memory & Self-Learning Skills

- **Memory**: Stores only facts and preferences explicitly stated by the user—never internal reasoning traces. Habit proposals require explicit user confirmation before taking effect.
- **Self-learning skills**: Built from completed runs with verified screen evidence. Concrete inputs are abstracted into parameters while stale node IDs and coordinates are stripped. Reusing a skill across different parameters upgrades its verification status; repeated mismatches after an app redesign automatically pause the outdated skill.

---

## 5. Privacy & Current Boundaries

### Where Does Your Data Live?
- Conversation history, long-term memory, skills, and run logs stay inside the app's private on-device storage.
- Model API keys and MCP authorization headers are encrypted using **Android Keystore**.
- LifeBuddy has no built-in model account and routes nothing through any developer-owned relay server.
- It never passively records your daily phone usage or trains models on your data.

### Current Limitations (`0.2.0-alpha18`)
- Phone control relies on accessible UI text and widget trees; custom-drawn, unlabeled, or purely visual screens may not be operable.
- CAPTCHAs, payments, final checkout confirmation, unattended background execution, and desktop `stdio`/`npx` MCP plugins are not supported.
- Local Gemma / `llama.cpp` support is experimental; the default APK does not bundle local weights or native inference libraries, so phone planning currently uses your configured cloud model.

---

## 6. Quick Start & Building from Source

### Try the Preview APK
1. Download and install the latest preview APK from [Releases](https://github.com/RytterMohn/LifeBuddy/releases) (requires Android 8.0+).
2. Open **Sidebar → Settings** and enter an HTTPS endpoint compatible with OpenAI Chat Completions + function tools, a model name, and your API key.
3. Verify connectivity in **Chat** mode, then enable the LifeBuddy Accessibility Service in Android Settings.
4. Switch to **Operate** mode and try a simple task such as:
   > "Open Notes, create a new note saying 'LifeBuddy test', and save it."

### Build from Source
Requirements: **JDK 17**, **Android SDK Platform 34**, and **Build Tools 34.0.0** (the repo includes Gradle 8.9 Wrapper; regular builds require no API key or NDK):

```shell
git clone https://github.com/RytterMohn/LifeBuddy.git
cd LifeBuddy
./gradlew :core:test :app:testDebugUnitTest :app:lintDebug :app:assembleDebug
```

On Windows, replace `./gradlew` with `gradlew.bat`. The debug APK is generated at `app/build/outputs/apk/debug/app-debug.apk`.

---

## 7. Closing Thoughts

LifeBuddy is still under active development, and adapting to more real-world apps and multi-app workflows is an ongoing effort. If you are interested in Android agents, accessibility automation, or mobile MCP extensions, feel free to star the repo or open an Issue / PR on [GitHub](https://github.com/RytterMohn/LifeBuddy)!
