/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Brain, 
  Trash2, 
  Sparkles, 
  Search, 
  SlidersHorizontal, 
  AlertCircle,
  Minimize2,
  Calendar,
  Compass,
  ArrowDownWideNarrow,
  Mic,
  MicOff,
  Plus,
  Square,
  Timer,
  Check,
  RotateCcw
} from "lucide-react";
import { Memory, SystemContext } from "../types";

interface MemoryPanelProps {
  memories: Memory[];
  onForgetMemory: (id: string) => void;
  onCompressMemories: () => Promise<void>;
  isCompressing: boolean;
  compressionResult: string | null;
  systemContext?: SystemContext | null;
  onAddMemory?: (content: string, type: 'episodic' | 'semantic' | 'preference', importance: number, category: string, tags?: string[]) => Promise<any>;
}

export default function MemoryPanel({
  memories,
  onForgetMemory,
  onCompressMemories,
  isCompressing,
  compressionResult,
  systemContext,
  onAddMemory
}: MemoryPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedImportance, setSelectedImportance] = useState<number>(0);
  const [selectedFilterTag, setSelectedFilterTag] = useState<string>("all");

  const [newMemoryTags, setNewMemoryTags] = useState<string[]>([]);
  const PRESET_TAGS = ["#career", "#interview", "#learning", "#networking", "#success", "#milestone", "#problem-solving"];

  // Speech Recognition & Advanced Voice Dictation Engine States
  const [newMemoryContent, setNewMemoryContent] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logCategory, setLogCategory] = useState("Voice Log");
  const [logImportance, setLogImportance] = useState(5);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Advanced Voice States
  const [activeTab, setActiveTab] = useState<"type" | "voice">("voice");
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState<number[]>(Array(12).fill(15));

  // Audio Context and Stream References for Real-time Micro-interaction Visualizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Real Audio Volume Analyzer
  const startAudioAnalyzer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // Low fftSize for responsive volume check
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateBars = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Map frequencies to our 12 bars
        const volumes = Array.from({ length: 12 }, (_, i) => {
          const index = Math.floor((i / 12) * bufferLength);
          const val = dataArray[index] || 0;
          return Math.max(15, (val / 255) * 100);
        });
        setAudioVolume(volumes);
        animationFrameRef.current = requestAnimationFrame(updateBars);
      };

      updateBars();
    } catch (err) {
      console.warn("Could not access microphone for visualizer, falling back to simulation:", err);
      // Fallback to high-fidelity wave simulation
      let simTick = 0;
      const simulateWave = () => {
        simTick++;
        const simulated = Array.from({ length: 12 }, (_, i) => {
          const base = Math.sin(simTick * 0.15 + i * 0.4) * 35 + 50;
          const noise = Math.random() * 15;
          return Math.max(15, base + noise);
        });
        setAudioVolume(simulated);
        animationFrameRef.current = requestAnimationFrame(simulateWave);
      };
      simulateWave();
    }
  };

  const stopAudioAnalyzer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioVolume(Array(12).fill(15));
  };

  // Recording Timer effect
  useEffect(() => {
    let timerInterval: any;
    if (isListening) {
      timerInterval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(timerInterval);
  }, [isListening]);

  // Clean up analyzer on unmount
  useEffect(() => {
    return () => {
      stopAudioAnalyzer();
    };
  }, []);

  // Initialize SpeechRecognition on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.lang = "en-US";
      rec.interimResults = true;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
        stopAudioAnalyzer();
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setRecognitionError("Microphone access denied. Please verify your browser/iframe credentials.");
        } else {
          setRecognitionError(`Speech recognition failed: ${event.error}`);
        }
        setIsListening(false);
        stopAudioAnalyzer();
      };

      setRecognition(rec);
    } else {
      setRecognitionError("Web Speech Recognition API is unsupported on this browser.");
    }
  }, []);

  const handleMicToggle = () => {
    if (!recognition) {
      setRecognitionError("Speech recognition is not supported in your browser. Try typing your memory manually.");
      return;
    }

    if (isListening) {
      recognition.stop();
      stopAudioAnalyzer();
    } else {
      setRecognitionError(null);
      setNewMemoryContent("");
      
      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const text = finalTranscript || interimTranscript;
        if (text) {
          setNewMemoryContent(text);
        }
      };

      try {
        recognition.start();
        startAudioAnalyzer();
      } catch (err: any) {
        console.error("Failed to start recognition:", err);
        setRecognitionError("Failed to initialize recording hardware.");
      }
    }
  };

  // Auto-suggest tags based on content
  const autoSuggestedTags = React.useMemo(() => {
    const suggestions: string[] = [];
    const lower = newMemoryContent.toLowerCase();
    if (lower.includes("interview") || lower.includes("mock") || lower.includes("roleplay") || lower.includes("star")) {
      suggestions.push("#interview");
    }
    if (lower.includes("learn") || lower.includes("course") || lower.includes("study") || lower.includes("roadmap") || lower.includes("read") || lower.includes("d3") || lower.includes("typescript") || lower.includes("react")) {
      suggestions.push("#learning");
    }
    if (lower.includes("career") || lower.includes("job") || lower.includes("resume") || lower.includes("target") || lower.includes("ats")) {
      suggestions.push("#career");
    }
    if (lower.includes("meet") || lower.includes("network") || lower.includes("referral") || lower.includes("linkedin")) {
      suggestions.push("#networking");
    }
    if (lower.includes("success") || lower.includes("complete") || lower.includes("finish") || lower.includes("conquer") || lower.includes("win")) {
      suggestions.push("#success");
    }
    if (lower.includes("milestone") || lower.includes("achieve") || lower.includes("point")) {
      suggestions.push("#milestone");
    }
    if (lower.includes("solve") || lower.includes("bug") || lower.includes("debug") || lower.includes("problem")) {
      suggestions.push("#problem-solving");
    }
    return suggestions;
  }, [newMemoryContent]);

  const handleVoiceFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryContent.trim() || !onAddMemory) return;

    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      // Merge manually selected tags with any relevant autoSuggestedTags if not already there
      const finalTags = Array.from(new Set([...newMemoryTags, ...autoSuggestedTags]));

      const result = await onAddMemory(
        newMemoryContent,
        "episodic",
        logImportance,
        logCategory || "Voice Log",
        finalTags
      );
      if (result) {
        setSuccessMessage("Episodic voice memory added to active agent registry!");
        setNewMemoryContent("");
        setNewMemoryTags([]);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error("Error adding episodic memory:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetRecordState = () => {
    if (isListening) {
      recognition.stop();
      stopAudioAnalyzer();
    }
    setNewMemoryContent("");
    setRecordingDuration(0);
    setRecognitionError(null);
    setNewMemoryTags([]);
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filters
  const filteredMemories = memories.filter(memory => {
    const matchesSearch = memory.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          memory.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || memory.type === selectedType;
    const matchesImportance = memory.importance >= selectedImportance;
    const matchesTag = selectedFilterTag === "all" || (memory.tags && memory.tags.includes(selectedFilterTag));
    return matchesSearch && matchesType && matchesImportance && matchesTag;
  });

  return (
    <div id="memory-panel" className="flex-1 overflow-y-auto p-6 bg-transparent text-slate-100 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-gradient-purple-sky">State Memory Agent</span> <Brain className="w-6 h-6 text-sky-400 animate-pulse" />
          </h2>
          <p className="text-slate-400 text-sm font-sans">
            Retain cross-session career context, optimize prompt tokens, and compress logs.
          </p>
        </div>

        {/* Compression Trigger Button */}
        <button
          onClick={onCompressMemories}
          disabled={isCompressing || memories.length < 3}
          className="flex items-center gap-2 glass-button-primary text-white font-medium text-xs py-2 px-4 rounded-xl cursor-pointer shadow-md disabled:opacity-50"
        >
          {isCompressing ? "Synthesizing Guidelines..." : "Compress Memory Window"}
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* RAG Info Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 glass-card p-4 rounded-2xl">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400">Context Window Compression</span>
          <span className="text-xs text-slate-300">
            Fusing old episodic event logs into high-level semantic rules protects Gemini context space from clutter.
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400">Timely Forgetting Mechanism</span>
          <span className="text-xs text-slate-300">
            Manually pruning outdated experience files avoids biases in automated roadmap generation.
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400">Memory Alignment</span>
          <span className="text-xs text-slate-300">
            Preference, semantic, and episodic records synchronize on-write to update target companies and goals.
          </span>
        </div>
      </div>

      {/* Long-Term System Context File (Long-Term Retention) Section */}
      <div className="glass-card-purple rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden shadow-lg animate-pulse" style={{ animationDuration: '4s' }}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '20s' }} />
            </div>
            <div>
              <h3 className="text-sm font-sans font-medium text-white flex items-center gap-1.5">
                Long-Term System Context File
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  PERSISTED
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Data Store: <code className="font-mono text-purple-300">data/system_context.json</code> (Saves context window capacity, prevents vector db bloat)
              </p>
            </div>
          </div>
          {systemContext && (
            <span className="text-[10px] text-slate-500 font-mono">
              Last Synced: {new Date(systemContext.lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>

        {systemContext && systemContext.compressedMemoriesCount > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Left summary card */}
            <div className="md:col-span-1 bg-white/[0.01] border border-white/5 p-4 rounded-xl flex flex-col gap-2">
              <span className="text-[10px] uppercase font-mono text-purple-400 tracking-wider">Overall AI Context Synthesizer</span>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{systemContext.overallSummary}"
              </p>
              <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Pruned Counts:</span>
                <span className="text-xs font-mono font-bold text-white bg-purple-500/20 px-2 py-0.5 rounded">
                  {systemContext.compressedMemoriesCount} memories
                </span>
              </div>
            </div>

            {/* Right compressed fact stream */}
            <div className="md:col-span-2 flex flex-col gap-2">
              <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider flex items-center gap-1.5">
                <ArrowDownWideNarrow className="w-3.5 h-3.5 text-purple-400" />
                Active Compressed Facts Stream (Historical Pruned Logs)
              </span>
              <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
                {systemContext.historyLog.map((log) => (
                  <div key={log.id} className="bg-slate-950/40 border border-white/5 p-2 rounded-lg flex items-start justify-between gap-4 text-[11px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-300 font-medium">{log.compressedSummary}</span>
                      <span className="text-[9px] text-slate-500 flex items-center gap-1">
                        Original: <span className="text-slate-400 truncate max-w-xs md:max-w-md">"{log.originalContent}"</span>
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 whitespace-nowrap bg-white/5 px-1.5 py-0.5 rounded mt-0.5">
                      {log.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center flex flex-col items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-400/40" />
            <span className="text-xs text-slate-400">System Context File is currently waiting for pruned guidelines</span>
            <span className="text-[11px] text-slate-500">
              When you prune (delete) active memory cards below using the trash bin, CareerPilot will compress them into this file!
            </span>
          </div>
        )}
      </div>

      {/* Speech-to-Text Memory Logger */}
      <div id="voice-dictation-logger" className="glass-card rounded-2xl p-5 shadow-xl border border-white/10 relative overflow-hidden flex flex-col gap-5">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
        
        {/* Card Header & Tab Swapper */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-1 border-b border-white/5">
          <div>
            <h3 className="font-display font-bold text-white flex items-center gap-2 text-base">
              <Brain className="w-5 h-5 text-sky-400 animate-pulse" /> Episodic Memory Autopilot Logger
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Utilize high-fidelity voice dictation or manual input to feed the state memory pipeline.
            </p>
          </div>

          {/* Toggle Tab */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/40 border border-white/5 rounded-xl self-stretch sm:self-auto font-mono">
            <button
              type="button"
              onClick={() => { setActiveTab("voice"); handleResetRecordState(); }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === "voice" 
                  ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-md shadow-sky-500/5" 
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Live Dictation</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("type"); handleResetRecordState(); }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === "type" 
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-md shadow-purple-500/5" 
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Keyboard Entry</span>
            </button>
          </div>
        </div>

        {/* Tab contents */}
        {activeTab === "voice" ? (
          <div className="flex flex-col gap-4">
            {recognitionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-xs text-red-400 font-sans">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{recognitionError}</span>
              </div>
            )}

            {/* Live Dictation States */}
            {!isListening && !newMemoryContent.trim() ? (
              /* State A: Ready to record */
              <div className="flex flex-col items-center justify-center py-6 px-4 bg-slate-950/20 border border-white/5 border-dashed rounded-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-sky-500/[0.02] to-transparent pointer-events-none" />
                <button
                  type="button"
                  onClick={handleMicToggle}
                  className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 cursor-pointer hover:bg-sky-500/20 hover:border-sky-500/50 hover:text-white transition-all duration-300 shadow-lg shadow-sky-500/5 relative group-hover:scale-105"
                  title="Start Dictation Session"
                >
                  <motion.div
                    className="absolute inset-0 rounded-full bg-sky-500/10"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  />
                  <Mic className="w-7 h-7 relative z-10 animate-pulse" />
                </button>
                <span className="text-sm font-semibold text-white mt-4 font-sans tracking-tight">Begin Voice Dictation</span>
                <span className="text-[11px] text-slate-500 mt-1 max-w-xs text-center font-sans">
                  Tap to launch recording. CareerPilot automatically processes speech-to-text transcripts into rich episodic events.
                </span>
              </div>
            ) : isListening ? (
              /* State B: Recording */
              <div className="flex flex-col gap-4 py-1.5">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2 text-xs text-red-400 font-mono animate-pulse">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                    <span>Voice Transmission Active: Listening...</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                    <Timer className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDuration(recordingDuration)}</span>
                  </div>
                </div>

                {/* Soundwave Visualizer */}
                <div className="flex items-center justify-center gap-1 h-14 w-full py-2 bg-slate-950/40 border border-white/5 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-sky-500/[0.03] via-transparent to-purple-500/[0.03] pointer-events-none" />
                  {audioVolume.map((vol, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-gradient-to-t from-sky-400 to-purple-400 transition-all duration-75"
                      style={{ height: `${vol}%`, minHeight: "4px" }}
                    />
                  ))}
                </div>

                {/* Live Transcript Stream Panel */}
                <div className="bg-slate-950/65 border border-white/10 rounded-xl p-3.5 min-h-[90px] max-h-[140px] overflow-y-auto shadow-inner relative">
                  <span className="absolute top-1 right-2 text-[8px] font-mono text-slate-600 uppercase tracking-widest">Live transcription feedback</span>
                  <p className="text-xs text-sky-200 leading-relaxed italic font-sans pr-10">
                    {newMemoryContent ? `"${newMemoryContent}"` : "Listening... Speak now."}
                    <span className="inline-block w-1 h-3.5 ml-1 bg-sky-400 animate-pulse align-middle" />
                  </p>
                </div>

                {/* Recording Control Actions */}
                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleResetRecordState}
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium text-xs py-2 px-3.5 rounded-xl transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Discard</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleMicToggle}
                    className="flex items-center gap-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/40 text-red-400 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop dictation</span>
                  </button>
                </div>
              </div>
            ) : (
              /* State C: Transcribed & Reviewable */
              <div className="flex flex-col gap-3 py-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Review & Fine-Tune Transcript</span>
                  <button
                    type="button"
                    onClick={handleMicToggle}
                    className="text-xs text-sky-400 hover:text-sky-300 font-mono font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Re-record voice log
                  </button>
                </div>
                <textarea
                  value={newMemoryContent}
                  onChange={(e) => setNewMemoryContent(e.target.value)}
                  placeholder="Review or edit transcribed voice logs..."
                  className="w-full h-24 glass-input rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                />
              </div>
            )}
          </div>
        ) : (
          /* Keyboard Manual Mode */
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-mono uppercase text-slate-400">Manual Memory Log</label>
            <textarea
              value={newMemoryContent}
              onChange={(e) => setNewMemoryContent(e.target.value)}
              placeholder="Type your core episodic memory or career milestone here..."
              className="w-full h-24 glass-input rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            />
          </div>
        )}

        {/* Dynamic Category & Importance (shared by both tabs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-3">
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
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Log Category</label>
            <input
              type="text"
              value={logCategory}
              onChange={(e) => setLogCategory(e.target.value)}
              placeholder="e.g. Interview, Event, Achievement"
              className="w-full glass-input rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
            />
          </div>
        </div>

        {/* Suggested & Selected tags */}
        <div className="border-t border-white/5 pt-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase text-slate-400">Memory Tag Synchronization:</span>
            {autoSuggestedTags.length > 0 && (
              <span className="text-[9px] font-mono text-purple-400 animate-pulse">💡 AI Auto-Suggested {autoSuggestedTags.length} tag{autoSuggestedTags.length > 1 ? "s" : ""}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_TAGS.map((tag) => {
              const isAutoSuggested = autoSuggestedTags.includes(tag);
              const isSelected = newMemoryTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setNewMemoryTags(prev => prev.filter(t => t !== tag));
                    } else {
                      setNewMemoryTags(prev => [...prev, tag]);
                    }
                  }}
                  className={`text-[10px] font-sans px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                    isSelected 
                      ? "bg-purple-500/20 border-purple-500 text-purple-300 font-bold" 
                      : isAutoSuggested 
                        ? "bg-purple-500/5 border-purple-500/40 text-purple-400 animate-pulse"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/25"
                  }`}
                >
                  <span>{tag}</span>
                  {isSelected && <span className="text-[8px] bg-purple-500 text-white rounded px-0.5 font-sans">✓</span>}
                  {!isSelected && isAutoSuggested && <span className="text-[8px] bg-purple-500/20 text-purple-400 rounded px-0.5 font-sans">+</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions bar at bottom */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-white/5 pt-3">
          <div>
            {successMessage ? (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" /> {successMessage}
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 leading-normal font-sans">
                Feeds episodic memory cards directly to CareerPilot's memory alignment vector network.
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 self-stretch sm:self-auto font-sans">
            {newMemoryContent.trim() && (
              <button
                type="button"
                onClick={handleResetRecordState}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1 text-[11px] bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200 px-3 py-2 rounded-xl transition cursor-pointer font-medium"
              >
                Clear Log
              </button>
            )}
            <button
              type="button"
              onClick={handleVoiceFormSubmit}
              disabled={isSubmitting || !newMemoryContent.trim() || isListening}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 glass-button-primary text-white font-medium text-[11px] py-2 px-5 rounded-xl disabled:opacity-40 cursor-pointer shadow-md"
            >
              {isSubmitting ? "Processing Autopilot Pipeline..." : "Commit Memory to State"}
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 rounded-2xl flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search core career memories..."
              className="w-full glass-input rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {/* Select Type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="glass-input rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Memory Types</option>
              <option value="episodic">Episodic (Events)</option>
              <option value="preference">Preference (Interests)</option>
              <option value="semantic">Semantic (Guidelines)</option>
            </select>

            {/* Select Importance */}
            <select
              value={selectedImportance}
              onChange={(e) => setSelectedImportance(Number(e.target.value))}
              className="glass-input rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value={0}>Any Importance</option>
              <option value={5}>Importance &gt;= 5</option>
              <option value={8}>Importance &gt;= 8</option>
            </select>
          </div>
        </div>

        {/* Tag filter chips row */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-3.5">
          <span className="text-[10px] font-mono uppercase text-slate-500 mr-1.5">Filter Chips:</span>
          <button
            onClick={() => setSelectedFilterTag("all")}
            className={`text-[10px] font-sans px-2.5 py-1 rounded-full border transition cursor-pointer ${
              selectedFilterTag === "all"
                ? "bg-sky-500/25 border-sky-400 text-sky-200 font-semibold"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            All Tags
          </button>
          {PRESET_TAGS.map((tag) => {
            const hasMatches = memories.some(m => m.tags && m.tags.includes(tag));
            return (
              <button
                key={tag}
                onClick={() => setSelectedFilterTag(tag)}
                className={`text-[10px] font-sans px-2.5 py-1 rounded-full border transition cursor-pointer flex items-center gap-1 ${
                  selectedFilterTag === tag
                    ? "bg-purple-500/25 border-purple-400 text-purple-200 font-semibold"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <span>{tag}</span>
                {hasMatches && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Compression Alert Result */}
      {compressionResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-purple-500/10 border border-purple-500/25 rounded-2xl flex gap-3 items-start"
        >
          <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-white">Context Compression Complete</span>
            <p className="text-[11px] text-slate-400 mt-0.5">{compressionResult}</p>
          </div>
        </motion.div>
      )}

      {/* Memory Cards Grid */}
      {filteredMemories.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-2xl py-12 text-center flex flex-col items-center justify-center gap-2">
          <Brain className="w-8 h-8 text-slate-600" />
          <span className="text-sm text-slate-400">No matching memories found in registry</span>
          <span className="text-xs text-slate-500">Add logs on the Dashboard tab to populate intelligence.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMemories.map((memory) => {
            const isComp = memory.id.startsWith("mem_comp_");
            return (
              <motion.div
                key={memory.id}
                layoutId={memory.id}
                className="glass-card glass-card-hover rounded-2xl p-4 flex flex-col justify-between gap-4 transition shadow-md"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 rounded border ${
                      isComp 
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-300" 
                        : memory.type === 'preference' 
                          ? "bg-sky-500/10 border-sky-500/30 text-sky-300"
                          : "bg-white/5 border-white/10 text-slate-400"
                    }`}>
                      {memory.category}
                    </span>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(memory.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{memory.content}</p>

                  {/* Render Tags */}
                  {memory.tags && memory.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {memory.tags.map((tag) => (
                        <span key={tag} className="text-[9px] font-sans bg-white/5 text-slate-400 px-1.5 py-0.5 rounded border border-white/5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500">
                      Type: <strong className="text-slate-400 capitalize">{memory.type}</strong>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Importance: <strong className="text-slate-400">{memory.importance}/10</strong>
                    </span>
                  </div>

                  {/* Forget Button */}
                  <button
                    onClick={() => onForgetMemory(memory.id)}
                    className="p-1.5 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/30 rounded-lg text-red-400 transition cursor-pointer"
                    title="Forgetting Mechanism: Permanently delete memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
