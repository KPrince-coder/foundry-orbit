# Foundry Orbit — Technical Specification v2

## Gap Analysis Summary

### What EXISTS (Phase 0 — Foundation, DONE)
- 7 on-demand skills: product-strategy, system-architecture, ai-ml-evaluation, engineering-delivery, learning-coaching, dev-workflow, founder-intake
- 4 custom UI components: FounderIntake, RoadmapView, ActionPlan, TaskBoard
- Dark theme (navy/blue/amber), background grid, Plus Jakarta Sans
- Instruction with orchestrator role, stage system, multi-agent handoffs
- Claude Sonnet 4.6 model

### What's MISSING (Phases 1-4)

#### Critical Gaps (Blocking a robust experience)
1. **No GitHub MCP integration** — dev-workflow skill describes PR review, commit analysis, CI/CD guidance but has zero tools to do it
2. **No Notion MCP integration** — dev-workflow skill describes build logs, task management, documentation but has zero tools to do it
3. **No persistent state** — no tRPC routers, no data persistence. Returning founders lose all context (stage, roadmap, tasks, decisions)
4. **No returning-session protocol** — instruction handles first open but nothing for sessions 2+
5. **Instruction never references `persistToMemoryBank`** — most important tool for continuity is unused
6. **Document review workflow missing** — instruction says "encourage drafts" but no process, no templates, no review format

#### Skill Quality Gaps
7. Skills describe output as markdown but never reference UI components (TaskBoard, Table, ActionPlan)
8. product-strategy: no example search queries, no user persona template, no PRD document template, no Table component reference
9. dev-workflow: hollow without GitHub/Notion — entire skill is aspirational
10. learning-coaching: uses emoji (contradicts instruction), zero specific resource recommendations
11. engineering-delivery: doesn't reference TaskBoard component, no env/secrets guidance
12. ai-ml-evaluation: no example eval set format, no tool recommendations (LangSmith, Braintrust)

#### Component Gaps
13. TaskBoard: no Done column, no Blocked state, no task IDs, no velocity summary
14. RoadmapView: hides future milestones, no target dates, no notes/blockers per stage
15. ActionPlan: no links (GitHub issue, Notion page), owner badges all look identical (generic Bot icon)
16. FounderIntake: no domain/industry field, no goalType field, no existing repo URL field

---

## Roadmap: 4 Phases

### Phase 1 — Data Persistence & Session Continuity
**Goal**: Returning founders pick up exactly where they left off.

**1.1 tRPC Router: `founder.router.ts`**
- Store founder profile: idea, userProblem, stage, skills, constraints, domain, goalType
- Written after intake via `loggedProcedure`
- Read at session start to rehydrate context
- Uses `ctx.storage` (private adapter) for cross-device persistence

**1.2 tRPC Router: `roadmap.router.ts`**
- Store current stage, milestones with status, target weeks
- Stage transitions logged via `loggedProcedure`
- Components read via `useLiveQuery('roadmap', ...)`

**1.3 tRPC Router: `tasks.router.ts`**
- Store sprint tasks: id, title, owner, difficulty, status (todo/in_progress/done/blocked), notes, dependencies, sprintName
- Interactive status updates from TaskBoard via `trpc.tasks.updateStatus.mutate()`
- Components use `useLiveQuery('tasks', ...)`

**1.4 Instruction Update: Session Continuity**
- Add `persistToMemoryBank` usage after intake and key decisions
- Add returning-session protocol: check memory bank → load founder profile → show current roadmap + actionable next steps
- Handle `[user opened the agent]` for both new and returning users

**1.5 Upgrade FounderIntake component**
- Add domain/industry selector (B2B SaaS, Consumer, Dev Tool, Marketplace, Other)
- Add goalType field (find PMF, build technical foundation, launch fast, learn/explore)
- Add optional existingRepoUrl and notionWorkspaceUrl fields

**1.6 Upgrade TaskBoard component**
- Add Done column (third column)
- Add Blocked status with red visual indicator
- Add task IDs for cross-reference
- Add interactive checkboxes (click to advance status via tRPC)
- Add sprint velocity summary

**1.7 Upgrade RoadmapView component**
- Show milestones for ALL stages (not just current/completed)
- Add targetWeek field per milestone
- Add notes/blockers field per stage
- Interactive milestone status toggle (via tRPC)

### Phase 2 — GitHub & Notion Integration
**Goal**: Dev-workflow agent becomes functional, not aspirational.

