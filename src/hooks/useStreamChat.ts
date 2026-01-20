import { useState, useCallback } from 'react';
import { Channel as StreamChannel } from 'stream-chat';
import { useStream } from '@/contexts/StreamContext';

export function useStreamChat() {
  const { chatClient, isConnected, credentials } = useStream();
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(null);

  const createDirectChannel = useCallback(async (otherUserId: string, otherUserName?: string) => {
    if (!chatClient || !credentials) {
      throw new Error('Chat client not connected');
    }

    const channel = chatClient.channel('messaging', {
      members: [credentials.userId, otherUserId],
    });

    await channel.create();
    setActiveChannel(channel);
    return channel;
  }, [chatClient, credentials]);

  const createGroupChannel = useCallback(async (
    channelId: string, 
    name: string, 
    memberIds: string[]
  ) => {
    if (!chatClient || !credentials) {
      throw new Error('Chat client not connected');
    }

    const channel = chatClient.channel('team', channelId, {
      members: [...memberIds, credentials.userId],
    });

    await channel.create();
    // Update channel name after creation
    await channel.update({ name } as Record<string, unknown>);
    setActiveChannel(channel);
    return channel;
  }, [chatClient, credentials]);

  const createProjectChannel = useCallback(async (
    projectId: string, 
    projectName: string,
    memberIds: string[]
  ) => {
    if (!chatClient || !credentials) {
      throw new Error('Chat client not connected');
    }

    const channel = chatClient.channel('team', `project-${projectId}`, {
      members: [...memberIds, credentials.userId],
    });

    await channel.create();
    // Update channel name after creation
    await channel.update({ name: `#${projectName}` } as Record<string, unknown>);
    setActiveChannel(channel);
    return channel;
  }, [chatClient, credentials]);

  const getChannel = useCallback(async (channelType: string, channelId: string) => {
    if (!chatClient) {
      throw new Error('Chat client not connected');
    }

    const channel = chatClient.channel(channelType, channelId);
    await channel.watch();
    setActiveChannel(channel);
    return channel;
  }, [chatClient]);

  return {
    chatClient,
    isConnected,
    activeChannel,
    setActiveChannel,
    createDirectChannel,
    createGroupChannel,
    createProjectChannel,
    getChannel,
    userId: credentials?.userId,
  };
}
