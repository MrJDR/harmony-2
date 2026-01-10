import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Smartphone, History, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export function SecuritySettings() {
  const { toast } = useToast();
  const [showMagicLinkDialog, setShowMagicLinkDialog] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginNotifications: true,
  });

  const [sessions] = useState<Session[]>([
    {
      id: '1',
      device: 'Chrome on macOS',
      location: 'San Francisco, CA',
      lastActive: 'Now',
      current: true,
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'San Francisco, CA',
      lastActive: '2 hours ago',
      current: false,
    },
    {
      id: '3',
      device: 'Firefox on Windows',
      location: 'New York, NY',
      lastActive: '1 day ago',
      current: false,
    },
  ]);

  const handleSendMagicLink = () => {
    if (!magicLinkEmail || !magicLinkEmail.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
    
    // Mock sending magic link - will be connected to Supabase later
    setMagicLinkSent(true);
    toast({
      title: 'Magic link sent!',
      description: `Check your inbox at ${magicLinkEmail}`,
    });
  };

  const handleToggle2FA = () => {
    setSecuritySettings((prev) => ({
      ...prev,
      twoFactorEnabled: !prev.twoFactorEnabled,
    }));
    toast({
      title: securitySettings.twoFactorEnabled ? '2FA Disabled' : '2FA Enabled',
      description: securitySettings.twoFactorEnabled
        ? 'Two-factor authentication has been disabled.'
        : 'Two-factor authentication has been enabled.',
    });
  };

  const handleRevokeSession = (sessionId: string) => {
    toast({
      title: 'Session revoked',
      description: 'The device has been signed out.',
    });
  };

  const handleRevokeAllSessions = () => {
    toast({
      title: 'All sessions revoked',
      description: 'All other devices have been signed out.',
    });
  };

  const handleCloseMagicLinkDialog = () => {
    setShowMagicLinkDialog(false);
    setMagicLinkSent(false);
    setMagicLinkEmail('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-lg font-semibold text-card-foreground">
          Security Settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account security and authentication
        </p>
      </div>

      {/* Magic Link Authentication */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Magic Link Authentication</CardTitle>
          </div>
          <CardDescription>
            Sign in securely with a link sent to your email — no password needed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Passwordless sign-in</p>
              <p className="text-sm text-muted-foreground">
                Get a secure login link via email
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowMagicLinkDialog(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Send Magic Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Enable 2FA</p>
                <p className="text-sm text-muted-foreground">
                  Use an authenticator app to generate codes
                </p>
              </div>
            </div>
            <Switch
              checked={securitySettings.twoFactorEnabled}
              onCheckedChange={handleToggle2FA}
            />
          </div>
          {securitySettings.twoFactorEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-lg border border-border bg-muted/30 p-4"
            >
              <div className="flex items-center gap-2 text-sm text-success">
                <Shield className="h-4 w-4" />
                Two-factor authentication is enabled
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Login Notifications */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Login Notifications</CardTitle>
          </div>
          <CardDescription>Get notified of new sign-ins to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Email notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive an email when a new device signs in
              </p>
            </div>
            <Switch
              checked={securitySettings.loginNotifications}
              onCheckedChange={(checked) =>
                setSecuritySettings((prev) => ({ ...prev, loginNotifications: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Active Sessions</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleRevokeAllSessions}>
              Sign out all devices
            </Button>
          </div>
          <CardDescription>Manage devices where you're currently signed in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{session.device}</p>
                    {session.current && (
                      <Badge variant="secondary" className="text-xs">Current</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {session.location} · {session.lastActive}
                  </p>
                </div>
              </div>
              {!session.current && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleRevokeSession(session.id)}
                >
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Magic Link Dialog */}
      <Dialog open={showMagicLinkDialog} onOpenChange={handleCloseMagicLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Send Magic Link
            </DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a secure sign-in link.
            </DialogDescription>
          </DialogHeader>
          
          {!magicLinkSent ? (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-link-email">Email Address</Label>
                  <Input
                    id="magic-link-email"
                    type="email"
                    placeholder="you@example.com"
                    value={magicLinkEmail}
                    onChange={(e) => setMagicLinkEmail(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseMagicLinkDialog}>
                  Cancel
                </Button>
                <Button onClick={handleSendMagicLink}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Link
                </Button>
              </DialogFooter>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <Mail className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Check your inbox!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a magic link to <strong>{magicLinkEmail}</strong>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                The link will expire in 10 minutes
              </p>
              <Button className="mt-6" onClick={handleCloseMagicLinkDialog}>
                Done
              </Button>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
