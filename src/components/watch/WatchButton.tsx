import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWatch, WatchableType } from '@/contexts/WatchContext';
import { cn } from '@/lib/utils';

interface WatchButtonProps {
  id: string;
  type: WatchableType;
  name: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
  showLabel?: boolean;
  className?: string;
}

export function WatchButton({ 
  id, 
  type, 
  name, 
  variant = 'ghost', 
  size = 'sm',
  showLabel = false,
  className 
}: WatchButtonProps) {
  const { isWatching, toggleWatch } = useWatch();
  const watching = isWatching(id, type);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        toggleWatch(id, type, name);
      }}
      className={cn(
        watching && 'text-primary',
        className
      )}
      title={watching ? 'Stop watching' : 'Watch for updates'}
    >
      {watching ? (
        <>
          <EyeOff className="h-4 w-4" />
          {showLabel && <span className="ml-2">Watching</span>}
        </>
      ) : (
        <>
          <Eye className="h-4 w-4" />
          {showLabel && <span className="ml-2">Watch</span>}
        </>
      )}
    </Button>
  );
}
