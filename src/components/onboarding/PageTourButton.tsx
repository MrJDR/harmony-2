import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useTour } from '@/contexts/TourContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PageTourButtonProps {
  tourId: string;
  label?: string;
}

export function PageTourButton({ tourId, label = 'Take a tour' }: PageTourButtonProps) {
  const { startTour, activeTour } = useTour();

  if (activeTour) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => startTour(tourId)}
            className="gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Start interactive overview for this page</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
