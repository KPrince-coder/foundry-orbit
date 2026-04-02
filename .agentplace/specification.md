# Foundry Orbit — Technical Specification

## Overview
A multi-agent startup copilot that helps solo founders plan, design, and build AI-native startups from idea to MVP. The orchestrator coordinates 7 specialized agent roles, tracks stages, and presents actionable plans through rich interactive UI.

## Architecture Decisions

### Model
Claude Sonnet 4 (via Bedrock) — complex reasoning, multi-step workflows, web search needed.

### Skills (7 specialized roles — on-demand loading)
All skills use `autoload: false` to keep system prompt lean. Orchestrator loads relevant skills on-demand.

1. **product-strategy** — Problem clarity, competitor research, PRD, feature prioritization
2. **system-architecture** — System design, data flows, storage choices, data engineering
3. **ai-ml-evaluation** — Model selection, evaluation, prompting strategies, feedback loops
4. **engineering-delivery** — Sprint planning, backlog, repo structure, CI/CD, MLOps
5. **learning-coaching** — Knowledge gap analysis, mentoring, targeted learning paths
6. **dev-workflow** — GitHub code review, PR management, Notion documentation, task linking
7. **founder-intake** — Intake questionnaire logic, stage classification, initial roadmap

### UI Components (4 key components)

1. **FounderIntake** — Multi-step intake form (idea, user/problem, stage, skills, constraints)
2. **RoadmapView** — Stage-aware roadmap showing current stage + milestones with visual progress
3. **ActionPlan** — Next 3-7 actions with owners, difficulty, status, flags/risks
4. **TaskBoard** — Sprint backlog view with "Now" and "Next" columns, task cards

### Theme
Professional tech/startup aesthetic — dark theme with accent gradients. Colors: deep navy/slate background, electric blue primary, amber accents for warnings/flags, green for progress. Font: modern sans-serif pair.

### Instruction
Defines the orchestrator role, multi-agent coordination, stage-based guidance, component usage, web search discipline, and welcome flow (founder intake on first open).

## Component Specifications

### FounderIntake
- Multi-step wizard (5 steps): Idea → User/Problem → Stage → Skills → Constraints
- Client-side validation, progress indicator
- On submit: sends structured JSON to orchestrator via handleSendMessage
- Props: none (self-contained form)

### RoadmapView
- Props: `{ currentStage, stages[], milestones[] }`
- Visual timeline with stage markers (Concept → Discovery → MVP Definition → Architecture → Build → Launch)
- Current stage highlighted, completed stages checked
- Each stage shows key milestones and their status

### ActionPlan  
- Props: `{ status, actions[], flags[] }`
- "Where we are" status header
- Action cards: description, owner (agent badge), difficulty (S/M/L), dependencies
- Flags section: risks, unknowns, blockers

### TaskBoard
- Props: `{ sprintName, now[], next[] }`
- Two-column layout: "Now (3-5 days)" and "Next"
- Task cards: title, owner, difficulty badge, dependency links, status
