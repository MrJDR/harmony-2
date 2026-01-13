import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Mail, Plus, X, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOnboardingData } from '@/contexts/OnboardingDataContext';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface InviteTeamStepProps {
  onComplete: () => void;
  isComplete: boolean;
}

interface PendingInvite {
  email: string;
  role: AppRole;
}

export function InviteTeamStep({ onComplete, isComplete }: InviteTeamStepProps) {
  const { organization, user } = useAuth();
  const { toast } = useToast();
  const { loadTeamMembers } = useOnboardingData();
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppRole>('member');
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [sending, setSending] = useState(false);

  const addToList = () => {
    if (!email.trim() || !email.includes('@')) {
      toast({ title: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }
    
    if (pendingInvites.some(i => i.email.toLowerCase() === email.toLowerCase())) {
      toast({ title: 'This email is already in the list', variant: 'destructive' });
      return;
    }

    setPendingInvites([...pendingInvites, { email: email.trim().toLowerCase(), role }]);
    setEmail('');
    setRole('member');
  };

  const removeFromList = (emailToRemove: string) => {
    setPendingInvites(pendingInvites.filter(i => i.email !== emailToRemove));
  };

  const sendInvites = async () => {
    if (!organization?.id || !user?.id || pendingInvites.length === 0) return;
    
    setSending(true);
    try {
      // Insert invites
      const invites = pendingInvites.map(invite => ({
        email: invite.email,
        role: invite.role,
        org_id: organization.id,
        invited_by: user.id,
      }));

      const { error } = await supabase
        .from('org_invites')
        .insert(invites);

      if (error) throw error;

      // Add each invited member to CRM contacts and create team_member records
      for (const invite of pendingInvites) {
        const displayName = invite.email.split('@')[0].replace(/[._-]/g, ' ');
        
        // Check if contact already exists
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('org_id', organization.id)
          .eq('email', invite.email)
          .maybeSingle();

        let contactId = existingContact?.id;

        if (!existingContact) {
          // Create contact
          const { data: newContact, error: contactError } = await supabase
            .from('contacts')
            .insert({
              org_id: organization.id,
              name: displayName,
              email: invite.email,
              role: invite.role,
              notes: 'Added via team invite',
            })
            .select('id')
            .single();

          if (contactError) {
            console.error('Error creating contact:', contactError);
          } else {
            contactId = newContact.id;
          }
        }

        // Create team_member record so they can be assigned to projects
        if (contactId) {
          const { data: existingTeamMember } = await supabase
            .from('team_members')
            .select('id')
            .eq('org_id', organization.id)
            .eq('contact_id', contactId)
            .maybeSingle();

          if (!existingTeamMember) {
            await supabase
              .from('team_members')
              .insert({
                org_id: organization.id,
                contact_id: contactId,
                capacity: 40,
              });
          }
        }
      }

      // Refresh the shared team members list
      await loadTeamMembers();

      toast({ 
        title: `${pendingInvites.length} invite(s) created!`,
        description: 'Team members are now available for project assignment.',
      });
      
      setPendingInvites([]);
      onComplete();
    } catch (error: any) {
      toast({
        title: 'Error sending invites',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const skipWithoutInvites = () => {
    onComplete();
  };

  const getRoleBadgeColor = (role: AppRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-500';
      case 'manager': return 'bg-blue-500';
      case 'member': return 'bg-green-500';
      case 'viewer': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted">
        <Users className="h-10 w-10 text-primary shrink-0 mt-1" />
        <div>
          <h3 className="font-medium">Invite your team</h3>
          <p className="text-sm text-muted-foreground">
            Add team members who will collaborate with you. They'll receive access when they sign up with their invited email.
          </p>
        </div>
      </div>

      {/* Add invite form */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Label htmlFor="email" className="sr-only">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            onKeyDown={(e) => e.key === 'Enter' && addToList()}
          />
        </div>
        <div className="w-full sm:w-32">
          <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
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
        <Button onClick={addToList} variant="secondary">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Pending invites list */}
      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Invites to send ({pendingInvites.length})
          </Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pendingInvites.map((invite) => (
              <div 
                key={invite.email}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{invite.email}</span>
                  <Badge className={`${getRoleBadgeColor(invite.role)} text-white text-xs`}>
                    {invite.role}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromList(invite.email)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          You can always invite more people later from Settings
        </p>
        <div className="flex gap-2">
          {pendingInvites.length === 0 && !isComplete && (
            <Button variant="outline" onClick={skipWithoutInvites}>
              Skip for now
            </Button>
          )}
          {pendingInvites.length > 0 && (
            <Button onClick={sendInvites} disabled={sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Send {pendingInvites.length} Invite{pendingInvites.length > 1 ? 's' : ''}
            </Button>
          )}
          {isComplete && pendingInvites.length === 0 && (
            <Badge variant="outline" className="text-green-600">
              <Check className="h-3 w-3 mr-1" /> Complete
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
