import { supabase } from '@/integrations/supabase/client';

export interface StreamCredentials {
  token: string;
  apiKey: string;
  userId: string;
  userName: string;
  userImage?: string;
}

export async function getStreamToken(type: 'chat' | 'video' | 'feed' = 'chat'): Promise<StreamCredentials> {
  const { data, error } = await supabase.functions.invoke('stream-token', {
    body: { type },
  });

  if (error) {
    console.error('Failed to get Stream token:', error);
    throw new Error('Failed to authenticate with Stream');
  }

  return data as StreamCredentials;
}
