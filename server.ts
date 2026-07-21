/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Set up the persistent store directory and file
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "careerpilot_store.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default state
const initialStore = {
  profile: {
    skills: ["TypeScript", "React", "Node.js", "Python"],
    goals: ["Get a Software Engineering Internship at Google", "Learn System Design"],
    projects: [
      {
        name: "EcoTrack",
        description: "A carbon footprint tracker built with React and Tailwind.",
        technologies: ["React", "Tailwind CSS", "Local Storage"]
      }
    ],
    preferredCompanies: ["Google", "Microsoft", "Adobe"],
    weakSubjects: ["Java Concurrency", "System Design Patterns"],
    certifications: ["AWS Certified Developer Associate"],
    experienceLevel: "Entry-Level / Student",
    targetRole: "Full-Stack Engineer",
    weeklyGoals: [
      {
        id: "1",
        title: "Algorithm & Core System Architecture",
        description: "Tackle advanced data structures, trees, dynamic programming, and D3 analytics systems",
        category: "Technical Depth",
        colorClass: "bg-gradient-to-r from-sky-400 to-indigo-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]",
        tasks: [
          { id: "1-1", text: "Solve 5 medium-hard Trees & Graph problems", completed: true },
          { id: "1-2", text: "Integrate Skill Radar D3 chart onto primary controller panel", completed: true },
          { id: "1-3", text: "Implement custom context session storage", completed: false }
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
          { id: "2-3", text: "Run lint compliance and verify clean production builds", completed: true }
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
          { id: "3-3", text: "Prepare and log STAR-formatted experience summaries", completed: false }
        ]
      }
    ]
  },
  memories: [
    {
      id: "mem_1",
      content: "Expressed deep interest in backend development, cloud databases, and scalable server architectures in React + Node.js.",
      type: "preference",
      timestamp: "2026-07-01T10:00:00Z",
      importance: 8,
      category: "Tech Preferences"
    },
    {
      id: "mem_2",
      content: "Stated a clear goal: Target Google as primary choice for upcoming internship recruitment in autumn.",
      type: "preference",
      timestamp: "2026-07-10T14:30:00Z",
      importance: 9,
      category: "Goals"
    }
  ],
  roadmaps: [
    {
      id: "road_1",
      title: "System Design Essentials",
      description: "Focus on load balancing, caching, CDN, and persistent database replication.",
      status: "in_progress",
      resources: [
        { title: "System Design Primer by Donne Martin", url: "https://github.com/donnemartin/system-design-primer", type: "article" },
        { title: "Grokking System Design Tutorials", url: "https://youtube.com/results?search_query=system+design+primer", type: "video" }
      ],
      approved: true
    }
  ],
  applications: [
    {
      id: "app_1",
      company: "Google",
      role: "Software Engineering Intern",
      status: "interested",
      dateApplied: "2026-07-12",
      notes: "Focusing heavily on mock technical interviews and algorithmic coding."
    }
  ],
  notifications: [
    {
      id: "not_1",
      title: "Google Application Setup",
      content: "Memory Trigger: Your Google Application is active. Proposing a technical interview prep session on Google hiring standards.",
      type: "reminder",
      timestamp: "2026-07-15T11:00:00Z",
      read: false
    }
  ],
  weeklyReports: [
    {
      id: "rep_1",
      weekRange: "July 08 - July 14, 2026",
      summary: "Completed 2 mock interview trials, added a system design tracker, and setup the custom Express/React server.",
      skillGrowth: [
        { skill: "System Design", increase: 15 },
        { skill: "React Routing", increase: 5 }
      ],
      interviewsCount: 2,
      learningHours: 12,
      suggestions: [
        "Dedicate time to Java Concurrency since it was identified as a core weak spot.",
        "Submit a resume to the Resume Agent for automated Google-specific ATS screening."
      ]
    }
  ],
  approvals: [
    {
      id: "appr_1",
      title: "Propose Learning Roadmap: Java Concurrency",
      description: "Based on identified weak subject 'Java Concurrency', the Learning Agent recommends generating a 4-step intensive roadmap.",
      type: "roadmap",
      meta: { topic: "Java Concurrency" },
      status: "pending"
    }
  ]
};

