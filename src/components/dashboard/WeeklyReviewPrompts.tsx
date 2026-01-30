/**
 * Weekly Review Prompts – Masterbook "Deliberate Thought Shapes Decisions".
 * Dismissible prompts for key focus areas; no forced actions.
 */

import { useNavigate } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMasterbook } from '@/contexts/MasterbookContext';
import { cn } from '@/lib/utils';

export function WeeklyReviewPrompts() {
  const navigate = useNavigate();
  const { weeklyReviewPrompts, dismissWeeklyPrompt } = useMasterbook();

  const activePrompts = weeklyReviewPrompts.filter((p) => !p.dismissedAt);

  if (activePrompts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Weekly review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activePrompts.map((prompt) => (
          <div
            key={prompt.id}
            className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{prompt.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{prompt.description}</p>
              {prompt.actionLabel && prompt.actionHref && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 mt-2 text-primary"
                  onClick={() => navigate(prompt.actionHref!)}
                >
                  {prompt.actionLabel}
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => dismissWeeklyPrompt(prompt.id)}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
