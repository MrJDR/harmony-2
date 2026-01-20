import { useState, useEffect, useRef, useCallback } from 'react';
import { Channel as StreamChannel, Event, MessageResponse } from 'stream-chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  ArrowLeft,
  Smile,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { useStream } from '@/contexts/StreamContext';

interface ChatViewProps {
  channel: StreamChannel;
  onBack?: () => void;
  onStartVideoCall?: () => void;
  onStartAudioCall?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMessage = any;

interface MessageGroup {
  userId: string;
  userName: string;
  userImage?: string;
  messages: AnyMessage[];
  timestamp: Date;
}

function formatMessageDate(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

function formatMessageTime(date: Date): string {
  return format(date, 'h:mm a');
}

function getChannelName(channel: StreamChannel): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = channel.data as any;
  if (data?.name) return data.name as string;
  
  if (channel.type === 'messaging') {
    const members = Object.values(channel.state.members || {});
    if (members.length === 2) {
      const otherMember = members.find(m => m.user_id !== channel._client.userID);
      return otherMember?.user?.name || otherMember?.user_id || 'Direct Message';
    }
  }
  
  return channel.id || 'Unknown Channel';
}

function groupMessages(messages: AnyMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  
  messages.forEach((msg) => {
    const lastGroup = groups[groups.length - 1];
    const msgDate = new Date(msg.created_at as string);
    
    if (
      lastGroup &&
      lastGroup.userId === msg.user?.id &&
      msgDate.getTime() - lastGroup.timestamp.getTime() < 5 * 60 * 1000 // 5 minutes
    ) {
      lastGroup.messages.push(msg);
    } else {
      groups.push({
        userId: msg.user?.id || '',
        userName: msg.user?.name || msg.user?.id || 'Unknown',
        userImage: msg.user?.image,
        messages: [msg],
        timestamp: msgDate,
      });
    }
  });
  
  return groups;
}

export function ChatView({ channel, onBack, onStartVideoCall, onStartAudioCall }: ChatViewProps) {
  const { credentials } = useStream();
  const [messages, setMessages] = useState<AnyMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (!channel) return;

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        await channel.watch();
        setMessages(channel.state.messages || []);
        // Mark as read
        channel.markRead();
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    // Listen for new messages
    const handleNewMessage = (event: Event) => {
      if (event.message) {
        setMessages(prev => [...prev, event.message]);
        channel.markRead();
      }
    };

    channel.on('message.new', handleNewMessage);

    return () => {
      channel.off('message.new', handleNewMessage);
    };
  }, [channel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await channel.sendMessage({ text: newMessage.trim() });
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const messageGroups = groupMessages(messages);
  const memberCount = Object.keys(channel.state.members || {}).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="font-semibold text-foreground">{getChannelName(channel)}</h2>
            <p className="text-xs text-muted-foreground">
              {memberCount} member{memberCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onStartAudioCall && (
            <Button variant="ghost" size="icon" onClick={onStartAudioCall}>
              <Phone className="h-5 w-5" />
            </Button>
          )}
          {onStartVideoCall && (
            <Button variant="ghost" size="icon" onClick={onStartVideoCall}>
              <Video className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon">
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-64 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Send className="h-8 w-8 text-primary" />
            </div>
            <p className="font-medium text-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {messageGroups.map((group, groupIndex) => {
              const showDateDivider = groupIndex === 0 || 
                !isSameDay(group.timestamp, messageGroups[groupIndex - 1].timestamp);
              const isCurrentUser = group.userId === credentials?.userId;

              return (
                <div key={`${group.userId}-${group.timestamp.getTime()}`}>
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                        {formatMessageDate(group.timestamp)}
                      </div>
                    </div>
                  )}
                  
                  <div className={cn(
                    'flex gap-3',
                    isCurrentUser && 'flex-row-reverse'
                  )}>
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={group.userImage} />
                        <AvatarFallback className="text-xs">
                          {group.userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={cn(
                      'flex flex-col gap-1 max-w-[70%]',
                      isCurrentUser && 'items-end'
                    )}>
                      {!isCurrentUser && (
                        <span className="text-xs text-muted-foreground ml-1">
                          {group.userName}
                        </span>
                      )}
                      
                      {group.messages.map((msg, msgIndex) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'rounded-2xl px-4 py-2 max-w-full break-words',
                            isCurrentUser
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-muted text-foreground rounded-tl-sm'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      ))}
                      
                      <span className={cn(
                        'text-xs text-muted-foreground mt-0.5',
                        isCurrentUser ? 'mr-1' : 'ml-1'
                      )}>
                        {formatMessageTime(group.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-background">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="shrink-0">
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isSending}
          />
          <Button type="button" variant="ghost" size="icon" className="shrink-0">
            <Smile className="h-5 w-5" />
          </Button>
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim() || isSending}
            className="shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
