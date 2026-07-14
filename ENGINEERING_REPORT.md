# Engineering Report
## AI Productivity Operating System
### Project: to-do-list-app- | Repository: Ali-Khamis45/to-do-list-app-

---

## 1. Executive Summary

This report documents the full engineering design, architectural decisions, and implementation details for the **AI Productivity Operating System** — a frontend-only, production-ready application combining habit tracking, task management, long-term goal planning, and an AI-powered second brain workspace.

The project was built from an existing monthly habit tracker and expanded with two major feature systems:
1. **Smart Goal Planner** — Converts long-term goals into daily actionable targets with AI coaching
2. **AI Brain Workspace** — A personal knowledge management system that captures, organizes, connects, and converts ideas into executable projects

---

## 2. System Architecture

### 2.1 Architectural Pattern

The system implements a **layered clean architecture** with strict separation of concerns:

```
┌─────────────────────────────────────────────┐
│              UI Layer (React)               │
│  Components, Modals, Dashboards, Charts     │
├─────────────────────────────────────────────┤
│           Application Layer                 │
│  App.tsx — State, Event Handlers, Routing   │
├─────────────────────────────────────────────┤
│            Domain Layer                     │
│  goals/, brain/ — Types, Calculations, AI   │
├─────────────────────────────────────────────┤
│         Infrastructure Layer                │
│  auth/ — Repository, Session, Hashing       │
└─────────────────────────────────────────────┘
```

### 2.2 Design Principles Applied

| Principle | Implementation |
|-----------|---------------|
| **Single Responsibility** | `calculations.ts` only does math; `forecast.ts` only forecasts; `aiService.ts` only orchestrates AI |
| **Open/Closed** | New goal types/templates can be added without modifying existing logic |
| **Liskov Substitution** | `IUserRepository` interface allows swapping localStorage for any backend |
| **Interface Segregation** | `IUserRepository` declares minimal focused method groups per table |
| **Dependency Inversion** | `AuthenticationService` depends on `IUserRepository` abstraction, not concrete class |

### 2.3 Data Flow

```
User Interaction
      │
      ▼
App.tsx (Event Handler)
      │
      ├──▶ UserRepository (localStorage CRUD)
      │
      ├──▶ Domain Service (calculations/forecast/aiService)
      │         │
      │         └──▶ Gemini API (optional) OR Local Fallback
      │
      └──▶ setState() ──▶ React Re-render ──▶ UI Update
```

---

## 3. Module Documentation

### 3.1 Authentication Module (`src/auth/`)

#### `AuthenticationService.ts`
Orchestrates the full auth flow: registration, login, logout, and session verification.

```typescript
class AuthenticationService {
  register(fullName, email, password): { success, user?, error? }
  login(email, password): { success, user?, error? }
  logout(): void
  getLoggedInUser(): User | null
}
```

**Security Decisions:**
- Passwords hashed with **bcryptjs** using 10 salt rounds (~100ms hash time — prevents brute force)
- Sessions stored as `userId` in `localStorage` (no tokens in production — would use JWT)
- Email lookups are case-insensitive

#### `UserRepository.ts`
Implements the Repository pattern over `localStorage`. Each data table is stored as a JSON array under a namespaced key (`db_users`, `db_tasks`, etc.).

**Tables managed:**

| Table Key | Type | Description |
|-----------|------|-------------|
| `db_users` | `User[]` | Account credentials and preferences |
| `db_tasks` | `RelationalTask[]` | Tasks with userId isolation |
| `db_daily_task_progress` | `RelationalDailyTaskProgress[]` | Per-day task completion logs |
| `db_habits` | `RelationalHabit[]` | Habit definitions |
| `db_daily_progress` | `RelationalDailyProgress[]` | Per-day habit completion logs |
| `db_focus_sessions` | `RelationalFocusSession[]` | Focus heatmap data points |
| `db_achievements` | `RelationalAchievement[]` | Unlocked achievement records |
| `db_goals` | `RelationalGoal[]` | Smart goals with full metadata |
| `db_ideas` | `RelationalIdea[]` | AI Brain idea records |
| `db_idea_links` | `RelationalIdeaLink[]` | Directional idea relationships |

