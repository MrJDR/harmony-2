import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a section with optional title. Calm border/background per masterbook.
 */
export function PageSection({ title, children, className }: PageSectionProps) {
  return (
    <section
      className={cn(
        'rounded-lg border border-border/80 bg-card overflow-hidden',
        className
      )}
      aria-labelledby={title ? 'section-title' : undefined}
    >
      {title && (
        <div className="border-b border-border/80 px-4 py-2.5">
          <h2 id="section-title" className="text-sm font-medium text-foreground">
            {title}
          </h2>
        </div>
      )}
      <div className={title ? 'p-4' : 'p-4'}>{children}</div>
    </section>
  );
}
