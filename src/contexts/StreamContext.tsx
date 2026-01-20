import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { StreamChat, Channel as StreamChannel } from 'stream-chat';
import { useAuth } from '@/contexts/AuthContext';
import { getStreamToken, StreamCredentials } from '@/lib/streamClient';

interface StreamContextType {
  chatClient: StreamChat | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  credentials: StreamCredentials | null;
  reconnect: () => Promise<void>;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export function StreamProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<StreamCredentials | null>(null);

  const connect = useCallback(async () => {
    if (!user?.id || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Get Stream token from edge function
      const creds = await getStreamToken('chat');
      setCredentials(creds);

      // Initialize Stream Chat client
      const client = StreamChat.getInstance(creds.apiKey);

      // Connect user
      await client.connectUser(
        {
          id: creds.userId,
          name: creds.userName,
          image: creds.userImage,
        },
        creds.token
      );

      setChatClient(client);
      setIsConnected(true);
      console.log('Stream Chat connected successfully');
    } catch (err) {
      console.error('Stream connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Stream');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [user?.id, isConnecting]);

  const reconnect = useCallback(async () => {
    if (chatClient) {
      await chatClient.disconnectUser();
      setChatClient(null);
      setIsConnected(false);
    }
    await connect();
  }, [chatClient, connect]);

  useEffect(() => {
    if (user?.id && !chatClient && !isConnecting) {
      connect();
    }

    return () => {
      if (chatClient) {
        chatClient.disconnectUser().catch(console.error);
      }
    };
  }, [user?.id]);

  return (
    <StreamContext.Provider
      value={{
        chatClient,
        isConnected,
        isConnecting,
        error,
        credentials,
        reconnect,
      }}
    >
      {children}
    </StreamContext.Provider>
  );
}

export function useStream() {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error('useStream must be used within StreamProvider');
  }
  return context;
}
