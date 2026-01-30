# Masterbook v3.1 Refactor – Alignment & Module Documentation

This document describes the refactored AccordPM application and its alignment with Masterbook v3.1 principles.

## Principles → Implementation

| Masterbook Principle | Implementation |
|----------------------|----------------|
| **Flow Reveals Truth** | Critical path computed dynamically in `lib/criticalPath.ts`; `useCriticalPath` hook; Dashboard shows Critical Path summary; task movement and dependencies drive downstream updates. |
| **People Create Results** | Health signals (risks, blockers, critical path) used instead of activity surveillance; focus on enabling decisions via Week Ahead and weekly prompts. |
| **Guided Flexibility Prevails** | Dependency impact modal shows alternatives for circular dependencies; resource/scope prompts are dismissible; inline decision prompts with suggested actions. |
| **Discipline Defines Reality** | Portfolio decision log (append-only) in `MasterbookContext`; change requests with approval workflow; immutable change/risk logs. |
| **Deliberate Thought Shapes Decisions** | Weekly review prompts and contextual insights scaffold reasoning; dependency impact modal explains downstream effects before adding a link. |
| **Clarity Strengthens Communication** | Status Update Generator from live data; structured sections (milestones, risks, blockers, scope changes); editable “next focus” template. |
| **Uncertainty Brings Opportunity** | Risk register with lifecycle (Identified → Active → Mitigated/Realized); risk realization can create blocker tasks; scope creep and early-warning via risks. |
| **System Teaches by Use** | `ContextualInsight` component; dismissible inline teaching (first dependency, critical path, circular dependency, risk register, change request). |

## New / Refactored Modules

### Types (`src/types/masterbook.ts`)
- **Risk**, **RiskStatus**, **RiskSeverity** – risk register lifecycle.
- **ChangeRequest**, **ChangeRequestApproval**, **ChangeRequestType/Status** – scope change workflow.
- **PortfolioDecisionLogEntry** – immutable portfolio decisions.
- **TaskDependencyEdge**, **CriticalPathNode**, **DownstreamImpact**, **CircularDependencyResult** – flow and dependencies.
- **WeekAheadItem**, **WeeklyReviewPrompt**, **ContextualInsight**, **StatusUpdateSection** – dashboard and PM support.

### Core Logic (`src/lib/criticalPath.ts`)
- `computeCriticalPath(tasks, edges)` – forward/backward pass; slack and critical flag.
- `detectCircularDependencies(edges, taskIds)` – cycle detection and suggested edge removals.
- `getDownstreamImpact(taskId, edges, tasks, milestoneByTaskId)` – downstream tasks and affected milestones.
- `wouldCreateCycle(edges, taskIds, predId, succId)` – check if adding an edge would create a cycle.

### Context & State (`src/contexts/MasterbookContext.tsx`)
- **Risks**: add, update, remove, getByProject, getActive, realize (with optional blocker link).
- **Change requests**: add, update, addApproval, getByProject, getPending.
- **Portfolio decision log**: append-only `appendPortfolioDecision`; `getPortfolioDecisionLog(portfolioId?)`.
- **Weekly prompts**: add, dismiss (dismissible).
- **Contextual insights**: dismiss, isInsightDismissed (dismissible teaching).
- Persistence: localStorage keyed by org id.

### Hooks
- **`useCriticalPath()`** – criticalPathNodes, criticalPathTaskIds, isOnCriticalPath, circularResult, getDownstreamForTask, wouldCreateCycle, edges.
- **`useTaskDependencies`** – now returns `edges: TaskDependencyEdge[]` in addition to `getForTask`.

### Dashboard (`src/pages/Dashboard.tsx` + components)
- **WeekAhead** – tasks/milestones/risk reviews due this week; suggested focus; links to tasks/schedule.
- **CriticalPathSummary** – top critical path tasks; circular dependency warning and link to schedule.
- **RisksBlockersSummary** – high/critical risks and blocked tasks (from dependencies); links to programs/tasks.
- **WeeklyReviewPrompts** – dismissible weekly review prompts (from MasterbookContext).

### Risk Management
- **RiskRegister** (`src/components/masterbook/RiskRegister.tsx`) – full CRUD; filter by status; lifecycle actions (Mark Active, Mitigated, Realized); optional `programId` for program-level view; optional `onConvertToBlocker`.
- **ProgramDetail** – Risks tab replaced with `<RiskRegister programId={program.id} />`; stats (openRisks, highRisks) from Masterbook risks.

