/**
 * Change Request Modal – Masterbook "Discipline Defines Reality".
 * Create/edit change request: add/modify/remove work; approval workflow; immutable log.
 */

import { useState } from 'react';
import { FileEdit, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMasterbook } from '@/contexts/MasterbookContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import type { ChangeRequest, ChangeRequestType, ChangeRequestStatus } from '@/types/masterbook';

interface ChangeRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  programId?: string;
  defaultType?: ChangeRequestType;
}

export function ChangeRequestModal({
  open,
  onOpenChange,
  projectId,
  programId,
  defaultType = 'add_work',
}: ChangeRequestModalProps) {
  const { user } = useAuth();
  const { projects } = usePortfolioData();
  const { addChangeRequest } = useMasterbook();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChangeRequestType>(defaultType);
  const [itemsText, setItemsText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user?.id) return;
    try {
      const items = itemsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((titleVal) => ({ type: 'task' as const, title: titleVal }));
      if (items.length === 0 && type !== 'remove_work') {
        setItemsText('Add at least one item (one per line)');
        return;
      }
      addChangeRequest({
        title: title.trim(),
        description: description.trim(),
        type,
        status: 'pending_approval',
        projectId,
        programId,
        requestedById: user.id,
        requestedAt: new Date().toISOString(),
        items,
        approverIds: [],
      });
      setTitle('');
      setDescription('');
      setType(defaultType);
      setItemsText('');
      onOpenChange(false);
    } catch {
      // e.g. no organization – MasterbookContext throws; form stays open
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            New Change Request
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cr-title">Title</Label>
            <Input
              id="cr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Add login flow tasks"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="cr-desc">Description</Label>
            <Textarea
              id="cr-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Rationale and impact summary"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ChangeRequestType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add_work">Add work</SelectItem>
                <SelectItem value="modify_work">Modify work</SelectItem>
                <SelectItem value="remove_work">Remove work</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cr-items">
              Items (one per line) {type === 'add_work' && '— titles of new work'}
            </Label>
            <Textarea
              id="cr-items"
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              rows={4}
              placeholder="Task or deliverable title per line"
              className="mt-1 font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit for approval</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
