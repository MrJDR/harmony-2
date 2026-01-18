import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, Trash2, Shield, Loader2, Clock, Check, RefreshCw } from 'lucide-react';

type AppRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

interface Member {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: AppRole;
}

interface Invite {
  id: string;
  email: string;
  role: AppRole;
  token: string;
  created_at: string;
  expires_at: string;
}

const roleLabels: Record<AppRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
  viewer: 'Viewer',
};

const roleColors: Record<AppRole, string> = {
  owner: 'bg-primary/10 text-primary border-primary/20',
  admin: 'bg-info/10 text-info border-info/20',
  manager: 'bg-warning/10 text-warning border-warning/20',
  member: 'bg-secondary text-secondary-foreground',
  viewer: 'bg-muted text-muted-foreground',
};

export function OrgMembersSettings() {
  const { organization, user, userRole } = useAuth();
  const { toast } = useToast();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('member');
  const [inviting, setInviting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);

  const canManageMembers = userRole === 'owner' || userRole === 'admin';

  useEffect(() => {
    if (organization) {
      fetchMembers();
      fetchInvites();
    }
  }, [organization]);

  const fetchMembers = async () => {
    if (!organization) return;

    try {
      // Use profiles_safe view which conditionally exposes email based on viewer's role
      // Admins/managers see all emails, others only see their own email
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles_safe')
        .select('id, email, first_name, last_name, avatar_url')
        .eq('org_id', organization.id);

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('org_id', organization.id);

      if (rolesError) throw rolesError;

      const roleMap = new Map(roles?.map(r => [r.user_id, r.role as AppRole]) || []);

      const membersWithRoles = (profiles || []).map(p => ({
        ...p,
        email: p.email || 'Email hidden', // Show placeholder for hidden emails
        role: roleMap.get(p.id) || 'member',
      }));

      setMembers(membersWithRoles);
    } catch (error) {
      const { logError } = await import('@/lib/logger');
      logError('OrgMembersSettings.fetchMembers', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    if (!organization) return;

    try {
      const { data, error } = await supabase
        .from('org_invites')
        .select('*')
        .eq('org_id', organization.id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      setInvites((data || []).map(i => ({
        id: i.id,
        email: i.email,
        role: i.role as AppRole,
        token: i.token,
        created_at: i.created_at,
        expires_at: i.expires_at,
      })));
    } catch (error) {
      const { logError } = await import('@/lib/logger');
      logError('OrgMembersSettings.fetchInvites', error);
    }
  };

  const handleInvite = async () => {
    if (!organization || !user) return;

    setInviting(true);
    try {
      const emailLower = inviteEmail.toLowerCase().trim();
      
      // 1. Delete any existing invite for this email (expired or not accepted)
      await supabase
        .from('org_invites')
        .delete()
        .eq('org_id', organization.id)
        .eq('email', emailLower);

      // 2. Create the org invite
      const { data: inviteData, error } = await supabase
        .from('org_invites')
        .insert({
          org_id: organization.id,
          email: emailLower,
          role: inviteRole,
          invited_by: user.id,
        })
        .select('token')
        .single();

      if (error) {
        throw error;
      }

      // 3. Send the invite email
      const inviteLink = `${window.location.origin}/auth?invite=${inviteData.token}`;
      const emailBody = `You've been invited to join ${organization.name} as a ${inviteRole}.

Click the link below to accept your invitation and create your account:

${inviteLink}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.`;

      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailLower,
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

      // 4. Also add them to the CRM contacts if not exists
      const namePart = emailLower.split('@')[0];
      const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('org_id', organization.id)
        .eq('email', emailLower)
        .maybeSingle();

      if (!existingContact) {
        await supabase
          .from('contacts')
          .insert({
            org_id: organization.id,
            name: displayName,
            email: emailLower,
            role: inviteRole,
            notes: 'Added via team invite',
          });
      }

      // Show appropriate toast based on email success
      if (hasEmailError) {
        toast({
          title: 'Invite created',
          description: `Invite created for ${inviteEmail} but email could not be sent. They have been added to CRM. You can resend the invite email later.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Invite sent!',
          description: `An invite has been sent to ${inviteEmail}. They have also been added to CRM.`,
        });
      }

      setInviteEmail('');
      setInviteRole('member');
      setInviteDialogOpen(false);
      fetchInvites();
    } catch (error) {
      console.error('Invite error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invite. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('org_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: 'Invite cancelled',
        description: 'The invite has been removed.',
      });

      fetchInvites();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel invite.',
        variant: 'destructive',
      });
    }
  };

  const handleResendInvite = async (invite: Invite) => {
    if (!organization) return;

    setResendingInviteId(invite.id);
    try {
      const inviteLink = `${window.location.origin}/auth?invite=${invite.token}`;
      const emailBody = `You've been invited to join ${organization.name} as a ${invite.role}.

Click the link below to accept your invitation and create your account:

${inviteLink}

This invitation will expire on ${new Date(invite.expires_at).toLocaleDateString()}.

If you didn't expect this invitation, you can safely ignore this email.`;

      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: invite.email,
          subject: `Reminder: You're invited to join ${organization.name}`,
          body: emailBody,
          isInviteEmail: true,
        },
      });

      // Check for errors in both the invoke error and response body
      if (emailError || (emailData && emailData.error)) {
        throw new Error(emailError?.message || emailData?.error || 'Failed to send email');
      }

      toast({
        title: 'Invite resent',
        description: `Invitation email sent to ${invite.email}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend invite email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setResendingInviteId(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToDelete || !organization) return;

    try {
      // Remove role first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', memberToDelete.id)
        .eq('org_id', organization.id);

      // Update profile to remove org_id
      await supabase
        .from('profiles')
        .update({ org_id: null })
        .eq('id', memberToDelete.id);

      toast({
        title: 'Member removed',
        description: `${memberToDelete.email} has been removed from the organization.`,
      });

      setMemberToDelete(null);
      setDeleteDialogOpen(false);
      fetchMembers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove member.',
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = async (memberId: string, newRole: AppRole) => {
    if (!organization) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', memberId)
        .eq('org_id', organization.id);

      if (error) throw error;

      toast({
        title: 'Role updated',
        description: 'Member role has been updated.',
      });

      fetchMembers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update role.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              Manage who has access to {organization?.name}
            </CardDescription>
          </div>
          {canManageMembers && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join {organization?.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
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
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Invite'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback>
                      {(member.first_name?.[0] || '') + (member.last_name?.[0] || member.email[0].toUpperCase())}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {member.first_name && member.last_name
                        ? `${member.first_name} ${member.last_name}`
                        : member.email}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canManageMembers && member.role !== 'owner' && member.id !== user?.id ? (
                    <>
                      <Select
                        value={member.role}
                        onValueChange={(v) => handleRoleChange(member.id, v as AppRole)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setMemberToDelete(member);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Badge variant="outline" className={roleColors[member.role]}>
                      {roleLabels[member.role]}
                    </Badge>
                  )}
                  {member.id === user?.id && (
                    <Badge variant="secondary">You</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Pending Invites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Expires {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={roleColors[invite.role]}>
                      {roleLabels[invite.role]}
                    </Badge>
                    {canManageMembers && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResendInvite(invite)}
                          disabled={resendingInviteId === invite.id}
                          title="Resend invite email"
                        >
                          {resendingInviteId === invite.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteInvite(invite.id)}
                          title="Cancel invite"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {memberToDelete?.email} from {organization?.name}. They will lose access to all organization data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemoveMember}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
