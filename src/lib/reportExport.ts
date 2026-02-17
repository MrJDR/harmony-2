import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

// Chart element IDs that can be captured
export const CHART_IDS = {
  taskDistribution: 'report-chart-task-distribution',
  projectProgress: 'report-chart-project-progress',
  teamUtilization: 'report-chart-team-utilization',
  timeline: 'report-chart-timeline',
  portfolioProgress: 'report-chart-portfolio-progress',
  programStatus: 'report-chart-program-status',
  programProgress: 'report-chart-program-progress',
} as const;

// Capture a DOM element as an image
async function captureElement(elementId: string): Promise<string | null> {
  const element = document.getElementById(elementId);
  if (!element) return null;
  
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error(`Failed to capture element ${elementId}:`, error);
    return null;
  }
}

// Capture all chart elements
export async function captureCharts(): Promise<Record<string, string | null>> {
  const charts: Record<string, string | null> = {};
  
  for (const [key, id] of Object.entries(CHART_IDS)) {
    charts[key] = await captureElement(id);
  }
  
  return charts;
}

export interface ReportData {
  organizationName?: string;
  dateRange: string;
  filterScope?: {
    portfolioId?: string;
    portfolioName?: string;
    programId?: string;
    programName?: string;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    overdueTasks: number;
    highPriorityTasks: number;
    completionRate: number;
    activeProjects: number;
    completedProjects: number;
    totalProjects: number;
    avgProgress: number;
    utilizationRate: number;
    totalPrograms: number;
    totalPortfolios?: number;
    // Budget stats
    totalBudget?: number;
    totalActualCost?: number;
    budgetRemaining?: number;
    budgetUtilization?: number;
    budgetStatus?: 'under' | 'at-risk' | 'over' | 'no-budget';
    overBudgetProjects?: number;
  };
  portfolios?: Array<{
    name: string;
    description?: string;
    programCount: number;
    projectCount: number;
    taskCount: number;
    completedTasks: number;
    budget: number;
    actualCost: number;
  }>;
  programs?: Array<{
    id?: string;
    name: string;
    status: string;
    portfolioName?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    projectCount: number;
    taskCount: number;
    completedTasks: number;
    budget: number;
    actualCost: number;
    ownerName?: string;
  }>;
  projects: Array<{
    id?: string;
    name: string;
    status: string;
    programName?: string;
    portfolioName?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    createdAt?: string;
    updatedAt?: string;
    progress: number;
    tasksCount: number;
    completedTasksCount: number;
    budget?: number;
    actualCost?: number;
    ownerName?: string;
    ownerEmail?: string;
  }>;
  teamMembers: Array<{
    id?: string;
    name: string;
    email?: string;
    role?: string;
    allocation: number;
    capacity: number;
    taskCount?: number;
    completedTaskCount?: number;
  }>;
  // NEW: Comprehensive task data
  tasks?: Array<{
    id?: string;
    title: string;
    status: string;
    priority: string;
    weight?: number;
    projectName?: string;
    programName?: string;
    portfolioName?: string;
    assigneeId?: string;
    assigneeName?: string;
    assigneeEmail?: string;
    assigneeRole?: string;
    startDate?: string;
    dueDate?: string;
    createdAt?: string;
    updatedAt?: string;
    estimatedHours?: number;
    actualCost?: number;
    milestoneName?: string;
    milestoneDueDate?: string;
    subtaskCount?: number;
    completedSubtasks?: number;
  }>;
  // NEW: Milestone data
  milestones?: Array<{
    title: string;
    projectName?: string;
    programName?: string;
    dueDate?: string;
    description?: string;
    taskCount?: number;
    completedTaskCount?: number;
  }>;
}

