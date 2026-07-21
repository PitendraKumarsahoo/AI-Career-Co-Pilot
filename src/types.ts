/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Project {
  name: string;
  description: string;
  technologies: string[];
}

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface WeeklyGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  tasks: SubTask[];
  colorClass: string;
}

export interface UserProfile {
  skills: string[];
  goals: string[];
  projects: Project[];
  preferredCompanies: string[];
  weakSubjects: string[];
  certifications: string[];
  experienceLevel: string;
  weeklyGoals?: WeeklyGoal[];
  targetRole?: string;
  mainTaskToday?: string;
  mainTaskCompleted?: boolean;
}

export interface Memory {
  id: string;
  content: string;
  type: 'episodic' | 'semantic' | 'preference';
  timestamp: string;
  importance: number; // 1 to 10
  category: string;
  tags?: string[];
}

export interface ATSFeedbackItem {
  section: string;
  score: number; // 0-100
  feedback: string;
  suggestion: string;
}

export interface ResumeSuggestion {
  id: string;
  section: string;
  original: string;
  suggestion: string;
  reason: string;
  approved?: boolean;
}

export interface ResumeAnalysis {
  score: number;
  atsFeedback: ATSFeedbackItem[];
  suggestions: ResumeSuggestion[];
  rawText: string;
}

export interface LearningResource {
  title: string;
  url: string;
  type: 'video' | 'course' | 'article';
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  resources: LearningResource[];
  approved?: boolean;
}

export interface InterviewQA {
  question: string;
  answer?: string;
  feedback?: string;
  score?: number;
}

export interface InterviewSession {
  id: string;
  type: 'technical' | 'hr' | 'coding';
  topic: string;
  status: 'active' | 'completed';
  qa: InterviewQA[];
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: 'interested' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  dateApplied?: string;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: 'reminder' | 'system' | 'learning';
  timestamp: string;
  read: boolean;
  priority?: 'Urgent' | 'Interview Prep' | 'General';
}

export interface WeeklyReport {
  id: string;
  weekRange: string;
  summary: string;
  skillGrowth: { skill: string; increase: number }[];
  interviewsCount: number;
  learningHours: number;
  suggestions: string[];
}

export interface SystemContextLog {
  id: string;
  originalContent: string;
  type: string;
  category: string;
  compressedSummary: string;
  timestamp: string;
}

export interface SystemContext {
  lastUpdated: string;
  compressedMemoriesCount: number;
  compressedRules: string[];
  historyLog: SystemContextLog[];
  overallSummary: string;
}
