import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, Clock, Users, FolderKanban, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  icon: typeof Bell;
  enabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

interface ReminderSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  timing: string;
}

export function NotificationSettings() {
  const { toast } = useToast();

  // Notification preferences state
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'task-assigned',
      label: 'Task Assignments',
      description: 'When a task is assigned to you',
      icon: CheckCircle,
      enabled: true,
      emailEnabled: true,
      inAppEnabled: true,
    },
    {
      id: 'task-updated',
      label: 'Task Updates',
      description: 'When tasks you\'re watching are updated',
      icon: FolderKanban,
      enabled: true,
      emailEnabled: false,
      inAppEnabled: true,
    },
    {
      id: 'project-updates',
      label: 'Project Updates',
      description: 'Status changes and milestone updates',
      icon: FolderKanban,
      enabled: true,
      emailEnabled: true,
      inAppEnabled: true,
    },
    {
      id: 'team-mentions',
      label: 'Team Mentions',
      description: 'When someone mentions you in comments',
      icon: Users,
      enabled: true,
      emailEnabled: true,
      inAppEnabled: true,
    },
    {
      id: 'comments',
      label: 'Comments',
      description: 'New comments on tasks you\'re involved in',
      icon: MessageSquare,
      enabled: true,
      emailEnabled: false,
      inAppEnabled: true,
    },
    {
      id: 'overdue-tasks',
      label: 'Overdue Alerts',
      description: 'When your tasks become overdue',
      icon: AlertTriangle,
      enabled: true,
      emailEnabled: true,
      inAppEnabled: true,
    },
  ]);

  // Reminder settings state
  const [reminders, setReminders] = useState<ReminderSetting[]>([
    {
      id: 'due-today',
      label: 'Due Today',
      description: 'Remind me of tasks due today',
      enabled: true,
      timing: 'morning',
    },
    {
      id: 'due-tomorrow',
      label: 'Due Tomorrow',
      description: 'Remind me of tasks due tomorrow',
      enabled: true,
      timing: 'evening',
    },
    {
      id: 'due-week',
      label: 'Weekly Summary',
      description: 'Summary of upcoming tasks for the week',
      enabled: true,
      timing: 'monday',
    },
    {
      id: 'overdue',
      label: 'Overdue Tasks',
      description: 'Daily reminder of overdue tasks',
      enabled: true,
      timing: 'morning',
    },
  ]);

  // Global settings
  const [globalSettings, setGlobalSettings] = useState({
    emailDigest: 'daily',
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    weekendNotifications: true,
  });

  const togglePreference = (id: string, field: 'enabled' | 'emailEnabled' | 'inAppEnabled') => {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.id === id ? { ...pref, [field]: !pref[field] } : pref
      )
    );
  };

  const toggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((reminder) =>
        reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder
      )
    );
  };

  const updateReminderTiming = (id: string, timing: string) => {
    setReminders((prev) =>
      prev.map((reminder) =>
        reminder.id === id ? { ...reminder, timing } : reminder
      )
    );
  };

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your notification preferences have been updated.',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-display text-lg font-semibold text-card-foreground">
          Notification Settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure how and when you receive notifications
        </p>
      </div>

      {/* Global Settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Mail className="h-4 w-4" />
          Email Preferences
        </h3>
        
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Digest Frequency</Label>
              <p className="text-sm text-muted-foreground">How often to receive email summaries</p>
            </div>
            <Select
              value={globalSettings.emailDigest}
              onValueChange={(v) => setGlobalSettings((prev) => ({ ...prev, emailDigest: v }))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">Pause notifications during specific hours</p>
            </div>
            <Switch
              checked={globalSettings.quietHoursEnabled}
              onCheckedChange={(checked) =>
                setGlobalSettings((prev) => ({ ...prev, quietHoursEnabled: checked }))
              }
            />
          </div>

          {globalSettings.quietHoursEnabled && (
            <div className="flex items-center gap-4 pl-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">From</Label>
                <Select
                  value={globalSettings.quietHoursStart}
                  onValueChange={(v) =>
                    setGlobalSettings((prev) => ({ ...prev, quietHoursStart: v }))
                  }
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0') + ':00';
                      return <SelectItem key={hour} value={hour}>{hour}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">To</Label>
                <Select
                  value={globalSettings.quietHoursEnd}
                  onValueChange={(v) =>
                    setGlobalSettings((prev) => ({ ...prev, quietHoursEnd: v }))
                  }
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0') + ':00';
                      return <SelectItem key={hour} value={hour}>{hour}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Weekend Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications on weekends</p>
            </div>
            <Switch
              checked={globalSettings.weekendNotifications}
              onCheckedChange={(checked) =>
                setGlobalSettings((prev) => ({ ...prev, weekendNotifications: checked }))
              }
            />
          </div>
        </div>
      </motion.div>

      {/* Notification Types */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Bell className="h-4 w-4" />
          Notification Types
        </h3>

        <div className="rounded-lg border border-border overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr,80px,80px] gap-4 bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
            <span>Notification</span>
            <span className="text-center">In-App</span>
            <span className="text-center">Email</span>
          </div>

          {/* Rows */}
          {preferences.map((pref, index) => (
            <div
              key={pref.id}
              className={`grid grid-cols-[1fr,80px,80px] gap-4 px-4 py-3 items-center ${
                index !== preferences.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <pref.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.description}</p>
                </div>
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={pref.inAppEnabled}
                  onCheckedChange={() => togglePreference(pref.id, 'inAppEnabled')}
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={pref.emailEnabled}
                  onCheckedChange={() => togglePreference(pref.id, 'emailEnabled')}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Reminder Settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Clock className="h-4 w-4" />
          Task Reminders
        </h3>

        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <Switch
                  checked={reminder.enabled}
                  onCheckedChange={() => toggleReminder(reminder.id)}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{reminder.label}</p>
                  <p className="text-xs text-muted-foreground">{reminder.description}</p>
                </div>
              </div>
              {reminder.enabled && (
                <Select
                  value={reminder.timing}
                  onValueChange={(v) => updateReminderTiming(reminder.id, v)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reminder.id === 'due-week' ? (
                      <>
                        <SelectItem value="monday">Monday AM</SelectItem>
                        <SelectItem value="sunday">Sunday PM</SelectItem>
                        <SelectItem value="friday">Friday PM</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="morning">Morning (8 AM)</SelectItem>
                        <SelectItem value="noon">Noon (12 PM)</SelectItem>
                        <SelectItem value="evening">Evening (6 PM)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave}>Save Notification Settings</Button>
      </div>
    </div>
  );
}
