import { useState } from 'react';
import { Loader2, UserPlus, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

type AppRole = 'admin' | 'manager' | 'member' | 'viewer';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (email: string, role: AppRole) => void;
  title?: string;
  description?: string;
  defaultRole?: AppRole;
  showRoleSelect?: boolean;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  onSuccess,
  title = 'Invite Team Member',
  description,
  defaultRole = 'member',
  showRoleSelect = true,
}: InviteMemberDialogProps) {
  const { organization, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppRole>(defaultRole);
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!organization || !user || !email.trim()) return;

    setInviting(true);
    try {
      const emailLower = email.toLowerCase().trim();

      // 1. Delete any existing invite for this email (allows re-inviting)
      await supabase
        .from('org_invites')
        .delete()
        .eq('org_id', organization.id)
        .eq('email', emailLower);

      // 2. Create the org invite
      const { data: inviteData, error: inviteError } = await supabase
        .from('org_invites')
        .insert({
          org_id: organization.id,
          email: emailLower,
          role: role,
          invited_by: user.id,
        })
        .select('token')
        .single();

      if (inviteError) {
        throw inviteError;
      }

      // 2. Send the invite email
      const { buildPublicUrl } = await import('@/lib/appUrl');
      const inviteLink = buildPublicUrl(`/auth?invite=${inviteData.token}`);
      const emailBody = `You've been invited to join ${organization.name} as a ${role}.

Click the link below to accept your invitation and create your account:

${inviteLink}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.`;

      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: email.toLowerCase().trim(),
          subject: `You're invited to join ${organization.name}`,
          body: emailBody,
          isInviteEmail: true,
        },
      });

      // Check for errors in both the invoke error and response body
      const hasEmailError = emailError || (emailData && emailData.error);
      if (hasEmailError) {
        console.error('Failed to send invite email:', emailError || emailData?.error);
      }

      // 3. Also add them to the CRM contacts
      const namePart = emailLower.split('@')[0];
      // Capitalize first letter
      const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

      // Check if contact already exists
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('org_id', organization.id)
        .eq('email', emailLower)
        .maybeSingle();

      let contactId: string;

      if (!existingContact) {
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            org_id: organization.id,
            name: displayName,
            email: emailLower,
            role: role,
            notes: 'Added via team invite',
          })
          .select('id')
          .single();
        
        if (contactError) throw contactError;
        contactId = newContact.id;
      } else {
        contactId = existingContact.id;
      }

      // 3. Create team_member record if it doesn't exist
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
            capacity: 40, // Default capacity
          });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['team_members'] });

      // Show appropriate toast based on email success
      if (hasEmailError) {
        toast({
          title: 'Invite created',
          description: `Invite created for ${email} but email could not be sent. They have been added to your CRM and Resources. You can resend the invite email later.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Invite sent!',
          description: `An invite has been sent to ${email}. They have been added to your CRM and Resources.`,
        });
      }

      onSuccess?.(email, role);
      setEmail('');
      setRole(defaultRole);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invite. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description || `Send an invitation to join ${organization?.name || 'your organization'}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {showRoleSelect && (
            <div className="space-y-2">
              <Label>Role</Label>
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
              <p className="text-xs text-muted-foreground">
                {role === 'admin' && 'Full access to organization settings and team management'}
                {role === 'manager' && 'Can manage projects, programs, and team assignments'}
                {role === 'member' && 'Can work on assigned projects and tasks'}
                {role === 'viewer' && 'Read-only access to assigned projects'}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={inviting || !email.trim()}>
            {inviting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Invite'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
