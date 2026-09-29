# OpenClaw Agent Team - Frontend Specification for Lovable

## 1. Product

Build the web application interface for **OpenClaw Agent Team**, a multi-agent AI workspace inspired by OpenClaw and Hermes.

The application allows a user to interact with a team of specialized AI agents:

* GitHub Agent
* LinkedIn Agent
* Google Email Agent
* Google Research Agent

The architecture must remain extensible to future agents:

* Marketing Agent
* Finance Agent
* Sales Agent
* Operations Agent
* CEO / Executive Agent
* HR Agent
* Customer Support Agent

The frontend is a **control center for the Python agent runtime**.

The frontend must NOT implement the agent reasoning loop.

The backend exposes the agent runtime through APIs and streaming endpoints.

---

# 2. Product Philosophy

The interface should feel like an **AI operating system**, not a traditional SaaS administration dashboard.

The user should immediately understand:

1. Which agents exist
2. What each agent is doing
3. Which tasks are running
4. Which actions require approval
5. What the agents remember
6. What tools and skills they have
7. What happened during an execution

The UI must prioritize:

* clarity
* transparency
* observability
* fast interaction
* minimal visual noise
* professional developer-tool aesthetics

Avoid:

* excessive gradients
* generic AI landing-page aesthetics
* unnecessary animations
* oversized cards
* excessive rounded containers
* decorative elements without functional purpose

---

# 3. Technology

Use the standard Lovable web stack.

Preferred:

* React / TypeScript
* Tailwind CSS
* modern component architecture
* responsive layout
* accessible components
* dark mode
* GitHub-compatible codebase

The frontend communicates with an external Python backend.

Do NOT move the agent runtime into the frontend.

Do NOT implement agent reasoning in TypeScript.

Do NOT create a second agent engine.

---

# 4. Backend Contract

The frontend must assume that the backend exposes APIs similar to:

```text
GET    /api/agents
GET    /api/agents/{agent_id}

GET    /api/teams
GET    /api/teams/{team_id}

GET    /api/tasks
GET    /api/tasks/{task_id}

POST   /api/tasks

GET    /api/tasks/{task_id}/events

GET    /api/skills
GET    /api/tools

GET    /api/memory/{agent_id}

GET    /api/approvals
POST   /api/approvals/{approval_id}/approve
POST   /api/approvals/{approval_id}/reject

POST   /api/chat

GET    /api/health
```

For real-time agent execution, support:

```text
SSE
```

or WebSocket if the backend later requires bidirectional communication.

The frontend must treat the backend API as the source of truth.

---

# 5. Main Navigation

Use a persistent left sidebar.

Navigation:

```text
OpenClaw

Overview

Workspace
  Chat
  Tasks
  Approvals

Agents
  All Agents
  GitHub
  LinkedIn
  Google Email
  Google Research

Teams
  Executive
  Research
  Growth

Resources
  Skills
  Tools
  Memory

Observability
  Activity
  Executions
  Logs

Settings
```

The sidebar should be collapsible.

On mobile, transform it into a drawer.

---

# 6. Global Layout

Desktop:

```text
┌─────────────────────────────────────────────────────────────┐
│ Logo / Workspace                         Search   Profile  │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│ Sidebar       │                Main Content                 │
│               │                                             │
│ Navigation    │                                             │
│               │                                             │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

Use a consistent max-width and spacing system.

The interface must work well at:

* 1440px
* 1280px
* 1024px
* tablet
* mobile

---

# 7. Overview Dashboard

The Overview page is the operational command center.

Display:

### System status

```text
System
● Operational

API
● Connected

LLM
● DeepSeek

Agents
4 active

Tasks
3 running

Approvals
2 pending
```

### Agent activity

Show currently running agents.

Example:

```text
GitHub Agent
Analyzing repository architecture
● Running
2m 14s
```

```text
Google Research Agent
Researching fintech AI market
● Running
5m 42s
```

### Recent tasks

Show:

* task
* agent
* status
* duration
* created time

Statuses:

* queued
* running
* waiting_approval
* completed
* failed
* cancelled

### Pending approvals

Make approval requests highly visible.

Example:

```text
Google Email Agent

Wants to send:

