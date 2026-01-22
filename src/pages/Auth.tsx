import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle2, Briefcase, Wand2, Users } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

interface InviteData {
  id: string;
  email: string;
  role: string;
  org_id: string;
  org_name: string;
  expires_at: string;
}

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signUp, refreshProfile } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Invite handling - check URL first, then sessionStorage (persists through email confirmation)
  const urlInviteToken = searchParams.get('invite');
  const storedInviteToken = sessionStorage.getItem('pendingInviteToken');
  const inviteToken = urlInviteToken || storedInviteToken;
  
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Store invite token in sessionStorage so it survives email confirmation redirect
  useEffect(() => {
    if (urlInviteToken) {
      sessionStorage.setItem('pendingInviteToken', urlInviteToken);
    }
  }, [urlInviteToken]);

  // Validate invite token on mount
  useEffect(() => {
    if (inviteToken) {
      validateInviteToken(inviteToken);
    }
  }, [inviteToken]);

  const validateInviteToken = async (token: string) => {
    setInviteLoading(true);
    setInviteError(null);

    try {
      // Fetch invite details - using service role via an edge function would be better,
      // but for now we query directly since the user can see their own invites by email
      const { data: invite, error: inviteErr } = await supabase
        .from('org_invites')
        .select('id, email, role, org_id, expires_at')
        .eq('token', token)
        .is('accepted_at', null)
        .maybeSingle();

      if (inviteErr) {
        setInviteError('Unable to validate invitation. Please try again.');
        setInviteLoading(false);
        return;
      }

      if (!invite) {
        setInviteError('This invitation link is invalid or has already been used.');
        setInviteLoading(false);
        return;
      }

      // Check if expired
      if (new Date(invite.expires_at) < new Date()) {
        setInviteError('This invitation has expired. Please ask your administrator to send a new one.');
        setInviteLoading(false);
        return;
      }

      // Fetch org name
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', invite.org_id)
        .single();

      setInviteData({
        ...invite,
        org_name: org?.name || 'the organization',
      });

      // Pre-fill email and force signup mode
      setEmail(invite.email);
      setIsLogin(false);
    } catch (err) {
      setInviteError('An error occurred while validating the invitation.');
    } finally {
      setInviteLoading(false);
    }
  };

  // Handle redirect after login/signup when there's an invite
  useEffect(() => {
    if (user && !authLoading && inviteData) {
      // User just signed up/in with an invite - accept it
      acceptInvite();
    } else if (user && !authLoading && !inviteToken) {
      navigate('/');
    }
  }, [user, authLoading, inviteData, inviteToken]);

  const acceptInvite = async () => {
    if (!user || !inviteData) return;

    setLoading(true);
    try {
      // 1. Update the invite to mark as accepted
      const { error: acceptError } = await supabase
        .from('org_invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', inviteData.id);

      // Note: This might fail due to RLS, but we continue anyway
      if (acceptError) {
        console.error('Error marking invite as accepted:', acceptError);
      }

      // 2. Update the user's profile with the org_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ org_id: inviteData.org_id })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        setError('Failed to join organization. Please contact support.');
        setLoading(false);
        return;
      }

      // 3. Create user_role entry
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          org_id: inviteData.org_id,
          role: inviteData.role as 'admin' | 'manager' | 'member' | 'viewer',
        });

      if (roleError) {
        console.error('Error creating user role:', roleError);
        // Non-fatal, continue
      }

      // 4. Clear the stored invite token
      sessionStorage.removeItem('pendingInviteToken');

      // 5. Refresh profile to get updated org info
      await refreshProfile();

      setSuccess(`Welcome to ${inviteData.org_name}!`);
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError('An error occurred while joining the organization.');
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else {
            setError(error.message);
          }
        }
      } else {
        const { error } = await signUp(email, password, firstName, lastName);
        if (error) {
          if (error.message.includes('already registered')) {
            setError('This email is already registered. Please sign in instead.');
          } else {
            setError(error.message);
          }
        } else {
          setSuccess('Account created! Please check your email to verify your account.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setError(null);
    setSuccess(null);

    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
      return;
    }

    setMagicLinkLoading(true);

    try {
      const { buildPublicUrl } = await import('@/lib/appUrl');
      const redirectUrl = buildPublicUrl('/');
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Magic link sent! Check your email to sign in.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setMagicLinkLoading(false);
    }
  };

  // Show loading state while validating invite
  if (authLoading || inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          {inviteLoading && (
            <p className="text-muted-foreground mt-4">Validating invitation...</p>
          )}
        </div>
      </div>
    );
  }

  // Show error state for invalid invite
  if (inviteToken && inviteError && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-elevated">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Invalid Invitation</CardTitle>
              <CardDescription>{inviteError}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/auth')} variant="outline">
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

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
            <Briefcase className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Accord</h1>
          <p className="text-muted-foreground mt-2">
            {inviteData ? 'Accept your invitation' : 'Manage your portfolio with ease'}
          </p>
        </div>

        {/* Invite banner */}
        {inviteData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      You're invited to join <span className="text-primary">{inviteData.org_name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      as {inviteData.role.charAt(0).toUpperCase() + inviteData.role.slice(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Card className="shadow-elevated">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center">
              {inviteData ? 'Create your account' : isLogin ? 'Welcome back' : 'Create an account'}
            </CardTitle>
            <CardDescription className="text-center">
              {inviteData
                ? 'Fill in your details to join the team'
                : isLogin
                ? 'Enter your credentials to access your account'
                : 'Fill in your details to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert className="border-success/50 bg-success/10 text-success">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    readOnly={!!inviteData}
                    disabled={!!inviteData}
                  />
                </div>
                {inviteData && (
                  <p className="text-xs text-muted-foreground">
                    This email is linked to your invitation
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                {isLogin && (
                  <div className="text-right">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading || magicLinkLoading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : inviteData ? (
                  'Accept Invitation'
                ) : isLogin ? (
                  'Sign in'
                ) : (
                  'Create account'
                )}
              </Button>

              {isLogin && !inviteData && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleMagicLink}
                    disabled={loading || magicLinkLoading || !email}
                  >
                    {magicLinkLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Sign in with Magic Link
                      </>
                    )}
                  </Button>
                </>
              )}
            </form>

            {!inviteData && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <span className="font-medium text-primary">
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </span>
                </button>
              </div>
            )}

            {inviteData && (
              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                    }}
                    className="text-primary hover:underline"
                  >
                    Sign in instead
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