**Seed Data:** On first login, `seedDefaultUserData()` pre-populates:
- 5 habits with 90 days of realistic historical logs
- 8 tasks across various categories and priorities
- 3 goals (numeric Book reading, milestone SaaS startup, habit React learning)
- 5 ideas with 2 relationship links and 3 project tasks

---

### 3.2 Smart Goal Planner (`src/goals/`)

#### `types.ts` — Domain Types

```typescript
interface Goal {
  goalType: 'numeric' | 'milestone' | 'habit'
  status: 'not_started' | 'active' | 'paused' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  difficulty: 'easy' | 'medium' | 'hard'
  frequency: 'daily' | 'weekly' | 'monthly'
  milestones: GoalMilestone[]
  logs: GoalProgressLog[]
  subGoals: Goal[]           // Recursive tree support
  dependencies: string[]     // IDs of prerequisite goals
  history: GoalHistoryEvent[]
}
```

#### `calculations.ts` — Pure Math Engine

All functions are **pure** (no side effects, no API calls):

| Function | Purpose |
|----------|---------|
| `calculateGoalMetrics(goal, today)` | Computes all KPIs: days remaining, pace, streaks, consistency |
| `calculateStreak(logs, today)` | Counts consecutive days with a progress log |
| `calculateConsistency(logs, startDate, today)` | Percentage of days with any log entry |
| `countMissedDays(logs, startDate, today)` | Days since start with zero logging |
| `aggregateDashboardMetrics(goals)` | Rolls up all goals into summary stats |

**Date utilities** are fully defensive — every operation wraps in `try/catch` with `isNaN()` guards to prevent `RangeError` crashes from malformed localStorage values.

#### `forecast.ts` — Rolling Decay Forecasting

Uses **exponential decay weighting** to prioritize recent activity:

```
W(i) = e^(-λ · i)    where λ = 0.15, i = days ago

Rolling Pace = Σ(value[i] × W(i)) / Σ(W(i))   over last 14 days

Blended Pace = 0.8 × Rolling Pace + 0.2 × Overall Pace
```

This prevents the "cold start" problem where no recent logs produce an infinite projection.

**Outputs:**
- `projectedFinishDate` — When you'll finish at current pace
- `daysAheadOrBehind` — Positive = ahead, negative = behind
- `successProbability` — 0–100% likelihood of on-time completion
- `riskRating` — `'safe' | 'watch' | 'warning' | 'critical'`

#### `aiCoach.ts` — AI Coaching Engine

**Priority order:**
1. Gemini `gemini-2.5-flash` API call (structured JSON prompt)
2. Local rule-based engine (deterministic, production-stable fallback)

The local fallback analyzes:
- Days behind/ahead schedule
- Current streak length
- Estimated minutes per unit (e.g. 240 min/book → "read 56 min today")
- Priority level and difficulty rating

Returns a structured `CoachBriefing` with: `greeting`, `summary`, `dailyTarget`, `motivationalMessage`, `recoverySteps[]`, `suggestedFocusTime`.

#### `templates.ts` — Pre-built Goal Templates

7 goal templates pre-configured with sensible defaults:

| Template | Unit | Est. Minutes/Unit | Default Duration |
|----------|------|------------------|-----------------|
| Read Books | books | 240 min | 12 months |
| Lose Weight | kg | 60 min | 6 months |
| Save Money | dollars | 30 min | 12 months |
| Learn Language | lessons | 30 min | 6 months |
| Daily Coding | hours | 60 min | 3 months |
| Build Startup | milestones | 120 min | 6 months |
| Publish Apps | apps | 240 min | 12 months |

---

