import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Channel as StreamChannel } from 'stream-chat';
import { motion } from 'framer-motion';
import { MessageSquare, Video, Phone } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChannelList } from '@/components/communication/ChannelList';
import { ChatView } from '@/components/communication/ChatView';
import { NewChatDialog } from '@/components/communication/NewChatDialog';
import { useStream } from '@/contexts/StreamContext';
import { useStreamVideo } from '@/hooks/useStreamVideo';
import { cn } from '@/lib/utils';

export default function Messages() {
  const [searchParams] = useSearchParams();
  const { chatClient, isConnected } = useStream();
  const { createCall } = useStreamVideo();
  
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Handle channel from URL params (when navigating from detail pages)
  useEffect(() => {
    const channelId = searchParams.get('channel');
    const channelType = searchParams.get('type');
    
    if (channelId && chatClient && isConnected) {
      const loadChannel = async () => {
        try {
          const channel = chatClient.channel('team', `project-${channelId}`);
          await channel.watch();
          setActiveChannel(channel);
          setShowMobileChat(true);
        } catch (error) {
          console.error('Failed to load channel from URL:', error);
        }
      };
      loadChannel();
    }
  }, [searchParams, chatClient, isConnected]);

  const handleChannelSelect = (channel: StreamChannel) => {
    setActiveChannel(channel);
    setShowMobileChat(true);
  };

  const handleChannelCreated = async (channelId: string) => {
    if (!chatClient) return;
    
    try {
      const channels = await chatClient.queryChannels({ id: channelId });
      if (channels.length > 0) {
        setActiveChannel(channels[0]);
        setShowMobileChat(true);
      }
    } catch (error) {
      console.error('Failed to open created channel:', error);
    }
  };

  const handleStartVideoCall = async () => {
    if (!activeChannel) return;
    const callId = `${activeChannel.id}-video-${Date.now()}`;
    await createCall(callId, 'default');
  };

  const handleStartAudioCall = async () => {
    if (!activeChannel) return;
    const callId = `${activeChannel.id}-audio-${Date.now()}`;
    await createCall(callId, 'audio_room');
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-full flex rounded-xl border border-border bg-card shadow-card overflow-hidden"
        >
          {/* Channel List - Desktop always visible, mobile toggleable */}
          <div className={cn(
            'w-full lg:w-80 border-r border-border flex-shrink-0',
            showMobileChat ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'
          )}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h1 className="font-display text-xl font-bold text-foreground">Messages</h1>
            </div>
            <ChannelList 
              activeChannelId={activeChannel?.id}
              onChannelSelect={handleChannelSelect}
              onNewChat={() => setShowNewChat(true)}
            />
          </div>

          {/* Chat View */}
          <div className={cn(
            'flex-1 flex flex-col',
            !showMobileChat && !activeChannel ? 'hidden lg:flex' : 'flex'
          )}>
            {activeChannel ? (
              <ChatView 
                channel={activeChannel}
                onBack={() => setShowMobileChat(false)}
                onStartVideoCall={handleStartVideoCall}
                onStartAudioCall={handleStartAudioCall}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="rounded-full bg-primary/10 p-6 mb-4">
                  <MessageSquare className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Welcome to Messages
                </h2>
                <p className="text-muted-foreground max-w-sm">
                  Select a conversation or start a new chat to begin messaging your team
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <NewChatDialog 
        open={showNewChat}
        onOpenChange={setShowNewChat}
        onChannelCreated={handleChannelCreated}
      />
    </MainLayout>
  );
}
