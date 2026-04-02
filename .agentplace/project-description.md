# Foundry Orbit

## Overview
A multi-agent startup foundry that helps solo founders plan, design, and build AI-native startups from idea to MVP and beyond. The orchestrator sits at the center, with 7 specialized agents orbiting around the founder's work — each engaging when their domain expertise is needed.

## Architecture

### Agent Model
Claude Sonnet 4.6 (via Bedrock) — advanced reasoning for complex multi-step workflows.

### Theme
Dark professional theme: deep navy background (`#0c1222`), electric blue primary, amber accents. Subtle grid overlay in ChatView. Plus Jakarta Sans typography.

### Skills (7 orbiting agents, on-demand loading)
All stored in `.agent/skills/` with `autoload: false`:
- **product-strategy** — Problem clarity, competitor research, PRD, feature prioritization
- **system-architecture** — System design, data flows, storage choices, data engineering
- **ai-ml-evaluation** — Model selection, evaluation, prompting, feedback loops, MLOps
- **engineering-delivery** — Sprint planning, backlog, repo structure, CI/CD, testing
- **learning-coaching** — Knowledge gap detection, mentoring, targeted learning paths
- **dev-workflow** — Code review, PR management, Notion docs, task tracking, quality gates
- **founder-intake** — Intake questionnaire, stage classification, initial roadmap generation

### UI Components (4 custom + 3 default)
- **FounderIntake** — 5-step wizard (Idea → User/Problem → Stage → Skills → Constraints), sends structured JSON on submit
- **RoadmapView** — Stage-based visual timeline (Concept → Launch Prep) with milestone tracking
- **ActionPlan** — 3-7 prioritized actions with owners (agent badges), difficulty (S/M/L), risk flags
- **TaskBoard** — Two-column sprint board (Now / Next) with task cards
- **Image, Table, Video** — Default utility components

### Key Flows
1. **First open** → FounderIntake form → JSON submission → stage classification → RoadmapView + ActionPlan
2. **Ongoing** → Agent loads relevant skills per request → multi-agent handoffs → ActionPlan with each response
3. **Sprint planning** → TaskBoard with Now/Next breakdown
4. **Research** → Web search for market/competitor/technology data