### 3.3 Autonomous Reasoning AI Operating System & Brain Workspace (`src/brain/`)

The core AI capability of the system is designed around a multi-layered **Autonomous Reasoning-First AI Operating System (AI OS)**. It operates as a multi-step cognitive pipeline executing turn-based understanding, planning, reasoning, reflection, validation, and execution.

#### 3.3.1 Cognitive Pipeline Flow

The AI Operating System processes every user input message through a 10-step pipeline located in the `AgentPipeline` class:
1.  **Context Retrieval & Optimization:** The `ConversationManager` pulls the last 12 turns of active dialogue. Turns beyond this limit are processed by the `ConversationSummarizer` to create a concise historical context briefing.
2.  **Intent Classification & NLP Extraction:** The `IntentClassifier` analyzes the input (identifying prompts such as emotional support, task additions, project expansions). Concurrently, the `EntityExtractor` extracts dates, priorities, categories, and technology tags.
3.  **Dialogue State Determination:** The `DialogueStateManager` evaluates the active dialogue goal (e.g., MVP planning, roadmap breakdown, emotional support grounding) and detects user sentiment state (`stressed` vs. `calm`).
4.  **Response Planning:** The `ResponsePlanner` maps the goal to a planned sequence of output steps (e.g. `validate_empathy → ask_clarification` or `break_down_phases → suggest_tasks`).
5.  **Memory Retrieval & Semantic Ranking:** The `MemoryRetrievalRanker` scores the user's ideas and goals based on keyword density and tags, retrieving only the contextually relevant memories.
6.  **Prompt Selection & Compilation:** The `PromptBuilder` merges system role prompts, workspace context, semantic memories, dialogue goals, and active response plans.
7.  **Collaborative Reasoning:** The `AgentSupervisor` selects specialized agents (e.g., Coach, Planner, Coding, Research) depending on the message classification. The agents collaborate, return strongly typed structures, and the supervisor aggregates their outputs.
8.  **Tool Routing & Write-Action Interception:** Tool calls are passed to the `ToolRouter`. Read tools run automatically. Write tools (like task creation) are intercepted by the `ConfirmationEngine`, which suspends execution and generates a transaction.
9.  **Reflection & Self-Correction:** The `ReflectionEngine` filters the draft response against emotional coaching guidelines, checks for tone consistency, ensures contractions, and strips generic "productivity partner" placeholders.
10. **Sanitization & Validation:** The `ResponseValidator` verifies constraint compliance, strips repeated content, and outputs the finalized response for formatting by the `ResponseFormatter`.

---

#### 3.3.2 Module Structure & Architecture

The architecture is divided into clear layers under `src/brain/`:

##### 1. Core Reasoning Layers (`src/brain/core/`)
*   **`AgentSupervisor`:** Coordinates agent task delegation. Runs multi-agent collaborations, merges suggested tool calls, and compiles unified response text.
*   **`DialogueStateManager`:** Handles session turns and active dialogue goals, persisting state parameters to localStorage.
*   **`ResponsePlanner`:** Maps dialogue goals to a predefined sequence of response steps that guide agent generation.
*   **`PromptBuilder`:** Augments active templates with dialogue states, workspace parameters, and memory payloads.
*   **`MemoryRetrievalRanker`:** Ranks historical ideas and goals using string matching, tags, and category weights to compile contextual snippets.
*   **`ReflectionEngine`:** Self-corrects generated text to match a supportive friend persona, dynamically adapting the vocabulary to prevent generic customer support jargon.
*   **`ResponseValidator`:** Performs final syntactic and semantic validation checks on generated strings.
*   **`ConversationManager`:** Orchestrates turn saving, context retrieval, and window pruning.
*   **`ConfirmationEngine`:** Suspends state modifications (such as task additions), generating a safe transaction token that must be approved in the UI.

