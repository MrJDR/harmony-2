/**
 * Status Update Generator – Masterbook "Clarity Strengthens Communication".
 * Generate updates from live project data; editable templates; milestones, risks, blockers, scope changes.
 */

import { useMemo, useState } from 'react';
import { FileText, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { useMasterbook } from '@/contexts/MasterbookContext';
import { useTaskDependencyIds } from '@/hooks/useTaskDependencies';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { StatusUpdateSection } from '@/types/masterbook';

interface StatusUpdateGeneratorProps {
  projectId?: string;
  programId?: string;
  portfolioId?: string;
}

export function StatusUpdateGenerator({
  projectId,
  programId,
  portfolioId,
}: StatusUpdateGeneratorProps) {
  const { toast } = useToast();
  const { tasks, milestones, projects, programs } = usePortfolioData();
  const { getActiveRisks, getPendingChangeRequests, getRisksByProject } = useMasterbook();
  const { getForTask } = useTaskDependencyIds();

  const [formatType, setFormatType] = useState<'executive' | 'weekly'>('weekly');
  const [customText, setCustomText] = useState('');

  const safeTasks = tasks ?? [];
  const safeProjects = projects ?? [];
  const safeMilestones = milestones ?? [];

  const scopeTasks = useMemo(() => {
    if (projectId) return safeTasks.filter((t) => t.projectId === projectId);
    if (programId) {
      const projIds = safeProjects.filter((p) => p.programId === programId).map((p) => p.id);
      return safeTasks.filter((t) => projIds.includes(t.projectId));
    }
    return safeTasks;
  }, [safeTasks, safeProjects, projectId, programId]);

  const scopeMilestones = useMemo(() => {
    if (projectId) return safeMilestones.filter((m) => m.projectId === projectId);
    if (programId) return safeMilestones.filter((m) => m.programId === programId);
    return safeMilestones;
  }, [safeMilestones, projectId, programId]);

  const scopeRisks = useMemo(() => {
    if (projectId) return (getRisksByProject(projectId) ?? []).filter((r) => r.status === 'identified' || r.status === 'active');
    return getActiveRisks() ?? [];
  }, [projectId, getRisksByProject, getActiveRisks]);

  const scopeChangeRequests = useMemo(() => {
    const pending = getPendingChangeRequests() ?? [];
    if (projectId) return pending.filter((c) => c.projectId === projectId);
    if (programId) return pending.filter((c) => c.programId === programId);
    return pending;
  }, [projectId, programId, getPendingChangeRequests]);

  const blockedTaskIds = useMemo(() => {
    const set = new Set<string>();
    for (const t of scopeTasks) {
      if (t.status === 'done') continue;
      const { blocks } = getForTask(t.id);
      if (blocks.length > 0) {
        const allDone = blocks.every((predId) => scopeTasks.find((x) => x.id === predId)?.status === 'done');
        if (!allDone) set.add(t.id);
      }
    }
    return set;
  }, [scopeTasks, getForTask]);

  const completedThisPeriod = scopeTasks.filter((t) => t.status === 'done').length;
  const totalTasks = scopeTasks.length;
  const progressPct = totalTasks > 0 ? Math.round((completedThisPeriod / totalTasks) * 100) : 0;

  const sections = useMemo((): StatusUpdateSection[] => {
    const list: StatusUpdateSection[] = [];

    list.push({
      id: 'progress',
      key: 'progress',
      title: 'Progress',
      content: `Tasks: ${completedThisPeriod}/${totalTasks} completed (${progressPct}%).`,
      generatedFrom: scopeTasks.map((t) => t.id),
    });

    const upcomingMilestones = scopeMilestones
      .filter((m) => new Date(m.dueDate) >= new Date())
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
    if (upcomingMilestones.length > 0) {
      list.push({
        id: 'milestones',
        key: 'milestones',
        title: 'Milestones',
        content: upcomingMilestones
          .map((m) => `• ${m.title} – ${format(new Date(m.dueDate), 'MMM d, yyyy')}`)
          .join('\n'),
        generatedFrom: upcomingMilestones.map((m) => m.id),
      });
    }

    if (scopeRisks.length > 0) {
      list.push({
        id: 'risks',
        key: 'risks',
        title: 'Risks',
        content: scopeRisks
          .map((r) => `• ${r.title} (${r.severity}) – ${r.status}`)
          .join('\n'),
        generatedFrom: scopeRisks.map((r) => r.id),
      });
    }

    const blocked = scopeTasks.filter((t) => blockedTaskIds.has(t.id));
    if (blocked.length > 0) {
      list.push({
        id: 'blockers',
        key: 'blockers',
        title: 'Blockers',
        content: blocked.map((t) => `• ${t.title}`).join('\n'),
        generatedFrom: blocked.map((t) => t.id),
      });
    }

    if (scopeChangeRequests.length > 0) {
      list.push({
        id: 'scope_changes',
        key: 'scope_changes',
        title: 'Scope changes (pending)',
        content: scopeChangeRequests.map((c) => `• ${c.title} – ${c.type}`).join('\n'),
        generatedFrom: scopeChangeRequests.map((c) => c.id),
      });
    }

    list.push({
      id: 'next_focus',
      key: 'next_focus',
      title: 'Next focus',
      content: customText.trim() || 'Review critical path and unblock dependent tasks.',
    });

    return list;
  }, [
    scopeTasks,
    scopeMilestones,
    scopeRisks,
    scopeChangeRequests,
    blockedTaskIds,
    completedThisPeriod,
    totalTasks,
    progressPct,
    customText,
  ]);

  const generatedMarkdown = useMemo(() => {
    const lines: string[] = [
      `# Status Update – ${format(new Date(), 'MMMM d, yyyy')}`,
      formatType === 'executive' ? '(Executive summary)' : '(Weekly)',
      '',
      ...sections.map((s) => `## ${s.title}\n\n${s.content}\n`),
    ];
    return lines.join('\n');
  }, [sections, formatType]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMarkdown);
    toast({ title: 'Copied to clipboard', description: 'Status update copied.' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Status Update Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Format</Label>
          <Select value={formatType} onValueChange={(v) => setFormatType(v as 'executive' | 'weekly')}>
            <SelectTrigger className="mt-1 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="next-focus">Next focus (editable)</Label>
          <Textarea
            id="next-focus"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="What to focus on next..."
            rows={2}
            className="mt-1"
          />
        </div>
        <div className="rounded-md border bg-muted/30 p-4">
          <pre className="text-xs whitespace-pre-wrap font-sans">{generatedMarkdown}</pre>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
