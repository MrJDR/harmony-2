import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Empty list or empty filter result. Calm, not loud (masterbook).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center rounded-lg border border-border/60 bg-muted/20',
        className
      )}
    >
      {Icon && (
        <Icon className="h-10 w-10 text-muted-foreground/60 mb-3" aria-hidden />
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
