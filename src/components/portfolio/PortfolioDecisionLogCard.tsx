/**
 * Portfolio Decision Log – Masterbook "Discipline Defines Reality".
 * Append-only log; add entry via simple form; list recent decisions.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMasterbook } from '@/contexts/MasterbookContext';
import { useAuth } from '@/contexts/AuthContext';
import type { PortfolioDecisionType } from '@/types/masterbook';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const DECISION_TYPES: { value: PortfolioDecisionType; label: string }[] = [
  { value: 'resource_allocation', label: 'Resource allocation' },
  { value: 'scope_approval', label: 'Scope approval' },
  { value: 'priority_override', label: 'Priority override' },
  { value: 'cross_project_dependency', label: 'Cross-project dependency' },
  { value: 'schedule_adjustment', label: 'Schedule adjustment' },
  { value: 'risk_acceptance', label: 'Risk acceptance' },
  { value: 'other', label: 'Other' },
];

interface PortfolioDecisionLogCardProps {
  portfolioId: string;
  projectIds: string[];
  programIds: string[];
}

export function PortfolioDecisionLogCard({
  portfolioId,
  projectIds,
  programIds,
}: PortfolioDecisionLogCardProps) {
  const { user } = useAuth();
  const { getPortfolioDecisionLog, appendPortfolioDecision } = useMasterbook();
  const [modalOpen, setModalOpen] = useState(false);
  const [formType, setFormType] = useState<PortfolioDecisionType>('other');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOutcome, setFormOutcome] = useState('');

  const entries = getPortfolioDecisionLog(portfolioId);
  const recentEntries = entries.slice(-10).reverse();
  const decidedByLabel = (userId: string) => (userId === user?.id ? 'You' : 'Team');

  const handleAdd = () => {
    if (!formTitle.trim() || !user?.id) return;
    appendPortfolioDecision({
      type: formType,
      title: formTitle.trim(),
      description: formDescription.trim(),
      portfolioId,
      projectIds,
      programIds,
      decidedBy: user.id,
      outcome: formOutcome.trim() || '—',
    });
    setFormTitle('');
    setFormDescription('');
    setFormOutcome('');
    setFormType('other');
    setModalOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-card-foreground">Decision Log</h3>
          <p className="mt-1 text-sm text-muted-foreground">Append-only record of portfolio decisions</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
      <ScrollArea className="mt-4 h-[200px] pr-3">
        <div className="space-y-2">
          {recentEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No decisions logged yet.</p>
          ) : (
            recentEntries.map((e) => (
              <div
                key={e.id}
                className="rounded-lg border border-border bg-muted/30 p-3 text-sm"
              >
                <p className="font-medium truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                  {e.type.replace('_', ' ')} · {format(new Date(e.decidedAt), 'MMM d, yyyy')} · {decidedByLabel(e.decidedBy)}
                </p>
                {e.outcome && e.outcome !== '—' && (
                  <p className="text-xs mt-1 text-muted-foreground line-clamp-2">{e.outcome}</p>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Log decision
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={formType} onValueChange={(v) => setFormType(v as PortfolioDecisionType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DECISION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="log-title">Title</Label>
              <Input
                id="log-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Short title"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="log-desc">Description</Label>
              <Textarea
                id="log-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                placeholder="What was decided"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="log-outcome">Outcome</Label>
              <Input
                id="log-outcome"
                value={formOutcome}
                onChange={(e) => setFormOutcome(e.target.value)}
                placeholder="Result or next step"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!formTitle.trim() || !user?.id}>
              Add to log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