// Generate PDF from report data with optional chart images
export async function generateReportPDF(
  data: ReportData,
  chartImages?: Record<string, string | null>
): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Helper functions
  const addTitle = (text: string, size: number = 16) => {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', 'bold');
    pdf.text(text, margin, yPos);
    yPos += size * 0.5 + 4;
  };

  const addText = (text: string, size: number = 10, color: [number, number, number] = [51, 51, 51]) => {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...color);
    pdf.text(text, margin, yPos);
    yPos += size * 0.4 + 2;
  };

  const addStatRow = (label: string, value: string | number) => {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(label, margin, yPos);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(51, 51, 51);
    pdf.text(String(value), margin + 80, yPos);
    yPos += 6;
  };

  const addDivider = () => {
    yPos += 4;
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
  };

  const checkPageBreak = (requiredSpace: number = 30) => {
    if (yPos + requiredSpace > pdf.internal.pageSize.getHeight() - 20) {
      pdf.addPage();
      yPos = 20;
    }
  };

  // Header
  const headerHeight = data.filterScope ? 50 : 40;
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(0, 0, pageWidth, headerHeight, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Portfolio Report', margin, 25);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const dateText = `Generated: ${format(new Date(), 'MMMM d, yyyy')} | Period: ${data.dateRange}`;
  pdf.text(dateText, margin, 34);
  
  // Show filter scope if applied
  if (data.filterScope) {
    pdf.setFontSize(9);
    const filterParts: string[] = [];
    if (data.filterScope.portfolioName) {
      filterParts.push(`Portfolio: ${data.filterScope.portfolioName}`);
    }
    if (data.filterScope.programName) {
      filterParts.push(`Program: ${data.filterScope.programName}`);
    }
    if (filterParts.length > 0) {
      pdf.text(`Filtered by: ${filterParts.join(' → ')}`, margin, 44);
    }
  }
  
  yPos = headerHeight + 12;
  pdf.setTextColor(51, 51, 51);

  // Executive Summary
  addTitle('Executive Summary', 14);
  yPos += 2;

  // Stats grid
  const statsData = [
    ['Task Completion Rate', `${data.stats.completionRate}%`],
    ['Team Utilization', `${data.stats.utilizationRate}%`],
    ['Total Projects', String(data.stats.totalProjects)],
    ['Total Programs', String(data.stats.totalPrograms)],
    ['Active Projects', String(data.stats.activeProjects)],
    ['Average Progress', `${data.stats.avgProgress}%`],
    ['Overdue Tasks', String(data.stats.overdueTasks)],
    ['High Priority Tasks', String(data.stats.highPriorityTasks)],
    ['Total Budget', data.stats.totalBudget ? `$${data.stats.totalBudget.toLocaleString()}` : 'N/A'],
    ['Actual Cost', data.stats.totalActualCost ? `$${data.stats.totalActualCost.toLocaleString()}` : 'N/A'],
    ['Budget Utilization', data.stats.budgetUtilization ? `${data.stats.budgetUtilization}%` : 'N/A'],
  ];

  statsData.forEach(([label, value]) => {
    addStatRow(label, value);
  });

  addDivider();

  // Add charts if available
  const addChartImage = (imageData: string | null | undefined, title: string) => {
    if (!imageData) return;
    
    checkPageBreak(100);
    addTitle(title, 14);
    yPos += 2;
    
    try {
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = 60; // Fixed height for charts
      pdf.addImage(imageData, 'PNG', margin, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 8;
    } catch (error) {
      console.error(`Failed to add chart image for ${title}:`, error);
    }
  };

  // Add chart images
  if (chartImages) {
    if (chartImages.taskDistribution) {
      addChartImage(chartImages.taskDistribution, 'Task Distribution');
      addDivider();
    }
    if (chartImages.projectProgress) {
      addChartImage(chartImages.projectProgress, 'Project Progress');
      addDivider();
    }
    if (chartImages.teamUtilization) {
      addChartImage(chartImages.teamUtilization, 'Team Utilization');
      addDivider();
    }
  }

  // Add Portfolio chart if available
  if (chartImages?.portfolioProgress) {
    addChartImage(chartImages.portfolioProgress, 'Portfolio Overview');
    addDivider();
  }

  // Portfolio Summary
  if (data.portfolios && data.portfolios.length > 0) {
    checkPageBreak(50);
    addTitle('Portfolios Summary', 14);
    yPos += 4;

    // Table header
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, yPos - 4, pageWidth - margin * 2, 8, 'F');
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text('Portfolio', margin + 2, yPos);
    pdf.text('Programs', margin + 55, yPos);
    pdf.text('Projects', margin + 80, yPos);
    pdf.text('Tasks', margin + 105, yPos);
    pdf.text('Budget', margin + 130, yPos);
    pdf.text('Cost', margin + 155, yPos);
    yPos += 8;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 51, 51);
    
    data.portfolios.forEach((portfolio) => {
      checkPageBreak(10);
      pdf.setFontSize(9);
      const truncatedName = portfolio.name.length > 25 ? portfolio.name.substring(0, 25) + '...' : portfolio.name;
      pdf.text(truncatedName, margin + 2, yPos);
      pdf.text(String(portfolio.programCount), margin + 55, yPos);
      pdf.text(String(portfolio.projectCount), margin + 80, yPos);
      pdf.text(`${portfolio.completedTasks}/${portfolio.taskCount}`, margin + 105, yPos);
      pdf.text(portfolio.budget > 0 ? `$${(portfolio.budget / 1000).toFixed(0)}k` : '-', margin + 130, yPos);
      pdf.text(portfolio.actualCost > 0 ? `$${(portfolio.actualCost / 1000).toFixed(0)}k` : '-', margin + 155, yPos);
      yPos += 6;
    });

    addDivider();
  }

  // Add Program charts if available
  if (chartImages?.programStatus) {
    addChartImage(chartImages.programStatus, 'Program Status Distribution');
    addDivider();
  }
  if (chartImages?.programProgress) {
    addChartImage(chartImages.programProgress, 'Program Progress');
    addDivider();
  }

  // Programs Summary
  if (data.programs && data.programs.length > 0) {
    checkPageBreak(50);
    addTitle('Programs Summary', 14);
    yPos += 4;

    // Table header
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, yPos - 4, pageWidth - margin * 2, 8, 'F');
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text('Program', margin + 2, yPos);
    pdf.text('Status', margin + 50, yPos);
    pdf.text('Projects', margin + 80, yPos);
    pdf.text('Tasks', margin + 105, yPos);
    pdf.text('Budget', margin + 130, yPos);
    pdf.text('Cost', margin + 155, yPos);
    yPos += 8;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 51, 51);
    
    data.programs.slice(0, 15).forEach((program) => {
      checkPageBreak(10);
      pdf.setFontSize(9);
      const truncatedName = program.name.length > 22 ? program.name.substring(0, 22) + '...' : program.name;
      pdf.text(truncatedName, margin + 2, yPos);
      pdf.text(program.status.charAt(0).toUpperCase() + program.status.slice(1), margin + 50, yPos);
      pdf.text(String(program.projectCount), margin + 80, yPos);
      pdf.text(`${program.completedTasks}/${program.taskCount}`, margin + 105, yPos);
      pdf.text(program.budget > 0 ? `$${(program.budget / 1000).toFixed(0)}k` : '-', margin + 130, yPos);
      pdf.text(program.actualCost > 0 ? `$${(program.actualCost / 1000).toFixed(0)}k` : '-', margin + 155, yPos);
      yPos += 6;
    });

    if (data.programs.length > 15) {
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`... and ${data.programs.length - 15} more programs`, margin + 2, yPos);
      yPos += 6;
    }

    addDivider();
  }

  // Task Overview
  checkPageBreak(50);
  addTitle('Task Overview', 14);
  yPos += 2;

  addStatRow('Total Tasks', data.stats.totalTasks);
  addStatRow('Completed', data.stats.completedTasks);
  addStatRow('In Progress', data.stats.inProgressTasks);
  addStatRow('To Do', data.stats.todoTasks);
  addStatRow('Overdue', data.stats.overdueTasks);

  addDivider();

  // Projects Summary
  checkPageBreak(50);
  addTitle('Projects Summary', 14);
  yPos += 4;

  // Table header
  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, yPos - 4, pageWidth - margin * 2, 8, 'F');
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(71, 85, 105);
  pdf.text('Project Name', margin + 2, yPos);
  pdf.text('Status', margin + 70, yPos);
  pdf.text('Progress', margin + 100, yPos);
  pdf.text('Tasks', margin + 130, yPos);
  yPos += 8;

  // Table rows
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(51, 51, 51);
  
  data.projects.slice(0, 10).forEach((project) => {
    checkPageBreak(10);
    pdf.setFontSize(9);
    const truncatedName = project.name.length > 30 ? project.name.substring(0, 30) + '...' : project.name;
    pdf.text(truncatedName, margin + 2, yPos);
    pdf.text(project.status, margin + 70, yPos);
    pdf.text(`${project.progress}%`, margin + 100, yPos);
    pdf.text(`${project.completedTasksCount}/${project.tasksCount}`, margin + 130, yPos);
    yPos += 6;
  });

  if (data.projects.length > 10) {
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`... and ${data.projects.length - 10} more projects`, margin + 2, yPos);
    yPos += 6;
  }

  addDivider();

  // Team Utilization
  checkPageBreak(50);
  addTitle('Team Utilization', 14);
  yPos += 4;

  // Table header
  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, yPos - 4, pageWidth - margin * 2, 8, 'F');
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(71, 85, 105);
  pdf.text('Team Member', margin + 2, yPos);
  pdf.text('Allocation', margin + 80, yPos);
  pdf.text('Capacity', margin + 110, yPos);
  pdf.text('Utilization', margin + 140, yPos);
  yPos += 8;

  // Table rows
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(51, 51, 51);
  
  data.teamMembers.slice(0, 15).forEach((member) => {
    checkPageBreak(10);
    pdf.setFontSize(9);
    const utilization = member.capacity > 0 ? Math.round((member.allocation / member.capacity) * 100) : 0;
    pdf.text(member.name, margin + 2, yPos);
    pdf.text(`${member.allocation}h`, margin + 80, yPos);
    pdf.text(`${member.capacity}h`, margin + 110, yPos);
    pdf.text(`${utilization}%`, margin + 140, yPos);
    yPos += 6;
  });

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${i} of ${totalPages} | Accord Portfolio Management`,
      pageWidth / 2,
      pdf.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return pdf.output('blob');
}

// Generate HTML content for email
export function generateReportHTML(data: ReportData): string {
  const statusColor = (rate: number) => {
    if (rate >= 70) return '#10b981';
    if (rate >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px;">📊 Portfolio Update</h1>
        <p style="color: #94a3b8; margin: 0; font-size: 14px;">
          Generated on ${format(new Date(), 'MMMM d, yyyy')} | Period: ${data.dateRange}
        </p>
      </div>

      <!-- Quick Stats -->
      <div style="background: #f8fafc; padding: 24px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
        <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 16px;">Quick Overview</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px; background: white; border-radius: 8px; text-align: center; width: 50%;">
              <div style="font-size: 28px; font-weight: bold; color: ${statusColor(data.stats.completionRate)};">${data.stats.completionRate}%</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Task Completion</div>
            </td>
            <td style="width: 12px;"></td>
            <td style="padding: 12px; background: white; border-radius: 8px; text-align: center; width: 50%;">
              <div style="font-size: 28px; font-weight: bold; color: ${statusColor(100 - data.stats.utilizationRate)};">${data.stats.utilizationRate}%</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Team Utilization</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Summary Stats -->
      <div style="padding: 24px; background: white; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
        <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 16px;">Summary</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="color: #64748b;">Total Projects</span>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #1e293b;">
              ${data.stats.totalProjects}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="color: #64748b;">Active Projects</span>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #1e293b;">
              ${data.stats.activeProjects}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="color: #64748b;">Average Progress</span>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #1e293b;">
              ${data.stats.avgProgress}%
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="color: #64748b;">Total Tasks</span>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #1e293b;">
              ${data.stats.totalTasks}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="color: #64748b;">Completed Tasks</span>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #10b981;">
              ${data.stats.completedTasks}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #64748b;">Overdue Tasks</span>
            </td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: ${data.stats.overdueTasks > 0 ? '#ef4444' : '#10b981'};">
              ${data.stats.overdueTasks}
            </td>
          </tr>
        </table>
      </div>

      <!-- Attention Items -->
      ${data.stats.overdueTasks > 0 || data.stats.highPriorityTasks > 0 ? `
      <div style="padding: 24px; background: #fef2f2; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
        <h2 style="color: #dc2626; margin: 0 0 12px 0; font-size: 16px;">⚠️ Requires Attention</h2>
        <ul style="margin: 0; padding-left: 20px; color: #991b1b;">
          ${data.stats.overdueTasks > 0 ? `<li style="margin-bottom: 8px;">${data.stats.overdueTasks} overdue task(s) need immediate attention</li>` : ''}
          ${data.stats.highPriorityTasks > 0 ? `<li>${data.stats.highPriorityTasks} high priority task(s) pending</li>` : ''}
        </ul>
      </div>
      ` : ''}

      <!-- Footer -->
      <div style="padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="color: #64748b; margin: 0; font-size: 12px;">
          This is an automated report from Accord Portfolio Management.
        </p>
      </div>
    </div>
  `;
}

