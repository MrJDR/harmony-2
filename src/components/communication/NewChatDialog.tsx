import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Users, MessageSquare, Loader2, X } from 'lucide-react';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useStreamChat } from '@/hooks/useStreamChat';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelCreated: (channelId: string) => void;
}

export function NewChatDialog({ open, onOpenChange, onChannelCreated }: NewChatDialogProps) {
  const { data: rawTeamMembers = [] } = useTeamMembers();
  const { createDirectChannel, createGroupChannel } = useStreamChat();
  const { toast } = useToast();
  
  // Transform raw team members to have consistent shape
  const teamMembers = useMemo(() => {
    return rawTeamMembers.map(member => ({
      id: member.id,
      name: member.contacts?.name || 'Unknown',
      email: member.contacts?.email || '',
      role: member.contacts?.role || '',
      avatarUrl: member.contacts?.avatar_url || '',
    }));
  }, [rawTeamMembers]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return teamMembers;
    const query = searchQuery.toLowerCase();
    return teamMembers.filter(member => 
      member.name.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query)
    );
  }, [teamMembers, searchQuery]);

  const selectedMembers = useMemo(() => {
    return teamMembers.filter(m => selectedIds.includes(m.id));
  }, [teamMembers, selectedIds]);

  const handleToggleMember = (memberId: string) => {
    setSelectedIds(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleRemoveMember = (memberId: string) => {
    setSelectedIds(prev => prev.filter(id => id !== memberId));
  };

  const handleCreateChat = async () => {
    if (selectedIds.length === 0) return;

    setIsCreating(true);
    try {
      if (selectedIds.length === 1) {
        // Direct message
        const member = teamMembers.find(m => m.id === selectedIds[0]);
        const channel = await createDirectChannel(selectedIds[0], member?.name);
        onChannelCreated(channel.id!);
      } else {
        // Group chat
        const channelId = `group-${Date.now()}`;
        const name = groupName.trim() || selectedMembers.map(m => m.name.split(' ')[0]).join(', ');
        const channel = await createGroupChannel(channelId, name, selectedIds);
        onChannelCreated(channel.id!);
      }
      
      toast({
        title: 'Conversation created',
        description: 'Your new conversation is ready.',
      });
      
      // Reset state
      setSearchQuery('');
      setSelectedIds([]);
      setGroupName('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast({
        title: 'Failed to create conversation',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedIds([]);
    setGroupName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Select team members to start a conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected Members */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map(member => (
                <Badge 
                  key={member.id} 
                  variant="secondary" 
                  className="gap-1 pr-1"
                >
                  {member.name}
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Group Name (for multiple selections) */}
          {selectedIds.length > 1 && (
            <Input
              placeholder="Group name (optional)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          )}

          {/* Member List */}
          <ScrollArea className="h-64 border rounded-lg">
            {filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No team members found</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredMembers.map(member => {
                  const isSelected = selectedIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      onClick={() => handleToggleMember(member.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left',
                        isSelected ? 'bg-accent' : 'hover:bg-muted'
                      )}
                    >
                      <Checkbox checked={isSelected} className="pointer-events-none" />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatarUrl} />
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{member.name}</p>
                        {member.role && (
                          <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateChat}
              disabled={selectedIds.length === 0 || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start Chat
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