"Follow-up regarding internship opportunity"

[Review] [Approve] [Reject]
```

---

# 8. WebChat

WebChat is the primary interaction interface.

It is NOT an agent.

It is a communication channel between the user and the agent runtime.

Example:

```text
User
  ↓
WebChat
  ↓
Agent Runtime
  ↓
Selected Agent
  ↓
Tools / Skills / Memory
```

## Chat interface

```text
┌────────────────────────────────────────────────────────────┐
│ Chat                                         Agent: CEO ▼ │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ User                                                       │
│ Analyze the latest GitHub activity of my project.          │
│                                                            │
│ CEO Agent                                                  │
│ I'll delegate this to the GitHub Agent.                   │
│                                                            │
│ GitHub Agent                                               │
│ Analyzing repository...                                    │
│                                                            │
│ ✓ Repository identified                                    │
│ ✓ Pull requests analyzed                                  │
│ ● Preparing report                                         │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ Message...                                  [Send]         │
└────────────────────────────────────────────────────────────┘
```

The user must be able to select:

* Auto
* specific agent
* specific team

Example:

```text
Agent
[Auto ▼]

Auto
CEO
GitHub
LinkedIn
Google Email
Google Research
```

---

# 9. Streaming Agent Execution

When the backend streams events, display them progressively.

Example event types:

```text
task.created
agent.started
reasoning.started
skill.loaded
tool.called
tool.completed
approval.required
agent.delegated
agent.completed
task.completed
task.failed
```

Do NOT expose hidden chain-of-thought.

Never display private internal reasoning.

Instead display safe execution summaries.

Example:

```text
GitHub Agent

→ Loaded Repository Analysis skill
→ Searching repository
→ Inspecting architecture files
→ Analyzing dependencies
→ Generating report
```

The UI should make the execution understandable without exposing private reasoning.

---

# 10. Agent List

Page:

```text
Agents
```

Display agent cards.

Each card:

```text
┌─────────────────────────────────┐
│ GitHub Agent                    │
│ Repository & Code Specialist   │
│                                 │
│ ● Online                        │
│                                 │
│ Skills        6                 │
│ Tools         8                 │
│ Tasks         12                │
│                                 │
│ [Open Agent]                    │
└─────────────────────────────────┘
```

Agents:

### GitHub Agent

Role:

Repository and software engineering specialist.

Capabilities:

* repository analysis
* code search
* issue analysis
* pull requests
* documentation
* architecture analysis

### LinkedIn Agent

Role:

Professional networking and content specialist.

Capabilities:

* research
* content drafting
* prospect analysis
* message preparation
* publishing with approval

### Google Email Agent

Role:

Email intelligence and communication specialist.

Capabilities:

* search emails
* summarize
* classify
* extract action items
* draft replies
* send emails with approval

### Google Research Agent

Role:

Research and information synthesis specialist.

Capabilities:

* web research
* source analysis
* competitive research
* market research
* technical research
* literature research

---

# 11. Agent Detail

Agent detail page:

```text
GitHub Agent

Repository & Software Engineering Specialist

Status: ● Online
```

Tabs:

```text
Overview
Skills
Tools
Memory
Tasks
Activity
Configuration
```

## Overview

Display:

* role
* description
* status
* current task
* capabilities
* recent executions

## Skills

Example:

```text
Repository Analysis
Code Search
Issue Management
Pull Request Review
Documentation
Architecture Analysis
```

Each skill displays:

* name
* description
* status
* scripts
* references

## Tools

Example:

```text
github.search_repository
github.search_code
github.get_pull_request
github.create_issue
```

Show permission level:

```text
READ
WRITE
APPROVAL REQUIRED
```

---

# 12. Tasks

Tasks page.

Table:

```text
Task
Agent
Status
Started
Duration
Actions
```

Example:

```text
Analyze Warabot repository
GitHub Agent
Running
2m 31s
[Open]
```

Filters:

```text
All
Running
Waiting approval
Completed
Failed
```

Search by:

* task name
* agent
* task ID

---

# 13. Task Detail

Task detail must provide complete observability.

Example:

```text
Task #task_82fa

Analyze repository architecture

Status
● Running

Agent
GitHub Agent

