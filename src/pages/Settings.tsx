import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, Globe, Users, Scale, Building2, Bug } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedRolesManager } from '@/components/settings/UnifiedRolesManager';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { AllocationSettings } from '@/components/settings/AllocationSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { LanguageSettings } from '@/components/settings/LanguageSettings';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { OrgGeneralSettings } from '@/components/settings/OrgGeneralSettings';
import { OrgMembersSettings } from '@/components/settings/OrgMembersSettings';
import { RoleSwitcher } from '@/components/permissions/RoleSwitcher';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { useAuth } from '@/contexts/AuthContext';
import { canManageOrgMembers } from '@/domains/permissions/service'; // Org admin check now delegated to permissions domain

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [activeOrgTab, setActiveOrgTab] = useState('general');
  const { userRole } = useAuth();

  // Determine whether user can access organization settings via permissions domain service.
  const isOrgAdmin = canManageOrgMembers(userRole as any);

  return (
    <MainLayout>
      <div className="max-w-4xl space-y-6 sm:space-y-8 overflow-x-hidden">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} data-tour="org-settings">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">Manage your account and preferences</p>
        </motion.div>


        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 w-full justify-start">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Language</span>
            </TabsTrigger>
            {/* Organization tab - requires real admin/owner role (security-sensitive) */}
            {isOrgAdmin && (
              <TabsTrigger value="organization" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Organization</span>
              </TabsTrigger>
            )}
            {/* Roles tab - use real role for security */}
            <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']} useRealRole>
              <TabsTrigger value="roles" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Roles</span>
              </TabsTrigger>
            </PermissionGate>
            {/* Allocation tab - use real role for security */}
            <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']} useRealRole>
              <TabsTrigger value="allocation" className="gap-2">
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">Allocation</span>
              </TabsTrigger>
            </PermissionGate>
            <TabsTrigger value="developer" className="gap-2">
              <Bug className="h-4 w-4" />
              <span className="hidden sm:inline">Developer</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-4 sm:mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card"
            >
              <ProfileSettings />
            </motion.div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-4 sm:mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card"
            >
              <SecuritySettings />
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-4 sm:mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card"
            >
              <NotificationSettings />
            </motion.div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="mt-4 sm:mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card"
            >
              <AppearanceSettings />
            </motion.div>
          </TabsContent>

          {/* Language Tab */}
          <TabsContent value="language" className="mt-4 sm:mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card"
            >
              <LanguageSettings />
            </motion.div>
          </TabsContent>

          {/* Organization Tab */}
          <TabsContent value="organization" className="mt-4 sm:mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4 sm:space-y-6"
            >
              <Tabs value={activeOrgTab} onValueChange={setActiveOrgTab} className="w-full">
                <TabsList className="mb-4 sm:mb-6">
                  <TabsTrigger value="general" className="text-xs sm:text-sm">General</TabsTrigger>
                  <TabsTrigger value="members" className="text-xs sm:text-sm">Members</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                  <OrgGeneralSettings />
                </TabsContent>

                <TabsContent value="members">
                  <OrgMembersSettings />
                </TabsContent>
              </Tabs>
            </motion.div>
          </TabsContent>

          {/* Roles Tab - Unified Manager */}
          <TabsContent value="roles" className="mt-4 sm:mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card"
            >
              <UnifiedRolesManager />
            </motion.div>
          </TabsContent>

          {/* Allocation Settings Tab */}
          <TabsContent value="allocation" className="mt-4 sm:mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card"
            >
              <AllocationSettings />
            </motion.div>
          </TabsContent>

          {/* Developer Tab */}
          <TabsContent value="developer" className="mt-4 sm:mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card"
            >
              <div className="mb-4 sm:mb-6">
                <h2 className="font-display text-base sm:text-lg font-semibold text-card-foreground">Developer Tools</h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Test permissions and debug UI behavior
                </p>
              </div>
              <RoleSwitcher />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
