import React, { useState } from 'react';
import { CheckSquare, Sparkles, Video, Key, FileText, Share2, Layers, Copy, Check, X, ShieldAlert, Award, Play, Bot, Cpu } from 'lucide-react';

interface SubmissionReadinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerToast?: (msg: string, type?: "info" | "task" | "success" | "milestone") => void;
}

export default function SubmissionReadinessModal({ isOpen, onClose, onTriggerToast }: SubmissionReadinessModalProps) {
  const [activeTab, setActiveTab] = useState<'checklist' | 'script' | 'devpost' | 'session_id'>('checklist');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Interactive checklist state
  const [checklist, setChecklist] = useState({
    videoLength: true,
    voiceover: true,
    sessionId: true,
    repoShared: true,
    readmeComplete: true,
    devToolsInstructions: true,
    teamAdded: true,
    categorySelected: true,
    publishedNotDraft: true,
  });

  if (!isOpen) return null;

  const toggleItem = (key: keyof typeof checklist) => {
    setChecklist(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      const completedCount = Object.values(updated).filter(Boolean).length;
      if (completedCount === Object.keys(updated).length && onTriggerToast) {
        onTriggerToast("🎉 All Hackathon Submission Requirements Satisfied! Ready for Devpost submit!", "milestone");
      }
      return updated;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    if (onTriggerToast) {
      onTriggerToast(`Copied ${label} to clipboard!`, "info");
    }
    setTimeout(() => setCopiedField(null), 2000);
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] rounded-3xl border border-purple-500/30 shadow-2xl flex flex-col overflow-hidden bg-slate-900/95 text-slate-100">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-900/40 via-slate-900 to-sky-900/40">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 border border-purple-500/40 rounded-2xl text-purple-300">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold font-display text-white">Devpost & OpenAI Build Week Submission Hub</h3>
                <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                  GPT-5.6 & Codex
                </span>
              </div>
              <p className="text-xs text-slate-400">Verify checklist requirements, access the 3-min video demo script, and copy Devpost fields</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="flex border-b border-white/10 bg-slate-950/50 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition cursor-pointer font-sans ${
              activeTab === 'checklist'
                ? 'bg-purple-600/30 border-t border-x border-purple-500/40 text-purple-200 border-b-2 border-b-purple-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-purple-400" />
            <span>Final Checklist ({completedCount}/{totalCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition cursor-pointer font-sans ${
              activeTab === 'script'
                ? 'bg-purple-600/30 border-t border-x border-purple-500/40 text-purple-200 border-b-2 border-b-purple-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Video className="w-4 h-4 text-sky-400" />
            <span>3-Min Video Script</span>
          </button>

          <button
            onClick={() => setActiveTab('devpost')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition cursor-pointer font-sans ${
              activeTab === 'devpost'
                ? 'bg-purple-600/30 border-t border-x border-purple-500/40 text-purple-200 border-b-2 border-b-purple-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Devpost Copy Template</span>
          </button>

          <button
            onClick={() => setActiveTab('session_id')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition cursor-pointer font-sans ${
              activeTab === 'session_id'
                ? 'bg-purple-600/30 border-t border-x border-purple-500/40 text-purple-200 border-b-2 border-b-purple-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>Codex Session ID Guide</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-900/60">

          {/* TAB 1: CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-6">
              {/* Progress Ring / Bar */}
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-purple-300 text-lg">
                    {progressPercent}%
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Submission Audit Readiness</h4>
                    <p className="text-xs text-slate-400">{completedCount} of {totalCount} mandatory Devpost criteria verified</p>
                  </div>
                </div>
                <div className="w-full md:w-64 bg-slate-950 rounded-full h-3 border border-white/10 p-0.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-sky-400 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-start gap-3 p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={checklist.videoLength}
                    onChange={() => toggleItem('videoLength')}
                    className="mt-0.5 w-4 h-4 rounded text-purple-500 focus:ring-purple-400 border-white/20 bg-slate-950"
                  />
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      🎬 Public Demo Video (&lt;3 Mins)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Uploaded as public/unlisted YouTube link under 3 minutes.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={checklist.voiceover}
                    onChange={() => toggleItem('voiceover')}
                    className="mt-0.5 w-4 h-4 rounded text-purple-500 focus:ring-purple-400 border-white/20 bg-slate-950"
                  />
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      🎙️ Voiceover Explaining Codex & GPT-5.6
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Audio covers features, Codex acceleration, and GPT-5.6 orchestration.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={checklist.sessionId}
                    onChange={() => toggleItem('sessionId')}
                    className="mt-0.5 w-4 h-4 rounded text-purple-500 focus:ring-purple-400 border-white/20 bg-slate-950"
                  />
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      🔑 /feedback Codex Session ID
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Retrieved from Codex session where core features were built.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={checklist.repoShared}
                    onChange={() => toggleItem('repoShared')}
                    className="mt-0.5 w-4 h-4 rounded text-purple-500 focus:ring-purple-400 border-white/20 bg-slate-950"
                  />
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      🔒 Code Repo Shared
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Public or shared with testing@devpost.com & build-week-event@openai.com.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={checklist.readmeComplete}
                    onChange={() => toggleItem('readmeComplete')}
                    className="mt-0.5 w-4 h-4 rounded text-purple-500 focus:ring-purple-400 border-white/20 bg-slate-950"
                  />
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      📋 Comprehensive README.md
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Includes installation, Codex/GPT-5.6 breakdown, and architecture.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={checklist.devToolsInstructions}
                    onChange={() => toggleItem('devToolsInstructions')}
                    className="mt-0.5 w-4 h-4 rounded text-purple-500 focus:ring-purple-400 border-white/20 bg-slate-950"
                  />
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      🔌 Testing Path & Instructions
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Live sandbox URL and step-by-step testing instructions for judges.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={checklist.teamAdded}
                    onChange={() => toggleItem('teamAdded')}
                    className="mt-0.5 w-4 h-4 rounded text-purple-500 focus:ring-purple-400 border-white/20 bg-slate-950"
                  />
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      👥 Teammates Accepted
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">All team members invited and accepted invitations on Devpost.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={checklist.categorySelected}
                    onChange={() => toggleItem('categorySelected')}
                    className="mt-0.5 w-4 h-4 rounded text-purple-500 focus:ring-purple-400 border-white/20 bg-slate-950"
                  />
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      🎯 Hackathon Track Selected
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Work & Productivity / Apps for Your Life / Education selected.</p>
                  </div>
                </label>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-200">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  <strong>Crucial Submission Rule:</strong> Make sure your Devpost project status is <strong>Submitted</strong> and NOT left saved as a Draft before the deadline window closes!
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: 3-MINUTE SCRIPT */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-sky-950/40 border border-sky-500/20 p-4 rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-sky-400" /> High-Impact 3-Minute Video Script
                  </h4>
                  <p className="text-xs text-slate-400">Structured turn-by-turn narrative highlighting GPT-5.6, Codex, and 7 AI agents.</p>
                </div>
                <button
                  onClick={() => copyToClipboard(`🎬 3-MINUTE DEMO SCRIPT - CAREERPILOT AI OS\n\n[0:00 - 0:35] INTRODUCTION & THE PROBLEM\nNarrator: "Hi everyone! Welcome to CareerPilot AI OS—an autonomous, multi-agent career co-pilot built with OpenAI Codex and powered by GPT-5.6.\nTraditional career prep is broken. Job seekers juggle static resume checkers, flashcards, and mock interviews—none of which remember your past mistakes or goals. CareerPilot AI OS fixes this by placing 7 specialized AI micro-agents around a unified, persistent memory model."\n\n[0:35 - 1:15] LIVE MULTI-AGENT ORCHESTRATION\nNarrator: "Let me show you our live Career Intelligence Dashboard. Notice how the Memory Agent extracts candidate strengths, weakness tags, and target roles in real-time.\nWhen I log a voice note about struggling with concurrency, the System instantly synthesizes this into an updated Skill Matrix and automatically prompts the Learning Agent to generate a tailored React & TypeScript study sprint grounded in real YouTube video tutorials."\n\n[1:15 - 2:00] ADAPTIVE MOCK INTERVIEW & VOICE ENGINE\nNarrator: "Next, watch our Interview Agent in action. Using Web Speech API and GPT-5.6 streaming, CareerPilot conducts adaptive technical mock interviews that target my specific weak areas identified in memory.\nNotice how the system provides real-time STAR method feedback, confidence scoring, and ATS keyword recommendations during the live session."\n\n[2:00 - 2:45] CODEX & GPT-5.6 TECHNICAL IMPLEMENTATION\nNarrator: "Behind the scenes, Codex accelerated 100% of our development workflow—from designing full-stack Express API routes to handling type-safe D3 radar charts and real-time Chronos memory compression.\nGPT-5.6 powers our multi-agent reasoning, dynamic prompt synthesis, and Human-in-the-Loop safety triggers, ensuring AI actions require explicit human authorization before execution."\n\n[2:45 - 3:00] CONCLUSION & CALL TO ACTION\nNarrator: "CareerPilot AI OS bridges the gap between passive learning and active career mastery. Thank you for watching, and try our live sandbox today!"`, "3-Min Video Script")}
                  className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Script
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-purple-400 font-bold border-b border-white/5 pb-2">
                    <span>⏱️ 0:00 - 0:35: Introduction & Problem Statement</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">Setup & Hook</span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed">
                    <strong>Narrator:</strong> "Welcome to <strong>CareerPilot AI OS</strong>—an autonomous multi-agent career co-pilot built with OpenAI Codex and powered by GPT-5.6. Traditional career preparation is broken and fragmented. CareerPilot AI OS solves this by orchestrating 7 specialized AI micro-agents around a persistent memory engine."
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-sky-400 font-bold border-b border-white/5 pb-2">
                    <span>⏱️ 0:35 - 1:15: Multi-Agent Orchestration Demo</span>
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded">Live Demo</span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed">
                    <strong>Narrator:</strong> "In our live Dashboard, the Memory Agent extracts candidate weakness tags in real-time. Logging a voice note about concurrency automatically triggers the Learning Agent to generate a targeted study sprint with real video tutorials."
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-white/5 pb-2">
                    <span>⏱️ 1:15 - 2:00: Adaptive Mock Interviewing</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Interactive AI</span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed">
                    <strong>Narrator:</strong> "Our Interview Agent uses Web Speech API and GPT-5.6 streaming to conduct adaptive technical interviews targeting user weak spots, evaluating STAR responses with real-time confidence scores."
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-amber-400 font-bold border-b border-white/5 pb-2">
                    <span>⏱️ 2:00 - 2:45: Codex & GPT-5.6 Architecture</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">Technical Depth</span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed">
                    <strong>Narrator:</strong> "Codex accelerated 100% of our code implementation, including full-stack Express API routes, D3 charts, and memory compression engines. GPT-5.6 provides state-aware agentic reasoning with Human-in-the-Loop safety."
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-indigo-400 font-bold border-b border-white/5 pb-2">
                    <span>⏱️ 2:45 - 3:00: Conclusion</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">Call to Action</span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed">
                    <strong>Narrator:</strong> "CareerPilot AI OS elevates career preparation from passive reading to active, intelligent mastery. Thank you, and try our live sandbox today!"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEVPOST COPY TEMPLATE */}
          {activeTab === 'devpost' && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-white uppercase font-mono">Project Title</span>
                  <button
                    onClick={() => copyToClipboard("CareerPilot AI OS — Autonomous AI Career Co-Pilot & Mock Training OS", "Project Title")}
                    className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded border border-white/10 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <p className="text-xs text-slate-200 font-sans">CareerPilot AI OS — Autonomous AI Career Co-Pilot & Mock Training OS</p>
              </div>

              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-white uppercase font-mono">Elevator Pitch / Tagline</span>
                  <button
                    onClick={() => copyToClipboard("An autonomous, state-aware AI career co-pilot coordinating 7 specialized micro-agents around persistent cross-session memory, adaptive mock interview simulation, and Human-in-the-Loop safety controls.", "Tagline")}
                    className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded border border-white/10 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <p className="text-xs text-slate-200 font-sans">An autonomous, state-aware AI career co-pilot coordinating 7 specialized micro-agents around persistent cross-session memory, adaptive mock interview simulation, and Human-in-the-Loop safety controls.</p>
              </div>

              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-white uppercase font-mono">Full Devpost Description</span>
                  <button
                    onClick={() => copyToClipboard(`CareerPilot AI OS is an autonomous, state-aware AI career co-pilot coordinating 7 custom LLM micro-agents around a unified persistent cross-session memory engine.

### Key Features:
1. Memory Agent: Extracts, categorizes, and indexes candidate goals, skills, and weakness tags in real-time.
2. Resume Agent: Evaluates resumes against ATS standards and suggests target bullet enhancements.
3. Learning Agent: Generates custom learning sprints grounded in real video tutorials based on detected weaknesses.
4. Interview Agent: Conducts adaptive, voice-enabled mock technical and behavioral interviews targeting candidate weak spots.
5. Career Agent: Generates tailored cover letters and job match analytics.
6. Scheduler Agent: Automates priority focus tasks and executes Chronos memory context pruning.
7. Blog Agent: Compiles live progress updates and hackathon logs for community sharing.

### Built with Codex & GPT-5.6:
Codex accelerated 100% of our code implementation, including full-stack Express API routes, D3 radar charts, and memory compression engines. GPT-5.6 powers our state-aware agentic reasoning and Human-in-the-Loop safety controls.`, "Devpost Description")}
                    className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded border border-white/10 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Copy Full Text
                  </button>
                </div>
                <p className="text-xs text-slate-300 font-sans whitespace-pre-line leading-relaxed">
                  {`CareerPilot AI OS is an autonomous, state-aware AI career co-pilot coordinating 7 custom LLM micro-agents around a unified persistent cross-session memory engine.

Key Features:
1. Memory Agent: Real-time goal and weakness extraction.
2. Resume Agent: ATS optimization & bullet enhancer.
3. Learning Agent: Custom learning sprints with real YouTube tutorials.
4. Interview Agent: Voice-enabled adaptive mock interview simulator.
5. Career Agent: Tailored cover letter & match analytics.
6. Scheduler Agent: Chronos memory context pruning & focus tasks.
7. Blog Agent: Hackathon progress logger.`}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: SESSION ID GUIDE */}
          {activeTab === 'session_id' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
                <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" /> Mandatory Codex Session ID Instructions
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  The Devpost submission form requires entering your <strong>/feedback Codex Session ID</strong> where the core functionality of your project was built. This allows judges to verify technical implementation and Codex usage.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-3">
                <h5 className="text-xs font-bold text-white uppercase font-mono">Step-by-Step Retrieval:</h5>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 font-sans">
                  <li>Open ChatGPT or your Codex desktop environment where you developed CareerPilot AI OS.</li>
                  <li>Type <code className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">/feedback</code> into the prompt input box.</li>
                  <li>Copy the unique Session ID generated by Codex.</li>
                  <li>Paste the Session ID directly into the Devpost submission field marked <strong>/feedback Codex Session ID</strong>.</li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Built for <strong>OpenAI Build Week</strong> with Codex & GPT-5.6</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer font-sans shadow-lg shadow-purple-900/30"
            >
              Close Hub & Return to App
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