### Scope Change Workflow
- **ChangeRequestModal** (`src/components/masterbook/ChangeRequestModal.tsx`) – create change request (add/modify/remove work); items as lines; submit for approval; stored in MasterbookContext.
- Approval workflow and immutable log are in context; UI for approvals can be extended (e.g. approver list and approval actions).

### Dependencies & Timeline
- **DependencyImpactModal** (`src/components/masterbook/DependencyImpactModal.tsx`) – shown when adding a dependency; shows downstream impact, critical path badges, and disables “Add” if `wouldCreateCycle` is true.
- **ContextualInsight** – first dependency, critical path, circular dependency teaching (dismissible).
- **TaskModal** – When adding a dependency in TaskDependenciesTab, **DependencyImpactModal** is shown first (optional `onRequestAddDependency`). Predecessor/successor are derived from type (blocked-by vs blocking). On confirm, dependency is added; if `wouldCreateCycle` is true, "Add dependency" is disabled.

### Status Update Generator
- **StatusUpdateGenerator** (`src/components/masterbook/StatusUpdateGenerator.tsx`) – builds sections from live data: progress, milestones, risks, blockers, scope changes (pending CRs), next focus (editable); executive/weekly format; copy to clipboard.
- Integrated in **Reports** page under a “Status Update” tab; respects portfolio/program filters.

### Portfolio / Multi-Project
- **Portfolio decision log** – append-only entries via `appendPortfolioDecision`; `getPortfolioDecisionLog(portfolioId)`. **PortfolioDecisionLogCard** on Portfolio Detail: list recent entries, "Add" opens dialog (type, title, description, outcome); permission-gated (owner/admin/manager).
- **Resource conflicts** – **ResourceConflictsCard** on Portfolio Detail: lists team members over-allocated (allocation > capacity) in portfolio scope, with suggested actions (reallocate, extend_timeline, reduce_scope).
- **Velocity normalization** – **VelocityNormalizationCard** on Portfolio Detail: portfolio-wide completion rate (completed/total tasks) across projects.
- Cross-project dependency manager (DB/UI) remains optional.

## UI/UX Notes
- All prompts and suggestions are **dismissible**; no forced actions.
- Tailwind used for layout and responsiveness; existing design system (cards, badges, buttons, dialogs) preserved.
- Health signals: critical path, risks, blockers surfaced on Dashboard and in Week Ahead.

## Quality Assurance Checklist
- [x] Critical path computed from tasks + blocks edges; circular detection with alternatives.
- [x] Risk register with lifecycle; link to blockers on realization.
- [x] Change request creation and storage; approval list in context; immutable log pattern.
- [x] Dependency impact modal; wouldCreateCycle prevents bad links.
- [x] Status update from live data; editable next focus; copy.
- [x] Contextual teaching (insights) dismissible.
- [x] Weekly review prompts dismissible.
- [x] Portfolio resource conflicts dashboard (ResourceConflictsCard on Portfolio Detail).
- [x] Velocity normalization across projects (VelocityNormalizationCard on Portfolio Detail).
- [x] Dependency Impact modal wired into TaskModal / TaskDependenciesTab (onRequestAddDependency).

## File Summary
- **New**: `src/types/masterbook.ts`, `src/lib/criticalPath.ts`, `src/contexts/MasterbookContext.tsx`, `src/hooks/useCriticalPath.ts`, `src/components/dashboard/WeekAhead.tsx`, `CriticalPathSummary.tsx`, `RisksBlockersSummary.tsx`, `WeeklyReviewPrompts.tsx`, `src/components/masterbook/RiskRegister.tsx`, `ChangeRequestModal.tsx`, `StatusUpdateGenerator.tsx`, `DependencyImpactModal.tsx`, `ContextualInsight.tsx`, `src/components/portfolio/ResourceConflictsCard.tsx`, `PortfolioDecisionLogCard.tsx`, `VelocityNormalizationCard.tsx`, `docs/MASTERBOOK_REFACTOR.md`.
- **Modified**: `App.tsx` (MasterbookProvider), `Dashboard.tsx` (new sections), `ProgramDetail.tsx` (Masterbook risks + RiskRegister), `Reports.tsx` (Status Update tab), `useTaskDependencies.ts` (edges export), `TaskModal.tsx` (DependencyImpactModal + onRequestAddDependency), `TaskDependenciesTab.tsx` (onRequestAddDependency), `PortfolioDetail.tsx` (ResourceConflictsCard, VelocityNormalizationCard, PortfolioDecisionLogCard).
