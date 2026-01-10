import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Building2, AlertCircle, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

export default function AdminSetup() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (value: string) => {
    setOrgName(value);
    setOrgSlug(generateSlug(value));
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged) {
      setError('Please acknowledge the email restriction before continuing.');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmDialog(false);
    if (!user) return;

    setError(null);
    setLoading(true);

    try {
      const { data: org, error: orgError } = await supabase
        .rpc('create_organization_and_assign_owner', {
          _name: orgName.trim(),
          _slug: orgSlug.trim(),
        })
        .single();

      if (orgError) {
        const msg = orgError.message ?? '';

        if (msg.toLowerCase().includes('duplicate key')) {
          setError('An organization with this slug already exists. Please choose a different name.');
          return;
        }

        if (msg.includes('already_in_org')) {
          setError('Your account is already associated with an organization. You must leave it before creating another.');
          return;
        }

        if (msg.includes('profile_missing')) {
          setError('Your user profile is not set up yet. Please sign out and sign back in, then try again.');
          return;
        }

        if (msg.includes('not_authenticated')) {
          setError('You are not signed in. Please sign in again and retry.');
          return;
        }

        setError(orgError.message);
        return;
      }

      toast({
        title: 'Organization created!',
        description: (
          <div className="space-y-1">
            <p><strong>{orgName}</strong> is ready to use.</p>
            <p className="text-xs text-muted-foreground">
              Your email ({profile?.email}) is now tied to this organization.
            </p>
          </div>
        ),
      });

      await refreshProfile();
      navigate('/onboarding');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Admin Setup</h1>
          <p className="text-muted-foreground mt-2">
            Create your organization to get started
          </p>
        </div>

        <Card className="shadow-elevated">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Create Organization
            </CardTitle>
            <CardDescription>
              Set up your organization. You'll be the owner with full admin access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePreSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Restriction Warning */}
              <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <strong>Important:</strong> Your email <span className="font-mono text-sm">{profile?.email}</span> will be permanently tied to this organization. You cannot join or create another organization with this email unless you leave this one.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="Acme Corporation"
                  value={orgName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgSlug">Organization Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">app.portfoliohub.com/</span>
                  <Input
                    id="orgSlug"
                    placeholder="acme-corp"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    required
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This will be used in URLs and must be unique
                </p>
              </div>

              {/* Acknowledgment Checkbox */}
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <Checkbox
                  id="acknowledge"
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked === true)}
                />
                <Label htmlFor="acknowledge" className="text-sm font-normal leading-relaxed cursor-pointer">
                  I understand that my email will be tied to this organization and I cannot use it for another organization until I leave this one.
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !orgName.trim() || !acknowledged}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Create Organization'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Organization Creation
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to create <strong>{orgName}</strong> as a new organization.
              </p>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Final warning:</strong> Your email <span className="font-mono">{profile?.email}</span> will be permanently associated with this organization. You will not be able to join or create another organization with this email unless you leave this one first.
                </p>
              </div>
              <p>Are you sure you want to proceed?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSubmit}>
              Yes, Create Organization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}