##### 2. Specialized Collaborative Agents (`src/brain/agents/`)
Specialized reasoning agents extend the `BaseAgent` class and communicate through a strongly typed structure containing analysis text, follow-up questions, and suggested tool invocations:
*   **`CoachAgent`:** Reviews pacing and goal targets to construct daily recovery briefings.
*   **`PlannerAgent`:** Maps out high-level project tasks, epics, and features.
*   **`CodingAgent`:** Recommends technical design patterns, framework options, and architectures.
*   **`ResearchAgent`:** Reviews market competition, target audiences, and suggests improvements.
*   **`ProjectAgent`:** Coordinates project dates, deliverables, and metrics.
*   **`IdeaAgent`:** Explores conceptual expansions, monetization avenues, and risks.

##### 3. Persistence & Memory Manager (`src/brain/memory/`)
*   **`UserMemory`:** Manages profile parameters, tracking favorite technologies, categories, and skills.
*   **`ConversationMemory`:** Handles relational saving of dialogue history.
*   **`IdeaMemory`:** Stores archived flags, favorite status, and cluster mappings.
*   **`GoalMemory`:** Logs goal-related modifications and milestone status.

##### 4. Tool Registry (`src/brain/tools/`)
Tools extend a base class defining their parameters, execution logic, and permission level:
*   **Read-Only (`permissionLevel: 'READ'`):** Automatically queries system states (`ListTasksTool`, `ListGoalsTool`, `ListIdeasTool`, `GetAnalyticsTool`, `SearchTool`).
*   **Write-Mutation (`permissionLevel: 'WRITE'`):** Requires user confirmation to run (`CreateTaskTool`, `CreateGoalTool`, `CreateIdeaTool`, `ProjectTool`).

##### 5. LLM Provider Layer (`src/brain/providers/`)
*   **`GeminiProvider`:** Connects to the Google Gemini API using `@google/genai` to stream and generate content, supporting function calling schemas.
*   **`LocalProvider`:** Operates offline, executing intent classifications, extracting tasks, checking emotional markers, and routing conversation flow deterministically.

---

#### 3.3.3 Idea & Search Domain Logic

##### `searchEngine.ts` — Semantic Search
1. Tokenize query into words.
2. Expand each token using the semantic dictionary (thesaurus-style matching).
3. Score each idea: Title match (+10 pts), Tag match (+5 pts), Content match (+1.5 pts per occurrence).
4. Filter zero-score ideas and sort descending.

##### Auto-Clustering Algorithm
*   Ideas are matched greedily against predefined cluster specifications (e.g. Technology, Health, Business) by tag, category, and content keywords.
*   Remaining ideas fall into a default "General Notes & Concepts" cluster.
*   Runs reactively using React `useMemo` hooks, avoiding any overhead on unchanged idea records.

---

### 3.4 UI Components

#### `SmartGoalPlanner.tsx` (66KB)

The most complex component. Renders:
- **Dashboard tab**: Aggregate metrics, health scores, risk indicators
- **Goal cards**: Progress rings, status badges, streak counts
- **Detail view**: 
  - Custom SVG line chart (actual vs. expected progress)
  - SVG burndown chart
  - SVG bar chart (weekly logs)
  - GitHub-style contribution heatmap (52 weeks × 7 days)
  - Dependency graph (prerequisite visualization)
  - Collapsible sub-goals tree
  - Progress log timeline
- **AI Coach panel**: Manual progress logger + briefing card

#### `AIBrain.tsx` (53KB)

Premium glassmorphic workspace. Renders:
- **Stats dashboard**: 4 KPI metric cards
- **Daily briefing banner**: AI-generated morning summary
- **Split workspace**:
  - Left (4/12): Cluster tree + semantic search + AI chatbot
  - Right (8/12): Tabbed workspace (Details / AI Expansion / Project Mode / Knowledge Graph)
- **SVG Knowledge Graph**: Draggable nodes, colored edges by relationship type
- **Task Review Modal**: Accept/reject AI-generated project tasks

#### SVG Implementation Notes

