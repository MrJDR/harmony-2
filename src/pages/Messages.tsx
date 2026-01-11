import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Inbox, Send, Archive, Trash2, Plus, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ComposeEmail } from '@/components/email/ComposeEmail';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMessages, useUpdateMessage, useDeleteMessage } from '@/hooks/useMessages';
import { format, isToday, isYesterday } from 'date-fns';

type FolderType = 'inbox' | 'sent' | 'archive' | 'trash';

const folders: { icon: typeof Inbox; label: string; value: FolderType }[] = [
  { icon: Inbox, label: 'Inbox', value: 'inbox' },
  { icon: Send, label: 'Sent', value: 'sent' },
  { icon: Archive, label: 'Archive', value: 'archive' },
  { icon: Trash2, label: 'Trash', value: 'trash' },
];

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMM d');
}

export default function Messages() {
  const [showCompose, setShowCompose] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderType>('sent');
  
  const { data: messages = [], isLoading } = useMessages();
  const updateMessage = useUpdateMessage();
  const deleteMessage = useDeleteMessage();

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => m.folder === selectedFolder);
  }, [messages, selectedFolder]);

  const folderCounts = useMemo(() => {
    const counts: Record<FolderType, number> = { inbox: 0, sent: 0, archive: 0, trash: 0 };
    messages.forEach((m) => {
      if (m.folder in counts) {
        if (m.folder === 'inbox' && !m.read) {
          counts[m.folder as FolderType]++;
        } else if (m.folder !== 'inbox') {
          counts[m.folder as FolderType] = (counts[m.folder as FolderType] || 0);
        }
      }
    });
    // Just count unread for inbox, total for others
    counts.sent = messages.filter(m => m.folder === 'sent').length;
    counts.archive = messages.filter(m => m.folder === 'archive').length;
    counts.trash = messages.filter(m => m.folder === 'trash').length;
    counts.inbox = messages.filter(m => m.folder === 'inbox' && !m.read).length;
    return counts;
  }, [messages]);

  const handleMarkAsRead = (id: string) => {
    updateMessage.mutate({ id, read: true });
  };

  const handleMoveToFolder = (id: string, folder: FolderType) => {
    updateMessage.mutate({ id, folder });
  };

  const handleDelete = (id: string) => {
    const message = messages.find(m => m.id === id);
    if (message?.folder === 'trash') {
      deleteMessage.mutate(id);
    } else {
      handleMoveToFolder(id, 'trash');
    }
  };

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
            <h1 className="font-display text-3xl font-bold text-foreground">Messages</h1>
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
            data-tour="messages-folders"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1"
          >
            {folders.map((folder) => (
              <button
                key={folder.value}
                onClick={() => setSelectedFolder(folder.value)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  selectedFolder === folder.value
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  <folder.icon className="h-4 w-4" />
                  {folder.label}
                </div>
                {folderCounts[folder.value] > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {folderCounts[folder.value]}
                  </span>
                )}
              </button>
            ))}
          </motion.div>

          {/* Message List */}
          <motion.div
            data-tour="messages-list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 rounded-xl border border-border bg-card shadow-card overflow-hidden"
          >
            {isLoading ? (
              <div className="divide-y divide-border">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-4 p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Send className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No messages</p>
                <p className="text-sm">
                  {selectedFolder === 'sent' 
                    ? 'Messages you send will appear here'
                    : `No messages in ${selectedFolder}`
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredMessages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => !message.read && handleMarkAsRead(message.id)}
                    className={cn(
                      'flex cursor-pointer items-start gap-4 p-4 transition-colors hover:bg-muted',
                      !message.read && 'bg-accent/30'
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
                      {(selectedFolder === 'sent' ? message.recipient_name || message.recipient_email : message.sender_name)
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={cn(
                            'font-medium',
                            !message.read ? 'text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {selectedFolder === 'sent' 
                            ? `To: ${message.recipient_name || message.recipient_email}`
                            : message.sender_name
                          }
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(message.created_at)}
                        </span>
                      </div>
                      <p
                        className={cn(
                          'mt-0.5 text-sm',
                          !message.read ? 'font-medium text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {message.subject}
                      </p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {message.body}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Compose Modal */}
        {showCompose && <ComposeEmail onClose={() => setShowCompose(false)} />}
      </div>
    </MainLayout>
  );
}
