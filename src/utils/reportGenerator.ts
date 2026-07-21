import { jsPDF } from "jspdf";
import { UserProfile, RoadmapItem, JobApplication, WeeklyReport } from "../types";

export function generateWeeklyReportMarkdown(
  profile: UserProfile,
  roadmaps: RoadmapItem[],
  applications: JobApplication[],
  report: WeeklyReport | undefined
): string {
  const weekTitle = report ? report.weekRange : "Current Active Week";
  const learningHours = report ? report.learningHours : 0;
  const interviewsCount = report ? report.interviewsCount : 0;
  const summary = report ? report.summary : "No automated audit summary compiled yet.";
  
  let md = `# CareerPilot Weekly Performance Audit Report\n`;
  md += `**Audit Window:** ${weekTitle}  |  **Generated:** ${new Date().toLocaleDateString()}  |  **Author:** Career Intelligence Engine\n\n`;
  
  md += `## 1. Executive Summary & Audit Feedback\n`;
  md += `> ${summary}\n\n`;
  
  md += `### Core Weekly Performance Indicators\n`;
  md += `- **Weekly Active Study Time:** ${learningHours} hours\n`;
  md += `- **Live Mock Auditions Logged:** ${interviewsCount} sessions\n`;
  md += `- **Active Skills Portfolio:** ${profile.skills.join(", ")}\n`;
  md += `- **Certifications Tracker:** ${profile.certifications.length > 0 ? profile.certifications.join(", ") : "None registered"}\n\n`;
  
  md += `## 2. Learning Roadmaps Progress\n`;
  if (roadmaps.length === 0) {
    md += `*No active learning roadmaps registered in current cycle.*\n\n`;
  } else {
    md += `| Roadmap Subject | Current Status | Study Resources |\n`;
    md += `| :--- | :--- | :--- |\n`;
    roadmaps.forEach(r => {
      const statusMap = {
        not_started: "Not Started ⚪",
        in_progress: "In Progress 🔵",
        completed: "Completed ✅"
      };
      const statusStr = statusMap[r.status] || r.status;
      const resourceCount = r.resources ? r.resources.length : 0;
      md += `| ${r.title} | ${statusStr} | ${resourceCount} resource items |\n`;
    });
    md += `\n`;
  }
  
  md += `## 3. Job Application Milestone Pipeline\n`;
  if (applications.length === 0) {
    md += `*No active job applications found in tracking systems.*\n\n`;
  } else {
    md += `| Target Organization | Role Specification | Pipeline Status | Context Notes |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    applications.forEach(app => {
      const statusEmoji = {
        interested: "Interested ⭐",
        applied: "Applied 📩",
        interviewing: "Interviewing 💬",
        offered: "Offered 🎉",
        rejected: "Archived ❌"
      }[app.status] || app.status;
      md += `| ${app.company} | ${app.role} | ${statusEmoji} | ${app.notes || "None available"} |\n`;
    });
    md += `\n`;
  }
  
  md += `## 4. Skill Growth & Velocity Metrics\n`;
  if (report && report.skillGrowth && report.skillGrowth.length > 0) {
    md += `| Skill Matrix | Acceleration |\n`;
    md += `| :--- | :--- |\n`;
    report.skillGrowth.forEach(g => {
      md += `| ${g.skill} | +${g.increase}% Skill Velocity Growth |\n`;
    });
    md += `\n`;
  } else {
    md += `*No incremental skill growth parsed in this weekly cycle. Practice interactive interviews or submit resumes to gather velocity logs.*\n\n`;
  }
  
  md += `## 5. Tactical Roadmap Suggestions\n`;
  if (report && report.suggestions && report.suggestions.length > 0) {
    report.suggestions.forEach((sug, idx) => {
      md += `${idx + 1}. **${sug}**\n`;
    });
  } else {
    md += `1. **Complete a mock interview trial** to gather interactive communication evaluations.\n`;
    md += `2. **Submit your latest resume draft** to the ATS Resume Analyzer to gather formatting feedback.\n`;
    md += `3. **Add certified credentials** to increase target alignment metrics.\n`;
  }
  
  return md;
}

class PDFReportHelper {
  doc: jsPDF;
  y: number;
  margin: number;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;

  constructor() {
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    this.margin = 20;
    this.y = 30;
    this.pageWidth = 210;
    this.pageHeight = 297;
    this.contentWidth = this.pageWidth - 2 * this.margin; // 170 mm
  }

  checkPageBreak(neededHeight: number) {
    if (this.y + neededHeight > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.y = this.margin + 12; // room below header
    }
  }

  addTitle(text: string) {
    this.checkPageBreak(25);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(18);
    this.doc.setTextColor(15, 23, 42); // slate-900
    this.doc.text(text, this.margin, this.y);
    this.y += 6;

    // Draw a subtle primary divider line
    this.doc.setDrawColor(56, 189, 248); // sky-400
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, this.y, this.margin + this.contentWidth, this.y);
    this.y += 10;
  }

  addMetadata(label: string, val: string) {
    this.checkPageBreak(6);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(9);
    this.doc.setTextColor(100, 116, 139); // slate-500
    this.doc.text(`${label}: `, this.margin, this.y);
    const textWidth = this.doc.getTextWidth(`${label}: `);
    
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(30, 41, 59); // slate-800
    this.doc.text(val, this.margin + textWidth, this.y);
    this.y += 6;
  }

  addSpacing(height: number) {
    this.y += height;
  }

  addHeading1(text: string) {
    this.checkPageBreak(15);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(12);
    this.doc.setTextColor(30, 41, 59); // slate-800
    
    // Draw left-accent bar
    this.doc.setFillColor(99, 102, 241); // indigo-500
    this.doc.rect(this.margin, this.y - 3.5, 3.5, 5, "F");
    
    this.doc.text(text, this.margin + 6, this.y);
    this.y += 8;
  }

  addHeading2(text: string) {
    this.checkPageBreak(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(10);
    this.doc.setTextColor(71, 85, 105); // slate-600
    this.doc.text(text, this.margin, this.y);
    this.y += 6;
  }

  addQuote(text: string) {
    this.doc.setFont("helvetica", "oblique");
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(71, 85, 105); // slate-600
    
    const lines = this.doc.splitTextToSize(text, this.contentWidth - 12);
    const blockHeight = lines.length * 4.5 + 6;
    
    this.checkPageBreak(blockHeight);
    
    // Draw background block
    this.doc.setFillColor(248, 250, 252); // slate-50
    this.doc.rect(this.margin, this.y - 3, this.contentWidth, blockHeight, "F");
    
    // Draw left vertical line
    this.doc.setDrawColor(148, 163, 184); // slate-400
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, this.y - 3, this.margin, this.y - 3 + blockHeight);
    
    lines.forEach((line: string) => {
      this.doc.text(line, this.margin + 6, this.y + 2);
      this.y += 4.5;
    });
    this.y += 6;
  }

  addBullet(text: string) {
    this.checkPageBreak(6);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(51, 65, 85); // slate-700
    
    // Draw small circle bullet
    this.doc.setFillColor(56, 189, 248); // sky-400
    this.doc.circle(this.margin + 2, this.y - 1, 0.8, "F");
    
    const lines = this.doc.splitTextToSize(text, this.contentWidth - 6);
    lines.forEach((line: string, index: number) => {
      if (index > 0) this.checkPageBreak(5);
      this.doc.text(line, this.margin + 6, this.y);
      this.y += 4.5;
    });
    this.y += 1.5;
  }

  addTable(headers: string[], rows: string[][], colWidths: number[]) {
    const rowHeight = 7.5;
    const blockHeight = (rows.length + 1) * rowHeight + 4;
    
    this.checkPageBreak(blockHeight);
    
    // Draw Table Header
    this.doc.setFillColor(241, 245, 249); // slate-100
    this.doc.rect(this.margin, this.y, this.contentWidth, rowHeight, "F");
    
    // Draw Header Text
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(8);
    this.doc.setTextColor(51, 65, 85); // slate-700
    
    let currentX = this.margin;
    headers.forEach((h, idx) => {
      this.doc.text(h, currentX + 3, this.y + 4.8);
      currentX += colWidths[idx];
    });
    this.y += rowHeight;
    
    // Draw rows
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(71, 85, 105); // slate-600
    
    rows.forEach((row, rIdx) => {
      // Zebra stripe backgrounds
      if (rIdx % 2 === 1) {
        this.doc.setFillColor(248, 250, 252); // slate-50
        this.doc.rect(this.margin, this.y, this.contentWidth, rowHeight, "F");
      }
      
      let rowX = this.margin;
      row.forEach((cell, cIdx) => {
        const truncated = this.doc.splitTextToSize(cell, colWidths[cIdx] - 4)[0] || "";
        this.doc.text(truncated, rowX + 3, this.y + 4.8);
        rowX += colWidths[cIdx];
      });
      
      // Draw bottom horizontal border
      this.doc.setDrawColor(241, 245, 249);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, this.y + rowHeight, this.margin + this.contentWidth, this.y + rowHeight);
      
      this.y += rowHeight;
    });
    this.y += 4;
  }

  addDecorations() {
    const totalPages = (this.doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      
      // Header text
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(148, 163, 184); // slate-400
      this.doc.text("CAREERPILOT INTELLIGENCE SYSTEM", this.margin, 12);
      this.doc.text("CONFIDENTIAL PERFORMANCE BRIEFING", this.pageWidth - this.margin - 58, 12);
      
      // Header line
      this.doc.setDrawColor(226, 232, 240); // slate-200
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, 14, this.pageWidth - this.margin, 14);

      // Footer line
      this.doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);
      
      // Footer text
      this.doc.text(`Page ${i} of ${totalPages}`, this.pageWidth - this.margin - 16, this.pageHeight - 11);
      this.doc.text("GENERATED DYNAMICALLY BY THE CAREERPILOT MULTI-AGENT AUTOPILOT ENGINE", this.margin, this.pageHeight - 11);
    }
  }

  download(filename: string) {
    this.addDecorations();
    this.doc.save(filename);
  }
}

