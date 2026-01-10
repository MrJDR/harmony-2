import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour } from '@/contexts/TourContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export function TourOverlay() {
  const { activeTour, currentStep, tourSteps, nextStep, prevStep, skipTour } = useTour();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentTourStep = tourSteps[currentStep];

  useEffect(() => {
    if (!currentTourStep) return;

    let raf1 = 0;
    let raf2 = 0;
    let timeout: number | undefined;

    const updatePosition = () => {
      const target = document.querySelector(currentTourStep.target);

      // Fallback when target doesn't exist (permissions, conditional rendering)
      if (!target) {
        setTargetRect(null);
        // Center the tooltip on screen
        const fallbackTop = Math.max(16, window.innerHeight / 2 - 100);
        const fallbackLeft = Math.max(16, window.innerWidth / 2 - 160);
        setPosition({ top: fallbackTop, left: fallbackLeft });
        return;
      }

      // Scroll target into view first
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });

      raf1 = window.requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);

        // Get tooltip dimensions (use defaults if not yet rendered)
        const tooltipW = overlayRef.current?.offsetWidth ?? 320;
        const tooltipH = overlayRef.current?.offsetHeight ?? 180;
        const margin = 12;
        const placement = currentTourStep.placement || 'bottom';

        let top = 0;
        let left = 0;

        // Calculate initial position based on placement
        switch (placement) {
          case 'top':
            top = rect.top - tooltipH - 10;
            left = rect.left + rect.width / 2 - tooltipW / 2;
            break;
          case 'bottom':
            top = rect.bottom + 10;
            left = rect.left + rect.width / 2 - tooltipW / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - tooltipH / 2;
            left = rect.left - tooltipW - 10;
            break;
          case 'right':
            top = rect.top + rect.height / 2 - tooltipH / 2;
            left = rect.right + 10;
            break;
        }

        // Clamp to viewport
        left = Math.max(margin, Math.min(left, window.innerWidth - tooltipW - margin));
        top = Math.max(margin, Math.min(top, window.innerHeight - tooltipH - margin));

        setPosition({ top, left });

        // Re-clamp after render in case tooltip size changed
        raf2 = window.requestAnimationFrame(() => {
          const newW = overlayRef.current?.offsetWidth ?? tooltipW;
          const newH = overlayRef.current?.offsetHeight ?? tooltipH;
          const clampedLeft = Math.max(margin, Math.min(left, window.innerWidth - newW - margin));
          const clampedTop = Math.max(margin, Math.min(top, window.innerHeight - newH - margin));
          if (clampedLeft !== left || clampedTop !== top) {
            setPosition({ top: clampedTop, left: clampedLeft });
          }
        });
      });
    };

    updatePosition();
    timeout = window.setTimeout(updatePosition, 300);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      if (timeout) window.clearTimeout(timeout);
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [currentTourStep]);

  if (!activeTour || !currentTourStep) return null;

  const placement = currentTourStep.placement || 'bottom';

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* Backdrop with hole */}
        {targetRect && (
          <svg className="absolute inset-0 w-full h-full pointer-events-auto">
            <defs>
              <mask id="tour-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={targetRect.left - 4}
                  y={targetRect.top - 4}
                  width={targetRect.width + 8}
                  height={targetRect.height + 8}
                  rx="8"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.5)"
              mask="url(#tour-mask)"
            />
          </svg>
        )}

        {/* Highlight ring */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute pointer-events-none"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
            }}
          >
            <div className="w-full h-full rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent animate-pulse" />
          </motion.div>
        )}

        {/* Tooltip - positioned absolutely with top/left already clamped */}
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute pointer-events-auto"
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          <Card className="w-80 shadow-xl border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{currentTourStep.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={skipTour}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {currentTourStep.content}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {currentStep + 1} of {tourSteps.length}
                </span>
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button variant="outline" size="sm" onClick={prevStep}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" onClick={nextStep}>
                    {currentStep === tourSteps.length - 1 ? 'Done' : 'Next'}
                    {currentStep < tourSteps.length - 1 && (
                      <ChevronRight className="h-4 w-4 ml-1" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
