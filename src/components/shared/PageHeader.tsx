import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  className?: string;
}

/**
 * Page-level header: one h1 and optional description. Aligns with masterbook (one h1 per page).
 */
export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <header className={cn('flex-shrink-0 border-b border-border/80 px-4 py-3', className)}>
      <h1 className="text-xl font-semibold text-foreground tracking-tight font-[family-name:var(--font-outfit)]">
        {title}
      </h1>
      {description != null && (
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      )}
    </header>
  );
}
