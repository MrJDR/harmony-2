import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, UserPlus } from 'lucide-react';
import { TeamMember } from '@/types/portfolio';
import { Button } from '@/components/ui/button';
import { InviteMemberDialog } from '@/components/shared/InviteMemberDialog';
import { cn } from '@/lib/utils';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (memberIds: string[]) => void;
  allMembers: TeamMember[];
  currentMemberIds: string[];
}

export function AddTeamMemberModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  allMembers, 
  currentMemberIds 
}: AddTeamMemberModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const availableMembers = allMembers.filter((m) => !currentMemberIds.includes(m.id));

  const toggleMember = (memberId: string) => {
    setSelectedIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleAdd = () => {
    onAdd(selectedIds);
    setSelectedIds([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-border bg-card shadow-elevated"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-display text-lg font-semibold text-card-foreground">
                Add Team Members
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6">
              {availableMembers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    All team members are already assigned to this project.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowInviteDialog(true)}
                    className="gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite New Member
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {availableMembers.map((member) => {
                      const isSelected = selectedIds.includes(member.id);
                      return (
                        <button
                          key={member.id}
                          onClick={() => toggleMember(member.id)}
                          className={cn(
                            "w-full flex items-center gap-4 p-3 rounded-lg border transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                            {member.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-foreground">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                          </div>
                          {isSelected && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <Button 
                      variant="ghost" 
                      className="w-full gap-2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowInviteDialog(true)}
                    >
                      <UserPlus className="h-4 w-4" />
                      Invite New Member to Organization
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={selectedIds.length === 0}>
                Add {selectedIds.length > 0 && `(${selectedIds.length})`}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <InviteMemberDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        title="Invite New Team Member"
        description="Invite someone new to your organization. They will be added to your CRM contacts automatically."
      />
    </>
  );
}
