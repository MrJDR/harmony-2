import { CheckCircle2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ThankYouModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROADMAP_URL = "https://accordpm.canny.io/admin/roadmap/accordpm-roadmap";

export function ThankYouModal({ open, onOpenChange }: ThankYouModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] text-center">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
              >
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </motion.div>

              <DialogHeader className="text-center">
                <DialogTitle className="text-xl">Thank You!</DialogTitle>
                <DialogDescription className="text-base mt-2">
                  Your feedback has been submitted successfully. We truly appreciate you taking the time to help us improve.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-3 w-full">
                <p className="text-sm text-muted-foreground">
                  Want to see what we're working on?
                </p>
                <Button
                  asChild
                  className="w-full"
                  variant="default"
                >
                  <a
                    href={ROADMAP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    View Our Roadmap
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
