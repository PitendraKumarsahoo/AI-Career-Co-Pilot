/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  GraduationCap, 
  Map, 
  Youtube, 
  BookOpen, 
  CheckSquare, 
  Play, 
  Compass, 
  AlertCircle,
  Plus,
  TrendingUp,
  Award
} from "lucide-react";
import { RoadmapItem, UserProfile } from "../types";

interface LearningPanelProps {
  roadmaps: RoadmapItem[];
  profile: UserProfile;
  onGenerateRoadmap: (topic: string) => Promise<void>;
  isGenerating: boolean;
  onUpdateStepStatus: (roadmapId: string, stepId: string, status: 'not_started' | 'in_progress' | 'completed') => void;
}

export default function LearningPanel({
  roadmaps,
  profile,
  onGenerateRoadmap,
  isGenerating,
  onUpdateStepStatus
}: LearningPanelProps) {
  const [topicInput, setTopicInput] = useState("");
  const [activeRoadmapId, setActiveRoadmapId] = useState<string>(roadmaps[0]?.id || "");

  const handleCreateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) return;
    await onGenerateRoadmap(topicInput);
    setTopicInput("");
  };

  const selectedRoadmap = roadmaps.find(r => r.id === activeRoadmapId) || roadmaps[0];

  return (
    <div id="learning-panel" className="flex-1 overflow-y-auto p-6 bg-transparent text-slate-100 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight text-white flex items-center gap-2">
          <span className="text-gradient-purple-sky">Autonomous Learning Agent</span> <GraduationCap className="w-7 h-7 text-sky-400 animate-pulse" />
        </h2>
        <p className="text-slate-400 text-sm font-sans">
          Dynamically analyze profile gaps, generate tailored roadmaps, and surface optimal YouTube resources.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Controls & Active Roadmap selectors (Span 1) */}
        <div className="flex flex-col gap-4">
          
          {/* Propose/Generate Roadmap */}
          <div className="glass-card rounded-2xl p-4 shadow-md">
            <h3 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Plus className="w-4 h-4 text-sky-400" /> Propose New Topic
            </h3>

            <form onSubmit={handleCreateRoadmap} className="flex flex-col gap-3">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="e.g. Advanced Java Threads, Docker, Redis..."
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isGenerating || !topicInput.trim()}
                className="w-full flex items-center justify-center gap-1.5 glass-button-primary text-white font-medium text-xs py-2 px-4 rounded-xl cursor-pointer disabled:opacity-50 shadow-md"
              >
                {isGenerating ? "Synthesizing Roadmap..." : "Generate Custom Path"}
              </button>
            </form>
          </div>

          {/* List of active roadmaps */}
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
            <h3 className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1">
              <Map className="w-4 h-4 text-emerald-400" /> Active Directories
            </h3>

            <div className="flex flex-col gap-1.5">
              {roadmaps.map((roadmap) => (
                <button
                  key={roadmap.id}
                  onClick={() => setActiveRoadmapId(roadmap.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs flex flex-col gap-1 transition duration-150 cursor-pointer ${
                    activeRoadmapId === roadmap.id || (activeRoadmapId === "" && roadmaps[0]?.id === roadmap.id)
                      ? "bg-white/10 border-sky-500/50 text-white"
                      : "bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <span className="font-semibold">{roadmap.title}</span>
                  <span className="text-[10px] text-slate-500 leading-normal line-clamp-1">{roadmap.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Skill Gap Analysis Box */}
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
            <h3 className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-400 animate-pulse" /> Skill Gap Matrix
            </h3>
            
            <p className="text-[11px] text-slate-400 leading-normal">
              Based on target companies (Google) and weak subject memories, the Career Intelligence Agent surfaces these key skill discrepancies:
            </p>

            <div className="flex flex-col gap-2 pt-1">
              {profile.weakSubjects.map((subject, idx) => (
                <div key={idx} className="bg-red-500/[0.03] border border-red-500/20 p-2 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-red-300 font-medium">{subject}</span>
                  <span className="text-[9px] font-mono uppercase bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">
                    High Priority
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Roadmap step view (Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {isGenerating ? (
            <div className="glass-card border-dashed rounded-2xl h-full min-h-[450px] flex flex-col items-center justify-center gap-3">
              <span className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-xs font-semibold text-white font-sans">Synthesizing learning structures...</p>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">Connecting RAG datasets to build searchable YouTube index matrices.</p>
              </div>
            </div>
          ) : !selectedRoadmap ? (
            <div className="glass-card border-dashed rounded-2xl h-full min-h-[450px] flex flex-col items-center justify-center gap-2 p-6 text-center">
              <Map className="w-12 h-12 text-slate-700" />
              <h4 className="text-sm font-display font-bold text-slate-400">No active roadmap directory</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1 font-sans">
                Trigger a custom path creation to build multi-phase educational steps.
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-5 flex flex-col gap-5">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-sky-400 font-mono">ACTIVE ROADMAP STUDY PLAN</span>
                <h3 className="text-xl font-display font-bold text-white mt-0.5">{selectedRoadmap.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedRoadmap.description}</p>
              </div>

              {/* Vertical steps progression flow */}
              <div className="flex flex-col gap-6 pl-4 border-l border-white/10 relative mt-2">
                
                {/* Steps mapped */}
                {selectedRoadmap.resources && selectedRoadmap.resources.length > 0 ? (
                  // Wait, how are steps defined? In our types.ts RoadmapItem represents a collection, or it could be step by step.
                  // Let's support step rendering if the roadmap structure is step-by-step.
                  // Wait! In server.ts we generated a 'roadmap' of steps array under GET/learning/roadmap!
                  // Let's map steps dynamically: if selectedRoadmap itself is an object, does it contain array steps or is it one step?
                  // To be extremely flexible, if the roadmap is structured as steps array on the client, we render them, or if it is a single item, we show its resource list. Let's design it so it shows the sub-steps or sub-resources beautifully!
                  // Let's check how we seeded:
                  // roadmaps: [ { id: 'road_1', title: 'System Design Essentials', description: '...', status: 'in_progress', resources: [...] } ]
                  // And in server.ts learning/roadmap, we returned an array of steps:
                  // [ { id: 'step_1', title: 'Phase 1', description: '...', resources: [...] } ]
                  // So we support BOTH! We treat the active selectedRoadmap as a roadmap, and if it has a resources list, we render those resources as milestones, and let the user toggle their status.
                  // Let's render the list of resources inside as Milestones!
                  selectedRoadmap.resources.map((resItem, idx) => (
                    <div key={idx} className="relative group">
                      {/* Milestone dot */}
                      <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-sky-400 border border-slate-950 group-hover:scale-110 transition" />

                      <div className="glass-card glass-card-hover p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase font-mono text-slate-500">MILESTONE STEP {idx + 1}</span>
                          <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                            {resItem.type === "video" ? (
                              <Youtube className="w-3.5 h-3.5 text-red-500" />
                            ) : (
                              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                            )}
                            {resItem.title}
                          </h4>
                          <span className="text-[11px] text-slate-400">Searchable Query / Official Site Study Group</span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto">
                          <a
                            href={resItem.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 text-slate-200 text-[10px] py-1.5 px-3 rounded-lg cursor-pointer transition font-mono border border-white/10"
                          >
                            <Compass className="w-3 h-3" /> STUDY SOURCE
                          </a>

                          {/* Checkbox tracker */}
                          <button
                            onClick={() => onUpdateStepStatus(selectedRoadmap.id, String(idx), 'completed')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-[10px] py-1.5 px-3 rounded-lg cursor-pointer transition"
                          >
                            <CheckSquare className="w-3 h-3" /> MARK COMPLETE
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback Steps
                  <div className="relative group">
                    <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-500 border border-slate-950" />
                    <div className="bg-white/[0.02] border border-white/10 p-4 rounded-xl text-center">
                      <span className="text-xs text-slate-500 font-mono">No steps declared in roadmap</span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
