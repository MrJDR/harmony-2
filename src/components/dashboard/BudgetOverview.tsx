import { useNavigate } from 'react-router-dom';
import { ChevronRight, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface BudgetOverviewProps {
  totalBudget: number;
  totalActualCost: number;
  budgetUtilization: number;
}

export function BudgetOverview({ totalBudget, totalActualCost, budgetUtilization }: BudgetOverviewProps) {
  const navigate = useNavigate();

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Budget Overview</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/reports')}
            className="text-xs"
          >
            View Reports
            <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              ${totalBudget.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Actual Cost</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              ${totalActualCost.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Utilization</p>
            <div className="mt-1 flex items-center gap-2">
              <p className={cn(
                "text-2xl font-bold",
                budgetUtilization > 100 ? "text-destructive" :
                budgetUtilization > 90 ? "text-warning" : "text-success"
              )}>
                {budgetUtilization}%
              </p>
              {budgetUtilization <= 90 && (
                <TrendingUp className="h-5 w-5 text-success" />
              )}
            </div>
            <Progress 
              value={Math.min(budgetUtilization, 100)} 
              className="mt-2 h-2" 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
