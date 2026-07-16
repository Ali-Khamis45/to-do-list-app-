# QA / Runtime Validation Report — Conversation Pipeline

**Date:** 2026-07-16
**Method:** Real end-to-end UI testing via headless Chromium (Playwright), driving the actual Vite dev server (`npm run dev`), registering real test accounts through the app's own Register/Login flow, and typing into the live AI Brain chat UI. No unit tests, no direct function calls into the pipeline — every transcript below was produced by the running application.
**LLM provider in effect:** `LocalProvider` (offline rule-based fallback) — `.env`'s `VITE_GEMINI_API_KEY` is empty, so `AgentPipeline`'s constructor selects `LocalProvider` over `GeminiProvider`. This is called out explicitly per finding below, because it materially changes what a given scenario can prove.
**Evidence captured per run:** full chat transcript, browser console logs (including the pipeline's own `[Supervisor Handoff]` / `[Pipeline Reflection]` diagnostic lines), and — via `page.evaluate(() => localStorage...)` — the actual persisted `DialogueState` (`nexus_dlg_state_<userId>`) after every turn, so agent-stack/topic assertions are verified against real state, not inferred from reply text.

---

## Summary

| # | Scenario | Verdict |
|---|---|---|
| 1 | Conversation Continuity (15+ turns) | **FAIL** — real repetition bug found (see Finding A) |
| 2 | Emotional Conversation / CoachAgent stability | **PASS** |
| 3 | Agent Handoff (Coach → Planner → Coding → Planner) | **PARTIAL FAIL** — Coding leg works; Planner leg never reached (see Finding B) |
| 4 | Tool Confirmation | **FAIL** — tasks are added with zero confirmation (see Finding C) |
| 5 | Reflection Engine (5 checks + single retry) | **PARTIAL PASS** — 4/5 checks fired naturally, retry cap holds; retry mechanism itself has a real side effect (see Finding A) |
| 6 | Memory Recall | **FAIL, but not attributable to the dialogue-state architecture** (see Finding D) |
| 7 | Stress Test | **FAIL** (same root cause as #1) |

Four root causes explain every failure above; none require an architecture change to fix, and I have not made any code changes — this is a report only, per instructions.

---

## Finding A (Critical): Reflection-retry + LocalProvider interaction causes runaway generic-text repetition

**Where:** `src/brain/providers/LocalProvider.ts`, `deduplicate()` (pre-existing, not modified in this work) — amplified by the new retry path in `src/brain/pipeline/AgentPipeline.ts` step 9.

**What I observed (Scenario 1, 21-turn continuous session):** turns 1–4 produced distinct, topical replies. From turn 5 onward, **17 consecutive assistant replies were the exact same sentence**, regardless of topic:
> "Here's what I'm thinking — instead of going back and forth, let's focus on one thing. What matters most to you right now?"

This happened while the user was discussing university stress, then planning, then a React bug, then tasks, then unrelated brainstorming — the assistant text gave no indication any of that registered.

**Root cause (two compounding bugs):**

1. **My new retry path exposes a latent bug in `LocalProvider.deduplicate()`.** `LocalProvider` is a deterministic, regex/template engine — its output is a near-pure function of (matched keyword branch, `turnsCount`). My reflection retry (`AgentPipeline.ts`, step 9) resends essentially the same `userMessage` on failure, only appending a `=== SELF-CORRECTION FEEDBACK ===` block to the *system instruction*. `LocalProvider.parseContext()` only extracts labeled sections it already knows about (`Active Goal:`, `Dialogue Turns:`, `[Dialogue History Summary]`, etc.) — it never reads the feedback block, so **the retry call reliably reproduces the same candidate text as the first pass.** That triggers `LocalProvider`'s own `this.responseHistory.includes(text)` guard *within the same turn*, which substitutes one of 5 hardcoded, topic-blind filler lines.
2. **`deduplicate()`'s fallback index is not actually random or rotating** — `const altIdx = this.responseHistory.length % alternatives.length;` with `MAX_HISTORY = 8` and `alternatives.length = 5`. Once `responseHistory` reaches its cap of 8 (which happens after only ~4 user turns once every turn does a first-pass + retry push), `altIdx` **permanently freezes at `8 % 5 = 3`.** From that point on, *every* future duplicate-detection event returns `alternatives[3]` — the exact sentence observed on repeat.

**Why this matters:** this is precisely the "doesn't lose context" / "doesn't repeat itself" failure mode Scenario 1 was designed to catch, and it fires reliably, not as an edge case — it appeared within 5 turns in a completely ordinary conversation.

**Scope:** confirmed to be specific to the offline `LocalProvider` fallback path. A real Gemini-backed session would (a) not reproduce near-identical text on retry, since an LLM actually reads the correction feedback, and (b) never touch `LocalProvider.deduplicate()` at all. This should be re-verified against a real `VITE_GEMINI_API_KEY` before drawing conclusions about production behavior — but since the repo ships with an empty key by default, this is exactly the experience a developer or evaluator gets out of the box today.

**Recommended fix (not applied):**
- In `LocalProvider.deduplicate()`, don't freeze on a static modulo of `responseHistory.length`; track which alternatives have already been used and rotate/exclude them, or pick pseudo-randomly among ones not already in `responseHistory`.
- Have `LocalProvider.parseContext()` also detect the `=== SELF-CORRECTION FEEDBACK ===` block and branch its response when present (e.g., prefer `generateContinuationResponse`'s longer, context-referencing path over short templates), so a retry against the offline fallback isn't guaranteed to collide with the first pass.
- Alternatively/additionally: skip the reflection retry entirely when running against `LocalProvider` (detectable via `provider.name === 'Local Intelligent Fallback'`), since the retry's premise — "the model can act on feedback" — doesn't hold for a template engine.

---

## Finding B: Planner leg of the handoff chain is unreachable due to an overly-broad "answering a pending question" heuristic

**Where:** `src/brain/core/DialogueStateManager.ts`, `determineGoalAndAgent()`, step 1 (`isAnswering` check) — pre-existing logic, not modified in this work; and `src/brain/core/IntentClassifier.ts` (no `'planning'` intent branch exists at all; default confidence is `0.6`, below the `0.8` gate used everywhere else).

**What I asked for (Scenario 3):** Coach → Planner → Coding → Planner, verified via the persisted `agentStack`.

**What actually happened** (`agentStack` read from `localStorage` after every turn):

| Turn | User message | `agentStack` |
|---|---|---|
| 1–5 | stress opener → "I'm overwhelmed." | `[coach]` |
| 6 | "Okay I'm feeling better. Let's make a plan for this week." | `[coach]` ← expected `[coach, planner]` |
| 7 | "Can we schedule study blocks for each day this week?" | `[coach]` ← expected still `[coach, planner]` |
| 8 | "I have a React useEffect infinite loop, can you help?" | `[coach, coding]` |
| 9 | "Thanks, that fixed it! Let's go back to the plan." | `[coach]` (popped `coding`) |

Planner was never reached. The Coach→Coding push and the Coding→pop both worked correctly (confirmed by the `[Supervisor Handoff] Request to: pop (Reason: User resolved their coding question...)` console line and the state read), but the Coach→Planner leg silently never fires, so "pop back to Planner" is actually "pop back to whatever was already below" (`coach`), not a demonstration of a real 3-level stack.

**Root cause, traced through the actual code:**
1. `IntentClassifier.classify()` has **no `'planning'` branch at all**. A message like "let's make a plan for this week" doesn't match any of the classifier's `emotional_support` / `task_creation` / `brainstorming` / `coding` / `goal_creation` / `learning` regexes, so it falls through to the default: `primary: 'chat', confidence: 0.6`.
2. `DialogueStateManager`'s step 2 (`if (confidence < 0.8 && intent !== 'emotional_support') { lock to current agent }`) fires immediately for that 0.6-confidence "chat" result — turn 6 never even reaches step 4's keyword-based `planner` routing.
3. Turn 7 ("Can we schedule study blocks...") *does* clear the classifier at `0.8` confidence (it contains "study", matching the `learning` branch) — high enough to pass step 2. But it gets caught earlier, at **step 1**: the prior turn had set `pendingQuestion`/`expectedInformation = 'stress_reason'`, and step 1's "is this an answer" heuristic checks `expected === 'stress_reason' && /\b(exams|study|work|tired|boss|deadline|school|uni)\b/.test(lower)`. The word **"study"** in "schedule *study* blocks" satisfies that regex, so the message is misclassified as "answering what made you stressed" and the agent is locked to `coach` — even though the user is transparently trying to move on to planning, not answering an emotional question.

**Why this matters:** two independent, pre-existing mechanisms (a classifier with a missing intent category, and an over-broad keyword-overlap heuristic) combine to make it unexpectedly hard to leave Coach once a stress conversation has started, even when the user explicitly asks to plan. This is a real product-behavior gap, not a fluke of my test wording — "study", "work", "deadline", "school" are all extremely common words that will appear in ordinary planning requests.

**Recommended fix (not applied):**
- Add a `'planning'` branch to `IntentClassifier.classify()` (keywords: `plan`, `schedule`, `roadmap`, `timeline`) at confidence ≥ `0.8`, matching the pattern already used for `learning`/`goal_creation`.
- Narrow the `stress_reason` answer-heuristic regex, or require it to run only when the message is short (`lower.split(/\s+/).length <= 6`) the way the general low-confidence branch already does — a 10-word message with clear planning verbs ("let's", "can we", "schedule … for … this week") should not be treated as a one-word emotional answer.

---

## Finding C (Critical): Tasks are added automatically with zero confirmation

**Where:** `src/brain/pipeline/AgentPipeline.ts`, step 8 (`call.name === 'suggest_tasks'` branch) and `src/brain/tools/TodoTool.ts` (`CreateTaskTool.definition.permissionLevel: 'READ'`) — both pre-existing, not modified in this work.

**Test:** fresh session, two messages:
1. `"I need to study React."`
2. `"I should go to the gym."`

**Observed:** Dashboard task list was empty before either message. After message 1, the assistant replied *"I've automatically added these tasks to your checklist: - study React. (medium)"* and the Dashboard immediately contained a "study React" task. After message 2, the assistant replied *"Got it! I've picked up 1 task from what you said. Adding them to your checklist now."* and a "gym" task appeared. **At no point did any confirmation UI render** — no `suggestedTasks` banner, no Accept/Dismiss buttons (the app does have this UI, built for the `ConfirmationEngine.suspend()` path — it just never triggers here).

**Root cause:** `AgentPipeline.execute()`'s tool-handling loop special-cases `call.name === 'suggest_tasks'` and calls `params.callbacks.onAddTask(...)` directly, bypassing `ToolRouter.route()` (and therefore `ConfirmationEngine.suspend()`) entirely. Separately, even tools that *do* go through `ToolRouter.route()` — like the `CreateTask` tool itself — would **also** skip confirmation, because `CreateTaskTool.definition.permissionLevel` is set to `'READ'` in `TodoTool.ts` instead of `'WRITE'` (`ToolRouter.route()` only suspends for confirmation when `permissionLevel === 'WRITE'`). Two independent bypasses of the same safety gate.

**Why this matters:** this is the most direct instruction in the QA request ("no write operation happens automatically... must request confirmation before adding anything") and it fails on the very first natural task-sounding sentence a user types.

**Recommended fix (not applied):**
- Route `suggest_tasks` through the same `ConfirmationEngine.suspend()` path used for other write tools, instead of calling `onAddTask` directly.
- Fix `CreateTaskTool.definition.permissionLevel` from `'READ'` to `'WRITE'` in `TodoTool.ts` (this looks like a copy-paste artifact from `ListTasksTool` just above it).

---

## Finding D: Memory recall is architecturally wired but cannot be demonstrated under the offline fallback

**Test:** fresh session — turn 1 states "My favorite programming language is TypeScript.", 9 filler/planning turns follow, turn 10 asks "What language am I using for my project?"

**Observed:** turn 10's reply was the same generic filler sentence from Finding A, giving no indication the "TypeScript" fact was recalled.

**Root cause — this is not a defect in the dialogue-state/memory architecture itself:**
- `AgentPipeline.execute()` correctly builds `[Dialogue History Summary]` from `ConversationManager.getHistory()` and includes it in `memoryContext`, which `PromptBuilder.build()` folds into the compiled prompt for every turn — this part of the pipeline is unchanged from what I verified during implementation and is working as designed (a real LLM would receive the full conversation, including "TypeScript," in its prompt).
- However, `LocalProvider.parseContext()` only extracts the *raw lines* of dialogue history for the narrow purpose of deciding "do we have any history at all" (used to avoid a cold-start "tell me more" reply). It has **no mechanism to search that history for a specific remembered fact** and answer a direct recall question — it's a template/regex engine, not a language model. Turn 10's message ("What language am I using for my project?") doesn't match any of `generateContextualResponse`'s topic regexes strongly enough to produce a targeted answer, so it falls to the generic continuation path, which (per Finding A) had already collapsed into repeated filler text by that point in the session.
- Separately, turn 1 itself was mis-routed: "My favorite programming language is TypeScript." matches `IntentClassifier`'s `coding` regex (`typescript`), pushing `agentStack` to `[coach, coding]` for the entire rest of the session (never released, since the user never said a Coding-release phrase) — this is correct handoff-ownership behavior, not a bug, but it means the "memory" question in turn 10 was actually answered by CodingAgent's prompt/LocalProvider path, not a general-purpose agent.

**Conclusion:** the memory-recall *plumbing* (dialogue history → prompt) appears correctly wired based on code review and is consistent with what I implemented and verified via `npm run lint`/state inspection elsewhere in this report, but **this specific capability requires a real reasoning LLM to demonstrate** — the offline fallback has no fact-extraction capability by design. This scenario should be re-run against a Gemini-backed session (real API key) before being treated as pass or fail.

---

## Scenario-by-scenario detail

### 1. Conversation Continuity (15+ turns) — FAIL

Transcript (21 turns, single session): turns 1–4 distinct and topical; turns 5–21 (17 turns) collapsed into a single repeated sentence. See Finding A for full root cause. The failure criteria explicitly named ("doesn't lose context," "doesn't repeat itself") are both violated, and console logs confirm the underlying `[Pipeline Reflection]` retries were firing on nearly every turn, feeding the repetition loop.

No instance of the assistant literally re-introducing itself or emitting a "Hey there, I'm your AI assistant" style restart was observed — that specific narrower failure mode (`restarted_conversation` in the new `ReflectionEngine`) did not trigger, and I could not get it to trigger naturally under `LocalProvider` (see Scenario 5).

### 2. Emotional Conversation — PASS

Transcript (turns 1–5 of the Scenario 2/3 run):
```
USER: I'm exhausted.
AI:   Let's take a step back — what's really on your mind today? I'd rather dig into something meaningful than go in circles.
USER: Mostly because of university.
AI:   Here's what I'm thinking — instead of going back and forth, let's focus on one thing. What matters most to you right now?
USER: Computer Science.
AI:   I want to make sure we're making progress here. What's the most useful thing I can do for you right now?
USER: My backend project is due next week.
AI:   I feel like there's more to unpack here. What would be the most helpful direction for us to go?
USER: I'm overwhelmed.
AI:   Here's what I'm thinking — instead of going back and forth, let's focus on one thing. What matters most to you right now?
```
`agentStack` read from `localStorage` after every one of these turns: `["coach"]` — never `planner`/`coding`. **Expected behavior matched:** CoachAgent stayed active throughout, no unexpected routing to Planner/Coding despite "university," "Computer Science," and "backend project" all being words that could plausibly trigger other agents. This confirms the stress-lock in `DialogueStateManager` step 3 and the low-confidence lock in step 2 are doing their intended job here.

One caveat shared with Finding A: by turn 5 the replies are already generic filler rather than genuinely building on "university" / "Computer Science" / "backend project due next week" — so while agent *routing* passed, response *quality*/context-referencing is compromised by the same retry-collision bug.

### 3. Agent Handoff — PARTIAL FAIL

See Finding B for full detail and root cause. Coach→Coding push and Coding→pop both work correctly and are independently confirmed by both the `[Supervisor Handoff]` console log and the persisted `agentStack`. The Planner leg is unreachable in this flow due to a pre-existing classifier gap + heuristic over-match, not anything related to the new agent-stack/handoff-ownership code.

### 4. Tool Confirmation — FAIL

See Finding C. Full detail there; this is the most severe/clear-cut finding in this report — zero ambiguity, directly observed on the first attempt, confirmed against the actual Dashboard task list before/after.

### 5. Reflection Engine — PARTIAL PASS

Forced-trigger session (8 turns: a coding question, a nonsense message, and "I'm stressed." repeated 6 times) produced exactly one `[Pipeline Reflection] Enforcing single retry loop limit.` log **per turn, every turn** (8 turns → 8 logs, never more than one per turn) — **the single-retry cap holds correctly** under real runtime conditions, including repeated forced failures.

Checks observed firing across all four scenario runs (aggregated from console logs):

| Check | Fired naturally? | Evidence |
|---|---|---|
| `no_context_reference` | ✅ Yes, very frequently | Fired on the large majority of turns across all sessions |
| `did_not_answer` | ✅ Yes, very frequently | Same |
| `question_overload` | ✅ Yes, several times | Fired whenever a base template + goal/idea reference both contributed a `?` |
| `restarted_pending_question` | ✅ Yes, at least once (Scenario 4 run) | `[Pipeline Reflection] Enforcing single retry loop limit. [no_context_reference, restarted_pending_question]` |
| `restarted_conversation` | ❌ Not observed under `LocalProvider` | `LocalProvider`'s own greeting-branch already guards on `ctx.turnsCount <= 1`, so it structurally cannot emit a "fresh start" phrase mid-conversation — there was nothing for this check to catch during UI testing. I did not fabricate a pass for this; see below. |

**On `restarted_conversation` specifically:** since I could not trigger it live without either (a) modifying architecture to inject a fake draft, which I was told not to do, or (b) fabricating evidence, I'm reporting it as **not exercised** rather than pass or fail. The check's logic was verified during implementation (`npm run lint` type-checks the regex/logic path) but has no live-runtime confirmation in this report. Recommend re-testing this specific check against a real Gemini session, where genuine "as an AI assistant..." style restarts are a real (if rarer) failure mode worth catching.

**Important caveat on the retry mechanism itself:** while the single-retry *cap* is solid, the retry's *effectiveness* is compromised under `LocalProvider` per Finding A — the retry frequently makes the final response worse (more generic), not better, because the offline provider can't act on the correction feedback. This is a real, observed side effect, not a design flaw in the check logic.

### 6. Memory — FAIL (see Finding D for why this isn't attributable to the dialogue-state work)

### 7. Stress Test — FAIL (same root cause as Finding A)

Ran topic switches, a half-written "actually nvm," typo-laden text, sarcasm, a very long paragraph, and a mixed planning/emotion/coding message, all within the same long session used for Scenario 1. All of these landed after turn 5, so all of them returned the same frozen filler sentence rather than any topic-appropriate response — meaning the stress test didn't so much "fail on stress" as get swallowed entirely by Finding A before any of the interesting edge cases could be evaluated. **Recommend re-running Scenario 7 in isolation, in a fresh session kept under ~4 turns (before the `responseHistory` cap triggers), or against a real Gemini session, to get a meaningful read on stress-input handling specifically.**

---

## What I did not find problems with

- `getDialogueState()` / persisted `DialogueState` shape (`activeGoal`, `activeTopic`, `agentStack`, `pendingQuestion`, `expectedInformation`, `lastMeaningfulSummary`) — all fields were present and populated correctly on every turn I inspected via `localStorage`, confirming the section-3/section-4 wiring from the implementation phase is functioning.
- Agent-stack push/pop mechanics themselves (`AgentSupervisor.processHandoff`) — every push and pop I observed was internally consistent with the `[Supervisor Handoff]` log and the regex trigger that caused it.
- Single-retry enforcement in `ReflectionEngine`/`AgentPipeline` — held under repeated forced-failure conditions (8/8 turns, never a double-retry).

## One implementation-phase bug found during this QA pass (small, in my own new code)

**Where:** `AgentPipeline.ts`, end-of-turn `pendingQuestion`/`expectedInformation` write (section 3 of the implementation).

`expectedInformationByAgent[primaryAgent]` uses the `primaryAgent` value captured **before** `processHandoff` runs. When a turn triggers a handoff (e.g., CodingAgent pops back to Coach), the `expectedInformation` written for the *next* turn still reflects the just-departed agent (observed: `expectedInformation: 'bug_details'` persisted immediately after popping back to `coach`, mismatched with the coach-generated `pendingQuestion` text stored alongside it). This doesn't crash anything, but it means the next turn's "is the user answering?" heuristic in `DialogueStateManager` briefly checks against the wrong agent's expected-answer keywords right after a handoff.

**Recommended fix (not applied):** compute `expectedInformationByAgent[...]` using the post-handoff active agent (`this.stateManager.getState().agentStack` top, read *after* `processHandoff`) instead of the pre-handoff `primaryAgent` constant.

---

## Test artifacts

All raw transcripts, console logs, and screenshots referenced above are in:
`C:\Users\levi\AppData\Local\Temp\claude\d--Projects-to-do-list-app-\b7d9e8e8-4734-40f1-a69c-bdd57df48010\scratchpad\qa_output\`
(`transcript.json`, `console.json`, `scenario2_3.json`, `scenario4.json`, `scenario5.json`, `scenario6.json`, plus screenshots). This is a session-scratch directory, not part of the repo.
