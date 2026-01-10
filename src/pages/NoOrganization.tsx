import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Mail, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NoOrganization() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-elevated">
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mx-auto mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-semibold">
              No Organization Yet
            </CardTitle>
            <CardDescription>
              You're signed in as <span className="font-medium text-foreground">{profile?.email}</span>, but you haven't been added to an organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <Mail className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Ask your organization administrator to send you an invite, or wait for them to add you.
              </p>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
