import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Loader2, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrgSetupStepProps {
  onComplete: () => void;
  isComplete: boolean;
}

export function OrgSetupStep({ onComplete, isComplete }: OrgSetupStepProps) {
  const { organization, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (organization) {
      setName(organization.name || '');
      setLogoUrl(organization.logo_url || '');
    }
  }, [organization]);

  const handleSave = async () => {
    if (!organization?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: name.trim(),
          logo_url: logoUrl.trim() || null,
        })
        .eq('id', organization.id);

      if (error) throw error;

      await refreshProfile();
      toast({ title: 'Organization updated!' });
      onComplete();
    } catch (error: any) {
      toast({
        title: 'Error updating organization',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
        <Building2 className="h-10 w-10 text-primary shrink-0 mt-1" />
        <div>
          <h3 className="font-medium">Customize your organization</h3>
          <p className="text-sm text-muted-foreground">
            Add your organization's details. This will appear across the app and in email communications.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="orgName">Organization Name</Label>
          <Input
            id="orgName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Corporation"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL (optional)</Label>
          <Input
            id="logoUrl"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
          />
          <p className="text-xs text-muted-foreground">
            Enter a URL to your organization's logo image
          </p>
        </div>

        {logoUrl && (
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <img 
              src={logoUrl} 
              alt="Logo preview" 
              className="h-12 w-12 object-contain rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-sm text-muted-foreground">Logo preview</span>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : isComplete ? (
            <Check className="h-4 w-4 mr-2" />
          ) : null}
          {isComplete ? 'Update' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  );
}