All charts are hand-coded SVGs (no chart library dependency):
- Line charts use `polyline points` for simplicity and performance
- Heatmap uses nested `rect` elements positioned via `x/y = col/row × cellSize`
- Graph nodes use `circle` + `text` within `g[transform=translate(x,y)]`
- Drag is implemented via `onMouseMove` delta tracking against SVG `getBoundingClientRect()`

---

## 4. State Management

No external state library (Redux, Zustand) is used. State is managed in `App.tsx` using React's built-in `useState` + `useMemo`:

| State Variable | Type | Purpose |
|---------------|------|---------|
| `currentUser` | `User \| null` | Auth session |
| `habits` | `Habit[]` | All user habits |
| `tasks` | `Task[]` | Persisted + virtual goal tasks |
| `goals` | `Goal[]` | Smart goals |
| `ideas` | `Idea[]` | AI Brain ideas |
| `ideaLinks` | `IdeaLink[]` | Idea relationships |
| `focusSessions` | `FocusSession[]` | Heatmap data |
| `activeTab` | `string` | Current navigation tab |

**`mergedTasks` (useMemo):** Dynamically injects virtual goal tasks into the task list on every render cycle when `tasks` or `goals` change. This is the primary synchronization mechanism — no database writes needed for virtual tasks.

---

## 5. Bidirectional Synchronization

### 5.1 Goal → Task Sync

Goals inject virtual tasks into `mergedTasks` via `useMemo`:

```
Numeric Goal (g) → Task id: `gt-${g.id}`
                   title: "Spend X mins on: {goal.title}"
                   completed: logs.find(l => l.date === today)?.value > 0

Milestone Goal (g) → Tasks per milestone: id: `gt-milestone-${g.id}-${m.id}`
                      completed: milestone.completed && completedDate === today
```

### 5.2 Task → Goal Sync (Reverse)

When `handleToggleTask` fires on a virtual task (`taskId.startsWith('gt-')`):

```
Numeric task checked:
  → Append GoalProgressLog { date: today, value: dailyTarget }
  → Save updated goal to UserRepository

Numeric task unchecked:
  → Remove GoalProgressLog for today
  → Save updated goal to UserRepository

Milestone task checked:
  → Set milestone.completed = true, completedDate = today
  → If goalType === 'milestone': append GoalProgressLog { value: 1 }

Milestone task unchecked:
  → Reverse: completed = false, completedDate = undefined
  → Remove progress log for today
```

### 5.3 Idea → Task Sync

Project task generation writes directly to `UserRepository` with `projectId` and `ideaId` fields. These tasks load as regular tasks in `loadUserData()` and appear in the daily checklist. The AI Brain's Project Mode tab filters `tasks.filter(t => t.projectId === idea.id)`.

---

## 6. Performance Considerations

### 6.1 What Was Done

- **Memoization**: `mergedTasks`, `filteredIdeas`, `clusters`, `selectedIdea`, `projectTasks`, `stats` all use `useMemo` with minimal dependency arrays
- **Pure functions**: All calculations in `goals/` and `brain/` are pure — safe to call repeatedly without side effects
- **Lazy AI calls**: AI expansion and task generation are only triggered by explicit user action, never on mount
- **Local-first**: All data reads/writes hit localStorage synchronously — no network latency in base usage

### 6.2 Known Tradeoffs

- **Bundle size**: 836KB minified JS (201KB gzip). Large due to `@google/genai` SDK (~200KB) and comprehensive component code. Would benefit from code-splitting with `React.lazy` in a future iteration.
- **localStorage limits**: ~5MB per origin. For heavy users with many goals/ideas/logs, a backend database would be necessary.
- **No virtualization**: Long lists (50+ ideas, 365 heatmap rows) render fully — acceptable for current scale, would need `react-window` for larger datasets.

---

## 7. Testing Strategy & Prompt Evaluation Framework

The application implements a comprehensive **Prompt Evaluation Framework** to benchmark prompt engineering improvements.

