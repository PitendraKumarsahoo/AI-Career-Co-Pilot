/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Brain, 
  FileText, 
  GraduationCap, 
  CheckCircle, 
  XCircle, 
  Plus, 
  ArrowRight, 
  AlertCircle,
  TrendingUp,
  Sparkles,
  HelpCircle,
  Calendar,
  Trophy,
  Coffee,
  Sun,
  Zap,
  CheckSquare,
  Smile,
  Heart,
  Activity,
  ChevronRight,
  Check,
  BookOpen,
  Award,
  Cpu
} from "lucide-react";
import SubmissionReadinessModal from "./SubmissionReadinessModal";
import { Memory, Project, UserProfile, RoadmapItem, InterviewSession, NotificationItem, WeeklyReport, JobApplication, ResumeAnalysis } from "../types";
import WinningOptimizationEngine from "./WinningOptimizationEngine";
import WinningScoreTracker from "./analytics/WinningScoreTracker";
import SkillRadarChart from "./analytics/SkillRadarChart";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import WeeklyGoals from "./WeeklyGoals";
import SuccessRateChart from "./SuccessRateChart";

interface DashboardProps {
  profile: UserProfile;
  memories: Memory[];
  roadmaps: RoadmapItem[];
  notifications: NotificationItem[];
  approvals: any[];
  onAddMemory: (content: string, type: 'episodic' | 'semantic' | 'preference', importance: number, category: string) => Promise<any>;
  onHandleApproval: (approvalId: string, action: 'approve' | 'reject') => void;
  isSimulator: boolean;
  onRefreshState: () => void;
  applications: JobApplication[];
  resumeAnalysis: ResumeAnalysis | null;
  weeklyReports: WeeklyReport[];
  onUpdateProfile: (profile: UserProfile) => Promise<void>;
  onTriggerToast?: (message: string, type: 'milestone' | 'task' | 'success' | 'info') => void;
}

