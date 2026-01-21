import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; positive: boolean };
  className?: string;
  href?: string;
  onClick?: () => void;
}

export function StatsCard({ title, value, subtitle, icon, trend, className, href, onClick }: StatsCardProps) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };
  
  const isClickable = !!href || !!onClick;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={isClickable ? handleClick : undefined}
      className={cn(
        'rounded-xl border border-border bg-card p-3 sm:p-6 shadow-card transition-all',
        isClickable && 'cursor-pointer hover:shadow-elevated hover:border-primary/30 hover:bg-accent/30',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="mt-1 sm:mt-2 font-display text-xl sm:text-3xl font-semibold text-card-foreground">{value}</p>
          {subtitle && <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm text-muted-foreground truncate">{subtitle}</p>}
          {trend && (
            <p
              className={cn(
                'mt-1 sm:mt-2 text-xs sm:text-sm font-medium',
                trend.positive ? 'text-success' : 'text-destructive'
              )}
            >
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className="flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
