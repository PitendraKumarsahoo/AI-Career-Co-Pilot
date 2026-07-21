import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Compass, 
  Brain, 
  FileText, 
  GraduationCap, 
  MessagesSquare, 
  Award, 
  Calendar, 
  Download, 
  Sun, 
  Moon,
  Sparkles,
  Command,
  X,
  Clock,
  Trash2,
  Keyboard,
  HelpCircle
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onExportState: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenShortcuts?: () => void;
}

interface RecentHistoryItem {
  id: string;
  label: string;
  desc: string;
  category: string;
  timestamp: number;
}

export default function CommandPalette({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onExportState,
  theme,
  onToggleTheme,
  onOpenShortcuts
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load search history locally
  const [recentHistory, setRecentHistory] = useState<RecentHistoryItem[]>(() => {
    const saved = localStorage.getItem("careerpilot_command_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading command palette search history:", e);
      }
    }
    return [];
  });

  // Command items configuration
  const items = [
    { id: "dashboard", category: "Navigation", label: "Go to Dashboard", desc: "Overview of your career state and analytics", icon: Compass, action: () => { setActiveTab("dashboard"); onClose(); } },
    { id: "memory", category: "Navigation", label: "Go to Memory Agent", desc: "View and log episodic & semantic memories", icon: Brain, action: () => { setActiveTab("memory"); onClose(); } },
    { id: "resume", category: "Navigation", label: "Go to Resume Agent", desc: "Analyze resume against job descriptions", icon: FileText, action: () => { setActiveTab("resume"); onClose(); } },
    { id: "learning", category: "Navigation", label: "Go to Learning Agent", desc: "Access personalized study roadmaps", icon: GraduationCap, action: () => { setActiveTab("learning"); onClose(); } },
    { id: "interview", category: "Navigation", label: "Go to Interview Agent", desc: "Practice interactive real-time mock interviews", icon: MessagesSquare, action: () => { setActiveTab("interview"); onClose(); } },
    { id: "career", category: "Navigation", label: "Go to Career Agent", desc: "AI career paths & suggestions engine", icon: Award, action: () => { setActiveTab("career"); onClose(); } },
    { id: "scheduler", category: "Navigation", label: "Go to Scheduler & Reports", desc: "Track application logs & automated reports", icon: Calendar, action: () => { setActiveTab("scheduler"); onClose(); } },
    { id: "export", category: "System Actions", label: "Export State Backup", desc: "Download all profile, roadmap, and application states as JSON", icon: Download, action: () => { onExportState(); onClose(); } },
    { id: "theme", category: "System Actions", label: `Toggle Theme (Switch to ${theme === "dark" ? "Light" : "Dark"} Mode)`, desc: "Switch color styles globally", icon: theme === "dark" ? Sun : Moon, action: () => { onToggleTheme(); onClose(); } },
    { id: "shortcuts", category: "Help & Shortcuts", label: "Keyboard Shortcuts Help Panel", desc: "Show list of keyboard shortcuts for fast routing and commands", icon: Keyboard, action: () => { if (onOpenShortcuts) onOpenShortcuts(); onClose(); } },
  ];

  // Key event listeners for opening / closing / selecting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle focus on open
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Track item action and save to history
  const handleItemAction = (item: any) => {
    setRecentHistory((prev) => {
      const filtered = prev.filter((h) => h.id !== item.id);
      const newHistory = [
        {
          id: item.id,
          label: item.label,
          desc: item.desc,
          category: item.category,
          timestamp: Date.now()
        },
        ...filtered
      ].slice(0, 5); // limit to top 5
      localStorage.setItem("careerpilot_command_history", JSON.stringify(newHistory));
      return newHistory;
    });
    item.action();
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentHistory([]);
    localStorage.removeItem("careerpilot_command_history");
    setSelectedIndex(0);
  };

  // Filtered list of items
  const filteredItems = items.filter(
    (item) =>
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Compiled items to show. When search is empty, show recent actions first!
  const displayItems = search 
    ? filteredItems 
    : [
        ...recentHistory.map((hist) => {
          const original = items.find((i) => i.id === hist.id);
          return {
            id: hist.id,
            category: "Recent Searches",
            label: hist.label,
            desc: hist.desc,
            icon: original ? original.icon : Clock,
            action: () => {
              if (original) original.action();
            }
          };
        }),
        ...items.filter((item) => !recentHistory.some((h) => h.id === item.id))
      ];

  // Key handler inside open palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % displayItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + displayItems.length) % displayItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (displayItems[selectedIndex]) {
        handleItemAction(displayItems[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-start justify-center pt-[10vh] px-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0, y: -10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: -10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="w-full max-w-lg glass-card rounded-2xl overflow-hidden border border-white/15 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search header bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <Search className="w-5 h-5 text-sky-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search panel..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            {recentHistory.length > 0 && !search && (
              <button 
                onClick={clearHistory}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/20 transition cursor-pointer"
                title="Clear recent history"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
            <span className="text-[10px] font-mono bg-white/10 text-slate-300 px-1.5 py-0.5 rounded border border-white/5 uppercase">
              ESC
            </span>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results area */}
        <div className="max-h-[360px] overflow-y-auto p-2 flex flex-col gap-0.5">
          {displayItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-sans">
              No results found for "{search}"
            </div>
          ) : (
            displayItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              const isRecent = item.category === "Recent Searches";
              return (
                <button
                  key={`${item.id}-${isRecent ? "recent" : "item"}`}
                  onClick={() => handleItemAction(item)}
                  className={`w-full text-left flex items-start gap-3.5 p-2.5 rounded-xl transition duration-150 cursor-pointer border ${
                    isSelected 
                      ? "bg-sky-500/10 border-sky-500/20 shadow-sm" 
                      : "bg-transparent border-transparent hover:bg-white/[0.02]"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    isSelected 
                      ? isRecent ? "bg-amber-500/20 text-amber-300" : "bg-sky-500/20 text-sky-300" 
                      : isRecent ? "bg-amber-500/5 text-amber-400" : "bg-white/5 text-slate-400"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <span className={`text-xs font-sans font-bold block ${
                        isSelected ? "text-white" : "text-slate-200"
                      }`}>
                        {item.label}
                      </span>
                      <span className={`text-[9px] font-mono bg-slate-950/40 px-1.5 py-0.5 rounded uppercase ${
                        isRecent ? "text-amber-400" : "text-slate-500"
                      }`}>
                        {item.category}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate font-sans">
                      {item.desc}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500">
          <div className="flex items-center gap-2 font-sans">
            <Command className="w-3.5 h-3.5 text-slate-400" />
            <span>Use ↑↓ keys to select and Enter to commit</span>
          </div>
          <span className="font-mono text-[9px] bg-sky-500/5 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/10">
            Ctrl + K
          </span>
        </div>
      </motion.div>
    </div>
  );
}