// Helper to read state
function getStoredState() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading storage file, using fallback:", err);
  }
  // If not exists or error, write default and return
  saveStoredState(initialStore);
  return initialStore;
}

// Helper to save state
function saveStoredState(state: any) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing storage file:", err);
    return false;
  }
}

// Gemini Client Lazy Initializer
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("PLACEHOLDER") || apiKey === "") {
      return null;
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// ----------------------------------------------------
// API ENDPOINTS
// ----------------------------------------------------

// 1. Get entire persistence state
app.get("/api/state", (req, res) => {
  const state = getStoredState();
  const SYSTEM_CONTEXT_PATH = path.join(DATA_DIR, "system_context.json");
  if (fs.existsSync(SYSTEM_CONTEXT_PATH)) {
    try {
      const raw = fs.readFileSync(SYSTEM_CONTEXT_PATH, "utf-8");
      state.systemContext = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse system_context.json:", e);
    }
  } else {
    state.systemContext = null;
  }
  res.json({ success: true, state });
});

// 2. Overwrite / Update persistence state
app.post("/api/state", (req, res) => {
  const state = req.body.state;
  if (!state) {
    return res.status(400).json({ success: false, error: "Missing state object." });
  }
  saveStoredState(state);
  
  // Attach system context to state if it exists
  const SYSTEM_CONTEXT_PATH = path.join(DATA_DIR, "system_context.json");
  if (fs.existsSync(SYSTEM_CONTEXT_PATH)) {
    try {
      const raw = fs.readFileSync(SYSTEM_CONTEXT_PATH, "utf-8");
      state.systemContext = JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
  }
  res.json({ success: true, state });
});

// 2.2 Save direct user feedback comments to backend state
app.post("/api/feedback", (req, res) => {
  const { text, name, email, category } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, error: "Feedback text is required." });
  }
  
  const state = getStoredState();
  if (!state.feedbacks) {
    state.feedbacks = [];
  }
  
  const newFeedback = {
    id: `fb_${Date.now()}`,
    text,
    name: name || "Anonymous User",
    email: email || "",
    category: category || "General Feedback",
    timestamp: new Date().toISOString()
  };
  
  state.feedbacks.push(newFeedback);
  
  // Create an automated feedback acknowledgment notification
  const feedbackNotification = {
    id: `not_fb_${Date.now()}`,
    title: "User Feedback Logged Successfully",
    content: `Backend recorded a new "${category}" comment from ${newFeedback.name}. Thank you for helping optimize CareerPilot!`,
    type: "system",
    timestamp: new Date().toISOString(),
    read: false
  };
  
  if (!state.notifications) {
    state.notifications = [];
  }
  state.notifications.unshift(feedbackNotification);
  
  saveStoredState(state);
  res.json({ success: true, feedback: newFeedback, state });
});

