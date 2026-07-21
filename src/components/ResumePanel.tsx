/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  FileText, 
  Search, 
  FileCheck, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  Upload,
  FileUp,
  Download
} from "lucide-react";
import { ResumeAnalysis, ResumeSuggestion } from "../types";

interface ResumePanelProps {
  onAnalyzeResume: (resumeText: string, targetRole: string) => Promise<void>;
  analysis: ResumeAnalysis | null;
  isAnalyzing: boolean;
  onApproveSuggestion: (sugId: string) => void;
}

const mockResumes = [
  {
    title: "EcoTrack Basic Resume (Current)",
    role: "Software Engineer Intern",
    text: `PITEMDRA KUMAR SAHOO
Backend Software Engineer Intern Candidate

SKILLS:
TypeScript, React, Node.js, Python, CSS

PROJECTS:
EcoTrack Project:
- Created a carbon footprint tracker app.
- Used React and CSS.
- Added local storage to save details.

EDUCATION:
GIET University, B.Tech in Computer Science`
  },
  {
    title: "Java Backend Draft Resume",
    role: "Google Intern Candidate",
    text: `PITEMDRA KUMAR SAHOO
Backend Specialist

SKILLS:
Java, Concurrency, SQL, Node.js

EXPERIENCE:
Project 1:
- Wrote basic threading programs.
- Implemented some database connections in SQL.
- Failed mock interviews because of system design gaps.`
  }
];

