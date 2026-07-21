/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import MemoryPanel from "./components/MemoryPanel";
import ResumePanel from "./components/ResumePanel";
import LearningPanel from "./components/LearningPanel";
import InterviewPanel from "./components/InterviewPanel";
import CareerPanel from "./components/CareerPanel";
import SchedulerPanel from "./components/SchedulerPanel";
import ConfettiCanvas from "./components/ConfettiCanvas";
import CommandPalette from "./components/CommandPalette";
import InactivityTracker from "./components/InactivityTracker";
import { 
  UserProfile, 
  Memory, 
  RoadmapItem, 
  JobApplication, 
  NotificationItem, 
  WeeklyReport, 
  ResumeAnalysis,
  SystemContext
} from "./types";
import { 
  Trophy, 
  Check, 
  Sparkles, 
  Compass, 
  X, 
  Keyboard 
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSimulator, setIsSimulator] = useState(true);
  const [apiKeyStatus, setApiKeyStatus] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'milestone' | 'task' | 'success' | 'info' }[]>([]);

  const [theme, setTheme] = useState<"dark" | "light">(
    () => (localStorage.getItem("theme") as "dark" | "light") || "dark"
  );

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  const handleTriggerToast = (message: string, type: 'milestone' | 'task' | 'success' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Alt + numbers for Tab Navigation
      if (e.altKey && e.key >= "1" && e.key <= "7") {
        e.preventDefault();
        const tabMap = ["dashboard", "memory", "resume", "learning", "interview", "career", "scheduler"];
        const index = parseInt(e.key) - 1;
        if (tabMap[index]) {
          setActiveTab(tabMap[index]);
          handleTriggerToast(`⚡ Routed via Hotkey to ${tabMap[index].toUpperCase()}`, "info");
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // Master State representing all modules
  const [profile, setProfile] = useState<UserProfile>({
    skills: ["TypeScript", "React", "Node.js", "Python"],
    goals: [],
    projects: [],
    preferredCompanies: [],
    weakSubjects: [],
    certifications: [],
    experienceLevel: "",
    targetRole: "Full-Stack Engineer"
  });
  const [memories, setMemories] = useState<Memory[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);

  // Resume Sub-state
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);

  // Learning Sub-state
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

  // Career Sub-state
  const [careerSuggestions, setCareerSuggestions] = useState<any>(null);
  const [isFetchingCareer, setIsFetchingCareer] = useState(false);

  // Memory Panel Sub-state
  const [isCompressingMemories, setIsCompressingMemories] = useState(false);
  const [compressionResult, setCompressionResult] = useState<string | null>(null);
  const [systemContext, setSystemContext] = useState<SystemContext | null>(null);

  // ----------------------------------------------------
  // DATA FETCHING & STATE SYNC
  // ----------------------------------------------------

  const fetchState = async () => {
    try {
      const res = await fetch("/api/state");
      const data = await res.json();
      if (data && data.success && data.state) {
        const s = data.state;
        setProfile(s.profile);
        setMemories(s.memories);
        setRoadmaps(s.roadmaps);
        setApplications(s.applications);
        setNotifications(s.notifications);
        setWeeklyReports(s.weeklyReports);
        setApprovals(s.approvals);
        if (s.systemContext) {
          setSystemContext(s.systemContext);
        }
      }
    } catch (err) {
      console.error("Failed to read server state, using offline memory:", err);
    }
  };

  const saveStateToServer = async (updatedState: any) => {
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: updatedState })
      });
      const data = await res.json();
      if (data && data.success && data.state && data.state.systemContext) {
        setSystemContext(data.state.systemContext);
      }
    } catch (err) {
      console.error("Failed to persist state on backend:", err);
    }
  };

  useEffect(() => {
    fetchState();
    
    // Check if real Gemini key is active on backend
    fetch("/api/memory/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "probe" })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setIsSimulator(data.isSimulator);
          setApiKeyStatus(!data.isSimulator);
        }
      })
      .catch(() => {
        setIsSimulator(true);
        setApiKeyStatus(false);
      });
  }, []);

  // ----------------------------------------------------
  // CONTROLLER ACTIONS
  // ----------------------------------------------------

  // 1. Add Memory via Memory Agent
  const handleAddMemory = async (content: string, type: 'episodic' | 'semantic' | 'preference', importance: number, category: string, tags?: string[]) => {
    try {
      const res = await fetch("/api/memory/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type, importance, category, tags })
      });
      const data = await res.json();
      if (data && data.success) {
        // Refresh master state immediately to grab side-effects
        await fetchState();
        return data;
      }
    } catch (err) {
      console.error("Failed to trigger Memory Agent pipeline:", err);
    }
    return null;
  };

  // 2. Forget / Delete Memory (Timely Forgetting with Long-term Memory Compression mechanism)
  const handleForgetMemory = async (id: string) => {
    try {
      const res = await fetch("/api/memory/forget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data && data.success) {
        // Grab updated memories, system context, and notifications from the server response
        const s = data.state;
        setMemories(s.memories);
        setNotifications(s.notifications);
        if (data.systemContext) {
          setSystemContext(data.systemContext);
        }
        setCompressionResult(`Pruned memory compressed to Long-term System Context. Fact extracted: "${data.compressedResult}"`);
      } else {
        console.error("Failed to perform memory forget-compression:", data.error);
      }
    } catch (err) {
      console.error("Error forgetting and compressing memory:", err);
    }
  };

  // 3. Compress Context window
  const handleCompressMemories = async () => {
    setIsCompressingMemories(true);
    setCompressionResult(null);
    try {
      const res = await fetch("/api/memory/compress", { method: "POST" });
      const data = await res.json();
      if (data && data.success) {
        setCompressionResult(data.result);
        await fetchState();
      } else {
        setCompressionResult(data.error || "Not enough data coordinates to compress.");
      }
    } catch (err: any) {
      setCompressionResult(err.message);
    } finally {
      setIsCompressingMemories(false);
    }
  };

  // 4. Analyze Resume via Resume Agent
  const handleAnalyzeResume = async (resumeText: string, targetRole: string) => {
    setIsAnalyzingResume(true);
    try {
      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, targetRole })
      });
      const data = await res.json();
      if (data && data.success && data.result) {
        setResumeAnalysis({
          score: data.result.score,
          atsFeedback: data.result.atsFeedback,
          suggestions: data.result.suggestions,
          rawText: resumeText
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  // 5. Approve single resume optimize suggestion (Human in Loop)
  const handleApproveSuggestion = async (sugId: string) => {
    if (!resumeAnalysis) return;
    const updatedSug = resumeAnalysis.suggestions.map(s => {
      if (s.id === sugId) return { ...s, approved: true };
      return s;
    });

    const nextAnalysis = { ...resumeAnalysis, suggestions: updatedSug };
    setResumeAnalysis(nextAnalysis);

    // Apply simulation updates on skills profile too
    const approvedItem = resumeAnalysis.suggestions.find(s => s.id === sugId);
    if (approvedItem && approvedItem.section.toLowerCase().includes("skill")) {
      const parts = approvedItem.suggestion.split(",").map(p => p.trim());
      const nextSkills = [...profile.skills];
      parts.forEach(p => {
        if (!nextSkills.includes(p)) nextSkills.push(p);
      });
      const nextProfile = { ...profile, skills: nextSkills };
      setProfile(nextProfile);
      
      const fullState = {
        profile: nextProfile,
        memories,
        roadmaps,
        applications,
        notifications,
        weeklyReports,
        approvals
      };
      await saveStateToServer(fullState);
    }
  };

  // 6. Generate Roadmap via Learning Agent
  const handleGenerateRoadmap = async (topic: string) => {
    setIsGeneratingRoadmap(true);
    try {
      const res = await fetch("/api/learning/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic })
      });
      const data = await res.json();
      if (data && data.success && data.roadmap) {
        const newRoadmap: RoadmapItem = {
          id: `road_${Date.now()}`,
          title: `${topic} Track`,
          description: `Customized roadmap track generated dynamically for topic ${topic}.`,
          status: "in_progress",
          resources: data.roadmap,
          approved: true
        };

        const updatedRoadmaps = [newRoadmap, ...roadmaps];
        setRoadmaps(updatedRoadmaps);

        const fullState = {
          profile,
          memories,
          roadmaps: updatedRoadmaps,
          applications,
          notifications,
          weeklyReports,
          approvals
        };
        await saveStateToServer(fullState);
        setActiveTab("learning");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  // 7. Toggle steps on roadmaps
  const handleUpdateStepStatus = async (roadmapId: string, stepId: string, status: 'not_started' | 'in_progress' | 'completed') => {
    const updatedRoadmaps = roadmaps.map(r => {
      if (r.id === roadmapId) {
        // Mark the specific milestone complete
        return { ...r, status: status };
      }
      return r;
    });
    setRoadmaps(updatedRoadmaps as any);

    if (status === "completed") {
      const r = roadmaps.find(item => item.id === roadmapId);
      const title = r ? r.title : "Roadmap Subject";
      handleTriggerToast(`🎉 Milestone Accomplished: "${title}" is marked as completed!`, "milestone");
    }

    const fullState = {
      profile,
      memories,
      roadmaps: updatedRoadmaps as any,
      applications,
      notifications,
      weeklyReports,
      approvals
    };
    await saveStateToServer(fullState);
  };

  // 8. Generate Question from Interview Agent
  const handleGenerateQuestion = async (type: string, topic: string, historyList: any[]) => {
    try {
      const res = await fetch("/api/interview/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, topic, history: historyList })
      });
      const data = await res.json();
      if (data && data.success) {
        return data.question;
      }
    } catch (err) {
      console.error(err);
    }
    return "Explain key concepts about thread safety.";
  };

  // 9. Evaluate response from Interview Agent
  const handleEvaluateAnswer = async (question: string, answer: string) => {
    try {
      const res = await fetch("/api/interview/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer })
      });
      const data = await res.json();
      if (data && data.success) {
        return { feedback: data.feedback, score: data.score };
      }
    } catch (err) {
      console.error(err);
    }
    return { feedback: "Trial feedback compilation succeeded offline.", score: 80 };
  };

  // 10. Application Trackers
  const handleAddApplication = async (company: string, role: string) => {
    const newApp: JobApplication = {
      id: `app_${Date.now()}`,
      company,
      role,
      status: "interested",
      dateApplied: new Date().toISOString().split("T")[0],
      notes: "Saved card via Career Agent tracker."
    };
    const updatedApps = [newApp, ...applications];
    setApplications(updatedApps);

    const fullState = {
      profile,
      memories,
      roadmaps,
      applications: updatedApps,
      notifications,
      weeklyReports,
      approvals
    };
    await saveStateToServer(fullState);
  };

  const handleUpdateAppStatus = async (appId: string, status: JobApplication['status']) => {
    const updatedApps = applications.map(a => {
      if (a.id === appId) return { ...a, status };
      return a;
    });
    setApplications(updatedApps);

    if (status === "offered") {
      setShowConfetti(true);
    }

    const fullState = {
      profile,
      memories,
      roadmaps,
      applications: updatedApps,
      notifications,
      weeklyReports,
      approvals
    };
    await saveStateToServer(fullState);
  };

  // 11. Career suggestions formulated
  const handleFetchCareerSuggestions = async () => {
    setIsFetchingCareer(true);
    try {
      const res = await fetch("/api/career/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data && data.success) {
        setCareerSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingCareer(false);
    }
  };

  // 12. Human-In-The-Loop Approval Decisions
  const handleHandleApproval = async (approvalId: string, action: 'approve' | 'reject') => {
    const approvedItem = approvals.find(a => a.id === approvalId);
    
    // Set status of approval
    const updatedApprovals = approvals.map(a => {
      if (a.id === approvalId) return { ...a, status: action === 'approve' ? 'approved' : 'rejected' };
      return a;
    });
    setApprovals(updatedApprovals);

    const fullState = {
      profile,
      memories,
      roadmaps,
      applications,
      notifications,
      weeklyReports,
      approvals: updatedApprovals
    };
    await saveStateToServer(fullState);

    // If approved and action is roadmap, generate it!
    if (action === 'approve' && approvedItem) {
      if (approvedItem.type === 'roadmap' && approvedItem.meta?.topic) {
        await handleGenerateRoadmap(approvedItem.meta.topic);
      } else if (approvedItem.type === 'interview' && approvedItem.meta?.topic) {
        setActiveTab("interview");
      }
    }
  };

  // 13. Notifications
  const handleMarkNotificationRead = async (id: string) => {
    const updatedNotifications = notifications.map(n => {
      if (n.id === id) return { ...n, read: true };
      return n;
    });
    setNotifications(updatedNotifications);

    const fullState = {
      profile,
      memories,
      roadmaps,
      applications,
      notifications: updatedNotifications,
      weeklyReports,
      approvals
    };
    await saveStateToServer(fullState);
  };

  const handleClearNotifications = async () => {
    setNotifications([]);
    const fullState = {
      profile,
      memories,
      roadmaps,
      applications,
      notifications: [],
      weeklyReports,
      approvals
    };
    await saveStateToServer(fullState);
  };

  const handleExportState = () => {
    try {
      const stateToExport = {
        profile,
        roadmaps,
        applications
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stateToExport, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `careerpilot_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Failed to export state backup:", err);
    }
  };

  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    const fullState = {
      profile: updatedProfile,
      memories,
      roadmaps,
      applications,
      notifications,
      weeklyReports,
      approvals,
      systemContext
    };
    await saveStateToServer(fullState);
  };

  // ----------------------------------------------------
  // NAVIGATION ROUTER
  // ----------------------------------------------------

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            profile={profile}
            memories={memories}
            roadmaps={roadmaps}
            notifications={notifications}
            approvals={approvals}
            onAddMemory={handleAddMemory}
            onHandleApproval={handleHandleApproval}
            isSimulator={isSimulator}
            onRefreshState={fetchState}
            applications={applications}
            resumeAnalysis={resumeAnalysis}
            weeklyReports={weeklyReports}
            onUpdateProfile={handleUpdateProfile}
            onTriggerToast={handleTriggerToast}
          />
        );
      case "memory":
        return (
          <MemoryPanel
            memories={memories}
            onForgetMemory={handleForgetMemory}
            onCompressMemories={handleCompressMemories}
            isCompressing={isCompressingMemories}
            compressionResult={compressionResult}
            systemContext={systemContext}
            onAddMemory={handleAddMemory}
          />
        );
      case "resume":
        return (
          <ResumePanel
            onAnalyzeResume={handleAnalyzeResume}
            analysis={resumeAnalysis}
            isAnalyzing={isAnalyzingResume}
            onApproveSuggestion={handleApproveSuggestion}
          />
        );
      case "learning":
        return (
          <LearningPanel
            roadmaps={roadmaps}
            profile={profile}
            onGenerateRoadmap={handleGenerateRoadmap}
            isGenerating={isGeneratingRoadmap}
            onUpdateStepStatus={handleUpdateStepStatus}
          />
        );
      case "interview":
        return (
          <InterviewPanel
            profile={profile}
            onGenerateQuestion={handleGenerateQuestion}
            onEvaluateAnswer={handleEvaluateAnswer}
            onCelebration={() => setShowConfetti(true)}
          />
        );
      case "career":
        return (
          <CareerPanel
            profile={profile}
            applications={applications}
            onAddApplication={handleAddApplication}
            onUpdateAppStatus={handleUpdateAppStatus}
            onFetchCareerSuggestions={handleFetchCareerSuggestions}
            suggestions={careerSuggestions}
            isFetchingSuggestions={isFetchingCareer}
            onUpdateProfile={handleUpdateProfile}
          />
        );
      case "scheduler":
        return (
          <SchedulerPanel
            notifications={notifications}
            weeklyReports={weeklyReports}
            onMarkNotificationRead={handleMarkNotificationRead}
            onClearNotifications={handleClearNotifications}
            profile={profile}
            roadmaps={roadmaps}
            applications={applications}
          />
        );
      default:
        return (
          <Dashboard 
            profile={profile} 
            memories={memories} 
            roadmaps={roadmaps} 
            notifications={notifications} 
            approvals={approvals} 
            onAddMemory={handleAddMemory} 
            onHandleApproval={handleHandleApproval} 
            isSimulator={isSimulator} 
            onRefreshState={fetchState} 
            applications={applications}
            resumeAnalysis={resumeAnalysis}
            weeklyReports={weeklyReports}
            onUpdateProfile={handleUpdateProfile}
            onTriggerToast={handleTriggerToast}
          />
        );
    }
  };

  return (
    <div 
      id="master-layout-container" 
      className={`flex h-screen font-sans overflow-hidden relative transition-colors duration-300 ${
        theme === "dark" 
          ? "bg-slate-950 text-slate-100" 
          : "bg-slate-50 text-slate-800 light"
      }`}
    >
      {/* Ambient background mesh blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSimulator={isSimulator} 
        apiKeyStatus={apiKeyStatus} 
        onExportState={handleExportState}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onFeedbackSubmitted={fetchState}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
      />

      {/* Main Panel Content with Slide and Fade Route transitions */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {renderActiveTab()}
          </motion.div>
        </AnimatePresence>
      </div>
      <ConfettiCanvas active={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {/* Global Inactivity Monitor & Alert dialog */}
      <InactivityTracker />

      {/* Ctrl+K System Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportState={handleExportState}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
      />

      {/* Global Toast Notification Portal */}
      <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-2.5 pointer-events-none font-sans">
        <AnimatePresence>
          {toasts.map((toast) => {
            let iconColor = "text-sky-400 bg-sky-500/10 border-sky-500/20";
            let prefix = "💡 Info";
            if (toast.type === "milestone") {
              iconColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
              prefix = "🏆 Milestone";
            } else if (toast.type === "task") {
              iconColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
              prefix = "🎯 Completed";
            } else if (toast.type === "success") {
              iconColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
              prefix = "✨ Success";
            }
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
                className="w-80 md:w-96 glass-card p-4 rounded-xl border border-white/10 shadow-2xl flex items-center justify-between gap-3 pointer-events-auto"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border shrink-0 ${iconColor}`}>
                    {toast.type === "milestone" ? (
                      <Trophy className="w-4 h-4 animate-bounce" />
                    ) : toast.type === "task" ? (
                      <Check className="w-4 h-4" />
                    ) : toast.type === "success" ? (
                      <Sparkles className="w-4 h-4" />
                    ) : (
                      <Compass className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                      {prefix}
                    </span>
                    <p className="text-xs text-slate-100 font-sans leading-snug font-medium">
                      {toast.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      <AnimatePresence>
        {isShortcutsModalOpen && (
          <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setIsShortcutsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg glass-card rounded-2xl p-6 border border-white/15 shadow-2xl relative overflow-hidden flex flex-col gap-5 text-slate-200 font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative top ambient light */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex justify-between items-center relative z-10 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
                    <Keyboard className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-sans tracking-tight">Keyboard Navigation & Commands</h3>
                    <p className="text-[10px] text-slate-400 font-sans">Fast workflows and accessibility keys</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsShortcutsModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Hotkey groups */}
              <div className="flex flex-col gap-4 relative z-10 py-1 font-sans">
                {/* Global shortcuts */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">Global Commands</span>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2.5">
                      <span className="text-xs text-slate-300">Toggle System Command Palette</span>
                      <kbd className="text-xs font-mono bg-slate-950 border border-white/10 text-sky-400 px-2 py-0.5 rounded shadow">Ctrl + K</kbd>
                    </div>
                    <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2.5">
                      <span className="text-xs text-slate-300">Close Modals / Overlays</span>
                      <kbd className="text-xs font-mono bg-slate-950 border border-white/10 text-slate-400 px-2 py-0.5 rounded shadow">ESC</kbd>
                    </div>
                  </div>
                </div>

                {/* Navigation Hotkeys */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">Panel Navigation Shortcuts</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "1", label: "Dashboard Overview" },
                      { key: "2", label: "Memory Agent Logs" },
                      { key: "3", label: "Resume Agent Analysis" },
                      { key: "4", label: "Learning Roadmaps" },
                      { key: "5", label: "Interview Practice" },
                      { key: "6", label: "Career suggestions" },
                      { key: "7", label: "Scheduler & Reports" }
                    ].map(h => (
                      <div key={h.key} className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-xl px-2.5 py-2">
                        <span className="text-[11px] text-slate-400 truncate max-w-[130px] font-sans">{h.label}</span>
                        <kbd className="text-[10px] font-mono bg-slate-950 border border-white/5 text-purple-400 px-1.5 py-0.5 rounded shadow">Alt + {h.key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 mt-1 flex justify-between items-center text-[10px] text-slate-500 font-sans">
                <span>Power user workflows enabled</span>
                <span>Press ESC to exit</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
