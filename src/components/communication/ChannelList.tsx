import { useEffect, useState, useMemo } from 'react';
import { Channel as StreamChannel, Event } from 'stream-chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStream } from '@/contexts/StreamContext';
import { Search, MessageSquare, Users, FolderKanban, Layers, Briefcase, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';

interface ChannelListProps {
  activeChannelId?: string;
  onChannelSelect: (channel: StreamChannel) => void;
  onNewChat?: () => void;
}

function formatChannelTime(date: Date | string | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

function getChannelIcon(channelType: string, channelId?: string) {
  if (channelId?.startsWith('project-')) return FolderKanban;
  if (channelId?.startsWith('program-')) return Layers;
  if (channelId?.startsWith('portfolio-')) return Briefcase;
  if (channelType === 'messaging') return MessageSquare;
  return Users;
}

function getChannelName(channel: StreamChannel): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = channel.data as any;
  if (data?.name) return data.name as string;
  
  // For direct messages, show the other user's name
  if (channel.type === 'messaging') {
    const members = Object.values(channel.state.members || {});
    if (members.length === 2) {
      const otherMember = members.find(m => m.user_id !== channel._client.userID);
      return otherMember?.user?.name || otherMember?.user_id || 'Direct Message';
    }
  }
  
  return channel.id || 'Unknown Channel';
}

export function ChannelList({ activeChannelId, onChannelSelect, onNewChat }: ChannelListProps) {
  const { chatClient, isConnected, isConnecting } = useStream();
  const [channels, setChannels] = useState<StreamChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!chatClient || !isConnected) {
      setIsLoading(false);
      return;
    }

    const loadChannels = async () => {
      setIsLoading(true);
      try {
        // Query all channels the user is a member of
        const filter = { members: { $in: [chatClient.userID!] } };
        const sort = [{ last_message_at: -1 as const }];
        
        const channelResponse = await chatClient.queryChannels(filter, sort, {
          limit: 30,
          watch: true,
          state: true,
        });
        
        setChannels(channelResponse);
      } catch (error) {
        console.error('Failed to load channels:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChannels();

    // Listen for new channels
    const handleChannelEvent = () => {
      loadChannels();
    };

    chatClient.on('channel.created', handleChannelEvent);
    chatClient.on('channel.updated', handleChannelEvent);
    chatClient.on('message.new', handleChannelEvent);

    return () => {
      chatClient.off('channel.created', handleChannelEvent);
      chatClient.off('channel.updated', handleChannelEvent);
      chatClient.off('message.new', handleChannelEvent);
    };
  }, [chatClient, isConnected]);

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    
    const query = searchQuery.toLowerCase();
    return channels.filter(channel => {
      const name = getChannelName(channel).toLowerCase();
      return name.includes(query);
    });
  }, [channels, searchQuery]);

  if (isConnecting) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Connecting to chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and New Chat */}
      <div className="p-3 border-b border-border space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {onNewChat && (
          <Button onClick={onNewChat} variant="outline" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            New Conversation
          </Button>
        )}
      </div>

      {/* Channel List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start a chat from any project, program, or portfolio
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredChannels.map(channel => {
              const Icon = getChannelIcon(channel.type || 'messaging', channel.id);
              const lastMessage = channel.state.messages?.[channel.state.messages.length - 1];
              const unreadCount = channel.countUnread();
              const isActive = activeChannelId === channel.id;
              
              return (
                <button
                  key={channel.cid}
                  onClick={() => onChannelSelect(channel)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left',
                    isActive 
                      ? 'bg-accent text-accent-foreground' 
                      : 'hover:bg-muted'
                  )}
                >
                  <div className="relative shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn(
                        'font-medium truncate',
                        unreadCount > 0 && 'text-foreground'
                      )}>
                        {getChannelName(channel)}
                      </p>
                      {lastMessage?.created_at && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatChannelTime(new Date(lastMessage.created_at as unknown as string))}
                        </span>
                      )}
                    </div>
                    {lastMessage && (
                      <p className={cn(
                        'text-sm truncate mt-0.5',
                        unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                      )}>
                        {lastMessage.text || 'Sent an attachment'}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