// Download PDF with charts
export async function downloadReportPDF(
  data: ReportData,
  filename?: string,
  includeCharts: boolean = true
): Promise<void> {
  // Capture charts if requested
  let chartImages: Record<string, string | null> | undefined;
  if (includeCharts) {
    chartImages = await captureCharts();
  }
  
  const blob = await generateReportPDF(data, chartImages);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `portfolio-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Generate CSV content - Linear-compatible task-only export
export function generateReportCSV(data: ReportData): string {
  const lines: string[] = [];
  
  const esc = (val: string | number | undefined | null): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const fmtDate = (val: string | undefined | null): string => {
    if (!val) return '""';
    try {
      return esc(format(new Date(val), "MMM dd, yyyy"));
    } catch {
      return esc(val);
    }
  };

  // Header matching Linear CSV schema
  lines.push('"ID","Team","Title","Description","Status","Estimate","Priority","Project ID","Project","Creator","Assignee","Labels","Cycle Number","Cycle Name","Cycle Start","Cycle End","Created","Updated","Started","Triaged","Completed","Canceled","Archived","Due Date","Parent issue","Initiatives","Project Milestone ID","Project Milestone","SLA Status","UUID","Time in status (minutes)","Related to","Blocked by","Duplicate of"');

  if (data.tasks && data.tasks.length > 0) {
    data.tasks.forEach(task => {
      const completed = task.status === 'done';
      lines.push([
        esc(task.id || ''),
        esc(data.organizationName || ''),
        esc(task.title),
        esc(''),
        esc(task.status),
        esc(task.estimatedHours || ''),
        esc(task.priority),
        esc(''),
        esc(task.projectName || ''),
        esc(''),
        esc(task.assigneeName || ''),
        esc(''),
        '""', '""', '""', '""',
        fmtDate(task.createdAt),
        fmtDate(task.updatedAt),
        fmtDate(task.startDate),
        '""',
        completed ? fmtDate(task.updatedAt) : '""',
        '""', '""',
        fmtDate(task.dueDate),
        '""',
        esc(task.programName || ''),
        esc(''),
        esc(task.milestoneName || ''),
        '""',
        esc(task.id || ''),
        '""', '""', '""', '""',
      ].join(','));
    });
  }

  return lines.join('\n');
}

// Download CSV
export function downloadReportCSV(data: ReportData, filename?: string): void {
  const csv = generateReportCSV(data);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `Export_${format(new Date(), "EEE_MMM_dd_yyyy")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
