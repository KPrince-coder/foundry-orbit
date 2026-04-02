# Foundry Orbit — Data Persistence Design

## Overview

Foundry Orbit uses a layered persistence strategy to ensure founder context survives across sessions, devices, and browser states.

## Storage Layers

```mermaid
graph TB
    subgraph Ephemeral["Ephemeral (Session Only)"]
        CH["Conversation History<br/>LLM context window"]
        AL["Action Log<br/>tRPC mutation log"]
        CS["Component State<br/>React useState"]
    end

    subgraph Persistent["Persistent (Cross-Session)"]
        MB["Memory Bank<br/>Browser localStorage<br/>15 entries max"]
        AS["Agent Storage (Private)<br/>Cloud-synced per-user files<br/>via tRPC routers"]
    end

    subgraph ReadOnly["Read-Only"]
        SK["Skills (.agent/skills/)<br/>Agent configuration"]
        IN["Instruction<br/>System prompt"]
    end

    CH -->|"Cleared on session end"| Ephemeral
    AL -->|"Flushed per message"| Ephemeral
    MB -->|"Browser-local only"| Persistent
    AS -->|"Cloud-synced, cross-device"| Persistent
```

## Data Models

### FounderProfile
```typescript
type FounderProfile = {
  id: string;              // UUID, generated on first save
  idea: string;            // 3-5 sentence idea description
  userAndProblem: string;  // Target user and pain point
  currentStage: string;    // Classified stage (concept, discovery, etc.)
  skills: string[];        // Technical skills selected
  timeHorizon: string;     // Time availability
  teamSize?: string;       // Optional team description
  budget?: string;         // Optional budget range
  domain?: string;         // Product type (b2b_saas, consumer, dev_tool, etc.)
  goalType?: string;       // Primary goal (find_pmf, build_foundation, etc.)
  repoUrl?: string;        // GitHub repository URL
  notionUrl?: string;      // Notion workspace URL
  createdAt: number;       // Unix timestamp of first save
  updatedAt: number;       // Unix timestamp of last update
};
```

### RoadmapData
```typescript
type RoadmapData = {
  currentStage: string;    // Active stage
  milestones: Milestone[];
  updatedAt: number;
};

type Milestone = {
  id: string;              // Unique ID (e.g., "m-1", "m-2")
  stage: string;           // Which stage this belongs to
  title: string;           // Milestone description
  status: 'done' | 'in_progress' | 'upcoming';
  targetWeek?: string;     // e.g., "Week 1", "Week 2-3"
  notes?: string;          // Optional notes or blockers
};
```

### TasksData
```typescript
type TasksData = {
  sprintName: string;      // e.g., "Sprint 1 — Foundation"
  tasks: TaskItem[];
  updatedAt: number;
};

type TaskItem = {
  id: string;              // UUID
  title: string;           // Action-oriented task title
  owner: string;           // "You" or agent name
  difficulty: 'S' | 'M' | 'L';
  phase: 'now' | 'next';  // Which column
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  notes?: string;
  dependencies?: string;
  sprintName?: string;
  createdAt: number;
  updatedAt: number;
};
```

## Persistence Flow

### Write Path (FounderIntake → Storage)
```mermaid
sequenceDiagram
    participant FI as FounderIntake
    participant TR as tRPC (founder.router)
    participant ST as AgentStorage
    participant API as AgentPlace API

    FI->>TR: trpc.founder.save.mutate(profileData)
    TR->>TR: Generate UUID, set timestamps
    TR->>ST: writeFile('data/founder/profile.json', Buffer)
    ST->>API: PUT (cloud-synced, private adapter)
    API-->>ST: 200 OK
    TR-->>TR: loggedProcedure auto-logs + auto-invalidates
    TR-->>FI: Return profile + logSummary
```

### Read Path (Component → Storage)
```mermaid
sequenceDiagram
    participant C as Component
    participant ULQ as useLiveQuery Hook
    participant TR as tRPC Router
    participant ST as AgentStorage

    C->>ULQ: useLiveQuery('tasks', queryFn)
    ULQ->>TR: trpc.tasks.getAll.query()
    TR->>ST: readFile('data/tasks/sprint.json')
    ST-->>TR: Buffer (JSON)
    TR-->>ULQ: TasksData
    ULQ-->>C: { data, isLoading }
    
    Note over ULQ: Subscribes to 'tasks' invalidation
    Note over ULQ: Auto-refetches when mutations fire
```

### Invalidation Flow
```mermaid
sequenceDiagram
    participant C as Component (click task)
    participant TR as tasks.router
    participant MW as loggedProcedure middleware
    participant WS as WebSocket
    participant ULQ as useLiveQuery

    C->>TR: trpc.tasks.updateStatus.mutate({id, status})
    TR->>TR: Update task, write to storage
    TR->>MW: Return {logSummary, ...data}
    MW->>MW: Log to ActionLog
    MW->>WS: broadcast({method: 'data.invalidate', params: {topic: 'tasks'}})
    WS-->>ULQ: Invalidation signal
    ULQ->>TR: Re-execute queryFn
    TR-->>ULQ: Fresh data
    ULQ-->>C: Updated render
```

## Memory Bank vs Agent Storage

| Aspect | Memory Bank | Agent Storage (tRPC) |
|--------|------------|---------------------|
| **Where** | Browser localStorage | Cloud API (AgentPlace) |
| **Capacity** | 15 entries, overwritten | Unlimited files |
| **Cross-device** | No | Yes |
| **Access** | LLM tool (persistToMemoryBank) | Components via tRPC |
| **Use case** | Quick context notes for LLM | Structured persistent data for UI |
| **Visibility** | LLM reads on session start | Components via useLiveQuery |

Both are used together:
- **Memory Bank**: LLM reads on session start to know the founder's context quickly
- **Agent Storage**: Components read structured data (profile, roadmap, tasks) via tRPC for interactive UI
