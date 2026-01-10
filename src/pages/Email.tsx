import { useState } from 'react';
import { motion } from 'framer-motion';
import { Inbox, Send, Archive, Trash2, Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ComposeEmail } from '@/components/email/ComposeEmail';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const mockEmails = [
  {
    id: 1,
    from: 'Sarah Chen',
    email: 'sarah@acmecorp.com',
    subject: 'Project Update - Mobile App Redesign',
    preview: 'Hi team, I wanted to share some updates on the mobile app redesign project...',
    time: '10:30 AM',
    unread: true,
  },
  {
    id: 2,
    from: 'Marcus Johnson',
    email: 'marcus@techflow.io',
    subject: 'API Gateway Integration Questions',
    preview: 'Hey, I had a few questions about the API gateway integration we discussed...',
    time: '9:15 AM',
    unread: true,
  },
  {
    id: 3,
    from: 'Emily Rodriguez',
    email: 'emily@innovate.co',
    subject: 'Meeting Follow-up',
    preview: 'Thanks for the productive meeting yesterday. As discussed, here are the next steps...',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 4,
    from: 'David Kim',
    email: 'david@startup.io',
    subject: 'Partnership Proposal',
    preview: 'I hope this email finds you well. We would like to propose a potential partnership...',
    time: 'Yesterday',
    unread: false,
  },
];

const folders = [
  { icon: Inbox, label: 'Inbox', count: 2 },
  { icon: Send, label: 'Sent', count: 0 },
  { icon: Archive, label: 'Archive', count: 0 },
  { icon: Trash2, label: 'Trash', count: 0 },
];

export default function Email() {
  const [showCompose, setShowCompose] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('Inbox');

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Email</h1>
            <p className="mt-1 text-muted-foreground">Manage your communications</p>
          </div>
          <Button onClick={() => setShowCompose(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Compose
          </Button>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <motion.div
            data-tour="email-folders"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1"
          >
            {folders.map((folder) => (
              <button
                key={folder.label}
                onClick={() => setSelectedFolder(folder.label)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  selectedFolder === folder.label
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  <folder.icon className="h-4 w-4" />
                  {folder.label}
                </div>
                {folder.count > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {folder.count}
                  </span>
                )}
              </button>
            ))}
          </motion.div>

          {/* Email List */}
          <motion.div
            data-tour="email-list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 rounded-xl border border-border bg-card shadow-card overflow-hidden"
          >
            <div className="divide-y divide-border">
              {mockEmails.map((email, index) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'flex cursor-pointer items-start gap-4 p-4 transition-colors hover:bg-muted/50',
                    email.unread && 'bg-accent/30'
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
                    {email.from
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={cn(
                          'font-medium',
                          email.unread ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {email.from}
                      </p>
                      <span className="text-xs text-muted-foreground">{email.time}</span>
                    </div>
                    <p
                      className={cn(
                        'mt-0.5 text-sm',
                        email.unread ? 'font-medium text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {email.subject}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{email.preview}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Compose Modal */}
        {showCompose && <ComposeEmail onClose={() => setShowCompose(false)} />}
      </div>
    </MainLayout>
  );
}
