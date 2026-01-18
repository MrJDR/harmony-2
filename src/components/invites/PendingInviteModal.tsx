import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, UserPlus, X, Loader2 } from 'lucide-react';

interface PendingInvite {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  org_id: string;
  org_name: string;
  expires_at: string;
}

export function PendingInviteModal() {
  const { user, profile, organization, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [selectedInvite, setSelectedInvite] = useState<PendingInvite | null>(null);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [dismissedInvites, setDismissedInvites] = useState<Set<string>>(new Set());

  // Check for pending invites when user is logged in
  useEffect(() => {
    if (user?.email) {
      checkPendingInvites();
    }
  }, [user?.email]);

  const checkPendingInvites = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      // Fetch pending invites for this user's email
      const { data: invites, error } = await supabase
        .from('org_invites')
        .select('id, email, role, org_id, expires_at')
        .eq('email', user.email.toLowerCase())
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error fetching pending invites:', error);
        return;
      }

      if (!invites || invites.length === 0) {
        setPendingInvites([]);
        return;
      }

      // Fetch org names for each invite
      const orgIds = [...new Set(invites.map(i => i.org_id))];
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds);

      const orgMap = new Map(orgs?.map(o => [o.id, o.name]) || []);

      const invitesWithOrgNames: PendingInvite[] = invites
        .filter(invite => {
          // Filter out invites for the current organization
          if (organization && invite.org_id === organization.id) {
            return false;
          }
          return true;
        })
        .map(invite => ({
          ...invite,
          role: invite.role as PendingInvite['role'],
          org_name: orgMap.get(invite.org_id) || 'Unknown Organization',
        }));

      setPendingInvites(invitesWithOrgNames);

      // Auto-show the first non-dismissed invite
      const firstNonDismissed = invitesWithOrgNames.find(
        inv => !dismissedInvites.has(inv.id)
      );
      if (firstNonDismissed) {
        setSelectedInvite(firstNonDismissed);
      }
    } catch (error) {
      console.error('Error checking pending invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!selectedInvite || !user) return;

    setAccepting(true);
    try {
      // 1. Update the invite to mark as accepted
      const { error: acceptError } = await supabase
        .from('org_invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', selectedInvite.id);

      if (acceptError) {
        console.error('Error marking invite as accepted:', acceptError);
      }

      // 2. Update the user's profile with the new org_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ org_id: selectedInvite.org_id })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        toast({
          title: 'Error',
          description: 'Failed to join organization. Please try again.',
          variant: 'destructive',
        });
        setAccepting(false);
        return;
      }

      // 3. Create user_role entry for the new org
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          org_id: selectedInvite.org_id,
          role: selectedInvite.role,
        });

      if (roleError) {
        console.error('Error creating user role:', roleError);
        // Non-fatal, continue
      }

      // 4. Refresh profile to get updated org info
      await refreshProfile();

      toast({
        title: 'Welcome!',
        description: `You've joined ${selectedInvite.org_name} as ${selectedInvite.role}.`,
      });

      // Remove from pending list and close modal
      setPendingInvites(prev => prev.filter(inv => inv.id !== selectedInvite.id));
      setSelectedInvite(null);

      // Navigate to dashboard to reload with new org context
      navigate('/');
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while joining the organization.',
        variant: 'destructive',
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedInvite) return;

    // Mark as dismissed locally (won't show again this session)
    setDismissedInvites(prev => new Set([...prev, selectedInvite.id]));
    
    // Remove from pending list and close modal
    setPendingInvites(prev => prev.filter(inv => inv.id !== selectedInvite.id));
    setSelectedInvite(null);

    toast({
      title: 'Invite dismissed',
      description: 'You can accept this invite later from the link in your email.',
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
      case 'admin':
        return 'default';
      case 'manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!selectedInvite) return null;

  return (
    <Dialog open={!!selectedInvite} onOpenChange={(open) => !open && handleDecline()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Organization Invite</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            You've been invited to join a new organization.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
            <div className="p-3 rounded-lg bg-background border">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{selectedInvite.org_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">Role:</span>
                <Badge variant={getRoleBadgeVariant(selectedInvite.role)}>
                  {selectedInvite.role.charAt(0).toUpperCase() + selectedInvite.role.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          {organization && (
            <p className="text-sm text-muted-foreground mt-4">
              <span className="font-medium text-amber-500">Note:</span> Accepting this invite will switch you from{' '}
              <span className="font-medium">{organization.name}</span> to{' '}
              <span className="font-medium">{selectedInvite.org_name}</span>.
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={accepting}
            className="sm:flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Decline
          </Button>
          <Button
            onClick={handleAcceptInvite}
            disabled={accepting}
            className="sm:flex-1"
          >
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Join Organization
              </>
            )}
          </Button>
        </DialogFooter>

        {pendingInvites.length > 1 && (
          <p className="text-xs text-center text-muted-foreground">
            You have {pendingInvites.length - 1} more pending invite{pendingInvites.length > 2 ? 's' : ''}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
