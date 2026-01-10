import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2, AlertTriangle } from 'lucide-react';
import { DeleteOrgDialog } from './DeleteOrgDialog';

export function OrgGeneralSettings() {
  const { organization, userRole, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState(organization?.name || '');
  const [logoUrl, setLogoUrl] = useState(organization?.logo_url || '');
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const canEdit = userRole === 'owner' || userRole === 'admin';
  const isOwner = userRole === 'owner';

  const handleSave = async () => {
    if (!organization) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: name.trim(),
          logo_url: logoUrl || null,
        })
        .eq('id', organization.id);

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Organization settings have been updated.',
      });

      setIsDirty(false);
      await refreshProfile();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Details
          </CardTitle>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={logoUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {name?.[0]?.toUpperCase() || 'O'}
              </AvatarFallback>
            </Avatar>
            {canEdit && (
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="logoUrl"
                    placeholder="https://example.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => {
                      setLogoUrl(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-80"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter a URL for your organization's logo
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setIsDirty(true);
              }}
              disabled={!canEdit}
              className="max-w-md"
            />
          </div>

          <div className="space-y-2">
            <Label>Organization Slug</Label>
            <Input
              value={organization?.slug || ''}
              disabled
              className="max-w-md bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              The slug cannot be changed after creation
            </p>
          </div>

          {canEdit && (
            <div className="pt-4 border-t">
              <Button onClick={handleSave} disabled={saving || !isDirty}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone - Owner Only */}
      {isOwner && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect your entire organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <div>
                <p className="font-medium">Delete this organization</p>
                <p className="text-sm text-muted-foreground">
                  Archives all content and removes all members. This cannot be undone.
                </p>
              </div>
              <DeleteOrgDialog />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
