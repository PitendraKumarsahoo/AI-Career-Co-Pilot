/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { 
  Compass, 
  Brain, 
  FileText, 
  GraduationCap, 
  MessagesSquare, 
  Award, 
  Calendar, 
  FileEdit, 
  BookOpen, 
  Terminal,
  Activity,
  Trophy,
  Download,
  Sun,
  Moon,
  X,
  Send,
  CheckCircle,
  MessageSquare,
  Keyboard
} from "lucide-react";
import React, { useState } from "react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSimulator: boolean;
  apiKeyStatus: boolean;
  onExportState?: () => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
  onFeedbackSubmitted?: () => void;
  onOpenShortcuts?: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isSimulator, 
  apiKeyStatus, 
  onExportState,
  theme = "dark",
  onToggleTheme,
  onFeedbackSubmitted,
  onOpenShortcuts
}: SidebarProps) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState("General Feedback");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Compass },
    { id: "memory", label: "Memory Agent", icon: Brain },
    { id: "resume", label: "Resume Agent", icon: FileText },
    { id: "learning", label: "Learning Agent", icon: GraduationCap },
    { id: "interview", label: "Interview Agent", icon: MessagesSquare },
    { id: "career", label: "Career Agent", icon: Award },
    { id: "scheduler", label: "Scheduler & Reports", icon: Calendar },
  ];

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: feedbackText,
          category: feedbackCategory,
          name: userName,
          email: userEmail
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setSubmitSuccess(true);
        setFeedbackText("");
        setUserName("");
        setUserEmail("");
        
        // Notify the main App frame to reload state and show the persistent notification
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted();
        }

        setTimeout(() => {
          setIsFeedbackOpen(false);
          setSubmitSuccess(false);
        }, 2200);
      } else {
        setErrorMessage(data.error || "Submission failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Could not connect to back-end server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="sidebar-container" className="w-64 h-screen bg-slate-950/40 backdrop-blur-xl text-slate-100 border-r border-white/10 flex flex-col justify-between p-4 flex-shrink-0 relative z-10">
      <div className="flex flex-col gap-6">
        {/* App Title */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="p-2 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-lg shadow-lg shadow-sky-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-sans font-bold tracking-tight text-lg text-white">CareerPilot</h1>
            <p className="text-[10px] text-sky-400 font-mono tracking-widest uppercase">AI OPERATING SYSTEM</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left border ${
                  isActive 
                    ? "text-white bg-white/10 border-white/10 shadow-sm" 
                    : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-sky-400 to-blue-500 rounded-r"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-4 h-4 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Status Indicator */}
      <div className="flex flex-col gap-2 p-2.5 bg-white/[0.03] backdrop-blur-md rounded-xl border border-white/10">
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500/15 to-indigo-500/15 hover:from-sky-500/25 hover:to-indigo-500/25 text-sky-200 hover:text-white font-semibold text-xs py-2 px-3 rounded-lg border border-sky-500/30 hover:border-sky-500/50 transition duration-300 shadow-md cursor-pointer mb-1"
            title="View all Keyboard Shortcuts and Navigation Hotkeys"
          >
            <Keyboard className="w-3.5 h-3.5 text-sky-400" />
            <span>Keyboard Shortcuts</span>
          </button>
        )}

        <button
          onClick={() => setIsFeedbackOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500/15 to-indigo-500/15 hover:from-purple-500/25 hover:to-indigo-500/25 text-purple-200 hover:text-white font-semibold text-xs py-2 px-3 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition duration-300 shadow-md cursor-pointer mb-1.5"
          title="Provide feedback or suggestions directly to the CareerPilot team"
        >
          <MessageSquare className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>Provide Feedback</span>
        </button>

        {onExportState && (
          <button
            onClick={onExportState}
            className="w-full flex items-center justify-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 text-slate-200 hover:text-white font-medium text-xs py-2 px-3 rounded-lg border border-white/10 hover:border-sky-500/30 transition shadow-sm cursor-pointer mb-1"
            title="Download full backup of profile, roadmaps, and applications"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export State JSON</span>
          </button>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Node Backend</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-400">PORT 3000</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Gemini Cloud</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${apiKeyStatus ? 'bg-sky-400' : 'bg-amber-400'}`} />
            <span className={`text-[10px] font-mono ${apiKeyStatus ? 'text-sky-400' : 'text-amber-400'}`}>
              {apiKeyStatus ? 'CONNECTED' : 'SIMULATOR'}
            </span>
          </div>
        </div>

        {onToggleTheme && (
          <div className="flex items-center justify-between border-t border-white/10 pt-2 mt-1">
            <span className="text-xs text-slate-400">App Theme</span>
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-300 hover:text-white transition cursor-pointer"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="mt-1 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500">
          <span>Solo Track Sub</span>
          <span className="font-mono">v1.2.0</span>
        </div>
      </div>

      {/* FEEDBACK PORTAL OVERLAY & MODAL */}
      <AnimatePresence>
        {isFeedbackOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="glass-card max-w-md w-full rounded-2xl p-6 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col gap-5 text-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top ambient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex justify-between items-center relative z-10">
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400 animate-pulse" />
                  <span>Feedback Hub</span>
                </h3>
                <button
                  onClick={() => setIsFeedbackOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {submitSuccess ? (
                <div className="flex flex-col items-center justify-center text-center py-8 gap-4 relative z-10">
                  <motion.div
                    initial={{ scale: 0.5, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 12 }}
                    className="p-4 bg-purple-500/20 border border-purple-500/40 rounded-full"
                  >
                    <CheckCircle className="w-12 h-12 text-purple-400" />
                  </motion.div>
                  <div>
                    <h4 className="text-base font-bold text-white">Feedback Logged Successfully!</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Your inputs have been securely committed to the backend state store and our product intelligence queue.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-4 relative z-10 font-sans">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Feedback Class</label>
                    <select
                      value={feedbackCategory}
                      onChange={(e) => setFeedbackCategory(e.target.value)}
                      className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="General Feedback">General Feedback</option>
                      <option value="Bug Report">Bug Report (Security / Interface)</option>
                      <option value="Feature Request">Feature Request (Autopilot Extension)</option>
                      <option value="Design Improvement">Design critique / Premium layout</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Your Name</label>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Detailed Message / Suggestions</label>
                    <textarea
                      required
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Share your review of CareerPilot. Describe any bugs found or features you would love to see judges appreciate!"
                      className="w-full h-28 glass-input rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  {errorMessage && (
                    <p className="text-[10px] font-mono text-red-400">{errorMessage}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !feedbackText.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending comments...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Feedback Comments</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