export function exportWeeklyReportPDF(
  profile: UserProfile,
  roadmaps: RoadmapItem[],
  applications: JobApplication[],
  report: WeeklyReport | undefined
) {
  const helper = new PDFReportHelper();
  const weekTitle = report ? report.weekRange : "Current Active Week";

  // Page 1: Header & Executive summary
  helper.addTitle("Weekly Performance Audit Report");
  
  helper.addMetadata("Audit Window", weekTitle);
  helper.addMetadata("Report Type", "Autonomous Intelligence Compilation");
  helper.addMetadata("Execution Date", new Date().toLocaleDateString());
  helper.addSpacing(5);

  helper.addHeading1("1. Executive Summary & Audit Feedback");
  const summary = report ? report.summary : "No automated audit summary compiled yet.";
  helper.addQuote(summary);

  helper.addHeading2("Core Performance Indicators:");
  const learningHours = report ? report.learningHours : 0;
  const interviewsCount = report ? report.interviewsCount : 0;
  helper.addBullet(`Weekly Active Study Time: ${learningHours} hours`);
  helper.addBullet(`Mock Auditions Conducted: ${interviewsCount} sessions`);
  helper.addBullet(`Active Skills Portfolio: ${profile.skills.join(", ")}`);
  if (profile.certifications.length > 0) {
    helper.addBullet(`Certified Credentials: ${profile.certifications.join(", ")}`);
  }
  helper.addSpacing(4);

  // Section 2: Roadmaps
  helper.addHeading1("2. Learning Roadmaps Progress");
  if (roadmaps.length === 0) {
    helper.addBullet("No active learning roadmaps registered in current cycle.");
  } else {
    const headers = ["Roadmap Subject", "Current Status", "Study Resources"];
    const colWidths = [85, 45, 40]; // sum = 170 mm
    const rows = roadmaps.map(r => {
      const statusMap = {
        not_started: "Not Started",
        in_progress: "In Progress",
        completed: "Completed"
      };
      const statusStr = statusMap[r.status] || r.status;
      const resourceCount = r.resources ? r.resources.length : 0;
      return [r.title, statusStr, `${resourceCount} items`];
    });
    helper.addTable(headers, rows, colWidths);
  }

  // Section 3: Applications Pipeline
  helper.addHeading1("3. Job Application Pipeline");
  if (applications.length === 0) {
    helper.addBullet("No active job applications found in tracking systems.");
  } else {
    const headers = ["Organization", "Role", "Status", "Context Notes"];
    const colWidths = [40, 45, 35, 50]; // sum = 170 mm
    const rows = applications.map(app => {
      const statusStr = app.status.charAt(0).toUpperCase() + app.status.slice(1);
      return [app.company, app.role, statusStr, app.notes || "N/A"];
    });
    helper.addTable(headers, rows, colWidths);
  }

  // Section 4: Skill growth
  helper.addHeading1("4. Skill Growth & Velocity Metrics");
  if (report && report.skillGrowth && report.skillGrowth.length > 0) {
    const headers = ["Skill Subject Matrix", "Growth Acceleration Percentage"];
    const colWidths = [90, 80];
    const rows = report.skillGrowth.map(g => [g.skill, `+${g.increase}% Skill Velocity`]);
    helper.addTable(headers, rows, colWidths);
  } else {
    helper.addBullet("No incremental skill growth parsed in this weekly cycle. Practice mock interviews to log updates.");
  }

  // Section 5: Recommendations
  helper.addHeading1("5. Tactical Roadmap Suggestions");
  const suggestions = report && report.suggestions && report.suggestions.length > 0 
    ? report.suggestions 
    : [
        "Complete a mock interview trial to gather interactive communication evaluations.",
        "Submit your latest resume draft to the ATS Resume Analyzer to gather formatting feedback.",
        "Add certified credentials to increase target alignment metrics."
      ];
  
  suggestions.forEach((sug, idx) => {
    helper.addBullet(`${idx + 1}. ${sug}`);
  });

  // Save the PDF file
  const filename = `careerpilot_weekly_report_${weekTitle.toLowerCase().replace(/ /g, "_").replace(/,/g, "")}.pdf`;
  helper.download(filename);
}