Started
14:32

Duration
2m 14s
```

Timeline:

```text
14:32  Task created
14:32  GitHub Agent started
14:33  Repository Analysis skill loaded
14:33  github.search_repository
14:34  github.search_code
14:35  Architecture analysis
14:36  Report generation
```

Each event can be expanded.

Show:

* event type
* timestamp
* duration
* safe input summary
* output summary
* status
* errors

Never expose secrets.

Never expose hidden chain-of-thought.

---

# 14. Approvals

Create a dedicated Approval Center.

This is critical because agents can perform external actions.

Example:

```text
Pending Approval

Google Email Agent

Action:
Send email

Recipient:
example@company.com

Subject:
Follow-up regarding application

Message:
...

Risk:
External communication

[Approve]
[Reject]
```

Other approval types:

```text
LinkedIn post publication
LinkedIn message
GitHub destructive action
Email sending
External API write operation
```

Approval UI must clearly distinguish:

```text
READ
PREPARE
WRITE
EXTERNAL ACTION
```

---

# 15. Skills

Skills page.

Display skills using the Agent Skills structure.

Example:

```text
Repository Analysis

Description:
Analyze the architecture and structure of a software repository.

Files:

SKILL.md
scripts/
references/
assets/
```

Skill detail:

```text
Name
Description
Agent compatibility
Scripts
References
Status
```

The UI should represent progressive disclosure.

Do not load every skill instruction into the UI automatically.

---

# 16. Tools

Tools page.

Example:

```text
GitHub
  github.search_repository
  github.search_code
  github.get_issue
  github.get_pull_request

Google
  gmail.search
  gmail.read
  gmail.send

Research
  web.search
  web.open
```

Each tool shows:

```text
Tool
Description
Agent access
Permission
Risk level
```

Example:

```text
gmail.send

Risk:
HIGH

Permission:
APPROVAL REQUIRED
```

---

# 17. Memory

Memory must be transparent.

Display the Markdown-based memory structure.

Example:

```text
GitHub Agent

SOUL.md
USER.md
MEMORY.md
AGENTS.md
HEARTBEAT.md
```

Allow the user to inspect Markdown files.

Example editor:

```text
┌──────────────────────────────────────────┐
│ MEMORY.md                                │
├──────────────────────────────────────────┤
│                                          │
│ # Long Term Memory                       │
│                                          │
│ - User prefers Python                    │
│ - Main project is Warabot                │
│ - User works on financial AI             │
│                                          │
└──────────────────────────────────────────┘
```

The UI should clearly indicate:

```text
Agent Memory
User Memory
Shared Memory
Session Memory
```

Do not replace Markdown memory with an opaque vector database UI.

---

# 18. Teams

Teams page.

Display teams such as:

```text
Executive Team

CEO
├── Research Agent
├── GitHub Agent
├── Marketing Agent
└── Finance Agent
```

Visualize delegation relationships.

Example:

```text
                 CEO
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
   Research     GitHub    Marketing
```

Team detail:

```text
Members
Responsibilities
Delegation rules
Shared memory
Recent tasks
```

---

# 19. Agent Delegation UI

When one agent delegates work:

```text
CEO Agent

Delegating task

"Analyze the repository architecture"

↓

GitHub Agent

Working...
```

Display delegation as part of the task timeline.

Example:

```text
CEO
  │
  ├── Research Agent
  │
  └── GitHub Agent
          │
          ├── Repository Analysis
          └── Code Search
```

---

# 20. Research Results

Google Research Agent results should have a dedicated readable report interface.

Example:

```text
Research Report

Title:
AI Agents in Financial Services - 2026

Summary

...

Key Findings

1. ...
2. ...
3. ...

Sources

[1] Source title
[2] Source title
[3] Source title

Confidence
Medium

Generated by:
Google Research Agent
```

Sources must be clickable.

Clearly distinguish:

* source
* agent-generated synthesis
* uncertainty

---

# 21. GitHub Results

GitHub Agent should present repository information in a developer-friendly interface.

Example:

```text
Repository

StartlingAdama/warabot

Language
Python

Files analyzed
128

Architecture

