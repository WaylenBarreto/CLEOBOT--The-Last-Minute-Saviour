import React, { useState } from "react";
import { ActionableStep } from "../types";
import { 
  Sparkles, 
  Clock, 
  Mail, 
  Search, 
  Calendar, 
  Play, 
  Copy, 
  Check, 
  ExternalLink, 
  Download,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StepCardProps {
  step: ActionableStep;
  taskName: string;
  onToggleComplete: (stepOrder: number) => void;
  onExecuteAgent: (stepOrder: number) => Promise<void>;
  onUpdateAgentResult: (stepOrder: number, result: string) => void;
}

export const StepCard: React.FC<StepCardProps> = ({
  step,
  taskName,
  onToggleComplete,
  onExecuteAgent,
}) => {
  const [copied, setCopied] = useState(false);
  const [showResult, setShowResult] = useState(true);

  // Helper to trigger copy action
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build dynamic Google Calendar link
  const getGoogleCalendarLink = (title: string, details: string, durationMinutes: number) => {
    const start = new Date();
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    
    const formatCalDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };
    
    const textParam = encodeURIComponent(`[Life Saver] ${title}`);
    const detailsParam = encodeURIComponent(`Goal: ${step.description}\n\nInstructions & Checklist:\n${details}`);
    const datesParam = `${formatCalDate(start)}/${formatCalDate(end)}`;
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${textParam}&details=${detailsParam}&dates=${datesParam}`;
  };

  // Build real .ics download file URL
  const getICSDownloadUrl = (title: string, details: string, durationMinutes: number) => {
    const start = new Date();
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const cleanDetails = details.replace(/\n/g, "\\n").replace(/,/g, "\\,");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//The Last Minute Life Saver//EN",
      "BEGIN:VEVENT",
      `SUMMARY:[Life Saver] ${title}`,
      `DESCRIPTION:${cleanDetails}`,
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    return URL.createObjectURL(blob);
  };

  const getAgentTypeIcon = () => {
    switch (step.agentExecutionType) {
      case "email_draft":
        return <Mail className="w-4 h-4 text-black stroke-[2.5]" />;
      case "web_search":
        return <Search className="w-4 h-4 text-black stroke-[2.5]" />;
      case "calendar_block":
        return <Calendar className="w-4 h-4 text-black stroke-[2.5]" />;
      default:
        return null;
    }
  };

  const getAgentLabel = () => {
    switch (step.agentExecutionType) {
      case "email_draft":
        return "DRAFT EMAIL";
      case "web_search":
        return "SYNTHESIZE BRIEF";
      case "calendar_block":
        return "CALENDAR SCHEDULER";
      default:
        return "AUTONOMOUS AGENT";
    }
  };

  // Parse email draft into subject and body if possible, or display as-is
  const renderEmailDraft = (text: string) => {
    const lines = text.split("\n");
    let subject = "";
    let body = "";
    
    const subjectLineIndex = lines.findIndex(l => l.toLowerCase().startsWith("subject:"));
    if (subjectLineIndex !== -1) {
      subject = lines[subjectLineIndex].substring(8).trim();
      body = lines.slice(subjectLineIndex + 1).join("\n").trim();
    } else {
      body = text;
    }

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject || taskName)}&body=${encodeURIComponent(body)}`;

    return (
      <div className="space-y-3 bg-[#FFFEEF] p-4 neo-border-sm mt-3 font-sans text-sm">
        <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-2 flex-wrap gap-2">
          <span className="text-[10px] font-mono font-extrabold bg-[#7C3AED] text-white px-2 py-0.5 neo-border-sm">
            AI EMAIL GENERATOR
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(text)}
              className="flex items-center gap-1 text-xs text-black font-extrabold bg-white px-2.5 py-1.5 neo-border-sm neo-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
              {copied ? "COPIED" : "COPY DRAFT"}
            </button>
            <a
              href={mailtoUrl}
              className="flex items-center gap-1 text-xs text-black font-extrabold bg-[#FF4A8D] px-2.5 py-1.5 neo-border-sm neo-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              OPEN MAIL
            </a>
          </div>
        </div>

        {subject && (
          <div className="bg-white p-2.5 neo-border-sm">
            <span className="text-[9px] text-zinc-500 font-mono font-extrabold block">SUBJECT:</span>
            <span className="font-extrabold text-black">{subject}</span>
          </div>
        )}

        <div className="bg-white p-3.5 neo-border-sm whitespace-pre-line text-black leading-relaxed font-sans max-h-60 overflow-y-auto">
          {body}
        </div>
      </div>
    );
  };

  const renderWebSearch = (text: string) => {
    return (
      <div className="space-y-3 bg-[#FFFEEF] p-4 neo-border-sm mt-3 font-sans text-sm">
        <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-2">
          <span className="text-[10px] font-mono font-extrabold bg-[#FF4A8D] text-black px-2 py-0.5 neo-border-sm">
            RESEARCH BRIEF
          </span>
          <button
            onClick={() => handleCopy(text)}
            className="flex items-center gap-1 text-xs text-black font-extrabold bg-white px-2.5 py-1.5 neo-border-sm neo-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
            {copied ? "COPIED" : "COPY BRIEF"}
          </button>
        </div>

        <div className="bg-white p-4 neo-border-sm text-black whitespace-pre-line max-h-80 overflow-y-auto leading-relaxed">
          {text}
        </div>
      </div>
    );
  };

  const renderCalendarBlock = (text: string) => {
    const calLink = getGoogleCalendarLink(step.description, text, step.estimatedMinutes);
    const icsUrl = getICSDownloadUrl(step.description, text, step.estimatedMinutes);

    return (
      <div className="space-y-3 bg-[#FFFEEF] p-4 neo-border-sm mt-3 font-sans text-sm">
        <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-2 flex-wrap gap-2">
          <span className="text-[10px] font-mono font-extrabold bg-[#10B981] text-black px-2 py-0.5 neo-border-sm">
            CALENDAR PLANNER
          </span>
          <div className="flex gap-2">
            <a
              href={calLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-black font-extrabold bg-[#10B981] px-2.5 py-1.5 neo-border-sm neo-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              ADD GOOGLE CAL
            </a>
            <a
              href={icsUrl}
              download={`${step.description.slice(0, 20).replace(/\s+/g, "_")}.ics`}
              className="flex items-center gap-1 text-xs text-black font-extrabold bg-white px-2.5 py-1.5 neo-border-sm neo-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              DOWNLOAD .ICS
            </a>
          </div>
        </div>

        <div className="bg-white p-4 neo-border-sm text-black whitespace-pre-line max-h-60 overflow-y-auto leading-relaxed">
          <p className="font-mono text-[9px] text-zinc-500 mb-1.5 uppercase font-extrabold tracking-wider">
            SUGGESTED TIMEBLOCK INFO:
          </p>
          {text}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      layout
      id={`step-card-${step.stepOrder}`}
      className={`p-5 neo-border neo-shadow-rose transition-all bg-white relative ${
        step.completed ? "opacity-75 bg-[#F8F9FA]" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Toggle Circle Checkbox */}
        <button
          onClick={() => onToggleComplete(step.stepOrder)}
          className="mt-1 flex-shrink-0 text-black hover:text-[#FF4A8D] transition-colors cursor-pointer"
          aria-label="Toggle Complete"
        >
          {step.completed ? (
            <div className="w-6 h-6 neo-border-sm bg-[#10B981] flex items-center justify-center text-black">
              <Check className="w-4 h-4 stroke-[4]" />
            </div>
          ) : (
            <div className="w-6 h-6 neo-border-sm bg-white hover:bg-[#FFFEEF]" />
          )}
        </button>

        {/* Core Description & Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
            <span className="font-mono text-xs text-black font-black uppercase bg-zinc-150 border-2 border-black px-2 py-0.5">
              STEP {step.stepOrder}
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 font-mono text-xs text-black bg-[#FFFEEF] neo-border-sm px-2 py-0.5 font-extrabold">
                <Clock className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                {step.estimatedMinutes} MIN
              </span>
              {step.requiresAgentExecution && (
                <span className="flex items-center gap-1 text-[11px] text-black bg-[#7C3AED] text-white px-2 py-0.5 neo-border-sm font-extrabold">
                  <Sparkles className="w-3 h-3 text-white fill-current animate-pulse" />
                  AGENT READY
                </span>
              )}
            </div>
          </div>

          <h4
            className={`font-display font-extrabold text-base md:text-lg text-black ${
              step.completed ? "line-through text-zinc-400" : ""
            }`}
          >
            {step.description}
          </h4>

          {/* Playful Agent Action Banner */}
          {step.requiresAgentExecution && !step.agentResult && (
            <div className="mt-4 bg-[#FFFEEF] neo-border-sm p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-white p-1.5 neo-border-sm">
                  {getAgentTypeIcon()}
                </div>
                <div>
                  <span className="text-[10px] font-mono font-extrabold text-[#7C3AED] block uppercase">
                    {getAgentLabel()}
                  </span>
                  <span className="text-xs font-bold text-black font-sans">
                    {step.agentContext.slice(0, 65)}...
                  </span>
                </div>
              </div>
              <button
                disabled={step.executing}
                onClick={() => onExecuteAgent(step.stepOrder)}
                className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-black bg-[#10B981] hover:bg-emerald-400 px-4 py-2 neo-border-sm neo-shadow active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000000] transition-all cursor-pointer uppercase tracking-wider"
              >
                {step.executing ? (
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                {step.executing ? "WORKING..." : "DO IT FOR ME"}
              </button>
            </div>
          )}

          {/* Agent Output Actions with drawer drop */}
          {step.agentResult && (
            <div className="mt-4 border-t-2 border-black pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-extrabold text-black flex items-center gap-1.5">
                  <div className="p-0.5 bg-[#FF4A8D] neo-border-sm">
                    <Sparkles className="w-3.5 h-3.5 text-black fill-current" />
                  </div>
                  WORK COMPLETED
                </span>
                <button
                  onClick={() => setShowResult(!showResult)}
                  className="text-xs text-black hover:text-[#FF4A8D] flex items-center gap-1 font-black uppercase bg-white neo-border-sm px-2 py-1 neo-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                >
                  {showResult ? (
                    <>
                      <span>HIDE OUTPUT</span>
                      <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                    </>
                  ) : (
                    <>
                      <span>SHOW OUTPUT</span>
                      <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>

              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    {step.agentExecutionType === "email_draft" && renderEmailDraft(step.agentResult)}
                    {step.agentExecutionType === "web_search" && renderWebSearch(step.agentResult)}
                    {step.agentExecutionType === "calendar_block" && renderCalendarBlock(step.agentResult)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
