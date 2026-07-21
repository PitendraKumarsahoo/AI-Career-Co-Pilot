/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { 
  MessagesSquare, 
  Play, 
  Send, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle, 
  ChevronRight, 
  Award,
  BookOpen,
  RotateCcw,
  Trophy,
  Flame
} from "lucide-react";
import { InterviewSession, UserProfile } from "../types";

export interface Flashcard {
  id: string;
  category: "System Design" | "Algorithms" | "Concurrency" | "Database Internals" | "Frontend Performance" | "Behavioral";
  question: string;
  answer: string;
}

export const mockFlashcards: Flashcard[] = [
  {
    id: "fc_1",
    category: "System Design",
    question: "Explain how you would design a system to handle high read/write load on a rate-limiting API.",
    answer: "Implement a Token Bucket or Leaky Bucket algorithm. Use Redis with atomic pipeline operations (such as INCR and EXPIRE) to keep track of rate limits across decentralized application nodes. Place an event queue (e.g. Apache Kafka) in front of high-volume write targets to throttle spikes asynchronously."
  },
  {
    id: "fc_2",
    category: "Algorithms",
    question: "What is the difference between Time and Space Complexity in dynamic programming vs recursion?",
    answer: "Recursion without optimization runs in O(2^N) time due to redundant overlapping branches, while consuming O(N) stack space. Dynamic Programming uses Memoization (top-down cache) or Tabulation (bottom-up iteration), trading auxiliary Space (O(N) tables) to compress runtime to linear O(N) or polynomial bounds."
  },
  {
    id: "fc_3",
    category: "Concurrency",
    question: "What are Deadlocks, and how can they be avoided or detected in multithreading?",
    answer: "A deadlock occurs when threads block forever, each holding a lock the other requests. The four Coffman conditions must hold: Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait. Avoid deadlocks by lock ranking (ordering resource allocation), setting timeouts (tryLock), or minimizing active locks."
  },
  {
    id: "fc_4",
    category: "Database Internals",
    question: "How do indexes (B+ Trees) speed up SQL queries and what are their write penalties?",
    answer: "B+ Trees organize tabular keys in a sorted, multi-level tree structure, enabling fast binary search lookups in O(log N) operations. However, inserting, deleting, or updating records triggers tree-balancing splits and index-leaf reorganizations, creating a substantial disk-write penalty."
  },
  {
    id: "fc_5",
    category: "Frontend Performance",
    question: "How does React Fiber work, and how does it prevent blocking the main browser thread?",
    answer: "React Fiber is a modular scheduling reconciler that decomposes heavy component rendering tree calculations into tiny incremental fiber nodes. Utilizing a requestIdleCallback loop, it pauses virtual DOM updates during busy cycles to allow user inputs and animations to run on the main thread smoothly."
  },
  {
    id: "fc_6",
    category: "Behavioral",
    question: "How do you handle a critical architectural disagreement with a Product Manager?",
    answer: "Formulate a objective trade-off matrix comparing options (e.g., immediate speed vs long-term scalability debt). Reframe technical risk as business impacts (e.g., higher maintenance overhead, downtime risks). Seek compromise by delivering an incremental prototype (MVP) with scheduled refactoring phases."
  }
];

interface InterviewPanelProps {
  profile: UserProfile;
  onGenerateQuestion: (type: string, topic: string, history: any[]) => Promise<string>;
  onEvaluateAnswer: (question: string, answer: string) => Promise<{ feedback: string; score: number }>;
  onCelebration?: () => void;
}

