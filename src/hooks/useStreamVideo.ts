import { useState, useCallback } from 'react';
import { StreamVideoClient, Call } from '@stream-io/video-react-sdk';
import { getStreamToken } from '@/lib/streamClient';
import { useAuth } from '@/contexts/AuthContext';

export function useStreamVideo() {
  const { user } = useAuth();
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const initializeVideo = useCallback(async () => {
    if (!user?.id || isConnecting) return null;

    setIsConnecting(true);
    try {
      const credentials = await getStreamToken('video');
      
      const client = new StreamVideoClient({
        apiKey: credentials.apiKey,
        user: {
          id: credentials.userId,
          name: credentials.userName,
          image: credentials.userImage,
        },
        token: credentials.token,
      });

      setVideoClient(client);
      return client;
    } catch (error) {
      console.error('Failed to initialize video client:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [user?.id, isConnecting]);

  const createCall = useCallback(async (callId: string, callType: 'default' | 'audio_room' = 'default') => {
    let client = videoClient;
    
    if (!client) {
      client = await initializeVideo();
    }

    if (!client) {
      throw new Error('Video client not initialized');
    }

    const call = client.call(callType, callId);
    await call.getOrCreate();
    setActiveCall(call);
    return call;
  }, [videoClient, initializeVideo]);

  const joinCall = useCallback(async (callId: string, callType: 'default' | 'audio_room' = 'default') => {
    let client = videoClient;
    
    if (!client) {
      client = await initializeVideo();
    }

    if (!client) {
      throw new Error('Video client not initialized');
    }

    const call = client.call(callType, callId);
    await call.join({ create: true });
    setActiveCall(call);
    return call;
  }, [videoClient, initializeVideo]);

  const leaveCall = useCallback(async () => {
    if (activeCall) {
      await activeCall.leave();
      setActiveCall(null);
    }
  }, [activeCall]);

  const endCall = useCallback(async () => {
    if (activeCall) {
      await activeCall.endCall();
      setActiveCall(null);
    }
  }, [activeCall]);

  return {
    videoClient,
    activeCall,
    isConnecting,
    initializeVideo,
    createCall,
    joinCall,
    leaveCall,
    endCall,
  };
}
