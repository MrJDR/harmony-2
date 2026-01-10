import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, Globe, Users, Scale } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrgPermissions } from '@/components/settings/OrgPermissions';
import { PortfolioPermissions } from '@/components/settings/PortfolioPermissions';
import { ProgramPermissions } from '@/components/settings/ProgramPermissions';
import { ProjectPermissions } from '@/components/settings/ProjectPermissions';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { AllocationSettings } from '@/components/settings/AllocationSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { LanguageSettings } from '@/components/settings/LanguageSettings';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { RoleSwitcher } from '@/components/permissions/RoleSwitcher';
import { PermissionGate } from '@/components/permissions/PermissionGate';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [activeRoleTab, setActiveRoleTab] = useState('org');

  return (
    <MainLayout>
      <div className="max-w-4xl space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted-foreground">Manage your account and preferences</p>
        </motion.div>

        {/* Role Switcher for Testing */}
        <RoleSwitcher />

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
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
            <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
              <TabsTrigger value="roles" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Roles</span>
              </TabsTrigger>
            </PermissionGate>
            <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
              <TabsTrigger value="allocation" className="gap-2">
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">Allocation</span>
              </TabsTrigger>
            </PermissionGate>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <ProfileSettings />
            </motion.div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <SecuritySettings />
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <NotificationSettings />
            </motion.div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <AppearanceSettings />
            </motion.div>
          </TabsContent>

          {/* Language Tab */}
          <TabsContent value="language" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <LanguageSettings />
            </motion.div>
          </TabsContent>

          {/* Roles Tab with Sub-tabs */}
          <TabsContent value="roles" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <div className="mb-6">
                <h2 className="font-display text-lg font-semibold text-card-foreground">Role Permissions</h2>
                <p className="mt-1 text-sm text-muted-foreground">Configure permissions for different role types</p>
              </div>
              
              <Tabs value={activeRoleTab} onValueChange={setActiveRoleTab} className="w-full">
                <TabsList className="w-full justify-start mb-6">
                  <PermissionGate allowedOrgRoles={['owner', 'admin']}>
                    <TabsTrigger value="org">Organization</TabsTrigger>
                  </PermissionGate>
                  <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                  <TabsTrigger value="program">Program</TabsTrigger>
                  <TabsTrigger value="project">Project</TabsTrigger>
                </TabsList>

                <TabsContent value="org">
                  <OrgPermissions />
                </TabsContent>

                <TabsContent value="portfolio">
                  <PortfolioPermissions />
                </TabsContent>

                <TabsContent value="program">
                  <ProgramPermissions />
                </TabsContent>

                <TabsContent value="project">
                  <ProjectPermissions />
                </TabsContent>
              </Tabs>
            </motion.div>
          </TabsContent>

          {/* Allocation Settings Tab */}
          <TabsContent value="allocation" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <AllocationSettings />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}