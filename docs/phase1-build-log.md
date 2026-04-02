# Foundry Orbit — Phase 1 Build Log

## Phase 1: Data Persistence & Session Continuity

### Objective
Make returning founders pick up exactly where they left off. Founder profile, roadmap stage, and sprint tasks persist across sessions.

### What Was Built

#### 1. tRPC Routers (3 new routers)

**`founder.router.ts`**
- `get` (query) — Read founder profile from storage
- `save` (mutation) — Save/update founder profile with `loggedProcedure`
- `updateStage` (mutation) — Update stage, cross-invalidates `['founder', 'roadmap']`
- Storage: `data/founder/profile.json`

**`roadmap.router.ts`**
- `get` (query) — Read roadmap data
- `save` (mutation) — Save full roadmap with milestones
- `updateMilestone` (mutation) — Toggle individual milestone status
- Storage: `data/roadmap/roadmap.json`

**`tasks.router.ts`**
- `getAll` (query) — Read sprint tasks
- `saveSprint` (mutation) — Save full sprint with task generation
- `updateStatus` (mutation) — Change task status (todo/in_progress/done/blocked)
- `movePhase` (mutation) — Move task between now/next
- Storage: `data/tasks/sprint.json`

All mutations use `loggedProcedure` for auto-logging and auto-invalidation.

#### 2. Component Upgrades

**FounderIntake (6 steps, up from 5)**
- Added Step 2.5: "Domain & Goal" — product type selector (B2B SaaS, Consumer, Dev Tool, Marketplace, AI-Native, Other) and primary goal selector (find PMF, build foundation, launch fast, learn/explore)
- Added Step 6 fields: optional GitHub repo URL and Notion workspace URL
- On submit: saves profile via `trpc.founder.save.mutate()` BEFORE sending to orchestrator
- New fields flow through to `founder_intake_complete` JSON payload

**TaskBoard (3 columns, up from 2)**
- Added "Done" column — completed tasks move here
- Added "Blocked" status with red visual indicator
- Tasks are interactive — click to advance status (todo → in_progress → done)
- Reads persisted tasks via `useLiveQuery('tasks')` when available
- Falls back gracefully to orchestrator props when no persisted data exists
- Shows status icons per task (circle=todo, play=in_progress, check=done, alert=blocked)

**RoadmapView (all milestones visible)**
- Shows milestones for ALL stages (not just current/completed — future stages now visible at 40% opacity)
- Added `targetWeek` display with calendar icon per milestone
- Milestones are interactive — click to cycle status (upcoming → in_progress → done)
- Reads persisted roadmap via `useLiveQuery('roadmap')` when available
- Added `id` field to milestone schema for cross-referencing

#### 3. Instruction Updates

- Added `persistToMemoryBank` guideline — called after intake and major decisions
- Added returning-session protocol (Rule 2): welcome back, show roadmap, ask progress
- Updated component descriptions for new fields (domain, goalType, repoUrl, notionUrl)
- Added data persistence section explaining tRPC auto-loading behavior
- Added Rule 9: session continuity via memory bank on every major decision

#### 4. Skill Updates

**founder-intake skill**
- Added `persistToMemoryBank` call requirement after intake processing
- Added returning-founder flow (skip intake, welcome back, show roadmap)
- Added edge case stage classification guidance
- Removed redundant markdown templates (components handle rendering)
- Added `id` and `targetWeek` requirements for milestones

### Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Use `ctx.storage` (AgentPlace API) over in-memory | Cloud-synced, survives server restarts, cross-device |
| One JSON file per data type | Simple, no schema migrations, fast reads for small data |
| Components read both props AND tRPC | Graceful degradation — works even before data is persisted |
| FounderIntake saves via tRPC then sends to LLM | Ensures data is persisted even if LLM processing fails |
| Memory Bank for LLM context, tRPC for UI data | Each storage serves its optimal consumer |

### Files Changed

```
agent-dev-server/src/trpc/routers/founder.router.ts    (NEW)
agent-dev-server/src/trpc/routers/roadmap.router.ts    (NEW)
agent-dev-server/src/trpc/routers/tasks.router.ts      (NEW)
agent-dev-server/src/trpc/router.ts                     (MODIFIED — added 3 routers)
agent-dev-server/src/instruction.md                     (MODIFIED — session continuity)
agent-dev-client/src/app/agent/components/FounderIntake.tsx  (MODIFIED — 6 steps, tRPC save)
agent-dev-client/src/app/agent/components/TaskBoard.tsx      (MODIFIED — 3 columns, interactive)
agent-dev-client/src/app/agent/components/RoadmapView.tsx    (MODIFIED — all milestones, interactive)
.agent/skills/founder-intake/SKILL.md                   (MODIFIED — persistence, returning flow)
docs/architecture.md                                     (NEW)
docs/data-persistence.md                                 (NEW)
docs/agent-workflow.md                                   (NEW)
docs/phase1-build-log.md                                 (NEW)
```
