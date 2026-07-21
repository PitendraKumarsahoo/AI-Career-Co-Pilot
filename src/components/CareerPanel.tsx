/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Award, 
  Building2, 
  MapPin, 
  TrendingUp, 
  Sparkles, 
  Plus, 
  CheckCircle,
  Briefcase,
  AlertCircle,
  Search
} from "lucide-react";
import { JobApplication, UserProfile } from "../types";

interface CareerPanelProps {
  profile: UserProfile;
  applications: JobApplication[];
  onAddApplication: (company: string, role: string) => void;
  onUpdateAppStatus: (appId: string, status: JobApplication['status']) => void;
  onFetchCareerSuggestions: () => Promise<any>;
  suggestions: {
    roles: string[];
    companies: string[];
    skillGaps: string[];
    preparationSteps: string[];
  } | null;
  isFetchingSuggestions: boolean;
  onUpdateProfile: (profile: UserProfile) => void;
}

export default function CareerPanel({
  profile,
  applications,
  onAddApplication,
  onUpdateAppStatus,
  onFetchCareerSuggestions,
  suggestions,
  isFetchingSuggestions,
  onUpdateProfile
}: CareerPanelProps) {
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Target Role & Skill Gap state
  const currentTargetRole = profile.targetRole || "Full-Stack Engineer";
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [tempRole, setTempRole] = useState(currentTargetRole);

  const ROLE_SKILL_REQUIREMENTS: Record<string, string[]> = {
    "Full-Stack Engineer": ["TypeScript", "React", "Node.js", "Docker", "PostgreSQL", "GraphQL", "Redis", "AWS"],
    "Frontend Engineer": ["TypeScript", "React", "Next.js", "Tailwind CSS", "Redux", "CSS Grid", "Webpack", "Vite"],
    "Backend Engineer": ["Node.js", "Python", "Go", "PostgreSQL", "Docker", "Redis", "gRPC", "Kubernetes", "AWS"],
    "Data Scientist": ["Python", "R", "SQL", "Pandas", "Scikit-Learn", "TensorFlow", "PyTorch", "Spark"],
    "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Linux", "Bash", "Prometheus"]
  };

  const matchedRoleKey = Object.keys(ROLE_SKILL_REQUIREMENTS).find(
    k => k.toLowerCase() === currentTargetRole.toLowerCase()
  ) || "Full-Stack Engineer";
  const requiredSkills = ROLE_SKILL_REQUIREMENTS[matchedRoleKey];

  const userSkills = profile.skills || [];
  const matchingSkills = requiredSkills.filter(s => 
    userSkills.some(us => us.toLowerCase() === s.toLowerCase())
  );
  const missingSkills = requiredSkills.filter(s => 
    !userSkills.some(us => us.toLowerCase() === s.toLowerCase())
  );
  const matchRate = Math.round((matchingSkills.length / requiredSkills.length) * 100);

  const handleBridgeSkill = (skill: string) => {
    if (userSkills.includes(skill)) return;
    const updatedSkills = [...userSkills, skill];
    const updatedProfile = {
      ...profile,
      skills: updatedSkills
    };
    onUpdateProfile(updatedProfile);
  };

  const handleSaveRole = () => {
    if (!tempRole.trim()) return;
    const updatedProfile = {
      ...profile,
      targetRole: tempRole.trim()
    };
    onUpdateProfile(updatedProfile);
    setIsEditingRole(false);
  };

  const handleAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) return;
    onAddApplication(newCompany, newRole);
    setNewCompany("");
    setNewRole("");
    setIsAdding(false);
  };

  const statusColumns: { id: JobApplication['status']; label: string; color: string }[] = [
    { id: "interested", label: "Interested", color: "border-slate-800 text-slate-400 bg-slate-950/20" },
    { id: "applied", label: "Applied", color: "border-sky-500/30 text-sky-400 bg-sky-500/5" },
    { id: "interviewing", label: "Interviewing", color: "border-purple-500/30 text-purple-400 bg-purple-500/5" },
    { id: "offered", label: "Offered 🎉", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" }
  ];

  return (
    <div id="career-panel" className="flex-1 overflow-y-auto p-6 bg-transparent text-slate-100 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-gradient-purple-sky">Career Intelligence Agent</span> <Award className="w-7 h-7 text-sky-400 animate-pulse" />
          </h2>
          <p className="text-slate-400 text-sm font-sans">
            Map target companies, analyze role alignments, and manage active internship/placement trackers.
          </p>
        </div>

        <button
          onClick={onFetchCareerSuggestions}
          disabled={isFetchingSuggestions}
          className="flex items-center gap-2 glass-button-primary text-white font-medium text-xs py-2 px-4 rounded-xl cursor-pointer shadow-md"
        >
          {isFetchingSuggestions ? "Formulating Career Suggestions..." : "Query Career Agent"}
          <Sparkles className="w-3.5 h-3.5 text-sky-300" />
        </button>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNS 1 & 2: Internship board */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {/* Target Role & Skill Gap Alignment Dashboard */}
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-5 shadow-lg border border-white/10 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold block">PROTOCOL STATUS</span>
                {isEditingRole ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={tempRole}
                      onChange={(e) => setTempRole(e.target.value)}
                      placeholder="e.g. Frontend Engineer"
                      className="glass-input rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none w-48 font-semibold font-display bg-slate-950/40"
                    />
                    <button
                      type="button"
                      onClick={handleSaveRole}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition cursor-pointer font-mono"
                    >
                      SAVE
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTempRole(currentTargetRole);
                        setIsEditingRole(false);
                      }}
                      className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-[10px] font-bold transition cursor-pointer font-mono"
                    >
                      CANCEL
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 mt-1">
                    <h3 className="text-xl font-display font-black text-white">{currentTargetRole}</h3>
                    <button
                      type="button"
                      onClick={() => setIsEditingRole(true)}
                      className="text-[10px] font-mono text-sky-400 hover:text-sky-300 border border-sky-500/20 px-2 py-0.5 rounded bg-sky-500/5 cursor-pointer transition"
                    >
                      Edit Target
                    </button>
                  </div>
                )}
              </div>

              {/* Progress rate meter */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Match Compatibility</span>
                  <span className={`text-xl font-black font-mono ${matchRate >= 80 ? 'text-emerald-400' : matchRate >= 50 ? 'text-yellow-400 animate-pulse' : 'text-rose-400'}`}>
                    {matchRate}%
                  </span>
                </div>
                {/* Circular ring indicator */}
                <div className="relative w-11 h-11 flex items-center justify-center rounded-full bg-white/5 border border-white/10">
                  <span className="text-[10px] font-mono font-bold text-slate-300">{matchingSkills.length}/{requiredSkills.length}</span>
                </div>
              </div>
            </div>

            {/* Matching & Gaps Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* MATCHING SKILLS COLUMN */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Compliant Skills ({matchingSkills.length})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-1 bg-emerald-500/[0.01] border border-emerald-500/5 rounded-xl">
                  {matchingSkills.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic p-2 font-sans">No matching skills detected. Expand your profile.</span>
                  ) : (
                    matchingSkills.map((skill) => (
                      <span key={skill} className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* SKILL GAPS (MISSING SKILLS) COLUMN */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-yellow-400 animate-pulse" /> Skill Gap suggestions ({missingSkills.length})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-1 bg-yellow-500/[0.01] border border-yellow-500/5 rounded-xl">
                  {missingSkills.length === 0 ? (
                    <span className="text-[11px] text-emerald-400 font-semibold p-2 flex items-center gap-1 font-sans">
                      🎉 100% Alignment! Outstanding technical compliance.
                    </span>
                  ) : (
                    missingSkills.map((skill) => (
                      <div key={skill} className="group relative text-[10px] font-mono bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium hover:bg-yellow-500/15 transition">
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleBridgeSkill(skill)}
                          className="text-[9px] bg-yellow-500 text-slate-950 font-bold px-1.5 py-0.5 rounded hover:bg-white cursor-pointer transition shadow"
                          title={`Add ${skill} directly to your master skills profile`}
                        >
                          Bridge
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider text-slate-400">
                <Briefcase className="w-4 h-4 text-sky-400 animate-pulse" /> Internship Application Tracker
              </h3>

              <button
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-[10px] py-1 px-2.5 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> ADD INTERNSHIP
              </button>
            </div>

            {/* Inline Add Form */}
            {isAdding && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                onSubmit={handleAddApp}
                className="glass-card p-4 rounded-xl flex flex-col sm:flex-row gap-3 mt-1"
              >
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Company Name</span>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g. Adobe"
                    className="glass-input rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Target Role</span>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="e.g. Software Engineer Intern"
                    className="glass-input rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs px-4 py-1.5 rounded-lg self-end h-[32px] cursor-pointer"
                >
                  Confirm Card
                </button>
              </motion.form>
            )}

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 mt-2">
              {statusColumns.map((col) => {
                const colApps = applications.filter((app) => app.status === col.id);
                return (
                  <div key={col.id} className="flex flex-col gap-2 bg-slate-950/20 p-2.5 rounded-xl border border-white/5">
                    <span className={`text-[10px] font-mono font-bold uppercase pb-1.5 border-b border-white/5 flex justify-between items-center ${col.color.split(" ")[1]}`}>
                      <span>{col.label}</span>
                      <span className="text-[9px] bg-white/5 border border-white/10 text-slate-400 px-1.5 py-0.5 rounded-full font-sans font-normal">
                        {colApps.length}
                      </span>
                    </span>

                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px]">
                      {colApps.map((app) => (
                        <div key={app.id} className="glass-card p-2.5 rounded-lg shadow-sm flex flex-col gap-2 hover:border-sky-500/30 transition">
                          <div>
                            <h4 className="text-[11px] font-bold text-white leading-tight font-display">{app.role}</h4>
                            <span className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5 font-sans">
                              <Building2 className="w-2.5 h-2.5 text-sky-400" /> {app.company}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1 border-t border-white/5 pt-2">
                            {statusColumns
                              .filter((sibling) => sibling.id !== col.id)
                              .map((sibling) => (
                                <button
                                  key={sibling.id}
                                  onClick={() => onUpdateAppStatus(app.id, sibling.id)}
                                  className="text-[8px] font-mono hover:text-white hover:bg-white/10 text-slate-400 border border-white/10 px-1 py-0.5 rounded cursor-pointer transition capitalize"
                                >
                                  → {sibling.id.split("_")[0]}
                                </button>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMN 3: Suggestions from Career Agent */}
        <div className="flex flex-col gap-4">
          {isFetchingSuggestions ? (
            <div className="glass-card border-dashed rounded-2xl h-full min-h-[400px] flex flex-col items-center justify-center gap-3">
              <span className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-center p-4">
                <p className="text-xs font-semibold text-white font-sans">Career Intelligence computing...</p>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">Cross-referencing core goals, certifications, and weak threads from database.</p>
              </div>
            </div>
          ) : !suggestions ? (
            <div className="glass-card border-dashed rounded-2xl h-full min-h-[400px] flex flex-col items-center justify-center gap-2 p-6 text-center">
              <Sparkles className="w-10 h-10 text-slate-700" />
              <h4 className="text-sm font-display font-bold text-slate-400">Career suggestions offline</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1 font-sans">
                Hit "Query Career Agent" in the header to synthesize recommendations directly.
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-5 flex flex-col gap-4.5 shadow-lg">
              
              {/* Recommended Roles */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-400 animate-pulse" /> High-Match Roles
                </span>
                <div className="flex flex-col gap-1">
                  {suggestions.roles.map((role) => (
                    <div key={role} className="glass-card p-2.5 rounded-xl text-xs font-semibold text-white font-display">
                      {role}
                    </div>
                  ))}
                </div>
              </div>

              {/* Target fitting companies */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Target Corporates
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.companies.map((company) => (
                    <span key={company} className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full">
                      {company}
                    </span>
                  ))}
                </div>
              </div>

              {/* Specific Prep steps */}
              <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-purple-400" /> Intelligence Action Steps
                </span>
                <ul className="flex flex-col gap-2.5">
                  {suggestions.preparationSteps.map((step, idx) => (
                    <li key={idx} className="text-xs text-slate-300 leading-normal flex gap-2">
                      <span className="text-purple-400 font-mono font-bold">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
