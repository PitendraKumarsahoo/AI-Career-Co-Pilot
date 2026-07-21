import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Target, 
  ListTodo, 
  Flame, 
  Edit3, 
  CheckSquare, 
  Square, 
  Plus, 
  X, 
  RotateCcw,
  Sparkles
} from "lucide-react";
import { UserProfile, WeeklyGoal, SubTask } from "../types";

interface WeeklyGoalsProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => Promise<void>;
  onTriggerToast?: (message: string, type: 'milestone' | 'task' | 'success' | 'info') => void;
}

const DEFAULT_GOALS: WeeklyGoal[] = [
  {
    id: "1",
    title: "Algorithm & Core System Architecture",
    description: "Tackle advanced data structures, trees, dynamic programming, and D3 analytics systems",
    category: "Technical Depth",
    colorClass: "bg-gradient-to-r from-sky-400 to-indigo-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]",
    tasks: [
      { id: "1-1", text: "Solve 5 medium-hard Trees & Graph problems", completed: true },
      { id: "1-2", text: "Integrate Skill Radar D3 chart onto primary controller panel", completed: true },
      { id: "1-3", text: "Implement custom context session storage", completed: false },
    ]
  },
  {
    id: "2",
    title: "Continuous Session Security & Pipeline Resilience",
    description: "Ensure zero-downtime, safe cloud pipeline integrations and interactive alert guards",
    category: "System Stability",
    colorClass: "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]",
    tasks: [
      { id: "2-1", text: "Configure global keyboard shortcuts (Ctrl+K) command palette", completed: true },
      { id: "2-2", text: "Deploy inactive session monitor with automatic memory cache reset", completed: false },
      { id: "2-3", text: "Run lint compliance and verify clean production builds", completed: true },
    ]
  },
  {
    id: "3",
    title: "Mock Interview Drills & Resume ATS Targeting",
    description: "Build confidence in multi-agent real-time roleplays and keyword density optimizations",
    category: "Judge Readiness",
    colorClass: "bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    tasks: [
      { id: "3-1", text: "Perform 1 interactive mock interview simulation", completed: false },
      { id: "3-2", text: "Verify resume alignment index against top 3 job specifications", completed: true },
      { id: "3-3", text: "Prepare and log STAR-formatted experience summaries", completed: false },
    ]
  }
];

