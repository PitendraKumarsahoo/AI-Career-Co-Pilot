/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Award, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight, 
  Flame, 
  ShieldAlert, 
  Plus, 
  Zap, 
  BookOpen, 
  Briefcase, 
  Terminal, 
  Cpu, 
  Layers
} from "lucide-react";
import { UserProfile, Memory, RoadmapItem, JobApplication, ResumeAnalysis } from "../../types";

interface WinningScoreTrackerProps {
  profile: UserProfile;
  memories: Memory[];
  roadmaps: RoadmapItem[];
  applications: JobApplication[];
  resumeAnalysis: ResumeAnalysis | null;
  isSimulator: boolean;
}

export default function WinningScoreTracker({
  profile,
  memories,
  roadmaps,
  applications,
  resumeAnalysis,
  isSimulator
}: WinningScoreTrackerProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'upgrades'>('overview');

  // 1. Calculate Technical Depth (30% weight)
  const technicalDepthDetails = useMemo(() => {
    let score = 50; // base score
    const breakdowns: string[] = ["Base baseline alignment: +50 points"];

    // Skills check
    const skillsCount = profile.skills?.length || 0;
    const skillsBonus = Math.min(25, skillsCount * 5);
    if (skillsBonus > 0) {
      score += skillsBonus;
      breakdowns.push(`Industry skills declared (${skillsCount}): +${skillsBonus} points`);
    }

    // Projects technology check
    let uniqueTech: string[] = [];
    if (profile.projects) {
      profile.projects.forEach(p => {
        if (p.technologies) {
          p.technologies.forEach(t => {
            if (!uniqueTech.includes(t.toLowerCase())) {
              uniqueTech.push(t.toLowerCase());
            }
          });
        }
      });
    }
    const techCount = uniqueTech.length;
    const techBonus = Math.min(15, techCount * 3);
    if (techBonus > 0) {
      score += techBonus;
      breakdowns.push(`Project technological breadth (${techCount}): +${techBonus} points`);
    }

    // Roadmaps check
    const hasRoadmaps = roadmaps && roadmaps.length > 0;
    const hasCompletedRoadmaps = roadmaps && roadmaps.some(r => r.status === 'completed' || r.status === 'in_progress');
    if (hasCompletedRoadmaps) {
      score += 10;
      breakdowns.push("Active roadmap engineering: +10 points");
    } else if (hasRoadmaps) {
      score += 5;
      breakdowns.push("Roadmap target scheduled: +5 points");
    }

    return { score: Math.min(100, score), breakdowns };
  }, [profile, roadmaps]);

  // 2. Calculate Innovation (30% weight)
  const innovationDetails = useMemo(() => {
    let score = 55; // higher base score for innovation
    const breakdowns: string[] = ["Base innovation parameter: +55 points"];

    // Goals check
    const goalsCount = profile.goals?.length || 0;
    const goalsBonus = Math.min(20, goalsCount * 5);
    if (goalsBonus > 0) {
      score += goalsBonus;
      breakdowns.push(`Career/Technical goals formulated (${goalsCount}): +${goalsBonus} points`);
    }

    // High importance memories (agent contextual weights)
    const highImportanceMemories = memories ? memories.filter(m => m.importance >= 8) : [];
    const memoryBonus = Math.min(20, highImportanceMemories.length * 5);
    if (memoryBonus > 0) {
      score += memoryBonus;
      breakdowns.push(`High-importance cognitive logs (${highImportanceMemories.length}): +${memoryBonus} points`);
    }

    // Check if user has semantic category memories
    const hasSemantic = memories && memories.some(m => m.type === 'semantic');
    if (hasSemantic) {
      score += 5;
      breakdowns.push("Semantic preference graphs active: +5 points");
    }

    return { score: Math.min(100, score), breakdowns };
  }, [profile, memories]);

  // 3. Calculate Production Readiness (25% weight)
  const productionReadinessDetails = useMemo(() => {
    let score = 45; // base score
    const breakdowns: string[] = ["Base delivery readiness: +45 points"];

    // Resume analysis presence and score
    if (resumeAnalysis) {
      const resumeScoreBonus = Math.round(resumeAnalysis.score * 0.35);
      score += resumeScoreBonus;
      breakdowns.push(`Resume ATS baseline score (${resumeAnalysis.score}/100): +${resumeScoreBonus} points`);
    } else {
      // Experience Level fallback
      if (profile.experienceLevel === "Senior" || profile.experienceLevel === "Mid") {
        score += 15;
        breakdowns.push(`Demonstrated experience scale (${profile.experienceLevel}): +15 points`);
      } else {
        score += 8;
        breakdowns.push(`Foundational experience alignment: +8 points`);
      }
    }

    // Job Applications pipeline check
    const appsCount = applications?.length || 0;
    const appsBonus = Math.min(15, appsCount * 5);
    if (appsBonus > 0) {
      score += appsBonus;
      breakdowns.push(`Active application pipelines tracked (${appsCount}): +${appsBonus} points`);
    }

    // Certifications check
    const certsCount = profile.certifications?.length || 0;
    const certsBonus = Math.min(15, certsCount * 5);
    if (certsBonus > 0) {
      score += certsBonus;
      breakdowns.push(`Professional credentials registered (${certsCount}): +${certsBonus} points`);
    }

    return { score: Math.min(100, score), breakdowns };
  }, [profile, resumeAnalysis, applications]);

  // 4. Calculate Documentation Quality (15% weight)
  const documentationDetails = useMemo(() => {
    let score = 50; // base score
    const breakdowns: string[] = ["Base baseline documentation: +50 points"];

    // Preferences setup (preferred companies)
    const prefCount = profile.preferredCompanies?.length || 0;
    const prefBonus = Math.min(15, prefCount * 5);
    if (prefBonus > 0) {
      score += prefBonus;
      breakdowns.push(`Preferred target vectors defined (${prefCount}): +${prefBonus} points`);
    }

    // Project description completeness
    let descriptionsCount = 0;
    if (profile.projects) {
      profile.projects.forEach(p => {
        if (p.description && p.description.trim().length > 10) {
          descriptionsCount++;
        }
      });
    }
    const descBonus = Math.min(20, descriptionsCount * 10);
    if (descBonus > 0) {
      score += descBonus;
      breakdowns.push(`Sleek project specs documented (${descriptionsCount}): +${descBonus} points`);
    }

    // Weak subjects target alignment
    const weakCount = profile.weakSubjects?.length || 0;
    const weakBonus = Math.min(15, weakCount * 5);
    if (weakBonus > 0) {
      score += weakBonus;
      breakdowns.push(`Targeted growth areas highlighted (${weakCount}): +${weakBonus} points`);
    }

    return { score: Math.min(100, score), breakdowns };
  }, [profile]);

  // Combined score calculation
  const overallScore = useMemo(() => {
    const weighted = 
      (technicalDepthDetails.score * 0.30) + 
      (innovationDetails.score * 0.30) + 
      (productionReadinessDetails.score * 0.25) + 
      (documentationDetails.score * 0.15);
    return Math.round(weighted);
  }, [technicalDepthDetails, innovationDetails, productionReadinessDetails, documentationDetails]);

  // Missing Modules & Upgrades
  const requiredUpgrades = useMemo(() => {
    const upgrades = [];

    // 1. AI Simulator Upgrade
    if (isSimulator) {
      upgrades.push({
        id: "api_key",
        title: "Activate Production Gemini API Key",
        impact: "+15% Tech Depth, +10% Innovation",
        targetMetric: "Technical Depth",
        boost: 15,
        description: "The workspace is running in offline simulation fallback. Inject a real Google AI Studio Gemini API key to activate high-performance live reasoning.",
        actionLabel: "How to fix",
        resolution: "Define GEMINI_API_KEY inside the Settings panel to enable real-time analysis."
      });
    }

    // 2. Cognitive Memory upgrade
    if (!memories || memories.length < 5) {
      upgrades.push({
        id: "memory_logs",
        title: "Hydrate AI Agent Cognitive Memory",
        impact: "+12% Innovation, +8% Tech Depth",
        targetMetric: "Innovation",
        boost: 12,
        description: "Cognitive memory buffer is cold. Log more engineering milestones, failures, or workspace activities to train the memory synthesis engine.",
        actionLabel: "How to fix",
        resolution: "Add at least 5 logs or notes on the dashboard to build semantic guidelines."
      });
    }

    // 3. Project Tech Stack Upgrades
    let totalTechCount = 0;
    if (profile.projects) {
      profile.projects.forEach(p => {
        if (p.technologies) totalTechCount += p.technologies.length;
      });
    }
    if (totalTechCount < 4) {
      upgrades.push({
        id: "tech_stack",
        title: "Expand Project Technological Depth",
        impact: "+15% Tech Depth",
        targetMetric: "Technical Depth",
        boost: 15,
        description: "Project stacks are missing robust production systems terms like 'Redis', 'Docker', 'OAuth', or 'Drizzle PostgreSQL'.",
        actionLabel: "How to fix",
        resolution: "Add enterprise-level frameworks or systems to your projects list in the Profile."
      });
    }

    // 4. Job Applications Pipelines
    if (!applications || applications.length === 0) {
      upgrades.push({
        id: "applications",
        title: "Deploy Active Job Pipelines",
        impact: "+15% Production Readiness",
        targetMetric: "Production Readiness",
        boost: 15,
        description: "No active job application tracking rows established. Add applications to activate predictive mock-interview routines.",
        actionLabel: "How to fix",
        resolution: "Go to the Career Hub tab and track at least one target role application."
      });
    }

    // 5. ATS Resume Screening
    if (!resumeAnalysis) {
      upgrades.push({
        id: "resume_parse",
        title: "Conduct Automated ATS Audit",
        impact: "+20% Production Readiness",
        targetMetric: "Production Readiness",
        boost: 20,
        description: "Candidate resume has not been run through the AI screening parser. Audit your resume to lock in high-percentage readiness logs.",
        actionLabel: "How to fix",
        resolution: "Go to the Resume Optimizer tab and upload/parse a resume document."
      });
    }

    // 6. Target Career Documentation Vectors
    const hasGoals = profile.goals && profile.goals.length > 0;
    const hasCompanies = profile.preferredCompanies && profile.preferredCompanies.length > 0;
    if (!hasGoals || !hasCompanies) {
      upgrades.push({
        id: "missing_docs",
        title: "Define Target Career Documentation Vectors",
        impact: "+15% Documentation Quality",
        targetMetric: "Documentation Quality",
        boost: 15,
        description: "Strategic goals or target brand directories are not fully cataloged. Comprehensive career documentation aligns autonomous agents' focus.",
        actionLabel: "How to fix",
        resolution: "Navigate to the Profile & Target Vectors pane to outline your targets and strategic ambitions."
      });
    }

    // 7. Autonomous Learning Roadmaps Agent
    const hasActiveRoadmaps = roadmaps && roadmaps.length > 0;
    if (!hasActiveRoadmaps) {
      upgrades.push({
        id: "learning_roadmaps",
        title: "Initialize Autonomous Learning Agent",
        impact: "+10% Technical Depth, +5% Documentation",
        targetMetric: "Technical Depth",
        boost: 10,
        description: "No custom skill-gap maps are initialized. Provisioning a learning roadmap generates automated, structured training matrices.",
        actionLabel: "How to fix",
        resolution: "Go to the Skill Learning Hub and query the agent to map out technical domains or subjects."
      });
    }

    return upgrades;
  }, [isSimulator, memories, profile, applications, resumeAnalysis, roadmaps]);

  return (
    <div id="winning-score-tracker" className="glass-card glass-card-hover rounded-2xl p-5 shadow-xl relative overflow-hidden">
      
      {/* Visual Ambient Element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[30%] left-[40%] w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none animate-pulse" />

      {/* Header Info */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <span className="text-[10px] font-mono uppercase bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
            <Cpu className="w-3 h-3 text-purple-400" /> Hackathon Metric Validator
          </span>
          <h3 className="font-display font-bold text-white text-lg mt-2 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" /> <span className="text-gradient-purple-sky">Winning Probability Scorecard</span>
          </h3>
          <p className="text-slate-400 text-xs mt-0.5 leading-normal font-sans">
            Evaluating multi-modal systems architecture alignment with high-performance international winning metrics.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 mb-4">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-medium border-b-2 cursor-pointer transition ${
            activeTab === 'overview' 
              ? 'border-purple-400 text-white' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview Score
        </button>
        <button 
          onClick={() => setActiveTab('upgrades')}
          className={`px-4 py-2 text-xs font-medium border-b-2 cursor-pointer transition relative ${
            activeTab === 'upgrades' 
              ? 'border-purple-400 text-white' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Required Upgrades
          {overallScore < 85 && requiredUpgrades.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div 
            key="overview-pane"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex flex-col gap-4"
          >
            {/* Top Gauge Widget */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white/[0.01] border border-white/5 p-4 rounded-xl">
              
              {/* Left Radial Circle */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-2 relative border-r border-white/5">
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 mb-2">PROBABILITY SCORE</span>
                
                <div className="relative w-24 h-24 rounded-full border-4 border-dashed border-purple-500/10 flex flex-col items-center justify-center">
                  
                  {/* Progress Ring SVG */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke={overallScore >= 85 ? "url(#purpleGlowGradient)" : "url(#amberGlowGradient)"}
                      strokeWidth="5"
                      fill="transparent"
                      strokeDasharray="264"
                      strokeDashoffset={264 - (264 * overallScore) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="purpleGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c084fc" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                      <linearGradient id="amberGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-extrabold text-white font-mono leading-none">
                      {overallScore}%
                    </span>
                    <span className={`text-[8px] font-mono mt-1 font-bold tracking-wide uppercase ${
                      overallScore >= 90 ? 'text-purple-300' : overallScore >= 85 ? 'text-emerald-300' : 'text-amber-400'
                    }`}>
                      {overallScore >= 90 ? 'VC Elite Tier' : overallScore >= 85 ? 'Passing Gold' : 'Action Required'}
                    </span>
                  </div>
                </div>

                <div className="text-center mt-3">
                  {overallScore >= 85 ? (
                    <span className="text-[10px] text-emerald-400 font-medium inline-flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Met winning standards
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-medium inline-flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" /> Below standard (Target: 85%+)
                    </span>
                  )}
                </div>
              </div>

              {/* Right Formula description */}
              <div className="md:col-span-7 flex flex-col justify-center text-xs text-slate-300 gap-2">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">WEIGHTED MATH SCENARIO</span>
                <p className="leading-relaxed text-slate-400">
                  Judges use a specific scoring matrix to balance product viability:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-1.5 bg-white/[0.02] border border-white/5 rounded">
                    <span className="text-purple-300">TD (30%):</span> <strong className="text-white">{technicalDepthDetails.score}/100</strong>
                  </div>
                  <div className="p-1.5 bg-white/[0.02] border border-white/5 rounded">
                    <span className="text-purple-300">INN (30%):</span> <strong className="text-white">{innovationDetails.score}/100</strong>
                  </div>
                  <div className="p-1.5 bg-white/[0.02] border border-white/5 rounded">
                    <span className="text-purple-300">PR (25%):</span> <strong className="text-white">{productionReadinessDetails.score}/100</strong>
                  </div>
                  <div className="p-1.5 bg-white/[0.02] border border-white/5 rounded">
                    <span className="text-purple-300">DOC (15%):</span> <strong className="text-white">{documentationDetails.score}/100</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Interactive Metric Select Bars */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Metrics Parameter Analysis:</span>
              
              {[
                { id: "tech", label: "Technical Depth", score: technicalDepthDetails.score, weight: 30, color: "from-sky-400 to-indigo-500", details: technicalDepthDetails },
                { id: "innov", label: "Innovation Score", score: innovationDetails.score, weight: 30, color: "from-purple-400 to-indigo-500", details: innovationDetails },
                { id: "prod", label: "Production Readiness", score: productionReadinessDetails.score, weight: 25, color: "from-emerald-400 to-teal-500", details: productionReadinessDetails },
                { id: "doc", label: "Documentation Quality", score: documentationDetails.score, weight: 15, color: "from-pink-400 to-purple-500", details: documentationDetails },
              ].map((metric) => (
                <div key={metric.id} className="flex flex-col bg-white/[0.02] border border-white/5 rounded-xl p-2.5 hover:bg-white/[0.04] transition duration-200">
                  <div 
                    onClick={() => setSelectedMetric(selectedMetric === metric.id ? null : metric.id)}
                    className="flex justify-between items-center cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${selectedMetric === metric.id ? 'transform rotate-90 text-purple-400' : ''}`} />
                      <span className="text-xs font-semibold text-white">{metric.label}</span>
                      <span className="text-[9px] font-mono bg-white/10 text-slate-400 px-1.5 py-0.2 rounded">Weight {metric.weight}%</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-200">{metric.score}/100</span>
                  </div>

                  {/* Progress line */}
                  <div className="w-full bg-white/5 rounded-full h-1 mt-2 overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${metric.color}`} style={{ width: `${metric.score}%` }} />
                  </div>

                  {/* Expandable breakdown checklist */}
                  <AnimatePresence>
                    {selectedMetric === metric.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2.5 mt-2 border-t border-white/5 flex flex-col gap-1.5">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Active Contributions Checklist:</span>
                          {metric.details.breakdowns.map((line, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <CheckCircle className="w-3 h-3 text-purple-400/80 shrink-0" />
                              <span>{line}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="upgrades-pane"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex flex-col gap-3"
          >
            <div className="flex justify-between items-center bg-white/[0.01] border border-dashed border-white/10 p-3 rounded-lg text-xs mb-1">
              <span className="text-slate-400">Winning standard score minimum:</span>
              <span className="font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">85 / 100</span>
            </div>

            {overallScore >= 85 ? (
              <div className="border border-emerald-500/25 bg-emerald-500/5 p-6 rounded-xl text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400">
                  <CheckCircle className="w-6 h-6 animate-pulse" />
                </div>
                <span className="text-sm font-bold text-white font-display">Winning Bracket Achieved! ({overallScore}%)</span>
                <span className="text-xs text-slate-400 max-w-sm leading-relaxed font-sans">
                  Excellent! Your project has bypassed the critical 85% gold standard threshold. The system is structurally complete, documented, and possesses robust autonomous capabilities.
                </span>
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  <span className="text-[9px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    TD: COMPLIANT
                  </span>
                  <span className="text-[9px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    INN: ROBUST
                  </span>
                  <span className="text-[9px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    PR: READY
                  </span>
                </div>
              </div>
            ) : requiredUpgrades.length === 0 ? (
              <div className="border border-dashed border-emerald-500/30 bg-emerald-500/5 p-8 rounded-xl text-center flex flex-col items-center justify-center gap-2">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
                <span className="text-xs font-bold text-white">Elite System Achieved!</span>
                <span className="text-[10px] text-slate-400">No upgrades currently required. Your codebase architecture possesses maximum winning viability.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <div className="text-[10px] text-amber-400/90 bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded-lg leading-relaxed font-sans mb-1 flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>
                    Your score is currently below the <strong>85% gold standard</strong>. Address the critical system upgrades listed below to maximize your evaluation parameters.
                  </span>
                </div>
                {requiredUpgrades.map((upg) => (
                  <div key={upg.id} className="bg-slate-950/40 border border-white/5 hover:border-purple-500/30 rounded-xl p-3.5 flex flex-col gap-2.5 shadow transition-all duration-200">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <h4 className="text-xs font-bold text-slate-100">{upg.title}</h4>
                      </div>
                      <span className="text-[9px] font-mono text-purple-300 font-bold bg-purple-500/10 border border-purple-500/25 px-1.5 py-0.2 rounded shrink-0">
                        {upg.impact}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-normal">
                      {upg.description}
                    </p>

                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded-lg text-[10px] font-mono text-amber-300/95 leading-normal">
                      <strong className="text-white uppercase font-sans text-[9px] block mb-0.5">Required Upgrade:</strong>
                      {upg.resolution}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
