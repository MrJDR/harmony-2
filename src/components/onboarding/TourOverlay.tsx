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

    const clamp = (pos: { top: number; left: number }) => {
      const margin = 12;
      const overlayRect = overlayRef.current?.getBoundingClientRect();
      const overlayW = overlayRect?.width ?? 320;
      const overlayH = overlayRect?.height ?? 180;

      const placement = currentTourStep.placement || 'bottom';

      // Convert our "anchor" position to a top-left box position for clamping.
      const boxLeft =
        placement === 'left'
          ? pos.left - overlayW
          : placement === 'right'
            ? pos.left
            : pos.left - overlayW / 2;
      const boxTop =
        placement === 'top'
          ? pos.top - overlayH
          : placement === 'bottom'
            ? pos.top
            : pos.top - overlayH / 2;

      const clampedBoxLeft = Math.min(
        Math.max(boxLeft, margin),
        window.innerWidth - overlayW - margin
      );
      const clampedBoxTop = Math.min(
        Math.max(boxTop, margin),
        window.innerHeight - overlayH - margin
      );

      // Convert back to anchor position.
      const clampedLeft =
        placement === 'left'
          ? clampedBoxLeft + overlayW
          : placement === 'right'
            ? clampedBoxLeft
            : clampedBoxLeft + overlayW / 2;
      const clampedTop =
        placement === 'top'
          ? clampedBoxTop + overlayH
          : placement === 'bottom'
            ? clampedBoxTop
            : clampedBoxTop + overlayH / 2;

      setPosition({ top: clampedTop, left: clampedLeft });
    };

    const updatePosition = () => {
      const target = document.querySelector(currentTourStep.target);

      // If we can't find the element (permissions / conditional UI), keep the tooltip visible
      // and centered so the tour doesn't look broken.
      if (!target) {
        setTargetRect(null);
        setPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
        raf2 = window.requestAnimationFrame(() => clamp({ top: window.innerHeight / 2, left: window.innerWidth / 2 }));
        return;
      }

      // Scroll first, then measure on the next frame so highlight + tooltip match.
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });

      raf1 = window.requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);

        const placement = currentTourStep.placement || 'bottom';
        let top = 0;
        let left = 0;

        switch (placement) {
          case 'top':
            top = rect.top - 10;
            left = rect.left + rect.width / 2;
            break;
          case 'bottom':
            top = rect.bottom + 10;
            left = rect.left + rect.width / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2;
            left = rect.left - 10;
            break;
          case 'right':
            top = rect.top + rect.height / 2;
            left = rect.right + 10;
            break;
        }

        setPosition({ top, left });

        // Clamp after the tooltip renders at least once.
        raf2 = window.requestAnimationFrame(() => clamp({ top, left }));
      });
    };

    // Retry once shortly after mount (helps when layout/animations delay rendering).
    updatePosition();
    timeout = window.setTimeout(updatePosition, 250);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
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

        {/* Tooltip */}
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0, y: placement === 'top' ? 10 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute pointer-events-auto"
          style={{
            top: position.top,
            left: position.left,
            transform: `translate(${
              placement === 'left' ? '-100%' : placement === 'right' ? '0' : '-50%'
            }, ${
              placement === 'top' ? '-100%' : placement === 'bottom' ? '0' : '-50%'
            })`,
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
