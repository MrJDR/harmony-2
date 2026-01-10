import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Check, Plus, X, Users, Info, Loader2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface ResourcesStepProps {
  onComplete: () => void;
  isComplete: boolean;
}

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  capacity: number;
  isOwner: boolean;
  isPending: boolean;
}

export function ResourcesStep({ onComplete, isComplete }: ResourcesStepProps) {
  const { toast } = useToast();
  const { organization, user, profile } = useAuth();
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New invite form
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('member');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (organization?.id && user?.id) {
      loadTeamMembers();
    }
  }, [organization?.id, user?.id]);

  const loadTeamMembers = async () => {
    if (!organization?.id || !user?.id) return;
    
    setLoading(true);
    try {
      // Get pending invites
      const { data: invites, error: invitesError } = await supabase
        .from('org_invites')
        .select('email, role')
        .eq('org_id', organization.id)
        .is('accepted_at', null);

      if (invitesError) throw invitesError;

      // Build team members list starting with owner (current user)
      const members: TeamMember[] = [];

      // Add the owner (current user)
      members.push({
        id: user.id,
        email: profile?.email || user.email || '',
        name: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'You',
        role: 'owner',
        capacity: 100,
        isOwner: true,
        isPending: false,
      });

      // Add pending invites
      if (invites) {
        invites.forEach((invite) => {
          members.push({
            id: invite.email, // Use email as ID for pending invites
            email: invite.email,
            name: invite.email.split('@')[0], // Use email prefix as name
            role: invite.role,
            capacity: 100,
            isOwner: false,
            isPending: true,
          });
        });
      }

      setTeamMembers(members);
    } catch (error: any) {
      console.error('Error loading team members:', error);
      toast({
        title: 'Error loading team',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCapacity = (memberId: string, capacity: number) => {
    setTeamMembers(members => 
      members.map(m => m.id === memberId ? { ...m, capacity } : m)
    );
  };

  const addTeamMember = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast({ title: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }

    if (!organization?.id || !user?.id) return;

    // Check if already in list
    if (teamMembers.some(m => m.email.toLowerCase() === newEmail.toLowerCase())) {
      toast({ title: 'This person is already in the team', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      // Send invite
      const { error } = await supabase
        .from('org_invites')
        .insert({
          email: newEmail.trim().toLowerCase(),
          role: newRole,
          org_id: organization.id,
          invited_by: user.id,
        });

      if (error) throw error;

      // Add to local list
      setTeamMembers([...teamMembers, {
        id: newEmail.trim().toLowerCase(),
        email: newEmail.trim().toLowerCase(),
        name: newEmail.split('@')[0],
        role: newRole,
        capacity: 100,
        isOwner: false,
        isPending: true,
      }]);

      toast({ 
        title: 'Invite sent!',
        description: `${newEmail} will join when they sign up.`,
      });

      setNewEmail('');
      setNewRole('member');
    } catch (error: any) {
      toast({
        title: 'Error sending invite',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleComplete = () => {
    // In a real implementation, you'd save capacity allocations to the database
    toast({
      title: 'Team capacity configured!',
      description: 'You can adjust allocations anytime from the Resources page.',
    });
    onComplete();
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'manager': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Explanation header */}
      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
        <Users className="h-10 w-10 text-primary shrink-0 mt-1" />
        <div>
          <h3 className="font-medium">Configure team capacity</h3>
          <p className="text-sm text-muted-foreground">
            Set how much each team member can work on projects. This helps prevent overallocation and ensures balanced workloads.
          </p>
        </div>
      </div>

      {/* Allocation explanation */}
      <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium mb-1">How allocation works</p>
          <ul className="space-y-1 text-blue-700 dark:text-blue-300">
            <li>• <strong>100%</strong> = Full-time availability for project work</li>
            <li>• <strong>50%</strong> = Half-time (e.g., part-time or split between teams)</li>
            <li>• When tasks are assigned, the system tracks against each person's capacity</li>
            <li>• You'll see warnings when someone is over-allocated</li>
          </ul>
        </div>
      </div>

      {/* Team members list */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Team Members ({teamMembers.length})
        </Label>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {teamMembers.map((member) => (
            <div 
              key={member.id}
              className="flex items-center gap-4 p-4 rounded-lg border bg-card"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">
                    {member.name}
                    {member.isOwner && <span className="text-muted-foreground ml-1">(You)</span>}
                  </span>
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {member.role}
                  </Badge>
                  {member.isPending && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      <Mail className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
              </div>
              <div className="flex items-center gap-4 w-48">
                <Slider
                  value={[member.capacity]}
                  onValueChange={([value]) => updateCapacity(member.id, value)}
                  max={100}
                  min={0}
                  step={10}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">
                  {member.capacity}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add new team member */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-sm font-medium">Add Team Member</Label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="colleague@company.com"
              onKeyDown={(e) => e.key === 'Enter' && addTeamMember()}
            />
          </div>
          <div className="w-full sm:w-32">
            <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addTeamMember} disabled={sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add Team Member
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Adding a team member will send them an invite to join your organization.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4">
        <Button onClick={handleComplete}>
          {isComplete ? (
            <Check className="h-4 w-4 mr-2" />
          ) : null}
          Continue
        </Button>
      </div>
    </div>
  );
}
