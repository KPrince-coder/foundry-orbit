# Foundry Orbit — Agent Workflow Design

## Multi-Agent Orchestration Pattern

Foundry Orbit uses a **hub-and-spoke orchestrator pattern**: one central LLM (Claude Sonnet 4.6) decides which specialist skill to load for each user request. Skills are not separate LLM instances — they are prompt injections loaded on-demand into the same context.

```mermaid
graph TB
    U["Founder"] -->|"message"| O["Orchestrator<br/>(Claude Sonnet 4.6)"]
    
    O -->|"loads skill"| PS["Product Strategy"]
    O -->|"loads skill"| SA["System Architecture"]
    O -->|"loads skill"| AI["AI/ML Evaluation"]
    O -->|"loads skill"| ED["Engineering Delivery"]
    O -->|"loads skill"| LC["Learning Coaching"]
    O -->|"loads skill"| DW["Dev Workflow"]
    O -->|"loads skill"| FI["Founder Intake"]
    
    O -->|"calls tool"| WS["Web Search"]
    O -->|"calls tool"| MB["Memory Bank"]
    O -->|"renders"| UI["UI Components"]
    
    style O fill:#1d4ed8,color:#fff
    style PS fill:#1e293b,color:#e2e8f0
    style SA fill:#1e293b,color:#e2e8f0
    style AI fill:#1e293b,color:#e2e8f0
    style ED fill:#1e293b,color:#e2e8f0
    style LC fill:#1e293b,color:#e2e8f0
    style DW fill:#1e293b,color:#e2e8f0
    style FI fill:#1e293b,color:#e2e8f0
```

## Stage-Based Guidance Flow

The orchestrator tracks the founder's stage and adapts guidance accordingly:

```mermaid
stateDiagram-v2
    [*] --> Concept : Idea only
    [*] --> Discovery : Has interviews
    [*] --> MVP_Definition : Problem validated
    [*] --> Architecture : Scope defined
    [*] --> Build : Architecture set
    [*] --> Launch_Prep : MVP built

    Concept --> Discovery : User interviews done
    Discovery --> MVP_Definition : Problem-solution fit
    MVP_Definition --> Architecture : PRD finalized
    Architecture --> Build : System design done
    Build --> Launch_Prep : MVP functional
    Launch_Prep --> [*] : Launched
```

## User Session Lifecycle

```mermaid
flowchart TD
    A["User opens agent"] --> B{"Memory bank<br/>has context?"}
    
    B -->|"No (new user)"| C["Render FounderIntake"]
    C --> D["User fills 6-step form"]
    D --> E["Save profile via tRPC"]
    E --> F["Send to orchestrator"]
    F --> G["Classify stage"]
    G --> H["persistToMemoryBank"]
    H --> I["Render RoadmapView + ActionPlan"]
    I --> J["Ask focused question"]
    
    B -->|"Yes (returning)"| K["Welcome back"]
    K --> L["Show RoadmapView (from tRPC)"]
    L --> M["Ask 'What did you work on?'"]
    
    J --> N["Ongoing conversation loop"]
    M --> N
    
    N --> O{"Request type?"}
    O -->|"Market research"| P["Load product-strategy<br/>+ Web Search"]
    O -->|"Architecture question"| Q["Load system-architecture"]
    O -->|"AI feature design"| R["Load ai-ml-evaluation"]
    O -->|"Sprint planning"| S["Load engineering-delivery<br/>+ Render TaskBoard"]
    O -->|"Code review"| T["Load dev-workflow"]
    O -->|"Learning question"| U["Load learning-coaching"]
    O -->|"Stage transition"| V["Update RoadmapView<br/>+ persistToMemoryBank"]
    
    P & Q & R & S & T & U & V --> N
```

## Multi-Agent Handoff Example

When a question spans multiple agents, the orchestrator shows explicit collaboration:

```mermaid
sequenceDiagram
    actor F as Founder
    participant O as Orchestrator
    participant PS as Product Agent
    participant SA as Architecture Agent
    participant AI as AI/ML Agent

    F->>O: "How should I store user events<br/>so I can use them for recommendations?"
    
    O->>PS: Load product-strategy skill
    Note over O,PS: Product Agent clarifies the user story
    O->>F: **Product Agent:** What recommendation<br/>behavior do you want?<br/>(collaborative, content-based, hybrid)

    F->>O: "Content-based, show similar products"
    
    O->>SA: Load system-architecture skill
    Note over O,SA: Architecture Agent designs the event schema
    O->>F: **Architecture Agent:** Event schema:<br/>user_id, product_id, event_type, timestamp<br/>Store in PostgreSQL + vector embeddings

    O->>AI: Load ai-ml-evaluation skill
    Note over O,AI: AI/ML Agent designs the recommendation pipeline
    O->>F: **AI/ML Agent:** Use embedding similarity<br/>via pgvector. Start with text-embedding-3-small.<br/>Eval: precision@5 on test set of 50 examples
```

## Component Interaction Patterns

### Orchestrator-Driven (ActionPlan)
```
LLM decides content → renders component with props → user reads
No tRPC involved — pure AI-generated display
```

### Hybrid (RoadmapView, TaskBoard)
```
LLM renders initial component with props
Component also reads persisted data via useLiveQuery
User interacts → tRPC mutation → auto-invalidation → re-render
LLM sees mutations on next message via action log
```

### User-Driven (FounderIntake)
```
LLM renders empty form
User fills form → component saves via tRPC
Component sends summary to LLM via handleSendMessage
LLM processes and responds
```
