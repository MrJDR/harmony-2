import { useState } from 'react';
import { MessageSquare, Video, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useStreamChat } from '@/hooks/useStreamChat';
import { useStreamVideo } from '@/hooks/useStreamVideo';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CommunicationButtonProps {
  contextType: 'project' | 'program' | 'portfolio' | 'contact';
  contextId: string;
  contextName: string;
  memberIds?: string[];
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function CommunicationButton({
  contextType,
  contextId,
  contextName,
  memberIds = [],
  className,
  variant = 'outline',
  size = 'default',
}: CommunicationButtonProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createProjectChannel, isConnected } = useStreamChat();
  const { createCall, joinCall } = useStreamVideo();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'text' | 'video' | 'audio' | null>(null);

  const startTextChat = async () => {
    if (!isConnected) {
      toast({
        title: 'Connecting...',
        description: 'Please wait while we connect to chat.',
      });
      return;
    }

    setIsLoading(true);
    setLoadingType('text');
    try {
      const channelId = `${contextType}-${contextId}`;
      await createProjectChannel(contextId, contextName, memberIds);
      
      // Navigate to messages with the channel context
      navigate(`/messages?channel=${channelId}&type=${contextType}`);
      
      toast({
        title: 'Chat started',
        description: `Opening chat for ${contextName}`,
      });
    } catch (error) {
      console.error('Failed to start chat:', error);
      toast({
        title: 'Failed to start chat',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const startVideoCall = async () => {
    setIsLoading(true);
    setLoadingType('video');
    try {
      const callId = `${contextType}-${contextId}-${Date.now()}`;
      await createCall(callId, 'default');
      
      // Navigate to messages with video call context
      navigate(`/messages?call=${callId}&type=video&context=${contextType}&contextId=${contextId}`);
      
      toast({
        title: 'Video call started',
        description: 'Starting video call...',
      });
    } catch (error) {
      console.error('Failed to start video call:', error);
      toast({
        title: 'Failed to start call',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const startAudioCall = async () => {
    setIsLoading(true);
    setLoadingType('audio');
    try {
      const callId = `${contextType}-${contextId}-${Date.now()}`;
      await createCall(callId, 'audio_room');
      
      // Navigate to messages with audio call context
      navigate(`/messages?call=${callId}&type=audio&context=${contextType}&contextId=${contextId}`);
      
      toast({
        title: 'Audio call started',
        description: 'Starting audio call...',
      });
    } catch (error) {
      console.error('Failed to start audio call:', error);
      toast({
        title: 'Failed to start call',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={cn('gap-2', className)} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
          {size !== 'icon' && 'Chat'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Start Communication</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={startTextChat} disabled={loadingType === 'text'}>
          {loadingType === 'text' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="mr-2 h-4 w-4" />
          )}
          Text Chat
        </DropdownMenuItem>
        <DropdownMenuItem onClick={startVideoCall} disabled={loadingType === 'video'}>
          {loadingType === 'video' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Video className="mr-2 h-4 w-4" />
          )}
          Video Call
        </DropdownMenuItem>
        <DropdownMenuItem onClick={startAudioCall} disabled={loadingType === 'audio'}>
          {loadingType === 'audio' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Phone className="mr-2 h-4 w-4" />
          )}
          Audio Call
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
