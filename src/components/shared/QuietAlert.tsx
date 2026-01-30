import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface QuietAlertProps {
  children: ReactNode;
  className?: string;
}

/**
 * Calm, single-line alert: information present but not shouting.
 */
export function QuietAlert({ children, className }: QuietAlertProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground',
        className
      )}
    >
      {children}
    </div>
  );
}