export default function ResumePanel({
  onAnalyzeResume,
  analysis,
  isAnalyzing,
  onApproveSuggestion
}: ResumePanelProps) {
  const [resumeText, setResumeText] = useState(mockResumes[0].text);
  const [targetRole, setTargetRole] = useState("Software Engineer Intern");
  const [dragActive, setDragActive] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const exportAsJSON = () => {
    if (!analysis) return;
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        targetRole,
        score: analysis.score,
        atsFeedback: analysis.atsFeedback,
        suggestions: analysis.suggestions,
        exportedAt: new Date().toISOString()
      }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `resume_analysis_${targetRole.toLowerCase().replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Failed to export resume analysis as JSON:", err);
    }
  };

  const exportAsCSV = () => {
    if (!analysis) return;
    try {
      let csvContent = "Resume Analysis Report for " + targetRole + "\n";
      csvContent += "Overall ATS Score," + analysis.score + "%\n\n";
      
      csvContent += "SECTION FEEDBACK MATRIX\n";
      csvContent += "Section Name,Score,Feedback,Core Recommendation\n";
      analysis.atsFeedback.forEach(item => {
        const section = item.section.replace(/"/g, '""');
        const feedback = item.feedback.replace(/"/g, '""');
        const suggestion = item.suggestion.replace(/"/g, '""');
        csvContent += `"${section}",${item.score},"${feedback}","${suggestion}"\n`;
      });
      
      csvContent += "\nCRITICAL SUGGESTIONS & OPTIMIZATION LOG\n";
      csvContent += "ID,Section,Original Sentence,Suggested Revision,Reason for Change,Status\n";
      analysis.suggestions.forEach(item => {
        const section = item.section.replace(/"/g, '""');
        const original = item.original.replace(/"/g, '""');
        const suggestion = item.suggestion.replace(/"/g, '""');
        const reason = item.reason.replace(/"/g, '""');
        const status = item.approved ? "APPROVED & SYNCED" : "PENDING REVIEW";
        csvContent += `"${item.id}","${section}","${original}","${suggestion}","${reason}","${status}"\n`;
      });
      
      const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `resume_analysis_${targetRole.toLowerCase().replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Failed to export resume analysis as CSV:", err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const loadPdfJS = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
        resolve(pdfjsLib);
      };
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') {
      setIsExtracting(true);
      setUploadMessage("Loading client-side PDF parser...");
      loadPdfJS()
        .then(async (pdfjsLib) => {
          try {
            setUploadMessage(`Extracting text content from "${file.name}"...`);
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            let fullText = "";
            
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(" ");
              fullText += pageText + "\n";
            }
            
            setIsExtracting(false);
            if (fullText.trim()) {
              setResumeText(fullText.trim());
              setUploadMessage(`Successfully parsed "${file.name}" - Initiating analysis`);
              onAnalyzeResume(fullText.trim(), targetRole);
            } else {
              setUploadMessage(`Parsed "${file.name}", but no readable text was found (it may be a scanned image-based PDF).`);
            }
            setTimeout(() => setUploadMessage(null), 5000);
          } catch (err) {
            console.error(err);
            setIsExtracting(false);
            setUploadMessage(`Failed to parse PDF file "${file.name}". Please copy and paste plain text.`);
            setTimeout(() => setUploadMessage(null), 5000);
          }
        })
        .catch((err) => {
          console.error(err);
          setIsExtracting(false);
          setUploadMessage("Could not load PDF.js engine from CDN. Please copy and paste plain text.");
          setTimeout(() => setUploadMessage(null), 5000);
        });
    } else if (extension === 'txt' || extension === 'md' || extension === 'json') {
      setIsExtracting(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          setResumeText(text);
          setUploadMessage(`Successfully parsed "${file.name}" - Initiating analysis`);
          onAnalyzeResume(text, targetRole);
          setTimeout(() => setUploadMessage(null), 4000);
        }
        setIsExtracting(false);
      };
      reader.onerror = () => setIsExtracting(false);
      reader.readAsText(file);
    } else {
      setUploadMessage(`Loaded "${file.name}" (unsupported format for direct text parsing, please paste raw text)`);
      setResumeText(`[Uploaded File: ${file.name}]\n\nCandidates should copy and paste raw resume text details here if binary format parsing is blocked in your sandbox.`);
      setTimeout(() => setUploadMessage(null), 6000);
    }
  };

  const handleSelectMock = (mock: typeof mockResumes[0]) => {
    setResumeText(mock.text);
    setTargetRole(mock.role);
  };

  const handleRunAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) return;
    onAnalyzeResume(resumeText, targetRole);
  };

  return (
    <div id="resume-panel" className="flex-1 overflow-y-auto p-6 bg-transparent text-slate-100 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight text-white flex items-center gap-2">
          <span className="text-gradient-purple-sky">ATS Resume Optimization Agent</span> <FileText className="w-6 h-6 text-sky-400 animate-pulse" />
        </h2>
        <p className="text-slate-400 text-sm font-sans">
          Optimize your projects and profile keywords to bypass applicant screening algorithms automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT PANEL: Editor & Submitter */}
        <div className="flex flex-col gap-4">
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
            <h3 className="text-sm font-display font-bold text-white flex items-center justify-between">
              <span>Paste Resume Draft</span>
              <span className="text-[10px] text-slate-500 font-mono">TEXT ANALYZER</span>
            </h3>

            {/* Quick selectors */}
            <div className="flex gap-2 mb-1">
              {mockResumes.map((mock, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectMock(mock)}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-mono text-slate-300 px-2 py-1 rounded-lg cursor-pointer"
                >
                  Load: {mock.title.split(" ")[0]}
                </button>
              ))}
            </div>

            <form onSubmit={handleRunAnalysis} className="flex flex-col gap-3.5">
              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Target Application Role</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Google Software Engineering Intern"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              {/* Drag and Drop File Zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                  dragActive
                    ? "border-sky-500 bg-sky-500/10"
                    : isExtracting
                    ? "border-purple-500 bg-purple-500/5 animate-pulse"
                    : "border-white/10 bg-slate-950/20 hover:border-white/20"
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => !isExtracting && document.getElementById("resume-file-input")?.click()}
              >
                <input
                  type="file"
                  id="resume-file-input"
                  className="hidden"
                  onChange={handleFileInputChange}
                  accept=".txt,.md,.json,.pdf"
                  disabled={isExtracting}
                />
                {isExtracting ? (
                  <div className="flex flex-col items-center gap-1.5 py-1">
                    <span className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-purple-300">Extracting Document Text...</span>
                    <span className="text-[10px] text-slate-500 font-mono">Invoking client-side pdfjs-dist layer</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <Upload className="w-5 h-5 text-sky-400" />
                    <span className="text-xs font-semibold text-slate-200">Drag & Drop Resume File</span>
                    <span className="text-[10px] text-slate-500">Supports .pdf, .txt, .md, or .json (or click to browse)</span>
                  </div>
                )}
              </div>

              {uploadMessage && (
                <div className="text-[10px] font-mono text-sky-400 bg-sky-500/5 border border-sky-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>{uploadMessage}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Resume Text Content</label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full h-80 glass-input rounded-xl p-3 text-xs text-slate-300 font-mono focus:outline-none"
                  placeholder="Paste your plain text resume here..."
                />
              </div>

              <button
                type="submit"
                disabled={isAnalyzing || !resumeText.trim()}
                className="w-full flex items-center justify-center gap-1.5 glass-button-primary text-white font-medium text-xs py-2.5 rounded-xl cursor-pointer disabled:opacity-50 shadow-md"
              >
                {isAnalyzing ? "Analyzing Phrasing & Gaps..." : "Initiate ATS Audit & Keyword Matcher"}
                <Play className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT PANEL: ATS Metrics & Suggestions */}
        <div className="flex flex-col gap-4">
          {isAnalyzing ? (
            <div className="glass-card border-dashed rounded-2xl h-full min-h-[400px] flex flex-col items-center justify-center gap-3">
              <span className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-xs font-semibold text-white font-sans">Resume screening in progress...</p>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">Cross-referencing memory parameters and weak subject matrices.</p>
              </div>
            </div>
          ) : !analysis ? (
            <div className="glass-card border-dashed rounded-2xl h-full min-h-[400px] flex flex-col items-center justify-center gap-2 p-6 text-center">
              <FileCheck className="w-12 h-12 text-slate-700" />
              <h4 className="text-sm font-display font-bold text-slate-400">No active screen reports</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1 font-sans">
                Enter your text on the left and trigger analysis to generate custom suggestions.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              
              {/* ATS Score & Breakdown Card */}
              <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">ATS Screening Matrix</h3>
                    <p className="text-[10px] text-slate-500 font-mono">TARGET: {targetRole.toUpperCase()}</p>
                  </div>
                  
                  {/* Export Controls & Gauge */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white/5 border border-white/5 p-1 rounded-xl">
                      <button
                        onClick={exportAsJSON}
                        className="flex items-center gap-1 px-2.5 py-1 hover:bg-white/10 text-[10px] font-mono font-medium text-slate-300 hover:text-white rounded-lg transition duration-200 cursor-pointer"
                        title="Export ATS Report as structured JSON"
                      >
                        <Download className="w-3 h-3 text-sky-400" />
                        <span>JSON</span>
                      </button>
                      <span className="text-slate-700 font-mono text-[10px]">|</span>
                      <button
                        onClick={exportAsCSV}
                        className="flex items-center gap-1 px-2.5 py-1 hover:bg-white/10 text-[10px] font-mono font-medium text-slate-300 hover:text-white rounded-lg transition duration-200 cursor-pointer"
                        title="Export ATS Report as structured CSV"
                      >
                        <Download className="w-3 h-3 text-emerald-400" />
                        <span>CSV</span>
                      </button>
                    </div>

                    <div className="relative w-16 h-16 rounded-full border-4 border-white/10 flex items-center justify-center">
                      <span className="text-base font-bold font-mono text-emerald-400">{analysis.score}%</span>
                      <span className="absolute -inset-1 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  {analysis.atsFeedback.map((feedback, idx) => (
                    <div key={idx} className="bg-white/[0.02] border border-white/10 p-3 rounded-xl flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-slate-300">{feedback.section}</span>
                        <span className={`font-mono ${feedback.score >= 80 ? "text-emerald-400" : feedback.score >= 60 ? "text-amber-400" : "text-red-400"}`}>
                          {feedback.score}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{feedback.feedback}</p>
                      <p className="text-[10px] text-sky-400 mt-1 font-mono">→ Recommendation: {feedback.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Side-by-Side Optimization suggestions (Human-In-The-Loop) */}
              <div className="glass-card rounded-2xl p-5 shadow-lg">
                <h3 className="text-sm font-display font-bold text-white mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" /> Human-in-the-Loop Optimizations
                </h3>

                <div className="flex flex-col gap-3">
                  {analysis.suggestions.map((sug) => {
                    const isApproved = sug.approved;
                    return (
                      <div key={sug.id} className={`border p-3.5 rounded-xl flex flex-col gap-2.5 transition duration-200 ${
                        isApproved 
                          ? "bg-emerald-500/5 border-emerald-500/30" 
                          : "bg-white/[0.02] border-white/10"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase bg-white/5 border border-white/10 text-slate-400 px-1.5 py-0.5 rounded">
                            {sug.section}
                          </span>

                          {isApproved ? (
                            <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Approved & Synthesized
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-amber-400">
                              PENDING APPROVAL
                            </span>
                          )}
                        </div>

                        {/* Phrasing comparison */}
                        <div className="grid grid-cols-1 gap-2">
                          <div className="bg-slate-950/50 p-2 rounded-lg border border-white/10 text-[11px]">
                            <span className="text-red-400 font-mono block text-[9px] mb-0.5">ORIGINAL:</span>
                            <span className="text-slate-400 line-through">{sug.original}</span>
                          </div>
                          <div className="bg-slate-950/50 p-2 rounded-lg border border-white/10 text-[11px]">
                            <span className="text-emerald-400 font-mono block text-[9px] mb-0.5">SUGGESTED OPTIMIZATION:</span>
                            <span className="text-slate-200 font-semibold">{sug.suggestion}</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 italic">Reason: {sug.reason}</p>

                        {!isApproved && (
                          <button
                            onClick={() => onApproveSuggestion(sug.id)}
                            className="w-full flex items-center justify-center gap-1 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs py-1.5 rounded-lg cursor-pointer transition font-medium"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve Optimization Phrasing
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