// 2.5 Memory Forget and Compress Endpoint (Timely Forgetting with Long-term System Context Compression)
app.post("/api/memory/forget", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, error: "Missing memory ID." });
  }

  const ai = getGeminiClient();
  const state = getStoredState();

  // Find the memory to prune/compress
  const memoryToPrune = state.memories.find((m: any) => m.id === id);
  if (!memoryToPrune) {
    return res.status(404).json({ success: false, error: "Memory not found in active registry." });
  }

  // Remove the memory from the active list
  state.memories = state.memories.filter((m: any) => m.id !== id);

  // Read or initialize System Context file
  const SYSTEM_CONTEXT_PATH = path.join(DATA_DIR, "system_context.json");
  let systemContext: any = {
    lastUpdated: new Date().toISOString(),
    compressedMemoriesCount: 0,
    compressedRules: [],
    historyLog: [],
    overallSummary: "Active long-term context compiled from pruned career records."
  };

  if (fs.existsSync(SYSTEM_CONTEXT_PATH)) {
    try {
      const rawContext = fs.readFileSync(SYSTEM_CONTEXT_PATH, "utf-8");
      systemContext = JSON.parse(rawContext);
    } catch (e) {
      console.error("Error loading system context file:", e);
    }
  }

  // Synthesize a dense guideline from the memory being pruned
  let compressedSummary = "";
  if (ai) {
    try {
      const systemPrompt = `You are the Memory Compression & System Context Agent for CareerPilot AI OS.
Your objective is to compress a career memory being pruned from the user's active workspace.
Summarize it into a high-density, single-sentence long-term semantic directive or career facts statement.
Retain tech stack details, companies, metrics, and core achievements/lessons.
Avoid conversational filler. Output only the summarized statement (max 15 words).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Memory Pruned:\n- [${memoryToPrune.type}](${memoryToPrune.category}): ${memoryToPrune.content}\nImportance: ${memoryToPrune.importance}/10`,
        config: {
          systemInstruction: systemPrompt
        }
      });
      compressedSummary = response.text?.trim() || "";
    } catch (err: any) {
      console.warn("Gemini context compression offline, seamlessly using AI Simulator fallback:", err?.message || err);
    }
  }

  if (!compressedSummary) {
    // High-quality deterministic fallback summary
    const words = memoryToPrune.content.split(" ");
    const snippet = words.slice(0, 10).join(" ") + (words.length > 10 ? "..." : "");
    compressedSummary = `Archived (${memoryToPrune.category}): ${snippet}`;
  }

  // Update system context attributes
  systemContext.lastUpdated = new Date().toISOString();
  systemContext.compressedMemoriesCount += 1;
  systemContext.compressedRules.unshift(compressedSummary);
  systemContext.historyLog.unshift({
    id: memoryToPrune.id,
    originalContent: memoryToPrune.content,
    type: memoryToPrune.type,
    category: memoryToPrune.category,
    compressedSummary: compressedSummary,
    timestamp: new Date().toISOString()
  });

  // Re-evaluate overall long-term career theme using Gemini
  if (ai && systemContext.historyLog.length > 1) {
    try {
      const systemPrompt = `You are the Career System Context Synthesizer.
Analyze the list of archived long-term career guidelines and write a highly dense, professional summary of the candidate's core strengths, targeted goals, and identified weaknesses.
Keep it strictly under 3 sentences. No conversational filler.`;

      const historySummaryText = systemContext.historyLog.map((log: any) => `- ${log.compressedSummary}`).join("\n");
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Compressed Directives History:\n${historySummaryText}`,
        config: {
          systemInstruction: systemPrompt
        }
      });
      systemContext.overallSummary = response.text?.trim() || systemContext.overallSummary;
    } catch (e) {
      console.warn("Career theme synthesis offline, retaining existing overall summary:", e);
    }
  } else {
    const count = systemContext.compressedMemoriesCount;
    systemContext.overallSummary = `Global context actively retains ${count} compressed micro-records. Main focus areas: ${state.profile.goals.join(", ") || "Advanced Software Engineering Internship Prep"}.`;
  }

  // Save the compressed System Context file
  try {
    fs.writeFileSync(SYSTEM_CONTEXT_PATH, JSON.stringify(systemContext, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write system_context.json:", e);
  }

  // Push system notification for UI feedback
  const forgetNotification = {
    id: `not_forget_${Date.now()}`,
    title: "Memory Compressed to System Context",
    content: `Scheduler: Successfully pruned memory ID "${id}". Summarized fact "${compressedSummary}" was appended to the global System Context.`,
    type: "system" as const,
    timestamp: new Date().toISOString(),
    read: false
  };
  state.notifications.unshift(forgetNotification);

  // Save the updated main store
  saveStoredState(state);

  // Attach systemContext to output state for unified React update
  state.systemContext = systemContext;

  res.json({
    success: true,
    state,
    compressedResult: compressedSummary,
    systemContext
  });
});

// 3. Memory Agent Endpoint: Analyze new input memory and suggest automated triggers (Roadmap, interview, skills updates)
app.post("/api/memory/analyze", async (req, res) => {
  const { content, type, importance, category, tags } = req.body;
  if (!content) {
    return res.status(400).json({ success: false, error: "Missing memory content." });
  }

  const ai = getGeminiClient();

  // If it's just a connection probe, do not persist it to the store
  if (content === "probe") {
    return res.json({ success: true, isSimulator: !ai });
  }

  const state = getStoredState();

  // Create new memory object
  const newMemory = {
    id: `mem_${Date.now()}`,
    content,
    type: type || 'episodic',
    timestamp: new Date().toISOString(),
    importance: Number(importance) || 5,
    category: category || 'General Log',
    tags: Array.isArray(tags) ? tags : []
  };

  // Add memory to list
  state.memories.unshift(newMemory);

  let triggerResult = {
    profileUpdated: false,
    updatedFields: [] as string[],
    proposedAction: null as any
  };

  const runSimulatorMemoryAnalyze = () => {
    // Simulated mock reasoning if Gemini is not set up or failed
    const lower = content.toLowerCase();
    if (lower.includes("fail") || lower.includes("weak") || lower.includes("mistake") || lower.includes("concurrency") || lower.includes("java")) {
      const proposed = {
        id: `appr_${Date.now()}`,
        title: "Propose Interview Mocking: Technical Concurrency & Java",
        description: "Memory trigger: Detected interview difficulty or weak subject. Proposing Java Threading mock prep session.",
        type: "interview",
        meta: { topic: "Java Threads & Concurrency" },
        status: "pending"
      };
      state.approvals.unshift(proposed);
      triggerResult.profileUpdated = true;
      triggerResult.updatedFields.push("weakSubjects");
      if (!state.profile.weakSubjects.includes("Java Threads & Concurrency")) {
        state.profile.weakSubjects.push("Java Threads & Concurrency");
      }
      triggerResult.proposedAction = proposed;
    }
    saveStoredState(state);
  };

  if (!ai) {
    runSimulatorMemoryAnalyze();
    return res.json({ success: true, memory: newMemory, triggers: triggerResult, isSimulator: true });
  }

  try {
    // Call Gemini as the Memory Agent
    const systemPrompt = `You are the Memory Agent of CareerPilot AI OS.
Analyze the user's latest career entry: "${content}"
Determine if this entry implies updates to the user's career profile:
- New Skills learned
- New Career Goals declared
- Preferred Companies
- Weak Subjects or Mistakes made
- Certifications or Projects

Also, decide if we should PROPOSE a Human-in-the-Loop approval action (such as generating a roadmap or a mock interview session).
Return a strict JSON object structure:
{
  "profileUpdates": {
    "skills": ["new skill to add if any"],
    "goals": ["new goal to add if any"],
    "preferredCompanies": ["new company if any"],
    "weakSubjects": ["new weak subject/topic if any"]
  },
  "proposeAction": {
    "trigger": true/false,
    "title": "Propose Technical Mock Interview OR Propose Learning Roadmap",
    "description": "Short explanation justifying why this is proposed",
    "type": "roadmap" or "interview",
    "meta": { "topic": "Name of the topic to focus on" }
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Current Profile State: ${JSON.stringify(state.profile)}\nAnalyze Entry: "${content}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}");

    // Apply updates safely
    if (result.profileUpdates) {
      if (result.profileUpdates.skills && result.profileUpdates.skills.length > 0) {
        result.profileUpdates.skills.forEach((s: string) => {
          if (!state.profile.skills.includes(s)) {
            state.profile.skills.push(s);
            triggerResult.updatedFields.push(`Skill: ${s}`);
          }
        });
      }
      if (result.profileUpdates.goals && result.profileUpdates.goals.length > 0) {
        result.profileUpdates.goals.forEach((g: string) => {
          if (!state.profile.goals.includes(g)) {
            state.profile.goals.push(g);
            triggerResult.updatedFields.push(`Goal: ${g}`);
          }
        });
      }
      if (result.profileUpdates.preferredCompanies && result.profileUpdates.preferredCompanies.length > 0) {
        result.profileUpdates.preferredCompanies.forEach((c: string) => {
          if (!state.profile.preferredCompanies.includes(c)) {
            state.profile.preferredCompanies.push(c);
            triggerResult.updatedFields.push(`Company: ${c}`);
          }
        });
      }
      if (result.profileUpdates.weakSubjects && result.profileUpdates.weakSubjects.length > 0) {
        result.profileUpdates.weakSubjects.forEach((w: string) => {
          if (!state.profile.weakSubjects.includes(w)) {
            state.profile.weakSubjects.push(w);
            triggerResult.updatedFields.push(`Weak Subject: ${w}`);
          }
        });
      }
    }

    if (triggerResult.updatedFields.length > 0) {
      triggerResult.profileUpdated = true;
    }

    // Apply Human-in-the-Loop trigger
    if (result.proposeAction && result.proposeAction.trigger) {
      const proposed = {
        id: `appr_${Date.now()}`,
        title: result.proposeAction.title,
        description: result.proposeAction.description,
        type: result.proposeAction.type,
        meta: result.proposeAction.meta || {},
        status: "pending"
      };
      state.approvals.unshift(proposed);
      triggerResult.proposedAction = proposed;

      // Add Scheduler notification
      state.notifications.unshift({
        id: `not_${Date.now()}`,
        title: `Proposed: ${result.proposeAction.title}`,
        content: `The Scheduler Agent proposes a new ${result.proposeAction.type} setup for you. Head to Approvals.`,
        type: "reminder",
        timestamp: new Date().toISOString(),
        read: false
      });
    }

    saveStoredState(state);
    res.json({ success: true, memory: newMemory, triggers: triggerResult, isSimulator: false });
  } catch (err: any) {
    console.warn("Memory Agent offline or API key permission error, seamlessly operating in AI Simulator mode:", err?.message || err);
    runSimulatorMemoryAnalyze();
    res.json({ success: true, memory: newMemory, triggers: triggerResult, isSimulator: true, apiError: err.message });
  }
});

