import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CollaborationPanel } from './CollaborationPanel';

interface CollaborationButtonProps {
  title: string;
  contextType: 'task' | 'project' | 'program';
  contextId: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  currentUserId?: string;
  onStartVideoCall?: () => void;
  onStartAudioCall?: () => void;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
  showLabel?: boolean;
}

export function CollaborationButton({
  title,
  contextType,
  contextId,
  participants,
  currentUserId,
  onStartVideoCall,
  onStartAudioCall,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
}: CollaborationButtonProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      <Button 
        variant={variant} 
        size={size}
        onClick={() => setIsPanelOpen(true)}
        className="gap-1.5"
      >
        <MessageSquare className="h-4 w-4" />
        {showLabel && <span>Collaborate</span>}
      </Button>
      
      <CollaborationPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={title}
        contextType={contextType}
        contextId={contextId}
        participants={participants}
        currentUserId={currentUserId}
        onStartVideoCall={onStartVideoCall}
        onStartAudioCall={onStartAudioCall}
      />
    </>
  );
}