export default function Dashboard({
  profile,
  memories,
  roadmaps,
  notifications,
  approvals,
  onAddMemory,
  onHandleApproval,
  isSimulator,
  onRefreshState,
  applications,
  resumeAnalysis,
  weeklyReports,
  onUpdateProfile,
  onTriggerToast
}: DashboardProps) {
  // Memory Input Form State
  const [weeklyViewTab, setWeeklyViewTab] = useState<"current" | "trends">("current");
  const [newLog, setNewLog] = useState("");
  const [logType, setLogType] = useState<'episodic' | 'semantic' | 'preference'>('episodic');
  const [logImportance, setLogImportance] = useState(7);
  const [logCategory, setLogCategory] = useState("Daily Log");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [triggerNotification, setTriggerNotification] = useState<any>(null);

  // Focus Timer state
  const [timerSeconds, setTimerSeconds] = useState(1500); // 25 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const [hasTriggeredCompletionToast, setHasTriggeredCompletionToast] = useState(false);
  const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false);

  React.useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (timerMode === "focus") {
              setTimerMode("break");
              setTimerSeconds(300); // 5 minute break
              if (onTriggerToast) {
                const careerTips = [
                  "💡 AI Career Tip: Align your skills matrix to Google's standards by solving 2 concurrency tasks.",
                  "💡 AI Career Tip: Add clear metrics and technology tags to your EcoTrack project for ATS optimization.",
                  "💡 AI Career Tip: Mock interviewing is 3x more effective when using STAR-formatted responses.",
                  "💡 AI Career Tip: Take a 5-minute break now to stretch and refresh your cognitive focus reserves!",
                  "💡 AI Career Tip: Maintain deep focus on a single subject for 25-minute blocks to optimize memory retention."
                ];
                const randomTip = careerTips[Math.floor(Math.random() * careerTips.length)];
                onTriggerToast(`⏱️ Focus Block Completed! ${randomTip}`, "milestone");
              }
            } else {
              setTimerMode("focus");
              setTimerSeconds(1500);
              if (onTriggerToast) {
                onTriggerToast("⏱️ Break finished! Time to dive back into hyper-focus work.", "success");
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerMode, onTriggerToast]);

  // Daily Check-in & Morning Brief Synthesis State
  const [selectedMood, setSelectedMood] = React.useState<string>("");
  const [energyLevel, setEnergyLevel] = React.useState<number>(5);
  const [dailyFocusText, setDailyFocusText] = React.useState<string>("");
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = React.useState<boolean>(false);
  const [isEditingCheckIn, setIsEditingCheckIn] = React.useState<boolean>(false);

  const [isSynthesizingBrief, setIsSynthesizingBrief] = React.useState<boolean>(false);
  const [briefSynthesizedAt, setBriefSynthesizedAt] = React.useState<string>("");
  const [liveBriefContent, setLiveBriefContent] = React.useState<any>(null);

  const checkInMemories = memories.filter(m => m.category === "Daily Check-in");
  const latestCheckIn = checkInMemories.length > 0 
    ? [...checkInMemories].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
    : null;

  const hasCheckedInToday = latestCheckIn 
    ? new Date(latestCheckIn.timestamp).toDateString() === new Date().toDateString()
    : false;

  // React-based memoized moods list
  const MOODS = [
    { value: "Productive (Hyper-Focused)", label: "Focused", icon: Zap },
    { value: "Energetic (High Drive)", label: "Energetic", icon: Sun },
    { value: "Calm & Balanced", label: "Balanced", icon: Heart },
    { value: "Fatigued (Low Energy)", label: "Fatigued", icon: Coffee },
    { value: "Stressed / Blocked", label: "Stressed", icon: AlertCircle }
  ];

  // Auto-sync Morning Brief content on data modifications
  React.useEffect(() => {
    const mood = latestCheckIn 
      ? (latestCheckIn.content.includes("Mood is ") 
          ? latestCheckIn.content.split("Mood is ")[1].split(",")[0] 
          : "Balanced") 
      : "Unknown";
    
    let commandText = "Review active roadmaps and log your daily study goals.";
    let themeTitle = "Systematic Progression";
    if (mood.toLowerCase().includes("productive") || mood.toLowerCase().includes("energy")) {
      commandText = "Excellent energy profile. Complete 2 advanced coding challenges and practice a mock interview.";
      themeTitle = "Hyper-velocity Execution";
    } else if (mood.toLowerCase().includes("stressed") || mood.toLowerCase().includes("block")) {
      commandText = "Blockers detected. Use CareerPanel skill alignment to review gaps or schedule a lighter check-in task.";
      themeTitle = "Pragmatic Mitigation";
    } else if (mood.toLowerCase().includes("fatigue") || mood.toLowerCase().includes("low")) {
      commandText = "Recovery recommended today. Read saved preferences or audit minor application pipeline fields.";
      themeTitle = "Cognitive Conservation";
    }

    setLiveBriefContent({
      executiveSummary: `Cognitive vector syncing completed. Based on ${memories.length} memories, you are maintaining high alignment to your target role.`,
      signals: [
        `Logged sentiment state: "${mood}"`,
        `Roadmaps currently tracked: ${roadmaps.length} with ${roadmaps.filter(r => r.status === 'completed').length} finalized subjects`,
        `Active funnel contains ${applications.filter(a => a.status === 'interviewing').length} interviews and ${applications.filter(a => a.status === 'interested').length} leads`
      ],
      command: commandText,
      theme: themeTitle,
      score: Math.min(98, 75 + memories.length + roadmaps.filter(r => r.status === 'completed').length * 4)
    });
    setBriefSynthesizedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [memories.length, roadmaps.length, applications.length, latestCheckIn]);

  const handleEditCheckInClick = () => {
    if (latestCheckIn) {
      const content = latestCheckIn.content;
      let moodStr = "";
      if (content.includes("Mood is ")) {
        moodStr = content.split("Mood is ")[1].split(",")[0];
      }
      let energyVal = 5;
      if (content.includes("Energy: ")) {
        energyVal = parseInt(content.split("Energy: ")[1].split("/")[0]) || 5;
      }
      let focusStr = "";
      if (content.includes("Focus/Blocker: ")) {
        focusStr = content.split("Focus/Blocker: ")[1] || "";
      }
      setSelectedMood(moodStr);
      setEnergyLevel(energyVal);
      setDailyFocusText(focusStr);
    }
    setIsEditingCheckIn(true);
  };

  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) {
      alert("Please select a mood or mental focus state.");
      return;
    }
    setIsSubmittingCheckIn(true);
    try {
      const content = `Daily Check-in: Mood is ${selectedMood}, Energy: ${energyLevel}/10. Focus/Blocker: ${dailyFocusText || "None specified."}`;
      await onAddMemory(content, 'episodic', energyLevel, "Daily Check-in");
      setIsEditingCheckIn(false);
      if (onTriggerToast) {
        onTriggerToast("🧘 Daily Check-in logged as an episodic memory!", "success");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  const generateLiveBrief = () => {
    setIsSynthesizingBrief(true);
    setTimeout(() => {
      const mood = latestCheckIn 
        ? (latestCheckIn.content.includes("Mood is ") 
            ? latestCheckIn.content.split("Mood is ")[1].split(",")[0] 
            : "Balanced") 
        : (selectedMood || "Balanced");
      
      let commandText = "Review active roadmaps and log your daily study goals.";
      let themeTitle = "Systematic Progression";
      if (mood.toLowerCase().includes("productive") || mood.toLowerCase().includes("energy")) {
        commandText = "Excellent energy profile. Complete 2 advanced coding challenges and practice a mock interview.";
        themeTitle = "Hyper-velocity Execution";
      } else if (mood.toLowerCase().includes("stressed") || mood.toLowerCase().includes("block")) {
        commandText = "Blockers detected. Use CareerPanel skill alignment to review gaps or schedule a lighter check-in task.";
        themeTitle = "Pragmatic Mitigation";
      } else if (mood.toLowerCase().includes("fatigue") || mood.toLowerCase().includes("low")) {
        commandText = "Recovery recommended today. Read saved preferences or audit minor application pipeline fields.";
        themeTitle = "Cognitive Conservation";
      }

      setLiveBriefContent({
        executiveSummary: `Real-time multi-agent controller re-synthesized. Deep scans match your skill matrices to ${profile.targetRole || "target roles"}.`,
        signals: [
          `Logged sentiment state: "${mood}" (Energy: ${latestCheckIn ? latestCheckIn.importance : energyLevel}/10)`,
          `Active learning track: ${roadmaps.length > 0 ? roadmaps[0].title : "General Engineering"}`,
          `Funnels updated with ${applications.filter(a => a.status === 'offered').length} secured offers`
        ],
        command: commandText,
        theme: themeTitle,
        score: Math.min(99, 78 + memories.length + roadmaps.filter(r => r.status === 'completed').length * 4)
      });
      setIsSynthesizingBrief(false);
      setBriefSynthesizedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (onTriggerToast) {
        onTriggerToast("🧠 Morning Brief successfully synthesized and updated!", "success");
      }
    }, 1200);
  };

  const handleSubmitMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.trim()) return;
    setIsSubmitting(true);
    setTriggerNotification(null);
    try {
      const response = await onAddMemory(newLog, logType, logImportance, logCategory);
      setNewLog("");
      if (response && response.triggers) {
        setTriggerNotification(response.triggers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute stats
  const totalMemories = memories.length;
  const semanticCount = memories.filter(m => m.type === 'semantic').length;
  const episodicCount = memories.filter(m => m.type === 'episodic').length;
  const activeRoadmaps = roadmaps.filter(r => r.status === 'in_progress').length;
  const pendingApprovals = approvals.filter(a => a.status === 'pending').length;

  // Compute Job Application Milestones relative to user targets
  const appliedCount = applications.filter(a => a.status !== 'interested').length;
  const completedRoadmaps = roadmaps.filter(r => r.status === 'completed').length;
  const interviewingCount = applications.filter(a => a.status === 'interviewing' || a.status === 'offered').length;
  const offersCount = applications.filter(a => a.status === 'offered').length;

  const currentPoints = Math.min(5, appliedCount) + Math.min(3, completedRoadmaps) + Math.min(2, interviewingCount) + Math.min(1, offersCount);
  const maxPoints = 11;
  const overallProgress = (currentPoints / maxPoints) * 100;

  return (
    <div id="dashboard-panel" className="flex-1 overflow-y-auto p-6 bg-transparent text-slate-100 flex flex-col gap-6">
      {/* Hackathon Submission Readiness Modal */}
      <SubmissionReadinessModal
        isOpen={isReadinessModalOpen}
        onClose={() => setIsReadinessModalOpen(false)}
        onTriggerToast={onTriggerToast}
      />

      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-gradient-purple-sky">Career Intelligence Center</span> <Sparkles className="w-5 h-5 text-sky-400 animate-pulse" />
          </h2>
          <p className="text-slate-400 text-sm font-sans">
            Autonomous multi-agent controller orchestrating memory models and learning matrices.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Prominent Tech Stack Indicator for Hackathon Judges */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 via-sky-500/20 to-purple-500/20 border border-purple-500/30 px-3.5 py-2 rounded-xl text-xs text-purple-200 shadow-lg shadow-purple-900/20 font-sans">
            <Cpu className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
            <span className="font-bold text-white">Built with Codex & GPT-5.6</span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">| OpenAI Build Week</span>
          </div>

          {/* Submission Readiness Hub Button */}
          <button
            onClick={() => setIsReadinessModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-purple-400/40 shadow-lg shadow-purple-900/40 transition cursor-pointer font-sans"
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span>Submission Readiness Hub</span>
          </button>

          {/* Focus Timer Badge */}
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl text-xs text-white">
            <span className="font-mono text-slate-400">{timerMode === "focus" ? "🎯 Focus Session" : "🧘 Mindful Break"}:</span>
            <span className="font-mono font-bold text-sky-400 text-sm">
              {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
            </span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 font-bold px-2 py-1 rounded border border-sky-500/20 text-[10px] transition cursor-pointer font-sans"
            >
              {isTimerRunning ? "Pause" : "Start"}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerMode("focus");
                setTimerSeconds(1500);
              }}
              className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-2 py-1 rounded border border-white/10 text-[10px] transition cursor-pointer font-sans"
            >
              Reset
            </button>
            <button
              onClick={() => {
                const tips = [
                  "Align your skills matrix to Google's standards by solving 2 concurrency tasks.",
                  "Add clear metrics and technology tags to your EcoTrack project for ATS optimization.",
                  "Mock interviewing is 3x more effective when using STAR-formatted responses.",
                  "Take a 5-minute break now to stretch and refresh your cognitive focus reserves!",
                  "Maintain deep focus on a single subject for 25-minute blocks to optimize memory retention."
                ];
                const tip = tips[Math.floor(Math.random() * tips.length)];
                if (onTriggerToast) {
                  onTriggerToast(`💡 AI Career Tip: ${tip}`, "info");
                }
              }}
              title="Get a quick AI Career Tip"
              className="p-1 text-amber-400 hover:text-amber-300 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
            </button>
          </div>

          {/* Dynamic Warning if in Simulator Mode */}
          {isSimulator && (
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Simulator Mode: Standard rules apply offline</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {/* Memory Stats Widget */}
        <div className="glass-card glass-card-hover p-4 rounded-2xl flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Persistent Memories</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-sans text-white">{totalMemories}</span>
              <span className="text-[10px] text-sky-400 font-mono">({semanticCount}S / {episodicCount}E)</span>
            </div>
            <span className="text-[10px] text-slate-500">Cross-session retention active</span>
          </div>
          <div className="p-3 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
            <Brain className="w-5 h-5" />
          </div>
        </div>

        {/* Resume ATS Score Widget */}
        <div className="glass-card glass-card-hover p-4 rounded-2xl flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">ATS Score Matrix</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-sans text-white">74<span className="text-sm font-normal text-slate-500">/100</span></span>
              <span className="text-[10px] text-emerald-400 font-mono">+12 Growth</span>
            </div>
            <span className="text-[10px] text-slate-500">Google internship tier setup</span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Roadmap Progress */}
        <div className="glass-card glass-card-hover p-4 rounded-2xl flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Learning roadmaps</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-sans text-white">{activeRoadmaps}</span>
              <span className="text-[10px] text-indigo-400 font-mono">In Progress</span>
            </div>
            <span className="text-[10px] text-slate-500">Gap Analysis automated</span>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        {/* Approvals (Human-in-the-Loop) */}
        <div className="glass-card glass-card-hover p-4 rounded-2xl flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Human approvals</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-sans ${pendingApprovals > 0 ? "text-amber-400" : "text-slate-400"}`}>
                {pendingApprovals}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Pending Decisions</span>
            </div>
            <span className="text-[10px] text-slate-500">Guardian pipelines activated</span>
          </div>
          <div className={`p-3 rounded-xl border text-amber-400 ${pendingApprovals > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-white/5 border-white/10 text-slate-500"}`}>
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Profile Completion Calculation & Momentum Section */}
      {(() => {
        const profileCompletionFields = [
          { name: "Add Skills", value: profile.skills && profile.skills.length > 0 },
          { name: "Set Goals", value: profile.goals && profile.goals.length > 0 },
          { name: "Log Projects", value: profile.projects && profile.projects.length > 0 },
          { name: "List Preferred Companies", value: profile.preferredCompanies && profile.preferredCompanies.length > 0 },
          { name: "Identify Weak Areas", value: profile.weakSubjects && profile.weakSubjects.length > 0 },
          { name: "Add Certifications", value: profile.certifications && profile.certifications.length > 0 },
          { name: "Set Experience Level", value: !!profile.experienceLevel },
          { name: "Configure Target Role", value: !!profile.targetRole }
        ];
        const completedFieldCount = profileCompletionFields.filter(f => f.value).length;
        const profileCompletionPercentage = Math.round((completedFieldCount / profileCompletionFields.length) * 100);

        // Trigger a reward toast once 100% is reached
        React.useEffect(() => {
          if (profileCompletionPercentage === 100 && !hasTriggeredCompletionToast) {
            setHasTriggeredCompletionToast(true);
            if (onTriggerToast) {
              onTriggerToast("🏆 Profile Mastery Accomplished! You have completed 100% of your career profile matrix!", "milestone");
            }
          }
        }, [profileCompletionPercentage, onTriggerToast, hasTriggeredCompletionToast]);

        return (
          <div id="momentum-and-mastery-panel" className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 z-10 font-sans">
            
            {/* Today's Main Focus Task Card */}
            <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/5 relative overflow-hidden flex flex-col gap-4 lg:col-span-2">
              <div className="absolute top-0 right-0 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-sans tracking-tight">Today's Main Focus</h4>
                    <p className="text-[10px] text-slate-400 font-sans">Commit to and complete one mission-critical target today</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 flex-1">
                {profile.mainTaskToday ? (
                  <div className="flex flex-col gap-3 flex-1 justify-center">
                    <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex items-center justify-between gap-3 group relative">
                      <div className="flex items-center gap-3.5 flex-1">
                        <button
                          onClick={async () => {
                            const updated = {
                              ...profile,
                              mainTaskCompleted: !profile.mainTaskCompleted
                            };
                            await onUpdateProfile(updated);
                            if (!profile.mainTaskCompleted && onTriggerToast) {
                              onTriggerToast("🌟 Daily Focus Completed! You conquered today's main challenge!", "success");
                            }
                          }}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                            profile.mainTaskCompleted 
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                              : "border-white/20 hover:border-purple-400 text-transparent"
                          }`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <span className={`text-sm font-sans ${profile.mainTaskCompleted ? "line-through text-slate-500" : "text-white"}`}>
                          {profile.mainTaskToday}
                        </span>
                      </div>

                      <button
                        onClick={async () => {
                          const updated = {
                            ...profile,
                            mainTaskToday: "",
                            mainTaskCompleted: false
                          };
                          await onUpdateProfile(updated);
                        }}
                        className="text-[10px] font-mono text-slate-500 hover:text-red-400 cursor-pointer bg-white/5 px-2.5 py-1 rounded border border-white/10"
                      >
                        Clear Task
                      </button>
                    </div>
                  </div>
                ) : (
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const target = e.currentTarget as HTMLFormElement;
                      const input = target.elements.namedItem("mainTask") as HTMLInputElement;
                      if (!input.value.trim()) return;
                      const updated = {
                        ...profile,
                        mainTaskToday: input.value.trim(),
                        mainTaskCompleted: false
                      };
                      await onUpdateProfile(updated);
                      if (onTriggerToast) {
                        onTriggerToast("🎯 Today's Main Focus is set! Stay locked in.", "info");
                      }
                      target.reset();
                    }}
                    className="flex items-center gap-3 flex-1 justify-center"
                  >
                    <input
                      type="text"
                      name="mainTask"
                      placeholder="What is your single main priority today? (e.g. Prep Google Mock Interview)"
                      className="flex-1 bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-sans"
                    />
                    <button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-sans py-2.5 px-4 rounded-xl cursor-pointer transition shadow"
                    >
                      Set Focus
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Dynamic Profile Completion percentage ring */}
            <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/5 relative overflow-hidden flex flex-col gap-4">
              <div className="absolute top-0 right-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-sans tracking-tight">Profile Mastery</h4>
                    <p className="text-[10px] text-slate-400 font-sans">Trace your progress to 100% profile matrix</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 py-2 flex-1 justify-center">
                {/* SVG Progress Ring */}
                <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      className="stroke-slate-800"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      className="stroke-emerald-400 transition-all duration-1000 ease-out"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 34}
                      strokeDashoffset={2 * Math.PI * 34 * (1 - profileCompletionPercentage / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-sm font-mono font-bold text-white">
                    {profileCompletionPercentage}%
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-200">
                    {profileCompletionPercentage === 100 ? "Matrix Fully Sync'd" : "Keep Building Profile"}
                  </span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {profileCompletionPercentage === 100 
                      ? "Outstanding! You unlocked maximum judge readiness scoring." 
                      : `Complete ${profileCompletionFields.filter(f => !f.value).length} more field${profileCompletionFields.filter(f => !f.value).length > 1 ? "s" : ""} to reach 100% completion.`}
                  </p>
                </div>
              </div>

              {/* Missing Fields Helpers */}
              {profileCompletionPercentage < 100 && (
                <div className="flex flex-wrap gap-1 mt-1 border-t border-white/5 pt-3">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block w-full mb-1">Incomplete Fields:</span>
                  {profileCompletionFields.filter(f => !f.value).map((f) => (
                    <span key={f.name} className="text-[9px] font-sans bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/10">
                      + {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Daily Focus Center: Morning Brief & Daily Check-in */}
      <div id="daily-focus-center" className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0 z-10 font-sans">
        
        {/* Morning Brief Card */}
        <div id="morning-brief-card" className="glass-card rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-4 border border-white/5">
          <div className="absolute top-0 right-0 w-60 h-60 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-sans tracking-tight">AI Morning Brief</h4>
                <p className="text-[10px] text-slate-400 font-sans">Memory-compressed career intelligence summary</p>
              </div>
            </div>
            
            <button
              onClick={generateLiveBrief}
              disabled={isSynthesizingBrief}
              className="text-[10px] font-mono font-bold uppercase bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border border-sky-500/20 rounded-lg px-2.5 py-1.5 transition cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-sky-400" />
              {isSynthesizingBrief ? "Synthesizing..." : "Re-Synthesize"}
            </button>
          </div>

          {isSynthesizingBrief ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-sky-400 animate-pulse">Formulating memory structures...</span>
            </div>
          ) : liveBriefContent ? (
            <div className="flex flex-col gap-3.5">
              {/* Main executive summary with glassmorphic look */}
              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">STRATEGIC FOCUS THEME</span>
                  <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded border border-sky-400/20">
                    {liveBriefContent.theme}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-sans leading-relaxed">
                  {liveBriefContent.executiveSummary}
                </p>
              </div>

              {/* Key signals bullet list */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">24-Hour Cognitive Signals</span>
                <div className="flex flex-col gap-1.5">
                  {liveBriefContent.signals.map((sig: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-sans text-slate-300 leading-normal">
                      <ChevronRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <span>{sig}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable command */}
              <div className="border-t border-white/5 pt-3 mt-1 flex flex-col gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> AI Scheduler Queue Command:
                </span>
                <p className="text-xs text-slate-300 font-sans leading-relaxed bg-amber-500/5 border border-amber-500/10 rounded-xl p-2.5">
                  {liveBriefContent.command}
                </p>
              </div>

              {briefSynthesizedAt && (
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-600">
                  <span>COGNITIVE RATING: {liveBriefContent.score}/100</span>
                  <span>LAST UPDATED AT {briefSynthesizedAt}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/[0.01] border border-white/5 rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3">
              <Activity className="w-6 h-6 text-slate-600 animate-pulse" />
              <div className="flex flex-col gap-1">
                <p className="text-xs text-slate-300 font-bold font-sans">No synthesized brief found</p>
                <p className="text-[11px] text-slate-500 font-sans">
                  Click Re-Synthesize to scan active telemetry, mood inputs, and roadmap matrices.
                </p>
              </div>
              <button
                onClick={generateLiveBrief}
                className="mt-1 bg-sky-600 hover:bg-sky-500 text-white font-sans font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
              >
                Synthesize Morning Brief
              </button>
            </div>
          )}
        </div>

        {/* Daily Check-in Card */}
        <div id="daily-checkin-card" className="glass-card rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-4 border border-white/5">
          <div className="absolute top-0 right-0 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                <Smile className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-sans tracking-tight">Cognitive Daily Check-in</h4>
                <p className="text-[10px] text-slate-400 font-sans">Sync mind states with the recommendation engine</p>
              </div>
            </div>
            {hasCheckedInToday && !isEditingCheckIn && (
              <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Check className="w-3 h-3" /> Logged Today
              </span>
            )}
          </div>

          {!hasCheckedInToday || isEditingCheckIn ? (
            <form onSubmit={handleSubmitCheckIn} className="flex flex-col gap-4">
              {/* Mood Select Buttons */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Current Focus State</label>
                <div className="grid grid-cols-5 gap-2">
                  {MOODS.map(m => {
                    const Icon = m.icon;
                    const isSel = selectedMood === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setSelectedMood(m.value)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition cursor-pointer ${
                          isSel 
                            ? "bg-purple-500/15 border-purple-500/40 text-purple-300 ring-1 ring-purple-500/20" 
                            : "bg-white/[0.01] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSel ? 'text-purple-400 scale-110' : 'text-slate-400'}`} />
                        <span className="text-[9px] font-sans font-medium hidden sm:inline">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Energy Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Energy & Focus Reserves</label>
                  <span className="text-xs font-mono font-bold text-purple-300">{energyLevel}/10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={energyLevel} 
                  onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-950/60 rounded-lg appearance-none h-1.5 border border-white/5" 
                />
              </div>

              {/* Daily Focus input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Target Focus / Blockers today</label>
                <input 
                  type="text" 
                  value={dailyFocusText}
                  onChange={(e) => setDailyFocusText(e.target.value)}
                  placeholder="What are you hacking or preparing for today?"
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingCheckIn}
                className="w-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:opacity-50 text-white font-sans font-bold text-xs py-2 px-3 rounded-xl transition shadow-lg cursor-pointer mt-1"
              >
                {isSubmittingCheckIn ? "Logging Memory State..." : "Log Daily State Matrix"}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Completed State */}
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 font-sans">
                  <p className="text-xs text-emerald-300 font-bold font-sans">Cognitive State Sync Complete</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">
                    The AI Agent has processed your sentiment profile and adjusted current recommendation queues.
                  </p>
                </div>
              </div>

              {/* Brief check-in summary displayed */}
              {latestCheckIn && (
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2 font-sans">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 border-b border-white/5 pb-1.5">
                    <span>LOGGED AT {new Date(latestCheckIn.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span>EPISODIC ID: {latestCheckIn.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {latestCheckIn.content.includes("Mood is ") ? latestCheckIn.content.split("Mood is ")[1].split(",")[0] : "Balanced"}
                    </span>
                    <span className="text-[10px] font-mono text-sky-300 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      Energy {latestCheckIn.content.includes("Energy: ") ? latestCheckIn.content.split("Energy: ")[1].split(".")[0] : `${latestCheckIn.importance}/10`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-normal font-sans italic">
                    "{latestCheckIn.content.includes("Focus/Blocker: ") ? latestCheckIn.content.split("Focus/Blocker: ")[1] : "No blockers reported."}"
                  </p>
                </div>
              )}

              <button
                onClick={handleEditCheckInClick}
                className="w-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-sans font-bold text-xs py-2 px-3 rounded-xl border border-white/5 hover:border-white/10 transition cursor-pointer"
              >
                Adjust Today's Sentiment Check-in
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Career Goal & Application Milestones Tracker */}
      <div id="milestone-tracker-card" className="glass-card rounded-2xl p-6 shadow-xl relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
          <div>
            <h3 className="text-lg font-sans font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Career Milestones & Goal Progress
            </h3>
            <p className="text-slate-400 text-xs">
              Continuous tracker monitoring application cycles, mock interview reps, and curriculum completions relative to your prime career targets.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Goal Status:</span>
            <span className="text-xs font-mono font-bold bg-amber-400/10 text-amber-400 px-2.5 py-1 rounded-lg border border-amber-400/20">
              {Math.round(overallProgress)}% Completed
            </span>
          </div>
        </div>

        {/* Major Progress Bar */}
        <div className="w-full bg-slate-950/50 rounded-2xl p-1 border border-white/5 mb-6 relative">
          <div 
            className="h-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-amber-400 transition-all duration-1000 ease-out relative"
            style={{ width: `${Math.max(4, overallProgress)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-xl" />
          </div>
        </div>

        {/* Milestone Steps Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1: Applications */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200">1. Applied Target</span>
              <span className="text-xs font-mono font-bold text-sky-400">{appliedCount}/5</span>
            </div>
            <div className="w-full bg-slate-950/40 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-sky-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (appliedCount / 5) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 leading-normal">Submit at least 5 job application records</span>
          </div>

          {/* Step 2: Roadmaps Completed */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200">2. Skill Mastery</span>
              <span className="text-xs font-mono font-bold text-indigo-400">{completedRoadmaps}/3</span>
            </div>
            <div className="w-full bg-slate-950/40 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (completedRoadmaps / 3) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 leading-normal">Complete 3 personalized learning roadmap subjects</span>
          </div>

          {/* Step 3: Interviews Logged */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200">3. Live Auditions</span>
              <span className="text-xs font-mono font-bold text-purple-400">{interviewingCount}/2</span>
            </div>
            <div className="w-full bg-slate-950/40 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-purple-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (interviewingCount / 2) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 leading-normal">Advance to active interviewing status on 2 roles</span>
          </div>

          {/* Step 4: Offers Secured */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200">4. Secured Offers</span>
              <span className="text-xs font-mono font-bold text-amber-400">{offersCount}/1</span>
            </div>
            <div className="w-full bg-slate-950/40 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (offersCount / 1) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 leading-normal">Reach offered status on at least 1 job application</span>
          </div>
        </div>
      </div>

      {/* Dynamic Weekly Progress Section */}
      <div id="weekly-progress-aggregation-section" className="glass-card rounded-2xl p-6 shadow-xl border border-white/10 relative overflow-hidden flex flex-col gap-5">
        {/* Decorative background gradients */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />
              <span>Weekly Objective Aggregation Engine</span>
            </h3>
            <p className="text-slate-400 text-xs mt-1 font-sans">
              Calculates structural completion percentages against defined professional roadmap sub-tasks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View tab toggler */}
            <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setWeeklyViewTab("current")}
                className={`text-[10px] font-mono px-3 py-1.5 rounded-lg transition cursor-pointer font-bold uppercase ${
                  weeklyViewTab === "current" 
                    ? "bg-purple-500/15 border border-purple-500/35 text-purple-400" 
                    : "bg-transparent border border-transparent text-slate-400 hover:text-white"
                }`}
              >
                Current Sprint
              </button>
              <button
                type="button"
                onClick={() => setWeeklyViewTab("trends")}
                className={`text-[10px] font-mono px-3 py-1.5 rounded-lg transition cursor-pointer font-bold uppercase ${
                  weeklyViewTab === "trends" 
                    ? "bg-purple-500/15 border border-purple-500/35 text-purple-400" 
                    : "bg-transparent border border-transparent text-slate-400 hover:text-white"
                }`}
              >
                30-Day Trends
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl">
              <span className="text-slate-400">TOTAL TASKS COMPLETED:</span>
              <strong className="text-purple-400 font-bold">
                {(profile.weeklyGoals || []).reduce((acc, g) => acc + g.tasks.filter(t => t.completed).length, 0)}/
                {(profile.weeklyGoals || []).reduce((acc, g) => acc + g.tasks.length, 0)}
              </strong>
            </div>
          </div>
        </div>

        {(!profile.weeklyGoals || profile.weeklyGoals.length === 0) ? (
          <div className="border border-dashed border-white/10 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2 relative z-10">
            <Calendar className="w-8 h-8 text-slate-600" />
            <span className="text-xs text-slate-400 font-semibold">No active weekly objectives configured</span>
            <p className="text-[10px] text-slate-500 max-w-xs mt-0.5 leading-normal">
              Scroll down and add strategic goals under the "Weekly Objectives & Core Career Targets" section to begin tracing milestones.
            </p>
          </div>
        ) : weeklyViewTab === "trends" ? (
          /* TRENDS LINE CHART VIEW */
          <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 relative z-10 flex flex-col gap-4">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-bold">
                <TrendingUp className="w-4 h-4 text-purple-400" /> 30-Day Completion Rate Progression
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 font-sans">
                Traces your historical progress over 4 cycles, ending with the active live sprint. Completing objectives below moves the final point in real-time.
              </p>
            </div>

            <div className="w-full h-[240px] relative z-10 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={[
                    { name: "Week 1", rate: 45, label: "July 01" },
                    { name: "Week 2", rate: 60, label: "July 08" },
                    { name: "Week 3", rate: 75, label: "July 15" },
                    { 
                      name: "Week 4", 
                      rate: (() => {
                        const goals = profile.weeklyGoals || [];
                        let t = 0, c = 0;
                        goals.forEach(g => g.tasks.forEach(task => { t++; if (task.completed) c++; }));
                        return t > 0 ? Math.round((c / t) * 100) : 0;
                      })(), 
                      label: "Current Week" 
                    }
                  ]} 
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                    fontFamily="monospace"
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `${v}%`}
                    fontFamily="monospace"
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-xl flex flex-col gap-1 font-sans">
                            <span className="text-[10px] font-mono uppercase text-slate-400">{payload[0].payload.label}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                              <span className="text-xs font-bold text-white">Completion Rate: {payload[0].value}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#a855f7" 
                    strokeWidth={4} 
                    dot={{ r: 5, stroke: "#a855f7", strokeWidth: 2, fill: "#0f172a" }}
                    activeDot={{ r: 7, stroke: "#c084fc", strokeWidth: 2, fill: "#0f172a" }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Left Column: Huge progress indicator circle */}
            <div className="md:col-span-1 bg-white/[0.01] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 relative">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Aggregate completion</span>
              
              {(() => {
                const goals = profile.weeklyGoals || [];
                let total = 0;
                let completed = 0;
                goals.forEach(goal => {
                  goal.tasks.forEach(task => {
                    total++;
                    if (task.completed) completed++;
                  });
                });
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className="stroke-slate-900"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="40"
                          className="stroke-purple-500"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray="251.2"
                          initial={{ strokeDashoffset: 251.2 }}
                          animate={{ strokeDashoffset: 251.2 - (251.2 * percentage) / 100 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center font-sans">
                        <span className="text-2xl font-bold font-mono text-white tracking-tighter">{percentage}%</span>
                        <span className="text-[9px] text-slate-500 font-mono uppercase">WEEK PROGRESS</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>On schedule</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Right Column: List of sub-progress bars for each goal */}
            <div className="md:col-span-2 bg-white/[0.01] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                Strategic focus breakdowns
              </span>

              <div className="flex flex-col gap-3.5 max-h-[180px] overflow-y-auto pr-1">
                {(profile.weeklyGoals || []).map((goal) => {
                  const goalTotal = goal.tasks.length;
                  const goalCompleted = goal.tasks.filter(t => t.completed).length;
                  const goalPercentage = goalTotal > 0 ? Math.round((goalCompleted / goalTotal) * 100) : 0;
                  return (
                    <div key={goal.id} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono bg-white/5 text-slate-400 px-1.5 py-0.5 rounded uppercase">
                            {goal.category}
                          </span>
                          <span className="font-semibold text-slate-200 truncate max-w-[200px]">{goal.title}</span>
                        </div>
                        <span className="font-mono text-slate-400 text-[11px] font-semibold">{goalPercentage}%</span>
                      </div>
                      
                      {/* Individual Progress Bar */}
                      <div className="w-full h-2.5 bg-slate-950/40 rounded-full overflow-hidden border border-white/5 p-0.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${goalPercentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-full rounded-full ${goal.colorClass}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weekly Objectives & Top 3 Career Goals */}
      <WeeklyGoals profile={profile} onUpdateProfile={onUpdateProfile} onTriggerToast={onTriggerToast} />

      {/* Visual Analytics Hub (Weekly Success Rate Growth Curve) */}
      <SuccessRateChart weeklyReports={weeklyReports} />

      {/* Main Core Area: Left panel (Memory Logger, timeline), Right panel (Approvals, Profile stats) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
        
        {/* LEFT COLUMN: Memory Logger & Timeline (Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Autonomous Memory Logger */}
          <div className="glass-card rounded-2xl p-5 shadow-xl">
            <h3 className="font-display font-bold text-white mb-3 flex items-center gap-2 text-base">
              <Brain className="w-4 h-4 text-sky-400 animate-pulse" /> State Memory Autopilot Logger
            </h3>
            
            <form onSubmit={handleSubmitMemory} className="flex flex-col gap-4">
              <textarea
                value={newLog}
                onChange={(e) => setNewLog(e.target.value)}
                placeholder="Examples: 'I want to target a Google SWE Internship.' or 'I failed my TCS mock interview because of Java multithreading questions'..."
                className="w-full h-24 glass-input rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Type Selection */}
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Retention Type</label>
                  <select
                    value={logType}
                    onChange={(e: any) => setLogType(e.target.value)}
                    className="w-full glass-input rounded-lg px-2 py-1.5 text-xs text-slate-200"
                  >
                    <option value="episodic">Episodic (Event/Experience)</option>
                    <option value="preference">Preference (User Interest)</option>
                    <option value="semantic">Semantic (Core Fact)</option>
                  </select>
                </div>

                {/* Importance Rating */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-mono uppercase text-slate-400">Importance Rating</label>
                    <span className="text-[10px] font-mono text-sky-400 font-bold">{logImportance}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={logImportance}
                    onChange={(e) => setLogImportance(Number(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Log Category</label>
                  <input
                    type="text"
                    value={logCategory}
                    onChange={(e) => setLogCategory(e.target.value)}
                    placeholder="e.g. Interview, Weakness"
                    className="w-full glass-input rounded-lg px-2 py-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-slate-500">
                  Memory Agent processes updates automatically using context.
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting || !newLog.trim()}
                  className="flex items-center gap-1.5 glass-button-primary text-white font-medium text-xs py-2 px-4 rounded-xl disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isSubmitting ? "Orchestrating..." : "Feed Memory Engine"}
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Triggers Result Alert Box */}
            {triggerNotification && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-sky-500/5 border border-sky-500/30 rounded-xl"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-sky-500/10 rounded-lg text-sky-400 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Memory Agent Analysis Result</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      New record logged successfully. Semantic analyzer completed context alignment.
                    </p>
                    {triggerNotification.profileUpdated && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="text-[9px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded">
                          Profile Auto-Synced
                        </span>
                        {triggerNotification.updatedFields.map((field: string, idx: number) => (
                          <span key={idx} className="text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                            {field}
                          </span>
                        ))}
                      </div>
                    )}
                    {triggerNotification.proposedAction && (
                      <div className="mt-2 text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-300 p-2 rounded-lg">
                        <div className="font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Human-In-Loop Action Proposed:
                        </div>
                        <div className="mt-0.5 font-mono text-[9px] text-slate-300">{triggerNotification.proposedAction.title}</div>
                        <div className="mt-0.5 text-[9px] text-slate-400">{triggerNotification.proposedAction.description}</div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Persistent Career Timeline (Semantic Logs) */}
          <div className="glass-card rounded-2xl p-5 shadow-xl">
            <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Cross-Session Career Intelligence Timeline
            </h3>

            {memories.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No memories registered in system.</p>
            ) : (
              <div className="flex flex-col gap-4 pl-4 border-l border-white/10 relative">
                {memories.slice(0, 4).map((memory, index) => {
                  const isSynthesized = memory.id.startsWith("mem_comp_");
                  return (
                    <div key={memory.id} className="relative group">
                       {/* Timeline dot */}
                      <span className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border border-slate-950 ${
                        isSynthesized 
                          ? "bg-purple-500 ring-4 ring-purple-500/10" 
                          : memory.type === 'preference' 
                            ? "bg-sky-400" 
                            : "bg-slate-500"
                      }`} />
                      
                      <div className="bg-white/[0.02] hover:bg-white/[0.05] transition duration-200 border border-white/10 p-3 rounded-xl flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                            isSynthesized 
                              ? "bg-purple-500/10 border-purple-500/20 text-purple-300" 
                              : "bg-white/5 border-white/10 text-slate-400"
                          }`}>
                            {memory.category}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(memory.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{memory.content}</p>
                        
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>Importance: <strong className="text-slate-400 font-mono font-medium">{memory.importance}/10</strong></span>
                          <span>•</span>
                          <span className="capitalize font-mono text-[9px]">{memory.type} memory</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: approvals (Human in loop), Profile Snapshot */}
        <div className="flex flex-col gap-6">
          
          {/* Winning Score Tracker & Metric Validator */}
          <WinningScoreTracker 
            profile={profile}
            memories={memories}
            roadmaps={roadmaps}
            applications={applications}
            resumeAnalysis={resumeAnalysis}
            isSimulator={isSimulator}
          />

          {/* Winning Optimization Engine & Judge Simulator */}
          <WinningOptimizationEngine />
          
          {/* Human-in-the-Loop Decisions Box */}
          <div className="glass-card rounded-2xl p-5 shadow-xl">
            <h3 className="font-display font-bold text-white mb-3 flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400 animate-pulse" /> Human approvals queue
              </span>
              <span className="text-[10px] font-mono bg-amber-500/20 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded">
                HITL GUARDIAN
              </span>
            </h3>
            
            <p className="text-slate-400 text-xs mb-4">
              Autonomous agents propose roadmaps and scheduler setups based on user memory context. Make decisions below:
            </p>

            {approvals.filter(a => a.status === 'pending').length === 0 ? (
              <div className="border border-dashed border-white/10 p-6 rounded-xl text-center flex flex-col items-center justify-center gap-2">
                <CheckCircle className="w-6 h-6 text-slate-600" />
                <span className="text-xs text-slate-500">Approvals complete</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {approvals.filter(a => a.status === 'pending').map((appr) => (
                  <div key={appr.id} className="bg-white/[0.02] border border-white/10 p-3.5 rounded-xl flex flex-col gap-2 shadow">
                    <div>
                      <h4 className="text-xs font-semibold text-white">{appr.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">{appr.description}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => onHandleApproval(appr.id, 'approve')}
                        className="flex-1 flex items-center justify-center gap-1 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 text-xs py-1.5 rounded-lg cursor-pointer transition font-medium"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve Action
                      </button>
                      <button
                        onClick={() => onHandleApproval(appr.id, 'reject')}
                        className="flex-1 flex items-center justify-center gap-1 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs py-1.5 rounded-lg cursor-pointer transition"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skill Radar / Progress Gauges */}
          <div className="glass-card rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div>
              <h3 className="font-display font-bold text-white mb-1 flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4 text-sky-400" /> Skills Intelligence Gauge
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Multi-dimensional visualization of core proficiency metrics modeled using D3.js.
              </p>
            </div>

            {/* D3 Radar Chart component */}
            <SkillRadarChart skills={profile.skills} />

            <div className="flex flex-col gap-4">
              {/* Dynamic skills list mapped with project/certification history calculations */}
              <div className="flex flex-col gap-3">
                {profile.skills.slice(0, 5).map((skill) => {
                  // Calculate dynamic percentage based on associated projects and certifications
                  const skillLower = skill.toLowerCase();
                  let progressPoints = 20; // baseline

                  if (profile.projects) {
                    profile.projects.forEach(proj => {
                      const hasTech = proj.technologies?.some(t => t.toLowerCase().includes(skillLower));
                      const hasDesc = proj.description?.toLowerCase().includes(skillLower);
                      const hasName = proj.name?.toLowerCase().includes(skillLower);
                      if (hasTech || hasDesc || hasName) {
                        progressPoints += 25;
                      }
                    });
                  }

                  if (profile.certifications) {
                    profile.certifications.forEach(cert => {
                      if (cert.toLowerCase().includes(skillLower)) {
                        progressPoints += 20;
                      }
                    });
                  }

                  const score = Math.min(100, progressPoints);

                  return (
                    <div key={skill} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-medium">{skill}</span>
                        <span className="font-mono text-slate-400 text-[11px]">{score}% Mastery</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/10">
                        <div 
                          className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${score}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Weak Subject list */}
              <div className="pt-3 border-t border-white/10">
                <span className="text-xs font-semibold text-white block mb-2">Identified Weak Areas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.weakSubjects.map((subject) => (
                    <span key={subject} className="text-[10px] font-mono bg-red-500/10 border border-red-500/25 text-red-300 px-2 py-0.5 rounded-full">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