/// 4. Memory Agent Endpoint: Compress memories into high-level rules (Forgetting / Optimizing window)
app.post("/api/memory/compress", async (req, res) => {
  const ai = getGeminiClient();
  const state = getStoredState();

  if (state.memories.length < 3) {
    return res.json({ success: false, error: "Not enough memories to compress. Keep adding records!" });
  }

  const runSimulatorMemoryCompress = () => {
    const compressedMemory = {
      id: `mem_comp_${Date.now()}`,
      content: `[Synthesized Memory Rule] User targets high-scaling backend roles in React, Node, and Python at Google/Microsoft, prioritizing system scalability prep.`,
      type: 'semantic',
      timestamp: new Date().toISOString(),
      importance: 9,
      category: "Synthesized Directives"
    };
    state.memories = [
      compressedMemory,
      ...state.memories.filter(m => m.importance >= 8) // Retain important keys, discard low-importance ones
    ];
    saveStoredState(state);
    return compressedMemory;
  };

  if (!ai) {
    const compressedMemory = runSimulatorMemoryCompress();
    return res.json({ success: true, result: "Simulator compression successfully completed. Pruned low-priority episodic records.", rule: compressedMemory, isSimulator: true });
  }

  try {
    const memoryListText = state.memories.map(m => `-[${m.type}](${m.category}): ${m.content}`).join("\n");
    const prompt = `You are the Memory Optimization Agent.
We have multiple episodic and preference logs from the user. We need to COMPRESS them to save LLM context space and retain high-level semantic guidelines.
Below are the memories:
${memoryListText}
 
Please synthesize them into ONE major, dense Career Preference Guideline that summarizes their tech stack, preferred target company, experience, and weak areas.
Output a single dense sentence.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });

    const summaryText = response.text || "Synthesized profile preferences.";
    const compressedMemory = {
      id: `mem_comp_${Date.now()}`,
      content: `[Synthesized Memory Rule] ${summaryText}`,
      type: 'semantic' as const,
      timestamp: new Date().toISOString(),
      importance: 10,
      category: "Synthesized Directives"
    };

    // Replace older low-priority memories with this synthesized memory
    state.memories = [
      compressedMemory,
      ...state.memories.filter(m => m.importance >= 8 && !m.id.startsWith("mem_comp_")) // Discard lower priority records
    ];

    saveStoredState(state);
    res.json({ success: true, result: "Completed context compression. Low-priority logs compiled into rule.", rule: compressedMemory, isSimulator: false });
  } catch (err: any) {
    console.warn("Memory Compression Agent offline or API permission error, seamlessly operating in AI Simulator mode:", err?.message || err);
    const compressedMemory = runSimulatorMemoryCompress();
    res.json({ success: true, result: "Completed context compression via fallback. Low-priority logs compiled into rule.", rule: compressedMemory, isSimulator: true, apiError: err.message });
  }
});

// 5. Resume Agent Endpoint: Analyze Resume text
app.post("/api/resume/analyze", async (req, res) => {
  const { resumeText, targetRole } = req.body;
  if (!resumeText) {
    return res.status(400).json({ success: false, error: "Missing resume content." });
  }

  const ai = getGeminiClient();
  const role = targetRole || "Software Engineer Intern";

  const runDynamicSimulator = (apiErrorText?: string) => {
    // Parse resume text for custom feedback
    const textLower = resumeText.toLowerCase();
    const score = textLower.includes("google") || textLower.includes("system design") ? 82 : 68;
    const feedback = [
      { section: "Structure & Typography", score: 88, feedback: "Clean layout with modern, human-centric font choice and consistent spacing.", suggestion: "Keep maintaining elegant margins." },
      { section: "Role Keyword Density", score: textLower.includes("react") ? 75 : 55, feedback: `Limited keyword matches for modern ${role} stack requirements.`, suggestion: "Ensure typescript, react, and node.js are highlighted." },
      { section: "Metric Quantifiability", score: 60, feedback: "Project impact achievements are descriptive rather than metric-driven.", suggestion: "Inject precise percentages, throughput scores, or active user data." }
    ];
    const suggestions = [
      {
        id: "sug_1",
        section: "Projects / Achievements",
        original: textLower.includes("eco") ? "Built a carbon footprint tracker using React." : "Developed and deployed personal web application.",
        suggestion: textLower.includes("eco") ? "Designed a high-throughput carbon footprint dashboard in React, reducing client state refresh latency by 42% and scaling tracking routines to support complex data loads." : "Engineered and deployed a highly responsive React application with a Node/TypeScript backend, establishing sub-50ms API routes and full local state redundancy.",
        reason: "Adds engineering depth, clear telemetry metrics, and high-impact action verbs."
      },
      {
        id: "sug_2",
        section: "Skills / Competencies",
        original: "React, Node, JavaScript",
        suggestion: `React, TypeScript, Node.js, Express, System Scalability, Cloud Deployments, Microservices`,
        reason: `Enriches candidate profile for matching automated ${role} screening parameters.`
      }
    ];
    
    return { score, atsFeedback: feedback, suggestions, isSimulator: true, apiError: apiErrorText };
  };

  if (!ai) {
    const responseSimulator = runDynamicSimulator();
    return res.json({ success: true, result: responseSimulator, isSimulator: true });
  }

  try {
    const systemPrompt = `You are the Resume Agent of CareerPilot AI OS.
Your objective is to screen the user's resume text against their target career goal of: "${role}".
Provide an ATS analysis containing:
1. Overall ATS Score (0-100)
2. ATS Feedback points per category (Structure, Keywords, Project Impact)
3. 2-3 Concrete suggestions with section name, original phrase, and exact optimized alternative phrasing, with clear justifications.

Format your output strictly as a JSON response matching:
{
  "score": 75,
  "atsFeedback": [
    { "section": "Skills & Keywords", "score": 60, "feedback": "Detailed description", "suggestion": "Add key technology terms" }
  ],
  "suggestions": [
    { "id": "sug_1", "section": "Experience / Projects", "original": "Original text to replace", "suggestion": "Suggested optimized phrasing", "reason": "Quantify results and tech depth" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Resume Content:\n${resumeText}\nTarget Role:\n${role}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json({ success: true, result, isSimulator: false });
  } catch (err: any) {
    console.warn("Resume screening API offline, seamlessly using AI Simulator fallback:", err?.message || err);
    const responseSimulator = runDynamicSimulator(err.message);
    res.json({ success: true, result: responseSimulator, isSimulator: true });
  }
});

// 6. Learning Agent Endpoint: Propose customized roadmap
app.post("/api/learning/roadmap", async (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ success: false, error: "Missing topic parameter." });
  }

  const ai = getGeminiClient();
  const state = getStoredState();

  const runSimulatorRoadmap = () => {
    return [
      {
        id: `road_step_1_${Date.now()}`,
        title: `Phase 1: Foundations of ${topic}`,
        description: "Understanding thread life cycles, execution parameters, and base APIs.",
        status: "not_started" as const,
        resources: [
          { title: `${topic} Masterclass - FreeCodeCamp`, url: `https://youtube.com/results?search_query=${encodeURIComponent(topic + " masterclass")}`, type: "video" as const },
          { title: `Official Documentation: ${topic}`, url: "https://google.com/search?q=" + encodeURIComponent(topic + " official documentation"), type: "article" as const }
        ]
      },
      {
        id: `road_step_2_${Date.now()}`,
        title: `Phase 2: Intermediate & Advanced ${topic}`,
        description: "Focus on race conditions, memory synchronization, locks, and optimal pools.",
        status: "not_started" as const,
        resources: [
          { title: `${topic} Interview Cracking - YouTube Guide`, url: `https://youtube.com/results?search_query=${encodeURIComponent(topic + " interview prep")}`, type: "video" as const }
        ]
      }
    ];
  };

  if (!ai) {
    const simulatedRoadmap = runSimulatorRoadmap();
    return res.json({ success: true, roadmap: simulatedRoadmap, isSimulator: true });
  }

  try {
    const systemPrompt = `You are the Learning Agent of CareerPilot AI OS.
Create a detailed 2-phase learning roadmap for the topic: "${topic}".
Use the user's career context if helpful.
Include real searchable resource queries from YouTube or standard reference sites.
Format your output strictly as a JSON array of roadmap steps:
[
  {
    "id": "step_1",
    "title": "Phase 1: Core Mechanics",
    "description": "Short phase outline",
    "status": "not_started",
    "resources": [
      { "title": "Resource Video Title", "url": "https://youtube.com/...", "type": "video" }
    ]
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Generate Roadmap for: "${topic}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    });

    const roadmap = JSON.parse(response.text || "[]");
    res.json({ success: true, roadmap, isSimulator: false });
  } catch (err: any) {
    console.warn("Learning agent API offline, seamlessly using AI Simulator fallback:", err?.message || err);
    const simulatedRoadmap = runSimulatorRoadmap();
    res.json({ success: true, roadmap: simulatedRoadmap, isSimulator: true, apiError: err.message });
  }
});

// 7. Interview Agent Endpoint: Generate next question
app.post("/api/interview/question", async (req, res) => {
  const { type, topic, history } = req.body;
  const state = getStoredState();
  const ai = getGeminiClient();

  // Incorporate memories about weak topics and company preferences (Google)
  const memoryContext = state.memories
    .filter(m => m.importance >= 7)
    .map(m => m.content)
    .join("; ");

  const interviewTopic = topic || "Java & Backend Engineering";

  const runSimulatorQuestion = () => {
    const defaultQuestions = [
      "Explain the differences between volatile and synchronized modifiers in Java. When is volatile sufficient?",
      "How would you optimize a database query in Node.js that executes multiple parallel find requests to avoid connection pooling limits?",
      "Google has severe scaling criteria. How do you handle distributed locks if Redis experiences temporary network isolation?"
    ];
    const index = history ? history.length % defaultQuestions.length : 0;
    return defaultQuestions[index];
  };

  if (!ai) {
    const question = runSimulatorQuestion();
    return res.json({ success: true, question, isSimulator: true });
  }

  try {
    const prompt = `You are the Interview Agent of CareerPilot AI OS.
We are conducting a ${type || 'technical'} mock interview on: "${interviewTopic}".
User Memory Profile Context (targets, weak areas, preferences): ${memoryContext}
Previous Interview history (questions and answers): ${JSON.stringify(history || [])}

Generate the NEXT highly professional, target-company specific question.
If the user's memory indicates "Google" is their target, ask a Google-standard problem.
Keep the output concise. Just provide the interview question string directly, without markdown or JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });

    res.json({ success: true, question: response.text || "Explain your experience with scaling databases.", isSimulator: false });
  } catch (err: any) {
    console.warn("Interview Agent API offline, seamlessly using AI Simulator fallback:", err?.message || err);
    const question = runSimulatorQuestion();
    res.json({ success: true, question, isSimulator: true, apiError: err.message });
  }
});