export default function InterviewPanel({
  profile,
  onGenerateQuestion,
  onEvaluateAnswer,
  onCelebration
}: InterviewPanelProps) {
  const [activeMode, setActiveMode] = useState<"simulation" | "flashcard">("simulation");
  const [currentFlashcardIdx, setCurrentFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredFlashcards = useMemo(() => {
    if (selectedCategory === "All") {
      return mockFlashcards;
    }
    return mockFlashcards.filter((card) => card.category === selectedCategory);
  }, [selectedCategory]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentFlashcardIdx(0);
    setIsFlipped(false);
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentFlashcardIdx((prev) => (prev + 1) % filteredFlashcards.length);
    }, 150);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentFlashcardIdx((prev) => (prev - 1 + filteredFlashcards.length) % filteredFlashcards.length);
    }, 150);
  };

  const toggleMastered = (cardId: string) => {
    setMasteredCards((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  const [topic, setTopic] = useState("Java Concurrency & Thread Safety");
  const [sessionType, setSessionType] = useState<"technical" | "hr" | "coding">("technical");
  const [isActive, setIsActive] = useState(false);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  
  // Conversation State
  const [history, setHistory] = useState<{ question: string; answer?: string; feedback?: string; score?: number }[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  
  // Loading & Voice state
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [averageScore, setAverageScore] = useState<number | null>(null);

  // HTML5 Speech Synthesis trigger
  const speakQuestion = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleStartSession = async () => {
    setIsLoading(true);
    setIsActive(true);
    setIsSessionCompleted(false);
    setHistory([]);
    setAverageScore(null);
    try {
      const firstQuestion = await onGenerateQuestion(sessionType, topic, []);
      setCurrentQuestion(firstQuestion);
      speakQuestion(firstQuestion);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSession = () => {
    setIsSessionCompleted(true);
    setIsActive(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    // Trigger celebration if score is high (>= 85)
    if (averageScore !== null && averageScore >= 85) {
      if (onCelebration) {
        onCelebration();
      }
    }
  };

  const handleResetSession = () => {
    setIsActive(false);
    setIsSessionCompleted(false);
    setHistory([]);
    setAverageScore(null);
    setCurrentQuestion("");
    setUserAnswer("");
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || isLoading) return;
    setIsLoading(true);

    try {
      // Evaluate response
      const evalResult = await onEvaluateAnswer(currentQuestion, userAnswer);
      
      // Save item to history
      const newHistoryItem = {
        question: currentQuestion,
        answer: userAnswer,
        feedback: evalResult.feedback,
        score: evalResult.score
      };
      
      const updatedHistory = [...history, newHistoryItem];
      setHistory(updatedHistory);
      setUserAnswer("");

      // Calculate new average score
      const totalScore = updatedHistory.reduce((acc, curr) => acc + (curr.score || 0), 0);
      setAverageScore(Math.round(totalScore / updatedHistory.length));

      // Get next question
      const nextQuestion = await onGenerateQuestion(sessionType, topic, updatedHistory);
      setCurrentQuestion(nextQuestion);
      speakQuestion(nextQuestion);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopSession = () => {
    setIsActive(false);
    setCurrentQuestion("");
    setUserAnswer("");
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div id="interview-panel" className="flex-1 overflow-y-auto p-6 bg-transparent text-slate-100 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-gradient-purple-sky">Interview Simulation Agent</span> <MessagesSquare className="w-7 h-7 text-sky-400 animate-pulse" />
          </h2>
          <p className="text-slate-400 text-sm font-sans">
            Engage in technical, coding, or HR mock screens dynamically evaluated against target companies (Google).
          </p>
        </div>

        {/* Voice Toggle button */}
        <button
          onClick={() => {
            const nextVal = !voiceEnabled;
            setVoiceEnabled(nextVal);
            if (!nextVal && window.speechSynthesis) window.speechSynthesis.cancel();
            if (nextVal && currentQuestion) speakQuestion(currentQuestion);
          }}
          className={`flex items-center gap-1.5 font-mono text-[10px] py-1.5 px-3.5 rounded-xl border transition cursor-pointer ${
            voiceEnabled 
              ? "bg-sky-500/10 border-sky-500/30 text-sky-400" 
              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300"
          }`}
        >
          {voiceEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5" /> VOICE SYNTHESIS: ON
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" /> VOICE SYNTHESIS: OFF
            </>
          )}
        </button>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center gap-1.5 border-b border-white/5 pb-1">
        <button
          onClick={() => {
            setActiveMode("simulation");
            if (window.speechSynthesis) window.speechSynthesis.cancel();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono tracking-wider uppercase rounded-t-xl transition-all duration-300 border-t border-x cursor-pointer ${
            activeMode === "simulation"
              ? "bg-sky-500/10 border-white/10 text-sky-400 font-bold"
              : "bg-transparent border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <MessagesSquare className="w-3.5 h-3.5" />
          <span>Simulation Mode</span>
        </button>

        <button
          onClick={() => {
            setActiveMode("flashcard");
            if (window.speechSynthesis) window.speechSynthesis.cancel();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono tracking-wider uppercase rounded-t-xl transition-all duration-300 border-t border-x cursor-pointer ${
            activeMode === "flashcard"
              ? "bg-purple-500/10 border-white/10 text-purple-400 font-bold"
              : "bg-transparent border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Interactive Flashcards</span>
        </button>
      </div>

      {activeMode === "flashcard" ? (
        /* INTERACTIVE FLASHCARDS MODE */
        <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full mt-2">
          {/* Category Filter Cards and Mastery Progress Row */}
          <div className="glass-card rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 border border-white/5 shadow-xl">
            {/* Category selection */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {["All", "System Design", "Algorithms", "Concurrency", "Database Internals", "Frontend Performance", "Behavioral"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentFlashcardIdx(0);
                    setIsFlipped(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition duration-150 border cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-purple-500/20 border-purple-500/40 text-purple-400 font-bold"
                      : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Overall Mastery Percentage progress */}
            <div className="w-full md:w-56 flex flex-col gap-1.5 shrink-0">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>DECK MASTERY</span>
                <span className="font-bold text-purple-400">
                  {Math.round((masteredCards.length / mockFlashcards.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950/50 rounded-full border border-white/5 overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(masteredCards.length / mockFlashcards.length) * 100}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                />
              </div>
              <span className="text-[9px] font-mono text-slate-500 text-right">
                {masteredCards.length} of {mockFlashcards.length} cards mastered
              </span>
            </div>
          </div>

          {filteredFlashcards.length > 0 ? (
            <div className="flex flex-col gap-6">
              {/* 3D Rotatable Flashcard Container */}
              <div className="relative w-full h-[320px]" style={{ perspective: 1200 }}>
                <motion.div
                  className="w-full h-full relative"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  {/* FRONT SIDE (Question Card) */}
                  <div
                    className="absolute inset-0 w-full h-full p-6 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col justify-between shadow-xl cursor-pointer"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="flex justify-between items-start border-b border-white/5 pb-2.5">
                      <span className="text-[10px] font-mono bg-sky-500/10 text-sky-400 px-2.5 py-0.5 rounded border border-sky-500/20">
                        {filteredFlashcards[currentFlashcardIdx].category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        Card {currentFlashcardIdx + 1} of {filteredFlashcards.length}
                      </span>
                    </div>

                    <div className="flex-1 flex items-center justify-center py-6 text-center">
                      <h4 className="text-lg font-sans font-semibold text-slate-100 leading-relaxed px-4">
                        {filteredFlashcards[currentFlashcardIdx].question}
                      </h4>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-t border-white/5 pt-2.5">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-sky-400 animate-pulse" />
                        Click to Reveal Model Answer
                      </span>
                      {masteredCards.includes(filteredFlashcards[currentFlashcardIdx].id) && (
                        <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Mastered
                        </span>
                      )}
                    </div>
                  </div>

                  {/* BACK SIDE (Answer Card) */}
                  <div
                    className="absolute inset-0 w-full h-full p-6 bg-gradient-to-br from-purple-950/40 to-slate-900/60 backdrop-blur-md border border-purple-500/20 rounded-2xl flex flex-col justify-between shadow-xl cursor-pointer"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <div className="flex justify-between items-start border-b border-purple-500/10 pb-2.5">
                      <span className="text-[10px] font-mono bg-purple-500/20 text-purple-400 px-2.5 py-0.5 rounded border border-purple-500/30">
                        {filteredFlashcards[currentFlashcardIdx].category} — MODEL ANSWER
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        Card {currentFlashcardIdx + 1} of {filteredFlashcards.length}
                      </span>
                    </div>

                    <div className="flex-1 flex items-center justify-center py-4 overflow-y-auto">
                      <p className="text-sm font-sans text-slate-200 leading-relaxed px-4 text-center">
                        {filteredFlashcards[currentFlashcardIdx].answer}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-t border-purple-500/10 pt-2.5">
                      <span>Click to flip back to question</span>
                      {masteredCards.includes(filteredFlashcards[currentFlashcardIdx].id) ? (
                        <span className="text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Mastered
                        </span>
                      ) : (
                        <span className="text-slate-500">Not Mastered Yet</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* CARD DECK CONTROLS */}
              <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-4 shadow-md">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setTimeout(() => {
                        setCurrentFlashcardIdx((prev) => (prev - 1 + filteredFlashcards.length) % filteredFlashcards.length);
                      }, 150);
                    }}
                    className="px-3.5 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition cursor-pointer text-xs font-semibold flex items-center gap-1"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="px-3.5 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 hover:text-purple-300 border border-purple-500/20 rounded-xl transition cursor-pointer text-xs font-semibold"
                  >
                    Flip Card
                  </button>
                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setTimeout(() => {
                        setCurrentFlashcardIdx((prev) => (prev + 1) % filteredFlashcards.length);
                      }, 150);
                    }}
                    className="px-3.5 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition cursor-pointer text-xs font-semibold flex items-center gap-1"
                  >
                    Next
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentId = filteredFlashcards[currentFlashcardIdx].id;
                      setMasteredCards(prev => 
                        prev.includes(currentId) ? prev.filter(c => c !== currentId) : [...prev, currentId]
                      );
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      masteredCards.includes(filteredFlashcards[currentFlashcardIdx].id)
                        ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/10"
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>
                      {masteredCards.includes(filteredFlashcards[currentFlashcardIdx].id)
                        ? "Mastered!"
                        : "Mark as Mastered"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 text-center border border-white/5 shadow-md">
              <p className="text-slate-400 text-sm">No flashcards found under the "{selectedCategory}" category.</p>
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setCurrentFlashcardIdx(0);
                  setIsFlipped(false);
                }}
                className="mt-3 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Show All Cards
              </button>
            </div>
          )}
        </div>
      ) : isSessionCompleted ? (
        /* COMPLETED CELEBRATORY STATE REPORT VIEW */
        <div className="glass-card rounded-2xl p-8 max-w-3xl mx-auto w-full flex flex-col gap-6 shadow-2xl border border-white/10 relative overflow-hidden">
          {/* Animated background effects */}
          {averageScore !== null && averageScore >= 85 && (
            <>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/[0.02] to-transparent pointer-events-none" />
            </>
          )}

          <div className="flex flex-col items-center text-center gap-4 relative z-10">
            {averageScore !== null && averageScore >= 85 ? (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="p-5 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 rounded-full shadow-2xl shadow-yellow-500/20 text-slate-950 flex items-center justify-center relative"
              >
                {/* Micro sparks */}
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="absolute -top-1 -right-1 text-yellow-300 bg-slate-950 p-1 rounded-full border border-yellow-500/30"
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <Trophy className="w-12 h-12 text-slate-950 drop-shadow" />
              </motion.div>
            ) : (
              <div className="p-5 bg-white/5 border border-white/10 rounded-full text-slate-300">
                <CheckCircle className="w-12 h-12" />
              </div>
            )}

            <div>
              <h3 className="text-2xl font-display font-bold text-white">
                {averageScore !== null && averageScore >= 85 ? "Sensational Session Completed!" : "Practice Session Completed"}
              </h3>
              <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto font-sans">
                Your performance metrics have been compiled against Google's core engineering hiring standards.
              </p>
            </div>

            {/* Score Ring indicator */}
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-white/[0.02] border border-white/5 p-4 rounded-2xl w-full max-w-md justify-around">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-mono uppercase text-slate-500">Aggregate Score</span>
                <span className={`text-4xl font-extrabold font-mono mt-1 ${averageScore !== null && averageScore >= 85 ? 'text-amber-400' : 'text-sky-400'}`}>
                  {averageScore}%
                </span>
              </div>
              <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-mono uppercase text-slate-500">Result Verdict</span>
                <span className={`text-xs font-mono font-bold uppercase mt-2 px-3 py-1 rounded-lg border ${
                  averageScore !== null && averageScore >= 85 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                    : averageScore !== null && averageScore >= 70
                    ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                    : 'bg-slate-500/10 border-white/10 text-slate-400'
                }`}>
                  {averageScore !== null && averageScore >= 85 ? "🏆 RECRUITMENT READY" : averageScore !== null && averageScore >= 70 ? "📈 COMPETENT" : "🎯 PRACTICE ONGOING"}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive QA Timeline Report list */}
          <div className="flex flex-col gap-3 relative z-10 max-h-[250px] overflow-y-auto pr-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block mb-1">Detailed Question Log & Evaluation</span>
            {history.map((hItem, idx) => (
              <div key={idx} className="bg-slate-950/30 border border-white/5 p-4 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">QUESTION {idx + 1}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${hItem.score !== undefined && hItem.score >= 85 ? 'text-amber-400 bg-amber-400/5' : 'text-sky-400 bg-sky-400/5'}`}>
                    SCORE: {hItem.score}/100
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-white leading-relaxed">{hItem.question}</h4>
                <div className="text-[11px] text-slate-400 bg-white/[0.01] p-2.5 rounded-lg border border-white/[0.03] mt-1 italic font-sans">
                  " {hItem.answer} "
                </div>
                <p className="text-[11px] text-emerald-400/90 leading-relaxed mt-1 flex items-start gap-1.5 bg-emerald-500/[0.02] p-2.5 rounded-lg border border-emerald-500/10 font-sans">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{hItem.feedback}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Footer controls */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5 relative z-10">
            <button
              onClick={handleResetSession}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-700 hover:to-sky-600 text-white font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-purple-500/10"
            >
              <RotateCcw className="w-4 h-4" />
              Start New Protocol Session
            </button>
            <button
              onClick={handleResetSession}
              className="sm:px-6 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer"
            >
              Return to Interview Hub
            </button>
          </div>
        </div>
      ) : !isActive ? (
        /* SETUP PORTAL VIEW */
        <div className="glass-card rounded-2xl p-6 max-w-2xl mx-auto w-full flex flex-col gap-5 mt-4 shadow-xl">
          <div className="text-center">
            <h3 className="text-lg font-display font-bold text-white">Initialize Mock Interview Panel</h3>
            <p className="text-slate-400 text-xs mt-1 font-sans">
              Select technical focus and parameters. The agent utilizes profile metrics to shape the questions.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Session Type */}
            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Session Protocol</label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "technical", label: "Technical Domain", desc: "Core computer science, system scalability" },
                  { id: "coding", label: "Algorithm Trial", desc: "LeetCode style arrays, memory, trees" },
                  { id: "hr", label: "Behavioral / HR", desc: "STAR method, values and background" }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSessionType(type.id as any)}
                    className={`p-3 rounded-xl border text-xs flex flex-col gap-1 text-left transition duration-150 cursor-pointer ${
                      sessionType === type.id
                        ? "bg-white/10 border-sky-500/50 text-white shadow-lg backdrop-blur-sm"
                        : "glass-card border-white/5 text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    <span className="font-semibold">{type.label}</span>
                    <span className="text-[10px] text-slate-500 leading-normal font-sans">{type.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Input with quick options */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Interview Subject Focus</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Java Concurrency, PostgreSQL replication, System design patterns..."
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              />
              
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  "Java Threads & Concurrency",
                  "Google Algorithmic Challenges",
                  "System Design Patterns",
                  "Full Stack Architecture scaling"
                ].map((tOption) => (
                  <button
                    key={tOption}
                    onClick={() => setTopic(tOption)}
                    className="bg-white/5 hover:bg-white/10 text-[10px] font-mono text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg transition border border-white/10 cursor-pointer"
                  >
                    {tOption}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartSession}
              disabled={isLoading || !topic.trim()}
              className="w-full flex items-center justify-center gap-1.5 glass-button-primary text-white font-medium text-xs py-2.5 rounded-xl cursor-pointer mt-2 shadow-lg"
            >
              Start Session Protocol
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE CONVERSATION TRIAL */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT CHAT PANEL (Span 2) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="glass-card rounded-2xl p-4 flex flex-col justify-between h-[520px] shadow-lg">
              
              {/* Messages timeline scrolling */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
                {history.map((hItem, idx) => (
                  <div key={idx} className="flex flex-col gap-3">
                    {/* Interviewer bubble */}
                    <div className="flex items-start gap-2.5 max-w-[85%]">
                      <div className="p-1.5 bg-white/10 border border-white/10 text-slate-300 rounded-lg text-xs font-mono font-bold flex-shrink-0">
                        IA
                      </div>
                      <div className="bg-slate-950/30 border border-white/10 p-3 rounded-2xl text-xs text-slate-300 leading-relaxed shadow-sm">
                        {hItem.question}
                      </div>
                    </div>

                    {/* Candidate bubble */}
                    {hItem.answer && (
                      <div className="flex items-start gap-2.5 max-w-[85%] self-end flex-row-reverse">
                        <div className="p-1.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-lg text-xs font-mono font-bold flex-shrink-0">
                          YOU
                        </div>
                        <div className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-2xl text-xs text-slate-200 leading-relaxed shadow-sm">
                          {hItem.answer}
                        </div>
                      </div>
                    )}

                    {/* Evaluation Feedback block */}
                    {hItem.feedback && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl ml-8 text-xs flex flex-col gap-1.5">
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> INTERVIEWER EVALUATION
                          </span>
                          <span className="text-emerald-300">SCORE: {hItem.score}/100</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed text-[11px]">{hItem.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Current Active Question Bubble */}
                {currentQuestion && (
                  <div className="flex items-start gap-2.5 max-w-[85%]">
                    <div className="p-1.5 bg-white/10 border border-white/10 text-slate-300 rounded-lg text-xs font-mono font-bold flex-shrink-0">
                      IA
                    </div>
                    <div className="bg-slate-950/40 border border-white/10 p-3 rounded-2xl text-xs text-slate-200 leading-relaxed shadow shadow-sky-500/5 font-semibold">
                      {currentQuestion}
                    </div>
                  </div>
                )}

                {/* isLoading state */}
                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono pl-8 animate-pulse">
                    <span>Evaluating & compiling next inquiry...</span>
                  </div>
                )}
              </div>

              {/* Typed Answer Entry form */}
              <form onSubmit={handleSubmitAnswer} className="mt-4 pt-3 border-t border-slate-900 flex gap-2">
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={isLoading || !currentQuestion}
                  placeholder="Type your complete response technical answer..."
                  className="flex-1 glass-input rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isLoading || !userAnswer.trim()}
                  className="p-2.5 glass-button-primary text-white rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          </div>

          {/* RIGHT STATS PANEL */}
          <div className="flex flex-col gap-4">
            
            {/* Average Trial Score widget */}
            <div className="glass-card rounded-2xl p-5 flex flex-col items-center text-center gap-3 shadow-lg">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Average Performance</span>
              
              <div className="relative w-28 h-28 rounded-full border-4 border-white/10 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white font-mono text-gradient-purple-sky animate-pulse" style={{ animationDuration: '4s' }}>
                  {averageScore !== null ? `${averageScore}%` : "—"}
                </span>
                <span className="text-[9px] text-slate-500 font-mono uppercase mt-0.5">SCORE</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mt-1 font-sans">
                Evaluation thresholds conform directly with Google technical hiring rubrics. Keep scores above 85% to target placement offers.
              </p>
            </div>

            {/* Stop / Trial Control Panel */}
            <div className="glass-card rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono uppercase">ACTIVE PARAMETERS:</span>
                <span className="font-semibold text-white uppercase font-mono text-[10px] text-sky-400">{sessionType}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Subject Focus: <strong className="text-slate-300 font-normal">{topic}</strong>
              </p>
              
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleCompleteSession}
                  className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs py-2.5 rounded-xl cursor-pointer transition font-bold shadow-lg shadow-emerald-500/15"
                >
                  <Award className="w-4 h-4 text-emerald-100" />
                  Complete & Grade Session
                </button>
              )}

              <button
                type="button"
                onClick={handleResetSession}
                className="w-full flex items-center justify-center gap-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs py-2 rounded-xl cursor-pointer transition font-medium"
              >
                Terminate Session Protocol
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
