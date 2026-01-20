import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Program, Project } from '@/types/portfolio';

interface BudgetVarianceChartProps {
  programs: Program[];
  projects: Project[];
}

export function BudgetVarianceChart({ programs, projects }: BudgetVarianceChartProps) {
  // Calculate program budget data (allocated from budget vs actual from projects)
  const programBudgetData = useMemo(() => {
    return programs
      .filter(p => (p.budget ?? 0) > 0 || (p.actualCost ?? 0) > 0)
      .map(program => {
        const budget = program.budget ?? 0;
        const actual = program.actualCost ?? 0;
        const variance = budget - actual;
        const variancePercent = budget > 0 ? Math.round(((actual - budget) / budget) * 100) : 0;
        
        return {
          name: program.name.length > 15 ? program.name.substring(0, 15) + '...' : program.name,
          fullName: program.name,
          budget,
          actual,
          variance,
          variancePercent,
          status: actual > budget ? 'over' : actual >= budget * 0.9 ? 'at-risk' : 'under',
        };
      });
  }, [programs]);

  // Calculate project budget data (allocated vs actual from tasks)
  const projectBudgetData = useMemo(() => {
    return projects
      .filter(p => (p.allocatedBudget ?? 0) > 0 || (p.actualCost ?? 0) > 0)
      .map(project => {
        const allocated = project.allocatedBudget ?? 0;
        const actual = project.actualCost ?? 0;
        const variance = allocated - actual;
        const variancePercent = allocated > 0 ? Math.round(((actual - allocated) / allocated) * 100) : 0;
        
        return {
          name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
          fullName: project.name,
          allocated,
          actual,
          variance,
          variancePercent,
          status: actual > allocated ? 'over' : actual >= allocated * 0.9 ? 'at-risk' : 'under',
        };
      });
  }, [projects]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalProgramBudget = programs.reduce((sum, p) => sum + (p.budget ?? 0), 0);
    const totalProgramActual = programs.reduce((sum, p) => sum + (p.actualCost ?? 0), 0);
    const totalProjectAllocated = projects.reduce((sum, p) => sum + (p.allocatedBudget ?? 0), 0);
    const totalProjectActual = projects.reduce((sum, p) => sum + (p.actualCost ?? 0), 0);
    
    const programsOverBudget = programs.filter(p => (p.actualCost ?? 0) > (p.budget ?? 0) && (p.budget ?? 0) > 0).length;
    const projectsOverBudget = projects.filter(p => (p.actualCost ?? 0) > (p.allocatedBudget ?? 0) && (p.allocatedBudget ?? 0) > 0).length;
    
    return {
      totalProgramBudget,
      totalProgramActual,
      totalProjectAllocated,
      totalProjectActual,
      programsOverBudget,
      projectsOverBudget,
      programVariance: totalProgramBudget - totalProgramActual,
      projectVariance: totalProjectAllocated - totalProjectActual,
    };
  }, [programs, projects]);

  const getBarColor = (status: string) => {
    switch (status) {
      case 'over':
        return 'hsl(var(--destructive))';
      case 'at-risk':
        return 'hsl(var(--warning))';
      default:
        return 'hsl(var(--success))';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0]?.payload;
    if (!data) return null;

    const budgetLabel = data.budget !== undefined ? 'Budget' : 'Allocated';
    const budgetValue = data.budget ?? data.allocated ?? 0;
    
    return (
      <div className="rounded-lg border border-border bg-popover p-3 shadow-md">
        <p className="font-medium text-foreground mb-2">{data.fullName}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{budgetLabel}:</span>
            <span className="font-medium">${budgetValue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Actual:</span>
            <span className="font-medium">${data.actual.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-1 mt-1">
            <span className="text-muted-foreground">Variance:</span>
            <span className={cn(
              "font-medium",
              data.variance >= 0 ? "text-success" : "text-destructive"
            )}>
              {data.variance >= 0 ? '+' : ''}{data.variancePercent}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  const hasNoBudgetData = programBudgetData.length === 0 && projectBudgetData.length === 0;

  if (hasNoBudgetData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget Variance</CardTitle>
          <CardDescription>Allocated vs actual spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">No budget data</p>
            <p className="text-sm text-muted-foreground">
              Set budgets on programs and allocate to projects to see variance charts
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Program Budget</p>
                <p className="text-2xl font-bold text-foreground">
                  ${summaryStats.totalProgramBudget.toLocaleString()}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Across {programs.filter(p => (p.budget ?? 0) > 0).length} programs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actual Spend</p>
                <p className="text-2xl font-bold text-foreground">
                  ${summaryStats.totalProgramActual.toLocaleString()}
                </p>
              </div>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                summaryStats.programVariance >= 0 ? "bg-success/20" : "bg-destructive/20"
              )}>
                {summaryStats.programVariance >= 0 ? (
                  <TrendingDown className="h-5 w-5 text-success" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-destructive" />
                )}
              </div>
            </div>
            <p className={cn(
              "mt-2 text-xs",
              summaryStats.programVariance >= 0 ? "text-success" : "text-destructive"
            )}>
              {summaryStats.programVariance >= 0 ? 'Under budget by ' : 'Over budget by '}
              ${Math.abs(summaryStats.programVariance).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Programs Over Budget</p>
                <p className="text-2xl font-bold text-foreground">
                  {summaryStats.programsOverBudget}
                </p>
              </div>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                summaryStats.programsOverBudget === 0 ? "bg-success/20" : "bg-destructive/20"
              )}>
                <AlertTriangle className={cn(
                  "h-5 w-5",
                  summaryStats.programsOverBudget === 0 ? "text-success" : "text-destructive"
                )} />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              of {programs.filter(p => (p.budget ?? 0) > 0).length} with budgets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Projects Over Budget</p>
                <p className="text-2xl font-bold text-foreground">
                  {summaryStats.projectsOverBudget}
                </p>
              </div>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                summaryStats.projectsOverBudget === 0 ? "bg-success/20" : "bg-destructive/20"
              )}>
                <AlertTriangle className={cn(
                  "h-5 w-5",
                  summaryStats.projectsOverBudget === 0 ? "text-success" : "text-destructive"
                )} />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              of {projects.filter(p => (p.allocatedBudget ?? 0) > 0).length} with allocations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Program Budget Chart */}
      {programBudgetData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Program Budget vs Actual</CardTitle>
            <CardDescription>Compare budgeted amounts against actual spending per program</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={programBudgetData} margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="budget" 
                    fill="hsl(var(--muted-foreground))" 
                    name="Budget" 
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Bar 
                    dataKey="actual" 
                    name="Actual" 
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  >
                    {programBudgetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Budget Chart */}
      {projectBudgetData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Allocated vs Actual</CardTitle>
            <CardDescription>Compare allocated budgets against actual task costs per project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectBudgetData} margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="allocated" 
                    fill="hsl(var(--muted-foreground))" 
                    name="Allocated" 
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Bar 
                    dataKey="actual" 
                    name="Actual" 
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  >
                    {projectBudgetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variance Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget Variance Details</CardTitle>
          <CardDescription>Detailed breakdown of budget performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Programs Section */}
            {programBudgetData.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Programs</h4>
                <div className="space-y-3">
                  {programBudgetData.map((program, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{program.fullName}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Budget: ${program.budget.toLocaleString()}</span>
                          <span>Actual: ${program.actual.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24">
                          <Progress 
                            value={Math.min((program.actual / program.budget) * 100, 100)}
                            className={cn(
                              program.status === 'over' && "[&>div]:bg-destructive",
                              program.status === 'at-risk' && "[&>div]:bg-warning"
                            )}
                          />
                        </div>
                        <Badge variant={
                          program.status === 'over' ? 'destructive' : 
                          program.status === 'at-risk' ? 'outline' : 'secondary'
                        }>
                          {program.variancePercent > 0 ? '+' : ''}{program.variancePercent}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects Section */}
            {projectBudgetData.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Projects</h4>
                <div className="space-y-3">
                  {projectBudgetData.map((project, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{project.fullName}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Allocated: ${project.allocated.toLocaleString()}</span>
                          <span>Actual: ${project.actual.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24">
                          <Progress 
                            value={Math.min((project.actual / project.allocated) * 100, 100)}
                            className={cn(
                              project.status === 'over' && "[&>div]:bg-destructive",
                              project.status === 'at-risk' && "[&>div]:bg-warning"
                            )}
                          />
                        </div>
                        <Badge variant={
                          project.status === 'over' ? 'destructive' : 
                          project.status === 'at-risk' ? 'outline' : 'secondary'
                        }>
                          {project.variancePercent > 0 ? '+' : ''}{project.variancePercent}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}