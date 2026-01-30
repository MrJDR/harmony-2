/**
 * Masterbook v3.1 – Central context for risks, change requests, portfolio decision log,
 * and derived state (critical path, health signals). Persists to localStorage by org.
 */

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type {
  Risk,
  ChangeRequest,
  PortfolioDecisionLogEntry,
  WeeklyReviewPrompt,
  ContextualInsight,
} from '@/types/masterbook';

const STORAGE_KEY_PREFIX = 'accordpm_masterbook';

function loadJson<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

type MasterbookState = {
  risks: Risk[];
  changeRequests: ChangeRequest[];
  portfolioDecisionLog: PortfolioDecisionLogEntry[];
  weeklyReviewPrompts: WeeklyReviewPrompt[];
  dismissedInsights: string[];
};

const defaultState: MasterbookState = {
  risks: [],
  changeRequests: [],
  portfolioDecisionLog: [],
  weeklyReviewPrompts: [],
  dismissedInsights: [],
};

type MasterbookContextType = MasterbookState & {
  // Risks
  addRisk: (risk: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'>) => Risk;
  updateRisk: (id: string, patch: Partial<Risk>) => void;
  removeRisk: (id: string) => void;
  getRisksByProject: (projectId: string) => Risk[];
  getActiveRisks: () => Risk[];
  realizeRisk: (id: string, blockerTaskId?: string) => void;

  // Change requests
  addChangeRequest: (cr: Omit<ChangeRequest, 'id' | 'createdAt' | 'updatedAt' | 'approvals'>) => ChangeRequest;
  updateChangeRequest: (id: string, patch: Partial<ChangeRequest>) => void;
  addApproval: (crId: string, approval: ChangeRequest['approvals'][0]) => void;
  getChangeRequestsByProject: (projectId: string) => ChangeRequest[];
  getPendingChangeRequests: () => ChangeRequest[];

  // Portfolio decision log (append-only)
  appendPortfolioDecision: (entry: Omit<PortfolioDecisionLogEntry, 'id' | 'decidedAt'>) => PortfolioDecisionLogEntry;
  getPortfolioDecisionLog: (portfolioId?: string) => PortfolioDecisionLogEntry[];

  // Weekly prompts
  dismissWeeklyPrompt: (id: string) => void;
  addWeeklyPrompt: (prompt: Omit<WeeklyReviewPrompt, 'id'>) => void;

  // Contextual insights (dismissible)
  dismissInsight: (insightId: string) => void;
  isInsightDismissed: (insightId: string) => boolean;
};

const MasterbookContext = createContext<MasterbookContextType | null>(null);

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function MasterbookProvider({ children }: { children: React.ReactNode }) {
  const { organization } = useAuth();
  const [state, setState] = useState<MasterbookState>(() => defaultState);
  const storageKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const key = organization?.id ? `${STORAGE_KEY_PREFIX}_${organization.id}` : null;
    storageKeyRef.current = key;
    if (key) {
      setState({
        risks: loadJson(`${key}_risks`, defaultState.risks),
        changeRequests: loadJson(`${key}_changeRequests`, defaultState.changeRequests),
        portfolioDecisionLog: loadJson(`${key}_portfolioLog`, defaultState.portfolioDecisionLog),
        weeklyReviewPrompts: loadJson(`${key}_weeklyPrompts`, defaultState.weeklyReviewPrompts),
        dismissedInsights: loadJson(`${key}_dismissedInsights`, defaultState.dismissedInsights),
      });
    } else {
      setState(defaultState);
    }
  }, [organization?.id]);

  const persist = useCallback(() => {
    const key = storageKeyRef.current;
    if (!key) return;
    saveJson(`${key}_risks`, state.risks);
    saveJson(`${key}_changeRequests`, state.changeRequests);
    saveJson(`${key}_portfolioLog`, state.portfolioDecisionLog);
    saveJson(`${key}_weeklyPrompts`, state.weeklyReviewPrompts);
    saveJson(`${key}_dismissedInsights`, state.dismissedInsights);
  }, [state.risks, state.changeRequests, state.portfolioDecisionLog, state.weeklyReviewPrompts, state.dismissedInsights]);

  useEffect(() => {
    if (organization?.id) persist();
  }, [organization?.id, persist]);

  const addRisk = useCallback(
    (risk: Omit<Risk, 'id' | 'createdAt' | 'updatedAt' | 'orgId'>): Risk => {
      if (!organization?.id) throw new Error('Organization required');
      const now = new Date().toISOString();
      const newRisk: Risk = {
        ...risk,
        orgId: organization.id,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      setState((s) => ({ ...s, risks: [...s.risks, newRisk] }));
      return newRisk;
    },
    [organization?.id]
  );

  const updateRisk = useCallback((id: string, patch: Partial<Risk>) => {
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      risks: s.risks.map((r) =>
        r.id === id ? { ...r, ...patch, updatedAt: now } : r
      ),
    }));
  }, []);

  const removeRisk = useCallback((id: string) => {
    setState((s) => ({ ...s, risks: s.risks.filter((r) => r.id !== id) }));
  }, []);

  const getRisksByProject = useCallback(
    (projectId: string) => state.risks.filter((r) => r.projectId === projectId),
    [state.risks]
  );

  const getActiveRisks = useCallback(
    () => state.risks.filter((r) => r.status === 'identified' || r.status === 'active'),
    [state.risks]
  );

  const realizeRisk = useCallback((id: string, blockerTaskId?: string) => {
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      risks: s.risks.map((r) =>
        r.id === id
          ? { ...r, status: 'realized' as const, realizedAt: now, blockerTaskId, updatedAt: now }
          : r
      ),
    }));
  }, []);

  const addChangeRequest = useCallback(
    (cr: Omit<ChangeRequest, 'id' | 'createdAt' | 'updatedAt' | 'approvals' | 'orgId'>): ChangeRequest => {
      if (!organization?.id) throw new Error('Organization required');
      const now = new Date().toISOString();
      const newCr: ChangeRequest = {
        ...cr,
        orgId: organization.id,
        id: generateId(),
        approvals: [],
        createdAt: now,
        updatedAt: now,
      };
      setState((s) => ({ ...s, changeRequests: [...s.changeRequests, newCr] }));
      return newCr;
    },
    [organization?.id]
  );

  const updateChangeRequest = useCallback((id: string, patch: Partial<ChangeRequest>) => {
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      changeRequests: s.changeRequests.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: now } : c
      ),
    }));
  }, []);

  const addApproval = useCallback((crId: string, approval: ChangeRequest['approvals'][0]) => {
    setState((s) => ({
      ...s,
      changeRequests: s.changeRequests.map((c) =>
        c.id === crId ? { ...c, approvals: [...c.approvals, approval] } : c
      ),
    }));
  }, []);

  const getChangeRequestsByProject = useCallback(
    (projectId: string) =>
      state.changeRequests.filter((c) => c.projectId === projectId),
    [state.changeRequests]
  );

  const getPendingChangeRequests = useCallback(
    () => state.changeRequests.filter((c) => c.status === 'pending_approval'),
    [state.changeRequests]
  );

  const getPortfolioDecisionLog = useCallback(
    (portfolioId?: string) =>
      portfolioId
        ? state.portfolioDecisionLog.filter((e) => e.portfolioId === portfolioId)
        : state.portfolioDecisionLog,
    [state.portfolioDecisionLog]
  );

  const appendPortfolioDecision = useCallback(
    (entry: Omit<PortfolioDecisionLogEntry, 'id' | 'decidedAt'>): PortfolioDecisionLogEntry => {
      const now = new Date().toISOString();
      const newEntry: PortfolioDecisionLogEntry = {
        ...entry,
        id: generateId(),
        decidedAt: now,
      };
      setState((s) => ({
        ...s,
        portfolioDecisionLog: [...s.portfolioDecisionLog, newEntry],
      }));
      return newEntry;
    },
    []
  );

  const dismissWeeklyPrompt = useCallback((id: string) => {
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      weeklyReviewPrompts: s.weeklyReviewPrompts.map((p) =>
        p.id === id ? { ...p, dismissedAt: now } : p
      ),
    }));
  }, []);

  const addWeeklyPrompt = useCallback((prompt: Omit<WeeklyReviewPrompt, 'id'>) => {
    const newPrompt: WeeklyReviewPrompt = { ...prompt, id: generateId() };
    setState((s) => ({
      ...s,
      weeklyReviewPrompts: [...s.weeklyReviewPrompts, newPrompt],
    }));
    return newPrompt;
  }, []);

  const dismissInsight = useCallback((insightId: string) => {
    setState((s) => ({
      ...s,
      dismissedInsights: s.dismissedInsights.includes(insightId)
        ? s.dismissedInsights
        : [...s.dismissedInsights, insightId],
    }));
  }, []);

  const isInsightDismissed = useCallback(
    (insightId: string) => state.dismissedInsights.includes(insightId),
    [state.dismissedInsights]
  );

  const value = useMemo<MasterbookContextType>(
    () => ({
      ...state,
      addRisk,
      updateRisk,
      removeRisk,
      getRisksByProject,
      getActiveRisks,
      realizeRisk,
      addChangeRequest,
      updateChangeRequest,
      addApproval,
      getChangeRequestsByProject,
      getPendingChangeRequests,
      getPortfolioDecisionLog,
      appendPortfolioDecision,
      dismissWeeklyPrompt,
      addWeeklyPrompt,
      dismissInsight,
      isInsightDismissed,
    }),
    [
      state,
      addRisk,
      updateRisk,
      removeRisk,
      getRisksByProject,
      getActiveRisks,
      realizeRisk,
      addChangeRequest,
      updateChangeRequest,
      addApproval,
      getChangeRequestsByProject,
      getPendingChangeRequests,
      getPortfolioDecisionLog,
      appendPortfolioDecision,
      dismissWeeklyPrompt,
      addWeeklyPrompt,
      dismissInsight,
      isInsightDismissed,
    ]
  );

  return (
    <MasterbookContext.Provider value={value}>
      {children}
    </MasterbookContext.Provider>
  );
}

export function useMasterbook() {
  const ctx = useContext(MasterbookContext);
  if (!ctx) throw new Error('useMasterbook must be used within MasterbookProvider');
  return ctx;
}