**2.1 Connect GitHub MCP**
Key tools needed:
- `GITHUB_LIST_REPOSITORY_PULL_REQUESTS` — list open PRs
- `GITHUB_GET_A_PULL_REQUEST` — read PR details
- `GITHUB_LIST_COMMITS` — read commit history
- `GITHUB_CREATE_A_REVIEW_FOR_A_PULL_REQUEST` — post review comments
- `GITHUB_CREATE_AN_ISSUE` — create issues from tasks
- `GITHUB_CREATE_AN_ISSUE_COMMENT` — add comments to issues
- `GITHUB_GET_REPOSITORY_CONTENT` — read file contents
- `GITHUB_COMPARE_TWO_COMMITS` — diff analysis

**2.2 Connect Notion MCP**
Key tools needed:
- `NOTION_CREATE_NOTION_PAGE` — create docs, build log entries
- `NOTION_INSERT_ROW_DATABASE` — add tasks to backlog DB
- `NOTION_UPDATE_ROW_DATABASE` — update task statuses
- `NOTION_QUERY_DATABASE` — list tasks, query backlog
- `NOTION_SEARCH_NOTION_PAGE` — find existing docs
- `NOTION_ADD_MULTIPLE_PAGE_CONTENT` — write doc content
- `NOTION_GET_PAGE_MARKDOWN` — read existing docs

**2.3 Rewrite dev-workflow skill**
- Primary mode: tools available (GitHub + Notion connected)
- Fallback mode: paste-based code review + manual Notion guidance
- Quality gates that actually check GitHub CI status
- Auto-documentation workflow triggered by PR events

**2.4 Instruction Update: Integration Awareness**
- Add GitHub/Notion integration status awareness
- When tools available: use them directly
- When not configured: guide founder through setup (step-by-step)
- Reference specific tool capabilities without hardcoding parameters

### Phase 3 — Skill Depth & Templates
**Goal**: Every skill has actionable templates, component references, and concrete examples.

**3.1 product-strategy skill upgrade**
- Add 5 example web search query patterns for competitor research
- Add fill-in user persona template
- Add full PRD document template (not just section names)
- Add Table component reference for competitor comparison output
- Add product clarity rubric (what's a 3 vs a 4 vs a 5)

**3.2 engineering-delivery skill upgrade**
- Reference TaskBoard component in output format
- Add env/secrets management guidance for MVP
- Add Prisma migrate workflow
- Add tool selection rationale (when Vercel vs Railway vs Supabase vs Neon)

**3.3 ai-ml-evaluation skill upgrade**
- Add example eval set format (3 concrete examples)
- Add specific tool recommendations (LangSmith, Braintrust, RAGAS)
- Add example prompt template for a common pattern
- Add cost estimation examples (API call pricing)

**3.4 learning-coaching skill upgrade**
- Remove emoji from template format (align with instruction)
- Add 3-5 specific resource recommendations per learning category
- Add `persistToMemoryBank` instruction for tracking learned concepts

**3.5 founder-intake skill upgrade**
- Add `persistToMemoryBank` call after intake completion
- Add returning-founder branch logic
- Add edge case stage classification guidance
- Remove redundant markdown roadmap templates (use RoadmapView component)

**3.6 system-architecture skill upgrade**
- Add cost estimation benchmarks (real pricing examples)
- Add multi-tenant schema template
- Add pgvector schema example
- Add data quality tool recommendations

### Phase 4 — Polish & Advanced Features
**Goal**: Multi-agent handoff visibility, document review, advanced components.

**4.1 AgentHandoffCard component**
- Visual card showing which agent is responding
- Agent icon, name, domain badge
- Shows handoff chain when multiple agents collaborate

**4.2 PRDReview component**
- Structured document review display
- Section-by-section comments (What's Missing, Data/ML Gaps, Risks)
- Expandable/collapsible sections

**4.3 ActionPlan upgrade**
- Add link field per action (URL to GitHub issue, Notion page)
- Differentiated owner icons (unique icon per agent, not just generic Bot)
- Grouping by phase within the action list

**4.4 RoadmapView upgrade**
- Interactive stage transitions (click to mark done via tRPC)
- Progress percentage per stage

**4.5 Advanced instruction refinements**
- Anti-rendering guidance (when NOT to render ActionPlan/TaskBoard)
- Explicit document review process with review templates
- Multi-agent collaboration examples in instruction
