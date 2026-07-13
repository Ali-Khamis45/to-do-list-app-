# 🧠 AI Productivity OS — Smart Todo, Goals & Brain Workspace

> A production-ready **AI Productivity Operating System** built with React 19, TypeScript, TailwindCSS v4, and Google Gemini AI. Manage habits, tasks, long-term goals, and ideas in one beautifully integrated workspace.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/Ali-Khamis45/to-do-list-app-)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-orange)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features at a Glance

| Module | Description |
|--------|-------------|
| 📋 **Todo Manager** | Daily tasks with priority, repeat schedules, notes, and category tracking |
| 📅 **Monthly Habit Grid** | Visual calendar grid with completion/missed/half-done states |
| 🎯 **Smart Goal Planner** | Long-term goals with daily targets, forecasting, and AI coaching |
| 🧠 **AI Brain Workspace** | Idea capture, semantic search, knowledge graph, AI chat, and project generation |
| 📊 **Analytics & Stats** | Habit streaks, focus heatmaps, completion rates |
| 🏆 **Achievements** | Milestone trophy vault unlocked automatically |
| 🔐 **Authentication** | Secure local auth with bcrypt password hashing and session management |
| 🎨 **Theme Engine** | Light, Dark, and Stone themes with live switching |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20.19.0 or v22+ ([nodejs.org](https://nodejs.org/))
- **npm** v10+

### Installation

```bash
# Clone the repository
git clone https://github.com/Ali-Khamis45/to-do-list-app-.git
cd to-do-list-app-

# Install dependencies
npm install

# (Optional) Configure Gemini AI for enhanced AI features
cp .env.example .env
# Edit .env and add your VITE_GEMINI_API_KEY
```

### Running Locally

```bash
npm run dev
# App available at http://localhost:3000
```

### Production Build

```bash
npm run build
# Output in /dist
```

### Type Check

```bash
npm run lint
# Runs tsc --noEmit for zero-error verification
```

---

## 🗂️ Project Structure

```
src/
├── App.tsx                     # Root component, state management, tab routing
├── types.ts                    # Shared TypeScript interfaces (Task, Habit, etc.)
├── index.css                   # TailwindCSS v4 design system & custom utilities
│
├── auth/                       # Authentication & data persistence layer
│   ├── AuthenticationService.ts   # Login, register, logout orchestration
│   ├── PasswordHasher.ts          # bcryptjs password hashing
│   ├── SessionManager.ts          # localStorage session token management
│   ├── UserModel.ts               # Relational schema interfaces
│   └── UserRepository.ts          # localStorage CRUD + seed data
│
├── goals/                      # Smart Goal Planner domain
│   ├── types.ts                   # Goal, Milestone, ProgressLog, GoalMetrics
│   ├── calculations.ts            # Pure math: paces, streaks, health scores
│   ├── forecast.ts                # Exponential decay rolling pace forecasting
│   ├── aiCoach.ts                 # Gemini + local fallback coaching engine
│   └── templates.ts               # 7 pre-built goal templates
│
├── brain/                      # AI Brain Workspace domain
│   ├── types.ts                   # Idea, IdeaLink, IdeaCluster, IdeaExpansion
│   ├── searchEngine.ts            # Semantic search + auto-clustering
│   └── aiService.ts               # AI organize, expand, task generation
│
├── theme/                      # Theme engine
│   ├── ThemeService.ts            # Theme persistence and application
│   └── useTheme.ts                # React hook for theme access
│
└── components/                 # React UI components
    ├── AIBrain.tsx                # AI Brain dashboard workspace
    ├── SmartGoalPlanner.tsx       # Smart Goals dashboard
    ├── HabitGrid.tsx              # Monthly habit tracking grid
    ├── TaskList.tsx               # Daily task checklist panel
    ├── StatsView.tsx              # Focus heatmap and stats sidebar
    ├── MilestonesView.tsx         # Habit milestone cards
    ├── NewTaskModal.tsx           # Task creation form modal
    ├── NewGoalModal.tsx           # Goal creation form with templates
    ├── NewIdeaModal.tsx           # Quick idea capture modal
    ├── LoginView.tsx              # Login form
    ├── RegisterView.tsx           # Registration form
    ├── ProfileView.tsx            # User profile settings
    ├── SettingsView.tsx           # App preferences
    └── BackupView.tsx             # Data export/import
```

---

## 🧠 AI Brain — Second Brain Workspace

The AI Brain transforms the app into a **personal knowledge management system** that actively thinks with you.

### How It Works

1. **Quick Capture** → Write an idea in seconds via the capture modal
2. **AI Auto-Organization** → The AI classifies, tags, estimates complexity and effort
3. **Automatic Clustering** → Related ideas group into clusters (Food Tech, Health & Fitness, etc.)
4. **Semantic Search** → Search "food" and find restaurant, cooking, recipes, meal planner
5. **Knowledge Graph** → Interactive SVG graph showing relationships between ideas
6. **AI Expansion** → Get USPs, risks, MVP plan, roadmap, monetization for any idea
7. **Task Generation** → Convert an idea into a full Epic → Feature → Task tree
8. **Goal Conversion** → Promote any idea to a Smart Goal with milestones
9. **AI Chat** → Ask "What should I work on next?" or "Show startup ideas"

### Semantic Search Dictionary

The local search engine expands queries without requiring external APIs:

| Query | Also Matches |
|-------|-------------|
| `food` | restaurant, cooking, recipes, meal planner, nutrition, food delivery |
| `health` | gym, fitness, diet, exercise, workout, running |
| `coding` | programming, react, typescript, software, saas, backend |
| `startup` | business, mvp, pitch, launch, monetize, founders |
| `money` | finance, savings, invest, stripe, revenue |
| `learning` | education, study, books, skills, course, practice |

---

## 🎯 Smart Goal Planner

Goals are more than just targets — the planner **calculates exactly what you must do today**.

### Supported Goal Types

| Type | Example | Tracking |
|------|---------|---------|
| **Numeric** | Read 50 books | Daily/weekly targets auto-calculated |
| **Milestone** | Launch a SaaS | Prerequisite-linked milestone checklist |
| **Habit** | Code every day | Streak tracking with consistency scores |

### Intelligent Calculations

- **Daily/Weekly/Monthly Targets** — Auto-redistributes missed work
- **Forecasting Engine** — Exponential decay rolling average (14-day window)
- **Completion Probability** — Projects finish date based on actual pace
- **Streak Counting** — Consecutive active logging days
- **Health Score** — Composite metric: pace, consistency, recency

### AI Coach

When `VITE_GEMINI_API_KEY` is configured, the AI Coach generates:
- Personalized briefings (morning summary)
- Smart recovery plans
- Daily target conversions (e.g. "0.14 books = 34 minutes reading")
- Encouragement messages based on current pace

Falls back to a comprehensive local rule-based engine offline.

---

## 📋 Todo System

### Task Properties

```typescript
{
  title: string          // Task description
  time: string           // HH:MM scheduled time
  subtext: string        // Additional context
  date: string           // YYYY-MM-DD
  category?: string      // e.g. "Work", "Health"
  priority?: 'low' | 'medium' | 'high'
  reminderDate?: string  // Future reminder date
  repeatType?: string    // 'daily' | 'weekly' | 'monthly'
  notes?: string         // Extended notes
  projectId?: string     // Links to AI Brain project
  ideaId?: string        // Links to source idea
}
```

### Virtual Goal Tasks

Active goals automatically inject **virtual tasks** into the daily checklist:
- `"Spend 34 mins on: Read 50 Books this Year"` — from numeric goals
- `"Milestone: Launch beta testing (Build SaaS MVP)"` — from milestone goals

Ticking a virtual task **logs progress to the goal** automatically. Unticking reverses it.

---

## 🔐 Authentication

All user data is **completely isolated** by `userId`. No data leaks between accounts.

```
Registration → Password hashed with bcryptjs (10 rounds) → stored in localStorage
Login → Hash comparison → Session token stored → User data loaded in isolation
Logout → Session cleared → All state reset
```

---

## 🎨 Theme System

Three built-in themes with instant live switching:

| Theme | Background | Accent |
|-------|-----------|--------|
| `light` | White/Stone-50 | Stone-900 |
| `dark` | Stone-950/Stone-900 | Amber-400 |
| `stone` | Stone-800/Stone-700 | Stone-100 |

---

## ⚙️ Environment Variables

Create a `.env` file at the project root:

```env
# Optional: Enable Gemini AI features (AI Coach, Brain expansion, task generation)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

Get your free API key at [aistudio.google.com](https://aistudio.google.com/).

Without a key, all AI features fall back to rich local rule-based engines.

---

## 🏗️ Architecture Principles

- **Clean Architecture**: UI → Services → Domain Models — no circular dependencies
- **SOLID Principles**: Single responsibility per module, open for extension
- **Repository Pattern**: `UserRepository` abstracts all localStorage I/O
- **Dependency Injection**: Services composed at the root `App.tsx` level
- **Pure Functions**: All calculations (`calculations.ts`, `forecast.ts`) are side-effect-free
- **Separation of Concerns**: AI logic, math, storage, and UI never mix

---

## 📦 Tech Stack

| Technology | Version | Role |
|-----------|---------|------|
| React | 19.0.1 | UI framework |
| TypeScript | 5.8 | Type safety |
| TailwindCSS | v4.1.14 | Styling |
| Vite | 6.4.3 | Build tool & dev server |
| @google/genai | 2.4.0 | Gemini AI SDK |
| lucide-react | 0.546.0 | Icon library |
| bcryptjs | 3.0.3 | Password hashing |
| motion | 12.23.24 | Animations |

---

## 📄 License

MIT © [Ali Khamis](https://github.com/Ali-Khamis45)
