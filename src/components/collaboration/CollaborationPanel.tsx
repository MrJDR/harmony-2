import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Video, Info, MessageSquare, History, Paperclip, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
}

interface ActivityItem {
  id: string;
  type: 'status_change' | 'comment' | 'dependency' | 'assignment' | 'due_date';
  description: string;
  userName: string;
  timestamp: Date;
}

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedBy: string;
  uploadedAt: Date;
}

interface CollaborationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  contextType: 'task' | 'project' | 'program';
  contextId: string;
  participants: Participant[];
  currentUserId?: string;
  onStartVideoCall?: () => void;
  onStartAudioCall?: () => void;
}

// Mock data for demonstration
const mockMessages: Message[] = [
  {
    id: '1',
    userId: 'user-1',
    userName: 'Sarah Chen',
    content: 'Can we discuss the dependencies for this task?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
  },
  {
    id: '2',
    userId: 'user-2',
    userName: 'John Doe',
    content: 'Sure! Task A needs to complete first. I\'ll add it as a blocker.',
    timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 min ago
  },
];

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'status_change',
    description: 'Changed status to "In Progress"',
    userName: 'Sarah Chen',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: '2',
    type: 'dependency',
    description: 'Added dependency: Task A',
    userName: 'John Doe',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
  },
  {
    id: '3',
    type: 'comment',
    description: 'Commented: "Looks good!"',
    userName: 'Mike Wilson',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
  },
];

const mockAttachments: Attachment[] = [
  {
    id: '1',
    name: 'design-specs.pdf',
    size: '2.4 MB',
    type: 'pdf',
    uploadedBy: 'Sarah Chen',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: '2',
    name: 'wireframes.fig',
    size: '5.1 MB',
    type: 'figma',
    uploadedBy: 'John Doe',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
  },
];

export function CollaborationPanel({
  isOpen,
  onClose,
  title,
  contextType,
  contextId,
  participants,
  currentUserId,
  onStartVideoCall,
  onStartAudioCall,
}: CollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState('chat');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    
    // Simulate sending
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      userId: currentUserId || 'current-user',
      userName: 'You',
      content: newMessage.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
    setIsSending(false);
    inputRef.current?.focus();
  }, [newMessage, isSending, currentUserId]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'status_change':
        return '●';
      case 'comment':
        return '💬';
      case 'dependency':
        return '🔗';
      case 'assignment':
        return '👤';
      case 'due_date':
        return '📅';
      default:
        return '●';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:w-96 p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onClose} className="sm:hidden">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <SheetTitle className="text-base font-semibold line-clamp-1">{title}</SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {participants.length} member{participants.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onStartAudioCall && (
                <Button variant="ghost" size="icon" onClick={onStartAudioCall}>
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              {onStartVideoCall && (
                <Button variant="ghost" size="icon" onClick={onStartVideoCall}>
                  <Video className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon">
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="h-10 bg-muted/30 mx-4 mt-2 rounded-lg">
            <TabsTrigger value="chat" className="flex-1 gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 gap-1.5">
              <History className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="files" className="flex-1 gap-1.5">
              <Paperclip className="h-4 w-4" />
              Files
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 flex flex-col m-0 mt-2">
            <ScrollArea className="flex-1 px-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <Send className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium text-foreground text-sm">No messages yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start the conversation
                  </p>
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  {messages.map((msg) => {
                    const isCurrentUser = msg.userId === currentUserId || msg.userName === 'You';
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex gap-2',
                          isCurrentUser && 'flex-row-reverse'
                        )}
                      >
                        {!isCurrentUser && (
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarImage src={msg.userAvatar} />
                            <AvatarFallback className="text-xs">
                              {msg.userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn(
                          'flex flex-col gap-0.5 max-w-[75%]',
                          isCurrentUser && 'items-end'
                        )}>
                          {!isCurrentUser && (
                            <span className="text-xs text-muted-foreground ml-1">
                              {msg.userName}
                            </span>
                          )}
                          <div
                            className={cn(
                              'rounded-2xl px-3 py-2 text-sm',
                              isCurrentUser
                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                : 'bg-muted text-foreground rounded-tl-sm'
                            )}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <span className={cn(
                            'text-[10px] text-muted-foreground mt-0.5',
                            isCurrentUser ? 'mr-1' : 'ml-1'
                          )}>
                            {format(msg.timestamp, 'h:mm a')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 h-9"
                  disabled={isSending}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-9 w-9"
                  disabled={!newMessage.trim() || isSending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="flex-1 m-0 mt-2">
            <ScrollArea className="h-full px-4">
              <div className="space-y-3 py-2">
                {mockActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5 text-sm">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{item.userName}</span>{' '}
                        <span className="text-muted-foreground">{item.description}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="flex-1 m-0 mt-2">
            <ScrollArea className="h-full px-4">
              <div className="space-y-2 py-2">
                {mockAttachments.map((file) => (
                  <div 
                    key={file.id} 
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Paperclip className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.size} • {formatDistanceToNow(file.uploadedAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Upload Button */}
                <Button variant="outline" className="w-full mt-2">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