FastAPI
LangGraph
PostgreSQL
Redis
...
```

Support:

* repository tree
* important files
* issues
* pull requests
* architecture findings
* generated reports

---

# 22. Settings

Settings sections:

```text
General
LLM
Agents
Integrations
Security
Notifications
Appearance
API
```

LLM:

```text
Provider
DeepSeek

Model
deepseek-chat

Status
● Connected
```

Do not expose API keys.

Display:

```text
API key
••••••••••••
```

---

# 23. Authentication

Support:

* login
* signup
* logout
* protected application routes

Application pages must require authentication.

Public landing page is optional.

The MVP should prioritize the authenticated application rather than marketing pages.

---

# 24. Design System

Visual direction:

**Modern AI developer platform**

Reference feeling:

* Linear
* GitHub
* Vercel
* modern developer tools
* AI operating system

Avoid copying any specific product.

Use:

* strong typography
* restrained colors
* subtle borders
* high information density
* clear status indicators
* excellent empty states
* excellent loading states

Primary visual hierarchy:

```text
Background
↓
Navigation
↓
Page title
↓
Context / filters
↓
Primary content
↓
Secondary information
```

---

# 25. Colors

Default dark theme.

Suggested palette:

```text
Background: #0B0D10
Surface: #11151A
Surface elevated: #171C22
Border: #252B33

Text primary: #F5F7FA
Text secondary: #9AA4B2

Primary: #6366F1

Success: #22C55E
Warning: #F59E0B
Error: #EF4444
Info: #3B82F6
```

Do not overuse the primary accent.

Status colors should communicate state, not decoration.

---

# 26. Typography

Use a modern sans-serif font.

Recommended:

```text
Inter
```

Use monospace for:

* task IDs
* tool names
* API paths
* code
* logs
* Markdown memory
* execution events

---

# 27. Important UX States

Every major page must support:

### Loading

Use skeleton loaders.

### Empty

Example:

```text
No active tasks

Start a conversation to create your first task.
```

### Error

Example:

```text
Unable to connect to OpenClaw backend.

[Retry]
```

### Offline

Display:

```text
Backend disconnected
```

### Permission denied

Display a clear explanation.

### Waiting approval

Use a prominent but non-intrusive state.

---

# 28. Responsive Behavior

Desktop is the primary experience.

Tablet:

* collapsible sidebar
* responsive tables
* stacked panels

Mobile:

* drawer navigation
* stacked task cards
* full-width chat
* bottom message composer
* simplified execution timeline

The application must remain usable on mobile.

---

# 29. Accessibility

Implement:

* keyboard navigation
* semantic HTML
* visible focus states
* accessible dialogs
* accessible buttons
* sufficient contrast
* screen-reader labels
* no information conveyed only by color

---

# 30. Frontend Architecture

Organize the frontend into reusable modules.

Suggested structure:

```text
src/

components/
  ui/
  layout/
  agents/
  tasks/
  chat/
  approvals/
  skills/
  tools/
  memory/
  teams/
  activity/

pages/
  Overview
  Chat
  Agents
  AgentDetail
  Tasks
  TaskDetail
  Approvals
  Skills
  Tools
  Memory
  Teams
  Activity
  Settings

lib/
  api/
  events/
  auth/
  utils/

types/
```

Use reusable components instead of duplicating page-specific UI.

---

# 31. API Layer

Create a typed API client.

Example:

```typescript
agents.list()
agents.get(agentId)

tasks.list()
tasks.get(taskId)
tasks.create(input)

approvals.list()
approvals.approve(id)
approvals.reject(id)

chat.send(message)

executions.events(executionId)
```

Do not call fetch directly from every component.

Centralize API communication.

---

# 32. Streaming

Create a dedicated event-streaming abstraction.

Example:

```typescript
executionStream.connect(taskId)