// 8. Interview Agent Endpoint: Feedback on user response
app.post("/api/interview/feedback", async (req, res) => {
  const { question, answer } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ success: false, error: "Missing question or answer." });
  }

  const ai = getGeminiClient();

  const runSimulatorFeedback = () => {
    return {
      feedback: "Good attempt! You successfully touched upon the key technical terms. However, you should detail memory visibility side effects (such as CPU cache flushes) and CPU re-ordering guarantees.",
      score: 82
    };
  };

  if (!ai) {
    const responseSimulator = runSimulatorFeedback();
    return res.json({
      success: true,
      feedback: responseSimulator.feedback,
      score: responseSimulator.score,
      isSimulator: true
    });
  }

  try {
    const systemPrompt = `You are the Lead Technical Interviewer at Google evaluating a candidate response in CareerPilot AI OS.
Analyze the provided Question and User Answer.
Assess technical correctness, density of keywords, and clarity.
Provide a strict JSON response:
{
  "feedback": "constructive 2-sentence feedback emphasizing strength and missing details",
  "score": 85
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Question: ${question}\nUser Answer: ${answer}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json({ success: true, feedback: result.feedback, score: result.score, isSimulator: false });
  } catch (err: any) {
    console.warn("Evaluation feedback API offline, seamlessly using AI Simulator fallback:", err?.message || err);
    const responseSimulator = runSimulatorFeedback();
    res.json({
      success: true,
      feedback: responseSimulator.feedback,
      score: responseSimulator.score,
      isSimulator: true,
      apiError: err.message
    });
  }
});

// 9. Career Agent Endpoint: Career advice and company alignment
app.post("/api/career/suggest", async (req, res) => {
  const state = getStoredState();
  const ai = getGeminiClient();

  const runSimulatorCareerSuggest = () => {
    return {
      roles: ["Full Stack Distributed Engineer", "Cloud Backend Infrastructure Engineer", "System Architect"],
      companies: ["Google", "Alibaba Cloud", "AWS Dev", "Adobe Systems"],
      skillGaps: ["High-Level System Design (Caching, CDN, Load Balancers)", "NoSQL scaling configurations", "Microservice state consistency patterns"],
      preparationSteps: [
        "Read Donne Martin's System Design guidelines thoroughly.",
        "Solve mock interview trials focused on Concurrency on the Interview Agent.",
        "Optimize the project EcoTrack with performance-focused resume suggestions."
      ]
    };
  };

  if (!ai) {
    const suggestions = runSimulatorCareerSuggest();
    return res.json({ success: true, suggestions, isSimulator: true });
  }

  try {
    const memoryText = state.memories.map(m => m.content).join("; ");
    const systemPrompt = `You are the Career Intelligence Agent of CareerPilot AI OS.
Review the candidate's active profile: ${JSON.stringify(state.profile)}
And cross-session memory guidelines: ${memoryText}

Produce a personalized role and preparation suggestions plan.
Format your output strictly as a JSON object:
{
  "roles": ["Recommended Role 1", "Recommended Role 2"],
  "companies": ["Target Company 1", "Target Company 2"],
  "skillGaps": ["Identified skill gaps to target"],
  "preparationSteps": ["Step 1", "Step 2", "Step 3"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Generate Career Suggestions.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    });

    const suggestions = JSON.parse(response.text || "{}");
    res.json({ success: true, suggestions, isSimulator: false });
  } catch (err: any) {
    console.warn("Career Suggestions Agent API offline, seamlessly using AI Simulator fallback:", err?.message || err);
    const suggestions = runSimulatorCareerSuggest();
    res.json({ success: true, suggestions, isSimulator: true, apiError: err.message });
  }
});

// ----------------------------------------------------
// SERVER SERVING & VITE CONFIGURATION
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
