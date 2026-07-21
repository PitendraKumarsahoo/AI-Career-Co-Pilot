/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { 
  Calendar, 
  Bell, 
  FileEdit, 
  Clock, 
  Hourglass, 
  CheckCircle, 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  Award,
  Download,
  FileText
} from "lucide-react";
import { NotificationItem, WeeklyReport, UserProfile, RoadmapItem, JobApplication } from "../types";
import { generateWeeklyReportMarkdown, exportWeeklyReportPDF } from "../utils/reportGenerator";

interface SchedulerPanelProps {
  notifications: NotificationItem[];
  weeklyReports: WeeklyReport[];
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
  profile: UserProfile;
  roadmaps: RoadmapItem[];
  applications: JobApplication[];
}

export default function SchedulerPanel({
  notifications,
  weeklyReports,
  onMarkNotificationRead,
  onClearNotifications,
  profile,
  roadmaps,
  applications
}: SchedulerPanelProps) {
  const [activeReportIdx, setActiveReportIdx] = useState(0);
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Urgent' | 'Interview Prep' | 'General'>('All');

  const getNotificationPriority = (not: NotificationItem): 'Urgent' | 'Interview Prep' | 'General' => {
    if (not.priority) return not.priority;
    const titleLower = not.title.toLowerCase();
    const contentLower = not.content.toLowerCase();
    
    if (
      titleLower.includes("urgent") || 
      titleLower.includes("danger") || 
      titleLower.includes("immediately") || 
      titleLower.includes("deadline") || 
      titleLower.includes("missing") ||
      contentLower.includes("urgent") ||
      contentLower.includes("immediately") ||
      contentLower.includes("deadline")
    ) {
      return "Urgent";
    }
    
    if (
      titleLower.includes("interview") || 
      titleLower.includes("prep") || 
      titleLower.includes("mock") || 
      titleLower.includes("technical") || 
      titleLower.includes("coding") ||
      contentLower.includes("interview") ||
      contentLower.includes("prep") ||
      contentLower.includes("mock")
    ) {
      return "Interview Prep";
    }
    
    return "General";
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(not => {
      const priority = getNotificationPriority(not);
      if (priorityFilter === 'All') return true;
      return priority === priorityFilter;
    });
  }, [notifications, priorityFilter]);

  const selectedReport = weeklyReports[activeReportIdx] || weeklyReports[0];

  const handleDownloadMarkdown = () => {
    if (!selectedReport) return;
    const mdContent = generateWeeklyReportMarkdown(profile, roadmaps, applications, selectedReport);
    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = `careerpilot_report_${selectedReport.weekRange.replace(/ /g, "_").replace(/,/g, "")}.md`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    if (!selectedReport) return;
    exportWeeklyReportPDF(profile, roadmaps, applications, selectedReport);
  };

  return (
    <div id="scheduler-panel" className="flex-1 overflow-y-auto p-6 bg-transparent text-slate-100 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight text-white flex items-center gap-2">
          <span className="text-gradient-purple-sky">Scheduler & Reports Agent</span> <Calendar className="w-7 h-7 text-sky-400 animate-pulse" />
        </h2>
        <p className="text-slate-400 text-sm font-sans">
          Review automated weekly performance audits, log hours, and track scheduler agent reminders.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNS 1 & 2: Reports (Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-card rounded-2xl p-5 flex flex-col gap-5 shadow-lg">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400">ANALYTICS AGENT PERFORMANCE PORTAL</span>
                <h3 className="text-lg font-display font-bold text-white">Weekly Performance Audit Reports</h3>
              </div>
              
              {/* Report selector & Export actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {weeklyReports.length > 1 && (
                  <div className="flex gap-1 border border-white/5 bg-white/[0.02] p-1 rounded-xl">
                    {weeklyReports.map((r, idx) => (
                      <button
                        key={r.id}
                        onClick={() => setActiveReportIdx(idx)}
                        className={`text-[10px] font-mono px-2 py-1 rounded-lg transition cursor-pointer ${
                          activeReportIdx === idx 
                            ? "bg-sky-500/10 border border-sky-500/30 text-sky-400" 
                            : "bg-transparent border border-transparent text-slate-400 hover:text-white"
                        }`}
                      >
                        Week {idx + 1}
                      </button>
                    ))}
                  </div>
                )}

                {selectedReport && (
                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={handleDownloadPDF}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-purple-500 to-sky-500 hover:from-purple-600 hover:to-sky-600 text-white rounded-xl border border-white/10 hover:border-white/20 transition duration-200 cursor-pointer shadow-sm hover:shadow-purple-500/20"
                      title="Export Comprehensive PDF Audit Report"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={handleDownloadMarkdown}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/10 transition cursor-pointer"
                      title="Download Markdown Summary"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>MD</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {selectedReport ? (
              <div className="flex flex-col gap-5">
                {/* Statistics panel inside */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="glass-card-purple p-3 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono text-slate-400 block">STUDY COMPLETED</span>
                      <span className="text-sm font-bold font-mono text-white">{selectedReport.learningHours} Hours</span>
                    </div>
                  </div>

                  <div className="glass-card-purple p-3 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                      <Hourglass className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono text-slate-400 block">MOCK INTERVIEWS</span>
                      <span className="text-sm font-bold font-mono text-white">{selectedReport.interviewsCount} Sessions</span>
                    </div>
                  </div>

                  <div className="glass-card p-3 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono text-slate-400 block">AUDIT WINDOW</span>
                      <span className="text-xs font-semibold text-slate-300 font-mono">{selectedReport.weekRange}</span>
                    </div>
                  </div>
                </div>

                {/* Narrative Summary */}
                <div className="bg-slate-950/30 p-4 rounded-xl border border-white/10">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">AUDIT SUMMARY & FEEDBACK</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{selectedReport.summary}</p>
                </div>

                {/* Skill gains progress indicator */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono uppercase text-slate-500">SKILL VELOCITY GROWTH INDEX</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedReport.skillGrowth.map((g, i) => (
                      <div key={i} className="glass-card p-3 rounded-xl flex justify-between items-center">
                        <span className="text-xs font-semibold text-white font-sans">{g.skill}</span>
                        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/20 font-bold">
                          +{g.increase}% Skill Growth
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next cycle suggestions */}
                <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono uppercase text-sky-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Next Cycle Recommendations
                  </span>
                  <ul className="flex flex-col gap-1.5">
                    {selectedReport.suggestions.map((sug, i) => (
                      <li key={i} className="text-xs text-slate-300 flex gap-2">
                        <span className="text-sky-400 font-mono font-bold">{i+1}.</span>
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">No analytics audits calculated yet.</p>
            )}
          </div>
        </div>

        {/* COLUMN 3: Scheduler alert notifications */}
        <div className="flex flex-col gap-4">
          <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider text-slate-400">
                <Bell className="w-4 h-4 text-sky-400 animate-pulse" /> Reminders Queue
              </h3>

              {notifications.length > 0 && (
                <button
                  onClick={onClearNotifications}
                  className="text-[9px] font-mono text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  CLEAR ALL
                </button>
              )}
            </div>

            {/* Priority-based filter buttons */}
            {notifications.length > 0 && (
              <div className="flex flex-wrap gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                {(["All", "Urgent", "Interview Prep", "General"] as const).map((filter) => {
                  const count = notifications.filter(n => {
                    const p = getNotificationPriority(n);
                    return filter === "All" || p === filter;
                  }).length;

                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setPriorityFilter(filter)}
                      className={`text-[9px] font-mono px-2 py-1 rounded-lg cursor-pointer font-bold transition flex items-center gap-1 capitalize ${
                        priorityFilter === filter
                          ? "bg-sky-500/10 border border-sky-500/20 text-sky-400"
                          : "bg-transparent border border-transparent text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>{filter === "Interview Prep" ? "Interview" : filter}</span>
                      <span className="text-[8px] bg-white/5 px-1 py-0.2 rounded-full">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {filteredNotifications.length === 0 ? (
              <div className="border border-dashed border-white/10 py-12 rounded-xl text-center flex flex-col items-center justify-center gap-1">
                <CheckCircle className="w-8 h-8 text-slate-700" />
                <span className="text-xs text-slate-500 mt-1">No alerts found in filter</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto">
                {filteredNotifications.map((not) => {
                  const priority = getNotificationPriority(not);
                  return (
                    <div 
                      key={not.id} 
                      className={`p-3 rounded-xl border flex flex-col gap-1.5 transition ${
                        not.read 
                          ? "bg-white/[0.01] border-white/5 text-slate-400" 
                          : "bg-white/10 border-white/10 text-slate-200 shadow-sm"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[11px] font-bold text-white leading-snug">{not.title}</span>
                        {!not.read && (
                          <button
                            onClick={() => onMarkNotificationRead(not.id)}
                            className="text-[8px] font-mono uppercase bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 px-1.5 py-0.5 rounded cursor-pointer flex-shrink-0"
                          >
                            DISMISS
                          </button>
                        )}
                      </div>
                      
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{not.content}</p>
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                          priority === 'Urgent' 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                            : priority === 'Interview Prep' 
                            ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
                            : 'bg-slate-500/10 border-white/5 text-slate-400'
                        }`}>
                          {priority}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {new Date(not.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
