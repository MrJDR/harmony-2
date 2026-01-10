import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Users, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { TeamMemberCard } from '@/components/resources/TeamMemberCard';
import { TeamMemberModal } from '@/components/resources/TeamMemberModal';
import { TeamMemberDetail } from '@/components/resources/TeamMemberDetail';
import { AllocationOverview } from '@/components/resources/AllocationOverview';
import { ProjectWorkload } from '@/components/resources/ProjectWorkload';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type AllocationFilter = 'all' | 'overallocated' | 'at-capacity' | 'balanced' | 'available';

export default function Resources() {
  const { projects, setProjects, teamMembers, setTeamMembers } = usePortfolioData();
  const members = teamMembers;
  const [searchQuery, setSearchQuery] = useState('');
  const [allocationFilter, setAllocationFilter] = useState<AllocationFilter>('all');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');

  const allTasks = useMemo(() => {
    return projects.flatMap(p => p.tasks);
  }, [projects]);

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

  const handleSaveMember = (
    memberData: Omit<TeamMember, 'id'> & { id?: string }, 
    unassignedTasks?: Task[],
    newlyAssignedTaskIds?: string[]
  ) => {
    // Update task assignments in projects (global)
    setProjects(prevProjects =>
      prevProjects.map(project => ({
        ...project,
        tasks: project.tasks.map(task => {
          if (unassignedTasks?.some(t => t.id === task.id)) {
            return { ...task, assigneeId: undefined };
          }
          if (newlyAssignedTaskIds?.includes(task.id) && memberData.id) {
            return { ...task, assigneeId: memberData.id };
          }
          return task;
        })
      }))
    );

    if (memberData.id) {
      setTeamMembers((prev) => prev.map((m) => (m.id === memberData.id ? { ...m, ...memberData, id: m.id } : m)));
      toast.success('Team member updated');
    } else {
      const newMember: TeamMember = {
        ...memberData,
        id: `member-${Date.now()}`,
      };
      setTeamMembers((prev) => [...prev, newMember]);
      toast.success('Team member added');
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
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Resources</h1>
            <p className="mt-1 text-muted-foreground">
              Team workload, allocation, and capacity management
            </p>
          </div>
          <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
            <Button onClick={() => { setEditingMember(null); setIsModalOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Team Member
            </Button>
          </PermissionGate>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Team Members</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.avgAllocation}%</p>
                <p className="text-sm text-muted-foreground">Avg. Allocation</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className={cn('text-2xl font-bold', stats.overallocated > 0 ? 'text-destructive' : 'text-foreground')}>
                  {stats.overallocated}
                </p>
                <p className="text-sm text-muted-foreground">Overallocated</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className={cn('text-2xl font-bold', stats.atCapacity > 0 ? 'text-warning' : 'text-foreground')}>
                  {stats.atCapacity}
                </p>
                <p className="text-sm text-muted-foreground">At Capacity</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className={cn('text-2xl font-bold', stats.available > 0 ? 'text-success' : 'text-foreground')}>
                  {stats.available}
                </p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={allocationFilter} onValueChange={(v) => setAllocationFilter(v as AllocationFilter)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
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
            <h2 className="font-display text-lg font-semibold text-foreground">
              Team Members ({filteredMembers.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
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
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No team members match your filters
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
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
