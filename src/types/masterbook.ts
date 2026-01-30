/**
 * Masterbook v3.1 – TypeScript interfaces for PM workflows, governance, and insights.
 * Aligns with: Flow Reveals Truth, People Create Results, Guided Flexibility, Discipline, Clarity, Uncertainty.
 */

import type { Task, Project, Milestone } from './portfolio';

// --- Dependency & Critical Path ---

export type DependencyType = 'blocks' | 'relates_to';

export interface TaskDependencyEdge {
  id: string;
  predecessorTaskId: string;
  successorTaskId: string;
  type: DependencyType;
  orgId: string;
  createdAt?: string;
}

export interface CriticalPathNode {
  taskId: string;
  taskTitle: string;
  projectId: string;
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
  isCritical: boolean;
  durationHours: number;
}

export interface DownstreamImpact {
  taskId: string;
  taskTitle: string;
  projectId: string;
  depth: number;
  affectedMilestoneIds: string[];
  suggestedNewStart?: string;
  suggestedNewDue?: string;
}

export interface CircularDependencyResult {
  hasCycle: boolean;
  cycleTaskIds: string[];
  suggestedAlternatives: { removeEdge: { pred: string; succ: string }; reason: string }[];
}

// --- Risk Register ---

export type RiskStatus = 'identified' | 'active' | 'mitigated' | 'realized';

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Risk {
  id: string;
  title: string;
  description: string;
  status: RiskStatus;
  severity: RiskSeverity;
  projectId: string;
  programId?: string;
  ownerId?: string;
  identifiedAt: string;
  dueDate?: string;
  mitigationPlan?: string;
  realizedAt?: string;
  blockerTaskId?: string; // when realized, link to auto-created blocker
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiskWithRelations extends Risk {
  projectName?: string;
  ownerName?: string;
}

// --- Scope Change / Change Request ---

export type ChangeRequestType = 'add_work' | 'modify_work' | 'remove_work';

export type ChangeRequestStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'implemented';

export interface ChangeRequestItem {
  type: 'task' | 'milestone' | 'deliverable';
  id?: string;
  title: string;
  description?: string;
  /** For modify/remove, reference to existing work id */
  existingId?: string;
}

export interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  type: ChangeRequestType;
  status: ChangeRequestStatus;
  projectId: string;
  programId?: string;
  requestedById: string;
  requestedAt: string;
  items: ChangeRequestItem[];
  impactSummary?: {
    scheduleImpactDays?: number;
    affectedMilestoneIds: string[];
    affectedTaskIds: string[];
    dependencyImpact?: string;
  };
  approverIds: string[];
  approvals: ChangeRequestApproval[];
  implementedAt?: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeRequestApproval {
  approverId: string;
  approved: boolean;
  comment?: string;
  at: string;
}

// --- Portfolio Decision Log (immutable) ---

export type PortfolioDecisionType =
  | 'resource_allocation'
  | 'scope_approval'
  | 'priority_override'
  | 'cross_project_dependency'
  | 'schedule_adjustment'
  | 'risk_acceptance'
  | 'other';

export interface PortfolioDecisionLogEntry {
  id: string;
  type: PortfolioDecisionType;
  title: string;
  description: string;
  portfolioId: string;
  projectIds: string[];
  programIds: string[];
  decidedBy: string;
  decidedAt: string;
  outcome: string;
  /** Immutable: no update/delete; append-only */
  metadata?: Record<string, unknown>;
}

// --- Resource & Portfolio ---

export interface ResourceConflict {
  memberId: string;
  memberName: string;
  projectIds: string[];
  allocationTotal: number;
  capacity: number;
  overAllocationBy: number;
  suggestedActions: ('reallocate' | 'extend_timeline' | 'reduce_scope')[];
}

export interface CrossProjectDependency {
  id: string;
  sourceProjectId: string;
  targetProjectId: string;
  sourceTaskId?: string;
  targetTaskId?: string;
  description: string;
  createdAt: string;
}

export interface PortfolioHealthSignal {
  portfolioId: string;
  programId?: string;
  projectId?: string;
  signal: 'on_track' | 'at_risk' | 'critical' | 'blocked';
  reason: string;
  metric?: string;
  updatedAt: string;
}

// --- Status Update & PM Assistant ---

export interface StatusUpdateSection {
  id: string;
  key: 'milestones' | 'risks' | 'blockers' | 'scope_changes' | 'progress' | 'next_focus' | 'decisions';
  title: string;
  content: string;
  generatedFrom?: string[]; // entity ids used to generate
}

export interface StatusUpdateTemplate {
  id: string;
  name: string;
  sections: StatusUpdateSection['key'][];
  format: 'executive' | 'weekly' | 'custom';
}

export interface GeneratedStatusUpdate {
  templateId: string;
  generatedAt: string;
  sections: StatusUpdateSection[];
  projectId?: string;
  programId?: string;
  portfolioId?: string;
}

// --- Inline Teaching / Contextual Insights ---

export type InsightId =
  | 'dependency_impact'
  | 'critical_path_intro'
  | 'circular_dependency'
  | 'resource_over_allocation'
  | 'risk_realized_blocker'
  | 'scope_change_approval'
  | 'first_dependency'
  | 'first_risk'
  | 'first_change_request';

export interface ContextualInsight {
  id: InsightId;
  title: string;
  body: string;
  dismissible: boolean;
  actionLabel?: string;
  actionHref?: string;
  alternatives?: string[];
}

// --- Week Ahead / Dashboard ---

export interface WeekAheadItem {
  type: 'task' | 'milestone' | 'review' | 'risk_review' | 'scope_review';
  id: string;
  title: string;
  dueDate?: string;
  projectId?: string;
  isCritical?: boolean;
  isBlocked?: boolean;
  riskId?: string;
}

export interface WeeklyReviewPrompt {
  id: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  dismissedAt?: string;
}
