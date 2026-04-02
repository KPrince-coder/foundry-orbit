# Foundry Orbit

## Overview
A multi-agent startup foundry that helps solo founders plan, design, and build AI-native startups from idea to MVP and beyond. The orchestrator coordinates 7 specialized agent roles through on-demand skills, persists founder state via tRPC routers backed by cloud storage, and renders rich interactive UI.

## Architecture

### Model
Claude Sonnet 4.6 (via Bedrock).

### Theme
Dark professional: deep navy (`#0c1222`), electric blue primary, amber accents, subtle grid overlay.

### Data Persistence (Phase 1)
Three tRPC routers backed by AgentPlace cloud storage (private per-user):
- **founder.router** — Founder profile (idea, stage, domain, goal, skills, constraints, repo/notion URLs)
- **roadmap.router** — Stage classification + milestones with IDs and target weeks
- **tasks.router** — Sprint tasks with status (todo/in_progress/done/blocked) and phase (now/next)

All mutations use `loggedProcedure` for auto-logging and auto-invalidation. Memory Bank (`persistToMemoryBank`) provides quick LLM context for returning sessions.

### Skills (7 agents, on-demand)
product-strategy, system-architecture, ai-ml-evaluation, engineering-delivery, learning-coaching, dev-workflow, founder-intake

### UI Components
- **FounderIntake** — 6-step wizard (Idea → User/Problem → Domain & Goal → Stage → Skills → Constraints + repo/notion URLs). Saves profile via tRPC, then sends to orchestrator
- **RoadmapView** — Full 6-stage timeline with milestones for ALL stages, target weeks, interactive status toggle via tRPC
- **ActionPlan** — 3-7 prioritized actions with owner badges, difficulty, risk flags
- **TaskBoard** — 3-column sprint board (Now/Next/Done) with status icons and click-to-advance
- **Table, Image, Video** — Default utilities

### Session Continuity
- New founder: FounderIntake → stage classification → RoadmapView + ActionPlan → persistToMemoryBank
- Returning founder: read memory → welcome back → show roadmap → "What did you work on?"

### Docs
Comprehensive documentation in `docs/`:
- `architecture.md` — System architecture with Mermaid diagrams
- `data-persistence.md` — Storage layers, data models, read/write/invalidation flows
- `agent-workflow.md` — Multi-agent orchestration, stage lifecycle, handoff patterns
- `phase1-build-log.md` — Detailed build log of Phase 1 changes
