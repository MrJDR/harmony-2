import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Users, AlertTriangle, CheckCircle2, Clock, UserPlus } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSection } from '@/components/shared/PageSection';
import { EmptyState } from '@/components/shared/EmptyState';
import { TeamMemberCard } from '@/components/resources/TeamMemberCard';
import { TeamMemberModal } from '@/components/resources/TeamMemberModal';
import { TeamMemberDetail } from '@/components/resources/TeamMemberDetail';
import { AllocationOverview } from '@/components/resources/AllocationOverview';
import { ProjectWorkload } from '@/components/resources/ProjectWorkload';
import { InviteMemberDialog } from '@/components/shared/InviteMemberDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { TeamMember, Task } from '@/types/portfolio';
import { useCreateContact, useUpdateContact } from '@/hooks/useContacts';
import { useCreateTeamMember, useUpdateTeamMember } from '@/hooks/useTeamMembers';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type AllocationFilter = 'all' | 'overallocated' | 'at-capacity' | 'balanced' | 'available';

export default function Resources() {
  const { projects, tasks, teamMembers, setTeamMembers, updateTask } = usePortfolioData();
  const members = teamMembers;
  const [searchQuery, setSearchQuery] = useState('');
  const [allocationFilter, setAllocationFilter] = useState<AllocationFilter>('all');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');

  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const createTeamMember = useCreateTeamMember();
  const updateTeamMember = useUpdateTeamMember();

  // All tasks are now available directly from context
  const allTasks = tasks;

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      // Search filter
      const matchesSearch = 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase());

      // Allocation filter - now based on capacity ratio
      const ratio = (member.allocation / member.capacity) * 100;
      let matchesAllocation = true;
      switch (allocationFilter) {
        case 'overallocated':
          matchesAllocation = ratio >= 100;
          break;
        case 'at-capacity':
          matchesAllocation = ratio >= 85 && ratio < 100;
          break;
        case 'balanced':
          matchesAllocation = ratio >= 50 && ratio < 85;
          break;
        case 'available':
          matchesAllocation = ratio < 50;
          break;
      }

      return matchesSearch && matchesAllocation;
    });
  }, [members, searchQuery, allocationFilter]);

  const stats = useMemo(() => ({
    total: members.length,
    avgAllocation: Math.round(members.reduce((acc, m) => acc + (m.allocation / m.capacity) * 100, 0) / members.length),
    overallocated: members.filter(m => (m.allocation / m.capacity) * 100 >= 100).length,
    atCapacity: members.filter(m => {
      const ratio = (m.allocation / m.capacity) * 100;
      return ratio >= 85 && ratio < 100;
    }).length,
    available: members.filter(m => (m.allocation / m.capacity) * 100 < 50).length,
  }), [members]);

  const handleSaveMember = async (
    memberData: Omit<TeamMember, 'id'> & { id?: string }, 
    unassignedTasks?: Task[],
    newlyAssignedTaskIds?: string[]
  ) => {
    try {
      let memberId = memberData.id;

      // Create or update member record in DB so Resources stays in sync.
      if (!memberId) {
        // 1) Create CRM contact
        const newContact = await createContact.mutateAsync({
          name: memberData.name,
          email: memberData.email,
          role: memberData.role,
          notes: 'Added via Resources',
        });

        // 2) Create team_member pointing at that contact
        const newMember = await createTeamMember.mutateAsync({
          contact_id: newContact.id,
          capacity: memberData.capacity,
        });

        memberId = newMember.id;
      } else {
        // Best-effort updates for existing members
        if (memberData.contactId) {
          updateContact.mutate({
            id: memberData.contactId,
            name: memberData.name,
            email: memberData.email,
            role: memberData.role,
          });
        }

        updateTeamMember.mutate({
          id: memberId,
          capacity: memberData.capacity,
        });
      }

      // Update task assignments using updateTask from context
      if (unassignedTasks) {
        unassignedTasks.forEach(task => {
          updateTask(task.id, { assigneeId: undefined });
        });
      }

      if (newlyAssignedTaskIds && memberId) {
        newlyAssignedTaskIds.forEach(taskId => {
          updateTask(taskId, { assigneeId: memberId });
        });
      }

      toast.success(memberData.id ? 'Team member updated' : 'Team member added');
    } catch (e: any) {
      toast.error(`Failed to save team member: ${e?.message || 'Unknown error'}`);
    }
  };

  const handleDeleteMember = () => {
    if (deletingMember) {
      setTeamMembers((prev) => prev.filter((m) => m.id !== deletingMember.id));
      toast.success('Team member removed');
      setDeletingMember(null);
    }
  };

  const handleMemberClick = (member: TeamMember) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  if (viewMode === 'detail' && selectedMember) {
    return (
      <MainLayout>
        <TeamMemberDetail
          member={selectedMember}
          projects={projects}
          tasks={allTasks}
          onBack={() => {
            setViewMode('grid');
            setSelectedMember(null);
          }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 overflow-x-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <PageHeader
            title="Resources"
            description="Team workload and capacity management"
          />
          <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsInviteOpen(true)} className="gap-2 flex-1 sm:flex-none">
                <UserPlus className="h-4 w-4" />
                <span className="hidden xs:inline">Invite</span>
              </Button>
              <Button onClick={() => { setEditingMember(null); setIsModalOpen(true); }} className="gap-2 flex-1 sm:flex-none">
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline">Add Member</span>
              </Button>
            </div>
          </PermissionGate>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-3 sm:p-5 shadow-card"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Members</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-3 sm:p-5 shadow-card"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-info/10">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-info" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.avgAllocation}%</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Avg. Alloc</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-3 sm:p-5 shadow-card"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              </div>
              <div>
                <p className={cn('text-lg sm:text-2xl font-bold', stats.overallocated > 0 ? 'text-destructive' : 'text-foreground')}>
                  {stats.overallocated}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Over</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border border-border bg-card p-3 sm:p-5 shadow-card"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
              </div>
              <div>
                <p className={cn('text-lg sm:text-2xl font-bold', stats.atCapacity > 0 ? 'text-warning' : 'text-foreground')}>
                  {stats.atCapacity}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">At Cap</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-border bg-card p-3 sm:p-5 shadow-card col-span-2 lg:col-span-1"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
              </div>
              <div>
                <p className={cn('text-lg sm:text-2xl font-bold', stats.available > 0 ? 'text-success' : 'text-foreground')}>
                  {stats.available}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={allocationFilter} onValueChange={(v) => setAllocationFilter(v as AllocationFilter)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="overallocated">Overallocated</SelectItem>
              <SelectItem value="at-capacity">At Capacity</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="available">Available</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Team Members Grid */}
          <div className="lg:col-span-2 space-y-4" data-tour="team-overview">
            <h2 className="font-display text-base sm:text-lg font-semibold text-foreground">
              Team ({filteredMembers.length})
            </h2>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              {filteredMembers.map(member => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  projects={projects}
                  
                  onDelete={setDeletingMember}
                  onClick={handleMemberClick}
                />
              ))}
              {filteredMembers.length === 0 && (
                <div className="col-span-full">
                  <EmptyState
                    icon={Users}
                    title="No team members match your filters"
                    description="Try adjusting search or allocation filters, or add a new team member."
                    action={
                      <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
                        <Button onClick={() => { setEditingMember(null); setIsModalOpen(true); }}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Member
                        </Button>
                      </PermissionGate>
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - stack on mobile */}
          <div className="space-y-6" data-tour="allocation-chart">
            <AllocationOverview members={members} />
            <ProjectWorkload projects={projects} members={members} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <TeamMemberModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        member={editingMember}
        projects={projects}
        onSave={handleSaveMember}
      />

      <InviteMemberDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        title="Invite Team Member"
        description="Invite a new member to join your organization. They will also be added to your CRM contacts."
      />

      <AlertDialog open={!!deletingMember} onOpenChange={(open) => !open && setDeletingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingMember?.name} from the team? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