### 7.1 Automated Prompt Evaluation Dashboard
Developers can run assertions and benchmark performance metrics on Prompt Version A (Baseline) vs Prompt Version B (Reasoning-First) directly inside the AI Brain workspace:
*   **Metrics Collected:** Pass Rate, Average Latency (s), Token Usage, Memory Referencing Rate, Follow-Up Question Rate, Repeated Sentence Counts.
*   **Assertion Test Suites (`src/brain/evaluation/`):**
    *   `coach_tests.json`: Validates grounding user responses, empathy presence, task suggestion constraints, and single follow-up questions.
    *   `planner_tests.json`: Benchmarks scheduling steps and user level check-ins.
    *   `coding_tests.json`: Checks React dependencies arrays advice constraints.

### 7.2 Core Validation Mechanisms
1.  **TypeScript Verification:** `npm run lint` strictly validates type safety, exports compatibility under `isolatedModules`, and parameter order rules.
2.  **Production Bundler:** `npm run build` confirms tree-shaking, static assets, and dependency chunk sizes.
3.  **Draggable SVG Interactions & UI E2E:** Verified manually and E2E via browser automation.

**Recommended next steps:**
*   Unit tests for `calculations.ts` and `forecast.ts` (pure functions, trivially testable with Vitest)
*   Integration tests for `UserRepository` CRUD operations
*   E2E tests with Playwright for auth flows and task synchronization

---

## 8. Security Considerations

| Concern | Current State | Production Recommendation |
|---------|--------------|--------------------------|
| Password storage | bcryptjs hash in localStorage | Move to server-side with proper DB |
| Session management | userId in localStorage | JWT tokens with httpOnly cookies |
| API keys | `VITE_GEMINI_API_KEY` in env | Server-side proxy to hide key |
| XSS | React JSX escaping (automatic) | CSP headers on deployment |
| Data isolation | userId filter on every query | Server-side row-level security |

---

## 9. Deployment

### Static Hosting (Recommended)

```bash
npm run build
# Deploy /dist to: Vercel, Netlify, GitHub Pages, Cloudflare Pages
```

### Environment Variables on Hosting Platform

```
VITE_GEMINI_API_KEY = your_key_here
```

---

## 10. Changelog

### v3.0.0 — AI Brain Workspace
- Added `src/brain/` domain module (types, searchEngine, aiService)
- Added `AIBrain.tsx` premium glassmorphic workspace
- Added `NewIdeaModal.tsx` quick capture
- Added semantic search with keyword expansion
- Added automatic idea clustering
- Added interactive SVG knowledge graph with drag support
- Added AI Chat assistant with local memory
- Added AI Idea Expansion (17-dimension analysis)
- Added AI Task Generation with review/accept flow
- Added one-click Idea → Goal promotion
- Added project progress tracking synced to Todo checklist

### v2.0.0 — Smart Goal Planner
- Added `src/goals/` domain module (types, calculations, forecast, aiCoach, templates)
- Added `SmartGoalPlanner.tsx` with SVG charts and heatmaps
- Added `NewGoalModal.tsx` with 7 pre-built templates
- Added bidirectional Goal ↔ Task synchronization
- Added virtual goal tasks in daily checklist
- Added rolling exponential decay forecasting engine
- Added AI Coach with Gemini + local fallback
- Added 3 seed goals (numeric, milestone, habit types)

### v1.0.0 — Foundation
- Monthly habit tracking grid
- Task management with priority and repeat schedules
- Authentication with bcryptjs password hashing
- Session management and user isolation
- Theme engine (light, dark, stone)
- Focus heatmap and analytics
- Achievement vault
- Data backup/restore

---

## 11. Author

**Ali Khamis**  
GitHub: [@Ali-Khamis45](https://github.com/Ali-Khamis45)  
Repository: [to-do-list-app-](https://github.com/Ali-Khamis45/to-do-list-app-)