executionStream.on("agent.started", ...)
executionStream.on("tool.called", ...)
executionStream.on("tool.completed", ...)
executionStream.on("approval.required", ...)
executionStream.on("task.completed", ...)
```

The UI must update without page refresh.

---

# 33. Security

Never store backend secrets in the frontend.

Never expose:

* DeepSeek API keys
* GitHub tokens
* Google OAuth secrets
* LinkedIn credentials
* service credentials

Authentication tokens must be handled securely.

All external actions must ultimately be authorized by the backend.

The frontend approval button is only a request to the backend.

The frontend must never bypass backend authorization.

---

# 34. MVP Pages

Implement these first:

```text
1. Overview
2. Chat
3. Agents
4. Agent Detail
5. Tasks
6. Task Detail
7. Approvals
8. Skills
9. Tools
10. Memory
11. Teams
12. Settings
```

The backend is the source of truth. Do not show mock resources or simulate agent results in the running application; report backend connection errors explicitly.

---

# 35. MVP User Flow

The primary flow must be:

```text
Login
  ↓
Overview
  ↓
Chat
  ↓
User asks a question
  ↓
Backend creates task
  ↓
Agent starts
  ↓
Events stream into UI
  ↓
Agent uses skill
  ↓
Agent uses tool
  ↓
Optional approval
  ↓
Agent completes
  ↓
Result displayed
  ↓
Execution available in Tasks
```

---

# 36. Example Scenario

User:

```text
Analyze my Warabot repository and tell me what should be improved.
```

Frontend:

```text
User
    ↓
WebChat
    ↓
CEO / Auto Agent
    ↓
GitHub Agent
    ↓
Repository Analysis Skill
    ↓
GitHub Tools
    ↓
Execution Events
    ↓
Final Report
```

The user sees:

```text
GitHub Agent

● Analyzing repository

✓ Repository found
✓ Repository structure analyzed
✓ Architecture files inspected
✓ Dependencies analyzed
● Preparing recommendations
```

Then:

```text
Repository Analysis

Summary
...

Architecture
...

Potential improvements
...

Files analyzed
...

Execution
2m 18s
```

---

# 37. Important Constraints

Do NOT:

* implement the agent engine in the frontend
* implement ReAct in the frontend
* expose chain-of-thought
* hardcode agent behavior in React
* hardcode GitHub logic in UI components
* hardcode Gmail logic in UI components
* store secrets client-side
* couple UI components directly to external APIs
* create unnecessary frontend abstractions
* create a fake AI simulation once the backend is connected

The frontend must remain a presentation and interaction layer.

---

# 38. Development Strategy

Build in phases.

## Phase 1

Create:

* application shell
* sidebar
* Overview
* Chat
* Agents
* Tasks
* Approvals
* dark theme
* responsive design

Load agents, tasks, approvals and health from the Python backend. Show explicit loading, empty and connection-error states instead of mock data.

## Phase 2

Create:

* typed API client
* authentication
* backend connection
* task creation
* task retrieval

## Phase 3

Create:

* SSE execution streaming
* live agent activity
* tool events
* approval events

## Phase 4

Create:

* Skills
* Tools
* Memory
* Teams
* Execution details

## Phase 5

Polish:

* accessibility
* loading states
* error states
* mobile
* performance
* security
* UX consistency

---

# 39. Definition of Done

The frontend is considered complete when:

* authenticated users can access the dashboard
* users can open WebChat
* users can select an agent
* users can submit a task
* task status updates in real time
* agent activity is visible
* approvals are actionable
* agents have dedicated detail pages
* skills and tools are visible
* Markdown memory can be inspected
* team delegation is visualized
* execution history is available
* errors are clearly displayed
* responsive layouts work
* no secrets are exposed
* API communication is centralized
* the project can be synchronized with GitHub
* the UI can operate against the external Python backend without changing the agent architecture

---

# 40. Core Principle

OpenClaw Agent Team has two distinct systems:

```text
                  USER
                    │
                    ▼
          ┌──────────────────┐
          │ LOVABLE FRONTEND │
          │                  │
          │ Interface        │
          │ Visualization    │
          │ Interaction      │
          └────────┬─────────┘
                   │
                HTTP/SSE
                   │
                   ▼
          ┌──────────────────┐
          │ PYTHON BACKEND   │
          │                  │
          │ Agent Runtime    │
          │ ReAct            │
          │ Skills           │
          │ Tools            │
          │ Memory           │
          │ Teams            │
          │ Policies         │
          └──────────────────┘
```

**Lovable owns the experience.**

**Python owns the intelligence.**

Keep these responsibilities strictly separated.
