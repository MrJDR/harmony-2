import { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface WeightConfig {
  priority: {
    high: number;
    medium: number;
    low: number;
  };
  urgency: {
    overdue: number;
    dueSoon: number; // within 7 days
    dueModerate: number; // 7-30 days
    dueLater: number; // 30+ days
  };
  complexity: {
    high: number;
    medium: number;
    low: number;
  };
  status: {
    inProgress: number;
    todo: number;
    blocked: number;
  };
}

const defaultWeights: WeightConfig = {
  priority: {
    high: 3,
    medium: 2,
    low: 1,
  },
  urgency: {
    overdue: 4,
    dueSoon: 3,
    dueModerate: 2,
    dueLater: 1,
  },
  complexity: {
    high: 3,
    medium: 2,
    low: 1,
  },
  status: {
    inProgress: 2,
    todo: 1,
    blocked: 3,
  },
};

export function AllocationSettings() {
  const [weights, setWeights] = useState<WeightConfig>(defaultWeights);
  const [hasChanges, setHasChanges] = useState(false);

  const updateWeight = (
    category: keyof WeightConfig,
    key: string,
    value: number
  ) => {
    setWeights((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleReset = () => {
    setWeights(defaultWeights);
    setHasChanges(false);
    toast({
      title: 'Weights Reset',
      description: 'All allocation weights have been reset to defaults.',
    });
  };

  const handleSave = () => {
    // In a real app, this would save to a backend/database
    localStorage.setItem('allocationWeights', JSON.stringify(weights));
    setHasChanges(false);
    toast({
      title: 'Settings Saved',
      description: 'Allocation weights have been saved successfully.',
    });
  };

  const calculateExampleScore = () => {
    // Example: High priority task due in 3 days, medium complexity, in progress
    const score =
      weights.priority.high +
      weights.urgency.dueSoon +
      weights.complexity.medium +
      weights.status.inProgress;
    return score;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-card-foreground">
          Allocation Weights
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure how tasks are weighted when calculating resource allocation. Higher weights mean more impact on workload.
        </p>
      </div>

      {/* Priority Weights */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Priority Weights</CardTitle>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  High priority tasks should have more impact on a team member's allocation than low priority tasks.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <CardDescription>
            Adjust how task priority affects workload calculation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">High Priority</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>Critical tasks that directly impact deliverables, deadlines, or stakeholder commitments. Examples: client-facing features, blocking issues, regulatory requirements.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="secondary" className="font-mono">{weights.priority.high}x</Badge>
            </div>
            <Slider
              value={[weights.priority.high]}
              onValueChange={([v]) => updateWeight('priority', 'high', v)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">Medium Priority</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>Important tasks that contribute to project goals but aren't immediately critical. Examples: feature enhancements, internal tooling, documentation updates.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="secondary" className="font-mono">{weights.priority.medium}x</Badge>
            </div>
            <Slider
              value={[weights.priority.medium]}
              onValueChange={([v]) => updateWeight('priority', 'medium', v)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">Low Priority</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>Nice-to-have tasks that can be deferred without significant impact. Examples: tech debt cleanup, exploratory research, minor UI polish.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="secondary" className="font-mono">{weights.priority.low}x</Badge>
            </div>
            <Slider
              value={[weights.priority.low]}
              onValueChange={([v]) => updateWeight('priority', 'low', v)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Urgency/Due Date Weights */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Urgency Weights</CardTitle>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Tasks due sooner should weigh more heavily on current allocation than tasks due further out.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <CardDescription>
            Configure how due date proximity affects allocation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">Overdue Tasks</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>Tasks past their due date. High weight ensures overdue work is prioritized and visible in workload calculations. Consider setting this highest to reflect urgency.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="destructive" className="font-mono">{weights.urgency.overdue}x</Badge>
            </div>
            <Slider
              value={[weights.urgency.overdue]}
              onValueChange={([v]) => updateWeight('urgency', 'overdue', v)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">Due Soon (within 7 days)</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>Tasks due within the next week require active attention and should heavily impact current allocation to ensure timely completion.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="secondary" className="font-mono bg-warning/20 text-warning-foreground">{weights.urgency.dueSoon}x</Badge>
            </div>
            <Slider
              value={[weights.urgency.dueSoon]}
              onValueChange={([v]) => updateWeight('urgency', 'dueSoon', v)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">Moderate (7-30 days)</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>Tasks due in 1-4 weeks. These should be on the radar but don't require immediate focus. Moderate weight balances planning ahead without over-allocating.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="secondary" className="font-mono">{weights.urgency.dueModerate}x</Badge>
            </div>
            <Slider
              value={[weights.urgency.dueModerate]}
              onValueChange={([v]) => updateWeight('urgency', 'dueModerate', v)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">Later (30+ days)</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>Long-term tasks with distant deadlines. Low weight prevents future work from inflating current allocation. Useful for backlog planning visibility.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="outline" className="font-mono">{weights.urgency.dueLater}x</Badge>
            </div>
            <Slider
              value={[weights.urgency.dueLater]}
              onValueChange={([v]) => updateWeight('urgency', 'dueLater', v)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Complexity Weights */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Complexity Weights</CardTitle>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Complex tasks require more effort and should count more toward allocation.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <CardDescription>
            Set weights based on task complexity/effort
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">High Complexity</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>Tasks requiring significant cognitive effort, specialized skills, or extensive coordination. Examples: architecture design, complex integrations, cross-team dependencies.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="secondary" className="font-mono">{weights.complexity.high}x</Badge>
            </div>
            <Slider
              value={[weights.complexity.high]}
              onValueChange={([v]) => updateWeight('complexity', 'high', v)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">Medium Complexity</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>Standard tasks requiring moderate effort and some problem-solving. Examples: feature implementation, bug fixes with investigation, API integrations.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="secondary" className="font-mono">{weights.complexity.medium}x</Badge>
            </div>
            <Slider
              value={[weights.complexity.medium]}
              onValueChange={([v]) => updateWeight('complexity', 'medium', v)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">Low Complexity</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>Straightforward tasks with clear requirements and minimal unknowns. Examples: copy changes, config updates, simple UI tweaks, routine maintenance.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="secondary" className="font-mono">{weights.complexity.low}x</Badge>
            </div>
            <Slider
              value={[weights.complexity.low]}
              onValueChange={([v]) => updateWeight('complexity', 'low', v)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Status Weights */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Status Weights</CardTitle>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Active and blocked tasks typically require more attention than queued tasks.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <CardDescription>
            Configure how task status impacts allocation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">In Progress</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>Tasks actively being worked on. These consume real-time attention and should reflect current workload accurately.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="secondary" className="font-mono bg-primary/20 text-primary">{weights.status.inProgress}x</Badge>
            </div>
            <Slider
              value={[weights.status.inProgress]}
              onValueChange={([v]) => updateWeight('status', 'inProgress', v)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">To Do</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>Queued tasks not yet started. Lower weight since they don't consume active attention, but still factor into planned capacity.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="outline" className="font-mono">{weights.status.todo}x</Badge>
            </div>
            <Slider
              value={[weights.status.todo]}
              onValueChange={([v]) => updateWeight('status', 'todo', v)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">Blocked</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>Tasks waiting on external dependencies. High weight highlights bottlenecks and ensures blocked work is visible for resolution and escalation.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="destructive" className="font-mono">{weights.status.blocked}x</Badge>
            </div>
            <Slider
              value={[weights.status.blocked]}
              onValueChange={([v]) => updateWeight('status', 'blocked', v)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Example Calculation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-lg border border-border bg-muted/30 p-4"
      >
        <h3 className="text-sm font-medium text-foreground">Example Calculation</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          A <span className="font-semibold text-destructive">high priority</span> task,{' '}
          <span className="font-semibold text-warning">due in 3 days</span>,{' '}
          <span className="font-semibold">medium complexity</span>,{' '}
          <span className="font-semibold text-primary">in progress</span>:
        </p>
        <div className="mt-2 flex items-center gap-2">
          <code className="text-xs text-muted-foreground">
            {weights.priority.high} + {weights.urgency.dueSoon} + {weights.complexity.medium} + {weights.status.inProgress}
          </code>
          <span className="text-muted-foreground">=</span>
          <Badge className="font-mono text-base">{calculateExampleScore()} points</Badge>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges} className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
