/**
 * Risk Register – Masterbook "Uncertainty Brings Opportunity".
 * Lifecycle: Identified → Active → Mitigated / Realized. Link realized risks to blockers.
 */

import { useState } from 'react';
import { Shield, Plus, AlertTriangle, CheckCircle2, XCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useMasterbook } from '@/contexts/MasterbookContext';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import type { Risk, RiskStatus, RiskSeverity } from '@/types/masterbook';
import { cn } from '@/lib/utils';

const statusLabels: Record<RiskStatus, string> = {
  identified: 'Identified',
  active: 'Active',
  mitigated: 'Mitigated',
  realized: 'Realized',
};

const severityColors: Record<RiskSeverity, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info/20 text-info',
  high: 'bg-warning/20 text-warning',
  critical: 'bg-destructive/20 text-destructive',
};

interface RiskRegisterProps {
  projectId?: string;
  /** When set, show risks for all projects in this program */
  programId?: string;
  onConvertToBlocker?: (riskId: string, riskTitle: string) => void;
}

export function RiskRegister({ projectId, programId, onConvertToBlocker }: RiskRegisterProps) {
  const { projects, teamMembers } = usePortfolioData();
  const {
    risks,
    addRisk,
    updateRisk,
    removeRisk,
    getRisksByProject,
    getActiveRisks,
    realizeRisk,
  } = useMasterbook();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [filterStatus, setFilterStatus] = useState<RiskStatus | 'all'>('all');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSeverity, setFormSeverity] = useState<RiskSeverity>('medium');
  const [formStatus, setFormStatus] = useState<RiskStatus>('identified');
  const [formProjectId, setFormProjectId] = useState('');
  const [formOwnerId, setFormOwnerId] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formMitigationPlan, setFormMitigationPlan] = useState('');

  const safeProjects = projects ?? [];
  const safeRisks = risks ?? [];
  const programProjectIds = programId
    ? safeProjects.filter((p) => p.programId === programId).map((p) => p.id)
    : [];
  const filteredRisks = projectId
    ? getRisksByProject(projectId)
    : programId
      ? safeRisks.filter((r) => programProjectIds.includes(r.projectId))
      : safeRisks;
  const displayRisks = filterStatus === 'all'
    ? filteredRisks
    : filteredRisks.filter((r) => r.status === filterStatus);

  const projectName = (id: string) => safeProjects.find((p) => p.id === id)?.name ?? '';
  const memberName = (id: string) => (teamMembers ?? []).find((m) => m.id === id)?.name ?? '';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = formTitle.trim();
    if (!title || !formProjectId) return;

    if (editingRisk) {
      updateRisk(editingRisk.id, {
        title,
        description: formDescription.trim(),
        severity: formSeverity,
        status: formStatus,
        ownerId: formOwnerId || undefined,
        dueDate: formDueDate || undefined,
        mitigationPlan: formMitigationPlan.trim() || undefined,
        projectId: formProjectId,
      });
    } else {
      addRisk({
        title,
        description: formDescription.trim(),
        status: formStatus,
        severity: formSeverity,
        projectId: formProjectId,
        ownerId: formOwnerId || undefined,
        dueDate: formDueDate || undefined,
        mitigationPlan: formMitigationPlan.trim() || undefined,
        identifiedAt: new Date().toISOString(),
      });
    }
    setModalOpen(false);
    setEditingRisk(null);
    resetForm();
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormSeverity('medium');
    setFormStatus('identified');
    setFormProjectId(projectId ?? '');
    setFormOwnerId('');
    setFormDueDate('');
    setFormMitigationPlan('');
  };

  const openEdit = (risk: Risk) => {
    setEditingRisk(risk);
    setFormTitle(risk.title);
    setFormDescription(risk.description ?? '');
    setFormSeverity(risk.severity);
    setFormStatus(risk.status);
    setFormProjectId(risk.projectId);
    setFormOwnerId(risk.ownerId ?? '');
    setFormDueDate(risk.dueDate?.slice(0, 10) ?? '');
    setFormMitigationPlan(risk.mitigationPlan ?? '');
    setModalOpen(true);
  };

  const openNew = () => {
    setEditingRisk(null);
    resetForm();
    setFormProjectId(projectId ?? '');
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Risk Register
        </h2>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as RiskStatus | 'all')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" />
            Add Risk
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Risk</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRisks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No risks in this scope. Add a risk to track uncertainty and mitigation.
                </TableCell>
              </TableRow>
            ) : (
              displayRisks.map((risk) => (
                <TableRow key={risk.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{risk.title}</p>
                      {risk.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{risk.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{projectName(risk.projectId)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('capitalize', severityColors[risk.severity])}>
                      {risk.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {statusLabels[risk.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{risk.ownerId ? memberName(risk.ownerId) : '—'}</TableCell>
                  <TableCell>{risk.dueDate ? new Date(risk.dueDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(risk)}>Edit</DropdownMenuItem>
                        {risk.status === 'identified' && (
                          <DropdownMenuItem onClick={() => updateRisk(risk.id, { status: 'active' })}>
                            Mark Active
                          </DropdownMenuItem>
                        )}
                        {risk.status === 'active' && (
                          <DropdownMenuItem onClick={() => updateRisk(risk.id, { status: 'mitigated' })}>
                            Mark Mitigated
                          </DropdownMenuItem>
                        )}
                        {(risk.status === 'identified' || risk.status === 'active') && (
                          <DropdownMenuItem
                            onClick={() => {
                              realizeRisk(risk.id);
                              onConvertToBlocker?.(risk.id, risk.title);
                            }}
                          >
                            Mark Realized (create blocker)
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => removeRisk(risk.id)}
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRisk ? 'Edit Risk' : 'Add Risk'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select value={formSeverity} onValueChange={(v) => setFormSeverity(v as RiskSeverity)}>
                  <SelectTrigger id="severity" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['low', 'medium', 'high', 'critical'] as const).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as RiskStatus)}>
                  <SelectTrigger id="status" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="projectId">Project</Label>
              <Select value={formProjectId} onValueChange={setFormProjectId} required>
                <SelectTrigger id="projectId" className="mt-1">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {safeProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ownerId">Owner</Label>
              <Select value={formOwnerId} onValueChange={setFormOwnerId}>
                <SelectTrigger id="ownerId" className="mt-1">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="mitigationPlan">Mitigation plan</Label>
              <Textarea id="mitigationPlan" rows={2} value={formMitigationPlan} onChange={(e) => setFormMitigationPlan(e.target.value)} className="mt-1" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingRisk ? 'Save' : 'Add'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
