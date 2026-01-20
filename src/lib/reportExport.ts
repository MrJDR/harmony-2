import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

// Chart element IDs that can be captured
export const CHART_IDS = {
  taskDistribution: 'report-chart-task-distribution',
  projectProgress: 'report-chart-project-progress',
  teamUtilization: 'report-chart-team-utilization',
  timeline: 'report-chart-timeline',
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
  };
  projects: Array<{
    name: string;
    status: string;
    progress: number;
    tasksCount: number;
    completedTasksCount: number;
  }>;
  teamMembers: Array<{
    name: string;
    allocation: number;
    capacity: number;
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
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Portfolio Report', margin, 25);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const dateText = `Generated: ${format(new Date(), 'MMMM d, yyyy')} | Period: ${data.dateRange}`;
  pdf.text(dateText, margin, 34);
  
  yPos = 52;
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

// Generate CSV content from report data
export function generateReportCSV(data: ReportData): string {
  const lines: string[] = [];
  
  // Helper to escape CSV values
  const escape = (val: string | number | undefined | null): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Summary section
  lines.push('PORTFOLIO REPORT SUMMARY');
  lines.push(`Generated,${format(new Date(), 'yyyy-MM-dd HH:mm')}`);
  lines.push(`Period,${escape(data.dateRange)}`);
  lines.push('');
  
  // Stats section
  lines.push('KEY METRICS');
  lines.push('Metric,Value');
  lines.push(`Task Completion Rate,${data.stats.completionRate}%`);
  lines.push(`Team Utilization,${data.stats.utilizationRate}%`);
  lines.push(`Total Projects,${data.stats.totalProjects}`);
  lines.push(`Active Projects,${data.stats.activeProjects}`);
  lines.push(`Completed Projects,${data.stats.completedProjects}`);
  lines.push(`Total Programs,${data.stats.totalPrograms}`);
  lines.push(`Average Progress,${data.stats.avgProgress}%`);
  lines.push(`Total Tasks,${data.stats.totalTasks}`);
  lines.push(`Completed Tasks,${data.stats.completedTasks}`);
  lines.push(`In Progress Tasks,${data.stats.inProgressTasks}`);
  lines.push(`To Do Tasks,${data.stats.todoTasks}`);
  lines.push(`Overdue Tasks,${data.stats.overdueTasks}`);
  lines.push(`High Priority Tasks,${data.stats.highPriorityTasks}`);
  lines.push('');
  
  // Projects section
  lines.push('PROJECTS');
  lines.push('Project Name,Status,Progress %,Total Tasks,Completed Tasks');
  data.projects.forEach(project => {
    lines.push([
      escape(project.name),
      escape(project.status),
      project.progress,
      project.tasksCount,
      project.completedTasksCount,
    ].join(','));
  });
  lines.push('');
  
  // Team members section
  lines.push('TEAM UTILIZATION');
  lines.push('Team Member,Allocation (hrs),Capacity (hrs),Utilization %');
  data.teamMembers.forEach(member => {
    const utilization = member.capacity > 0 
      ? Math.round((member.allocation / member.capacity) * 100) 
      : 0;
    lines.push([
      escape(member.name),
      member.allocation,
      member.capacity,
      utilization,
    ].join(','));
  });
  
  return lines.join('\n');
}

// Download CSV
export function downloadReportCSV(data: ReportData, filename?: string): void {
  const csv = generateReportCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `portfolio-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