export default function WeeklyGoals({ profile, onUpdateProfile, onTriggerToast }: WeeklyGoalsProps) {
  // Derive goals directly from profile state, fallback if empty
  const goals = profile.weeklyGoals && profile.weeklyGoals.length > 0 
    ? profile.weeklyGoals 
    : DEFAULT_GOALS;

  // Initialize weekly goals in backend if not yet stored
  useEffect(() => {
    if (!profile.weeklyGoals || profile.weeklyGoals.length === 0) {
      onUpdateProfile({
        ...profile,
        weeklyGoals: DEFAULT_GOALS
      });
    }
  }, [profile.weeklyGoals]);

  const [isEditingGoalId, setIsEditingGoalId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDesc, setEditingDesc] = useState("");
  
  // Quick Add Sub-task State
  const [quickAddText, setQuickAddText] = useState("");
  const [quickAddGoalId, setQuickAddGoalId] = useState<string | null>(null);

  // Toggle sub-task completed
  const handleToggleSubTask = (goalId: string, taskId: string) => {
    let completedText = "";
    let newlyCompleted = false;
    const updatedGoals = goals.map(goal => {
      if (goal.id !== goalId) return goal;
      return {
        ...goal,
        tasks: goal.tasks.map(task => {
          if (task.id === taskId) {
            newlyCompleted = !task.completed;
            completedText = task.text;
            return { ...task, completed: !task.completed };
          }
          return task;
        })
      };
    });
    onUpdateProfile({ ...profile, weeklyGoals: updatedGoals });
    if (newlyCompleted && onTriggerToast) {
      onTriggerToast(`🎯 Objective Completed: "${completedText}"`, "task");
    }
  };

  // Start editing a Goal's metadata
  const handleStartEdit = (goal: WeeklyGoal) => {
    setIsEditingGoalId(goal.id);
    setEditingTitle(goal.title);
    setEditingDesc(goal.description);
  };

  // Save Goal metadata edits
  const handleSaveEdit = (goalId: string) => {
    const updatedGoals = goals.map(goal => 
      goal.id === goalId 
        ? { ...goal, title: editingTitle, description: editingDesc }
        : goal
    );
    onUpdateProfile({ ...profile, weeklyGoals: updatedGoals });
    setIsEditingGoalId(null);
  };

  // Add new sub-task to specific goal
  const handleAddSubTask = (goalId: string) => {
    if (!quickAddText.trim()) return;
    const updatedGoals = goals.map(goal => {
      if (goal.id !== goalId) return goal;
      return {
        ...goal,
        tasks: [
          ...goal.tasks,
          { id: `${goalId}-${Date.now()}`, text: quickAddText.trim(), completed: false }
        ]
      };
    });
    onUpdateProfile({ ...profile, weeklyGoals: updatedGoals });
    setQuickAddText("");
    setQuickAddGoalId(null);
  };

  // Delete sub-task
  const handleDeleteSubTask = (goalId: string, taskId: string) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id !== goalId) return goal;
      return {
        ...goal,
        tasks: goal.tasks.filter(t => t.id !== taskId)
      };
    });
    onUpdateProfile({ ...profile, weeklyGoals: updatedGoals });
  };

  // Reset to default objectives
  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to reset goals to default system objectives?")) {
      onUpdateProfile({ ...profile, weeklyGoals: DEFAULT_GOALS });
    }
  };

  // Calculate stats for a single goal
  const getGoalProgress = (goal: WeeklyGoal) => {
    if (goal.tasks.length === 0) return 0;
    const completedCount = goal.tasks.filter(t => t.completed).length;
    return Math.round((completedCount / goal.tasks.length) * 100);
  };

  // Overall combined weekly objectives score
  const totalTasks = goals.reduce((acc, g) => acc + g.tasks.length, 0);
  const completedTasks = goals.reduce((acc, g) => acc + g.tasks.filter(t => t.completed).length, 0);
  const aggregateScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div id="weekly-objectives-card" className="glass-card rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-5 shrink-0">
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header and aggregate progress */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-sans font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" /> Top 3 Weekly Career Objectives
          </h3>
          <p className="text-slate-400 text-xs">
            Personalized, interactive objectives tracked dynamically. Complete tasks to auto-increment progress curves.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-start">
          <button 
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-slate-400 hover:text-white bg-white/5 border border-white/5 hover:border-white/10 rounded-lg transition cursor-pointer"
            title="Reset to default objectives"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>
          <div className="flex items-center gap-2.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <Flame className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-purple-300">
              Weekly Completion: {aggregateScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid for Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        {goals.map(goal => {
          const progress = getGoalProgress(goal);
          const isEditing = isEditingGoalId === goal.id;

          return (
            <div 
              key={goal.id} 
              className="bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl p-5 transition duration-200 flex flex-col justify-between gap-4 relative"
            >
              {/* Category tag */}
              <div className="flex justify-between items-start gap-2">
                <span className="text-[10px] font-mono bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/5">
                  {goal.category}
                </span>
                
                <button
                  onClick={() => isEditing ? handleSaveEdit(goal.id) : handleStartEdit(goal)}
                  className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition cursor-pointer"
                  title={isEditing ? "Save Objectives" : "Edit Objective details"}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title & Description */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="flex flex-col gap-2 mt-1">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="w-full text-xs font-bold bg-slate-950/80 text-white rounded p-1.5 border border-white/10 focus:outline-none focus:border-purple-400 font-sans"
                      placeholder="Goal Title"
                    />
                    <textarea
                      value={editingDesc}
                      onChange={(e) => setEditingDesc(e.target.value)}
                      className="w-full text-[11px] bg-slate-950/80 text-slate-300 rounded p-1.5 border border-white/10 h-16 focus:outline-none focus:border-purple-400 resize-none font-sans"
                      placeholder="Goal description..."
                    />
                    <button
                      onClick={() => handleSaveEdit(goal.id)}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] py-1 rounded transition mt-1 cursor-pointer font-sans"
                    >
                      Save Objective Changes
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-sm font-sans font-bold text-slate-100 line-clamp-1">
                      {goal.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-normal min-h-[32px] line-clamp-2">
                      {goal.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Progress Bar Container */}
              <div className="flex flex-col gap-1.5 pt-1 border-t border-white/5">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-300">
                  <span>Objective Progress</span>
                  <span className="font-bold">{progress}%</span>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="w-full h-2.5 bg-slate-950/50 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${goal.colorClass}`}
                  />
                </div>
              </div>

              {/* Dynamic Task List Checkbox */}
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  <span>Sub-Tasks Matrix</span>
                  <span>{goal.tasks.filter(t => t.completed).length}/{goal.tasks.length}</span>
                </div>

                <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto">
                  {goal.tasks.map(task => (
                    <div 
                      key={task.id}
                      className="group/task flex items-start gap-2 p-1.5 rounded-lg hover:bg-white/[0.02] transition"
                    >
                      <button
                        onClick={() => handleToggleSubTask(goal.id, task.id)}
                        className="text-slate-400 hover:text-white transition shrink-0 mt-0.5 cursor-pointer"
                      >
                        {task.completed ? (
                          <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className={`text-[11px] flex-1 font-sans ${
                        task.completed 
                          ? "text-slate-500 line-through decoration-slate-600" 
                          : "text-slate-300"
                      }`}>
                        {task.text}
                      </span>
                      <button
                        onClick={() => handleDeleteSubTask(goal.id, task.id)}
                        className="opacity-0 group-hover/task:opacity-100 p-0.5 hover:bg-white/10 rounded text-slate-500 hover:text-red-400 transition cursor-pointer"
                        title="Delete Task"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Quick Add Form inline */}
                {quickAddGoalId === goal.id ? (
                  <div className="flex items-center gap-1.5 mt-1.5 font-sans">
                    <input
                      type="text"
                      value={quickAddText}
                      onChange={(e) => setQuickAddText(e.target.value)}
                      placeholder="Add sub-task..."
                      className="flex-1 bg-slate-950/60 border border-white/10 rounded-lg p-1 px-2 text-[11px] text-white focus:outline-none focus:border-purple-400 font-sans"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddSubTask(goal.id);
                        if (e.key === "Escape") setQuickAddGoalId(null);
                      }}
                    />
                    <button
                      onClick={() => handleAddSubTask(goal.id)}
                      className="p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition cursor-pointer font-sans"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setQuickAddGoalId(goal.id);
                      setQuickAddText("");
                    }}
                    className="w-full mt-1 py-1 px-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-lg text-[10px] text-slate-400 hover:text-white transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Objective Sub-Task</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
