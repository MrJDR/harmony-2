import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

export function DeleteOrgDialog() {
  const { organization, refreshProfile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [confirmName, setConfirmName] = useState('');
  const [understandConsequences, setUnderstandConsequences] = useState(false);
  const [finalConfirm, setFinalConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const orgName = organization?.name || '';
  const nameMatches = confirmName.trim().toLowerCase() === orgName.toLowerCase();
  
  const canProceedStep1 = nameMatches;
  const canProceedStep2 = understandConsequences;
  const canDelete = finalConfirm;

  const resetState = () => {
    setStep(1);
    setConfirmName('');
    setUnderstandConsequences(false);
    setFinalConfirm(false);
    setIsDeleting(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetState();
    }
  };

  const handleDelete = async () => {
    if (!organization) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('archive_organization', {
        _org_id: organization.id
      });

      if (error) throw error;

      toast({
        title: 'Organization archived',
        description: 'The organization and all its content have been archived. Members have been removed.',
      });

      await refreshProfile();
      setIsOpen(false);
      navigate('/');
    } catch (error: any) {
      console.error('Archive error:', error);
      toast({
        title: 'Error',
        description: error.message === 'not_owner' 
          ? 'Only organization owners can delete the organization.'
          : 'Failed to archive organization. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Delete Organization
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Organization
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action will archive the organization and remove all members. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">Step 1 of 3: Confirm Organization Name</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Type <span className="font-semibold text-foreground">"{orgName}"</span> to confirm you want to delete this organization.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-name">Organization Name</Label>
              <Input
                id="confirm-name"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder="Enter organization name"
                className={nameMatches ? 'border-green-500 focus-visible:ring-green-500' : ''}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">Step 2 of 3: Understand Consequences</p>
            </div>
            <div className="space-y-3 text-sm">
              <p className="font-medium">By deleting this organization:</p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>All organization content will be <span className="font-semibold text-foreground">archived</span></li>
                <li>All members will be <span className="font-semibold text-foreground">removed from the organization</span></li>
                <li>Member profiles will <span className="font-semibold text-foreground">remain intact</span> but without org access</li>
                <li>All pending invitations will be <span className="font-semibold text-foreground">cancelled</span></li>
                <li>This action <span className="font-semibold text-destructive">cannot be undone</span></li>
              </ul>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="understand"
                checked={understandConsequences}
                onCheckedChange={(checked) => setUnderstandConsequences(checked === true)}
              />
              <Label htmlFor="understand" className="text-sm cursor-pointer">
                I understand the consequences of this action
              </Label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">Step 3 of 3: Final Confirmation</p>
            </div>
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4">
              <p className="text-sm text-destructive font-medium">
                ⚠️ This is your final warning
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                You are about to permanently archive <span className="font-semibold text-foreground">"{orgName}"</span>. 
                All {organization?.name} data will be archived and all members will lose access.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="final-confirm"
                checked={finalConfirm}
                onCheckedChange={(checked) => setFinalConfirm(checked === true)}
              />
              <Label htmlFor="final-confirm" className="text-sm cursor-pointer text-destructive font-medium">
                Yes, permanently delete this organization
              </Label>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          
          {step === 1 && (
            <Button 
              onClick={() => setStep(2)} 
              disabled={!canProceedStep1}
              variant="destructive"
            >
              Continue
            </Button>
          )}
          
          {step === 2 && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                disabled={!canProceedStep2}
                variant="destructive"
              >
                Continue
              </Button>
            </div>
          )}
          
          {step === 3 && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} disabled={isDeleting}>
                Back
              </Button>
              <Button 
                onClick={handleDelete}
                disabled={!canDelete || isDeleting}
                variant="destructive"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Archiving...
                  </>
                ) : (
                  'Delete Organization'
                )}
              </Button>
            </div>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
