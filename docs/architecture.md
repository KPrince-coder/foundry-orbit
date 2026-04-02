# Foundry Orbit — System Architecture

## Overview

Foundry Orbit is a multi-agent startup copilot built on AgentPlace. An LLM orchestrator (Claude Sonnet 4.6) coordinates 7 specialized agent roles via on-demand skills, persists founder state via tRPC routers backed by cloud storage, and renders rich interactive UI through registered React components.

## High-Level Architecture

```mermaid
graph TB
    subgraph Browser["Browser (Client)"]
        UI["React UI Shell"]
        FI["FounderIntake"]
        RV["RoadmapView"]
        AP["ActionPlan"]
        TB["TaskBoard"]
        TRPC_C["tRPC Client (WebSocket)"]
    end

    subgraph Server["AgentPlace Server"]
        LLM["Claude Sonnet 4.6<br/>Orchestrator"]
        INST["instruction.md<br/>System Prompt"]
        SKILLS["Skills (on-demand)"]
        
        subgraph TRPC["tRPC Routers"]
            FR["founder.router"]
            RR["roadmap.router"]
            TR["tasks.router"]
            PR["platform.router"]
        end
        
        subgraph Tools["Backend Tools"]
            WS["Web Search"]
            MB["Memory Bank"]
            FS["Filesystem"]
            VA["Voice Assistance"]
        end
    end

    subgraph Storage["Cloud Storage (AgentPlace API)"]
        PD["Private Data<br/>(per-user)"]
        CD["Common Data<br/>(shared)"]
        LD["Local Data<br/>(.agent/ read-only)"]
    end

    subgraph External["External Services"]
        WEB["Web (Search)"]
        GH["GitHub MCP<br/>(Phase 2)"]
        NOT["Notion MCP<br/>(Phase 2)"]
    end

    UI --> TRPC_C
    TRPC_C -->|WebSocket| TRPC
    FR --> PD
    RR --> PD
    TR --> PD
    
    LLM --> Tools
    LLM --> SKILLS
    LLM --> INST
    LLM -.->|renders| FI & RV & AP & TB
    
    WS --> WEB
    MB -->|localStorage| Browser
    SKILLS --> LD
```

## Data Flow

### First-Time User
```mermaid
sequenceDiagram
    actor F as Founder
    participant UI as Browser
    participant O as Orchestrator (LLM)
    participant SK as founder-intake Skill
    participant TR as tRPC Routers
    participant ST as Cloud Storage
    participant MB as Memory Bank

    F->>UI: Opens agent
    UI->>O: [user opened the agent]
    O->>SK: Load founder-intake skill
    O->>UI: Render FounderIntake component
    F->>UI: Fills 6-step form
    F->>UI: Clicks "Launch Analysis"
    UI->>TR: trpc.founder.save.mutate(profile)
    TR->>ST: writeFile(data/founder/profile.json)
    UI->>O: handleSendMessage({action: founder_intake_complete, ...})
    O->>O: Classify stage
    O->>MB: persistToMemoryBank(summary)
    O->>UI: Render RoadmapView(stage, milestones)
    O->>UI: Render ActionPlan(status, actions, flags)
    O->>F: Ask focused question
```

### Returning User
```mermaid
sequenceDiagram
    actor F as Founder
    participant UI as Browser
    participant O as Orchestrator (LLM)
    participant MB as Memory Bank

    F->>UI: Opens agent
    UI->>O: [user opened the agent]
    Note over O: Memory bank has prior context
    O->>O: Read memory, identify returning founder
    O->>UI: Welcome back message
    O->>UI: Render RoadmapView (loads from tRPC)
    O->>UI: Render ActionPlan (current actions)
    O->>F: "What did you work on since last time?"
    F->>O: Describes progress
    O->>O: Update stage if needed
    O->>MB: persistToMemoryBank(updated summary)
```

### Interactive Task Status Update
```mermaid
sequenceDiagram
    actor F as Founder
    participant TB as TaskBoard Component
    participant TR as tasks.router
    participant ST as Cloud Storage

    F->>TB: Clicks task to advance status
    TB->>TR: trpc.tasks.updateStatus.mutate({id, status})
    TR->>ST: Read sprint.json
    TR->>ST: Write updated sprint.json
    TR-->>TB: Auto-invalidation via loggedProcedure
    Note over TB: useLiveQuery('tasks') refetches automatically
    TB->>TB: Re-renders with new status
```

## Component Architecture

| Component | Type | Data Source | Interactive? |
|-----------|------|-------------|-------------|
| FounderIntake | Form → handleSendMessage | Self-contained + tRPC save | Yes (multi-step wizard) |
| RoadmapView | Display + tRPC | Props + useLiveQuery('roadmap') | Yes (click milestones) |
| ActionPlan | Display | Props from orchestrator | No (read-only) |
| TaskBoard | Display + tRPC | Props + useLiveQuery('tasks') | Yes (click to advance status) |

## Storage Architecture

### File Layout (per user, private adapter)
```
data/
├── founder/
│   └── profile.json       # Founder profile from intake
├── roadmap/
│   └── roadmap.json        # Current stage + milestones
└── tasks/
    └── sprint.json         # Current sprint tasks
```

### tRPC Router Summary

| Router | Topic | Procedures | Storage |
|--------|-------|-----------|---------|
| `founder` | `founder` | `get` (query), `save` (mutation), `updateStage` (mutation) | `data/founder/profile.json` |
| `roadmap` | `roadmap` | `get` (query), `save` (mutation), `updateMilestone` (mutation) | `data/roadmap/roadmap.json` |
| `tasks` | `tasks` | `getAll` (query), `saveSprint` (mutation), `updateStatus` (mutation), `movePhase` (mutation) | `data/tasks/sprint.json` |

## Skill Architecture

All 7 skills use `autoload: false` — only name/description injected into system prompt at startup. Full skill content loaded on-demand via filesystem tool when the orchestrator determines the relevant domain.

```mermaid
graph LR
    O["Orchestrator"] -->|"User asks about competitors"| PS["product-strategy"]
    O -->|"User asks about database choice"| SA["system-architecture"]
    O -->|"User asks about AI models"| AI["ai-ml-evaluation"]
    O -->|"User wants sprint plan"| ED["engineering-delivery"]
    O -->|"User confused about concept"| LC["learning-coaching"]
    O -->|"User shares code/PR"| DW["dev-workflow"]
    O -->|"First interaction"| FI["founder-intake"]
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| LLM | Claude Sonnet 4.6 (Bedrock) | Orchestrator reasoning |
| Frontend | React + TypeScript + Tailwind | UI components |
| Backend | Node.js + tRPC | Data procedures over WebSocket |
| Storage | AgentPlace API (cloud-synced) | Persistent founder data |
| Memory | Browser localStorage | Quick context notes (15 entries) |
| Search | Anthropic Web Search | Live market/competitor research |
| Theme | Custom dark (navy/blue/amber) | Professional startup aesthetic |
