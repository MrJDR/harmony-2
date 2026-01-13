import { useState } from 'react';
import { Check, X, UserPlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/contexts/PermissionsContext';
import { canDeclineAssignment, handleAssignmentDecline, getReassignmentOptions } from '@/lib/assignmentUtils';
import type { TeamMember } from '@/types/portfolio';
import type { OrgRole } from '@/types/permissions';

interface AssignmentActionsProps {
  taskId: string;
  taskTitle: string;
  assigneeId?: string;
  assigneeName?: string;
  teamMembers: TeamMember[];
  currentUserId?: string;
  onAccept: () => void;
  onDecline: (newAssigneeId?: string) => void;
  onReassign: (newAssigneeId: string) => void;
  compact?: boolean;
}

export function AssignmentActions({
  taskId,
  taskTitle,
  assigneeId,
  assigneeName,
  teamMembers,
  currentUserId,
  onAccept,
  onDecline,
  onReassign,
  compact = false,
}: AssignmentActionsProps) {
  const { toast } = useToast();
  const { currentOrgRole, hasOrgPermission } = usePermissions();
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [selectedReassignee, setSelectedReassignee] = useState<string>('');
  const [declinedBy, setDeclinedBy] = useState<string[]>([]);

  // Check if current user is the assignee
  const isAssignee = currentUserId && assigneeId === currentUserId;
  
  // Check if user has permission to decline
  const canDecline = canDeclineAssignment(currentOrgRole as OrgRole, 'org');
  
  // Get reassignment options
  const reassignmentOptions = getReassignmentOptions(
    teamMembers.map(m => ({
      id: m.id,
      name: m.name,
      role: m.role,
      workload: m.allocation,
      availability: m.allocation < 100,
    })),
    [assigneeId || '', ...declinedBy],
    5
  );

  const handleAcceptAssignment = () => {
    onAccept();
    toast({
      title: 'Assignment accepted',
      description: `You've accepted the task "${taskTitle}"`,
    });
  };

  const handleDeclineAssignment = () => {
    if (!canDecline) {
      toast({
        title: 'Cannot decline',
        description: 'You do not have permission to decline assignments',
        variant: 'destructive',
      });
      return;
    }

    // Try auto-reassignment first
    const result = handleAssignmentDecline(
      assigneeId || '',
      teamMembers.map(m => ({
        id: m.id,
        name: m.name,
        role: m.role,
        workload: m.allocation,
        availability: m.allocation < 100,
      })),
      declinedBy
    );

    if (result.success && result.assignedTo) {
      onDecline(result.assignedTo.id);
      toast({
        title: 'Assignment declined',
        description: `Task automatically reassigned to ${result.assignedTo.name}`,
      });
      setDeclinedBy([...declinedBy, assigneeId || '']);
    } else {
      // No one available for auto-reassign, show manual selection
      setShowDeclineDialog(true);
    }
  };

  const handleManualReassign = () => {
    if (!selectedReassignee) {
      toast({
        title: 'Select a team member',
        description: 'Please select someone to reassign the task to',
        variant: 'destructive',
      });
      return;
    }

    onReassign(selectedReassignee);
    const reassigneeName = teamMembers.find(m => m.id === selectedReassignee)?.name;
    toast({
      title: 'Task reassigned',
      description: `Task assigned to ${reassigneeName}`,
    });
    setShowDeclineDialog(false);
    setShowReassignDialog(false);
    setSelectedReassignee('');
  };

  // Only show actions if user is the assignee or has manage permissions
  if (!isAssignee && !hasOrgPermission('manage_assignments')) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {isAssignee && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-success hover:text-success hover:bg-success/10"
              onClick={(e) => {
                e.stopPropagation();
                handleAcceptAssignment();
              }}
              title="Accept assignment"
            >
              <Check className="h-3 w-3" />
            </Button>
            {canDecline && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeclineAssignment();
                }}
                title="Decline assignment"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </>
        )}

        {/* Decline Dialog */}
        <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                No automatic reassignment available
              </AlertDialogTitle>
              <AlertDialogDescription>
                There's no one automatically available to take this task. Please select someone to reassign it to, or leave it unassigned.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Select value={selectedReassignee} onValueChange={setSelectedReassignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Leave unassigned</SelectItem>
                  {reassignmentOptions.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span>{member.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {member.workload || 0}% allocated
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleManualReassign}>
                Reassign
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isAssignee && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="text-success border-success/50 hover:bg-success/10"
            onClick={handleAcceptAssignment}
          >
            <Check className="mr-1 h-4 w-4" />
            Accept
          </Button>
          {canDecline && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/50 hover:bg-destructive/10"
              onClick={handleDeclineAssignment}
            >
              <X className="mr-1 h-4 w-4" />
              Decline
            </Button>
          )}
        </>
      )}

      {hasOrgPermission('manage_assignments') && !isAssignee && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReassignDialog(true)}
        >
          <UserPlus className="mr-1 h-4 w-4" />
          Reassign
        </Button>
      )}

      {/* Decline Dialog */}
      <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              No automatic reassignment available
            </AlertDialogTitle>
            <AlertDialogDescription>
              There's no one automatically available to take this task. Please select someone to reassign it to, or leave it unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={selectedReassignee} onValueChange={setSelectedReassignee}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Leave unassigned</SelectItem>
                {reassignmentOptions.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{member.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {member.workload || 0}% allocated
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleManualReassign}>
              Reassign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reassign Dialog */}
      <AlertDialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reassign Task</AlertDialogTitle>
            <AlertDialogDescription>
              Select a team member to reassign "{taskTitle}" to.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={selectedReassignee} onValueChange={setSelectedReassignee}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{member.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {member.allocation}% allocated
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleManualReassign} disabled={!selectedReassignee}>
              Reassign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
