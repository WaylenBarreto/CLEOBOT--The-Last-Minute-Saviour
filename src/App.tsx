/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { TaskPlan, QuickTemplate } from "./types";
import { templates } from "./data";
import { HistorySidebar } from "./components/HistorySidebar";
import { StepCard } from "./components/StepCard";
import { 
  Sparkles, 
  Send, 
  AlertTriangle, 
  Zap, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Keyboard,
  Compass,
  ArrowRight,
  Terminal,
  Skull,
  TrendingUp,
  RotateCcw,
  Coffee,
  Activity,
  Volume2,
  VolumeX,
  Radio,
  FileText,
  Shield,
  Check,
  AlertCircle,
  Mail,
  Calendar as CalendarIcon,
  LogOut,
  User as UserIcon,
  Database,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "firebase/auth";
import {
  initAuth,
  googleSignIn,
  checkRedirectResult,
  logout,
  savePlanToFirestore,
  getPlansFromFirestore,
  deletePlanFromFirestore,
  saveScanToFirestore,
  getScansFromFirestore
} from "./lib/firebase";
import { AuthScreen } from "./components/AuthScreen";
import { LandingScreen } from "./components/LandingScreen";
import cleobotLogo from "./assets/cleobot_logo.png";
import { GoogleLogoIcon, GmailLogoIcon, GoogleCalendarLogoIcon } from "./components/BrandLogos";

const STRESS_PHRASES = [
  "DECRUNCHING YOUR EXTREME PANIC INDEX...",
  "ROASTING YOUR PROCRASTINATION DECISIONS...",
  "SCOURING SECURE ACCESS VAULTS...",
  "DRAFTING DIPLOMATIC EXPLANATION PACKETS...",
  "CONSTRUCTING MIDNIGHT SURVIVAL TIMELINES...",
  "PREPARING COFFEE-FUELED AGENT BOTS..."
];

const GUARDIAN_PRESETS = [
  {
    title: "Mode A: Harvest (Emails)",
    description: "Scan unread inbox notifications for hidden commitments & payment warnings.",
    input: ""
  },
  {
    title: "Mode B: Block & Buffer (Calendar)",
    description: "Analyze calendar dumps and calculate structured defense slots.",
    input: ""
  },
  {
    title: "Mode C: Escalate (Panic Mode)",
    description: "Trigger critical alarms and communication backups when a deadline is imminent.",
    input: `CRITICAL STATUS CHECK:
Target Deadline: Client Production Server Deployment at 12:30 PM today.
Current Simulated Time: 11:45 AM (Only 45 minutes remaining!).
Checkpoint checklist completion: 0 out of 5 steps completed.
CTO status: In flight to Tokyo, completely unreachable.
AWS keys location: Unknown, likely inside secure vault.
Client status: Sending high-frequency warning messages on Slack asking if we are live.

Evaluate system state and generate a protective escalation backup call or delay-notice template immediately.`
  }
];

export default function App() {
  // Core states
  const [taskInput, setTaskInput] = useState("");
  const [dueInfo, setDueInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState(STRESS_PHRASES[0]);
  const [currentPlan, setCurrentPlan] = useState<TaskPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<TaskPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Tab selector state (either "planner" or "guardian")
  const [activeMainTab, setActiveMainTab] = useState<"planner" | "guardian">("planner");

  // Autonomous Guardian Engine states
  const [guardianInput, setGuardianInput] = useState("");
  const [guardianLoading, setGuardianLoading] = useState(false);
  const [guardianResult, setGuardianResult] = useState<any | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"A" | "B" | "C">("A");

  // Clock state set to current system simulated time
  const [currentTime, setCurrentTime] = useState(new Date("2026-06-24T11:21:11-07:00"));

  // Network online/offline status
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  
  // Command input reference for keyboard focus
  const commandInputRef = useRef<HTMLInputElement>(null);

  // Firebase Auth and Storage states
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [scansHistory, setScansHistory] = useState<any[]>([]);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Google Sign-In click handler
  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        // Load data from Firestore
        const dbPlans = await getPlansFromFirestore(result.user.uid);
        setSavedPlans(dbPlans);
        const dbScans = await getScansFromFirestore(result.user.uid);
        setScansHistory(dbScans);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout click handler
  const handleLogout = async () => {
    setAuthLoading(true);
    try {
      await logout();
      setUser(null);
      setToken(null);
      setShowLanding(true);
      setScansHistory([]);
      // fallback to localStorage
      const saved = localStorage.getItem("last_minute_life_saver_plans");
      if (saved) {
        setSavedPlans(JSON.parse(saved));
      } else {
        setSavedPlans([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to log out.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Directly trigger guardian analysis on input data
  const triggerDirectAnalyze = async (rawText: string) => {
    if (!rawText.trim()) return;
    setGuardianLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/guardian-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamInput: rawText,
          clientTime: currentTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to analyze background stream.");
      }

      const data = await response.json();
      setGuardianResult(data);

      if (user) {
        await saveScanToFirestore(user.uid, data, rawText);
        const dbScans = await getScansFromFirestore(user.uid);
        setScansHistory(dbScans);
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse Guardian Engine analysis.");
    } finally {
      setGuardianLoading(false);
    }
  };

  // Load real unread Gmail messages
  const handleLoadGmail = async (autoAnalyze = false) => {
    let currentToken = token;
    setGmailLoading(true);
    setError(null);
    try {
      if (!currentToken) {
        const result = await googleSignIn();
        if (result) {
          setUser(result.user);
          setToken(result.accessToken);
          currentToken = result.accessToken;
          const dbPlans = await getPlansFromFirestore(result.user.uid);
          setSavedPlans(dbPlans);
          const dbScans = await getScansFromFirestore(result.user.uid);
          setScansHistory(dbScans);
        } else {
          throw new Error("Google authentication is required to pull real-time Gmail messages.");
        }
      }

      const res = await fetch("/api/google/gmail", {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (!res.ok) {
        // If expired or unauthorized, try to renew once
        const result = await googleSignIn();
        if (result) {
          setUser(result.user);
          setToken(result.accessToken);
          currentToken = result.accessToken;
          const retryRes = await fetch("/api/google/gmail", {
            headers: { Authorization: `Bearer ${currentToken}` },
          });
          if (!retryRes.ok) {
            throw new Error("Failed to load Gmail messages. Check your Google Workspace authorization.");
          }
          const retryData = await retryRes.json();
          setGuardianInput(retryData.formattedText);
          if (autoAnalyze) {
            await triggerDirectAnalyze(retryData.formattedText);
          }
          return;
        }
        throw new Error("Failed to load Gmail messages. Check your Google Workspace authorization.");
      }
      const data = await res.json();
      setGuardianInput(data.formattedText);
      if (autoAnalyze) {
        await triggerDirectAnalyze(data.formattedText);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load Gmail feeds.");
    } finally {
      setGmailLoading(false);
    }
  };

  // Load real upcoming Google Calendar events
  const handleLoadCalendar = async (autoAnalyze = false) => {
    let currentToken = token;
    setCalendarLoading(true);
    setError(null);
    try {
      if (!currentToken) {
        const result = await googleSignIn();
        if (result) {
          setUser(result.user);
          setToken(result.accessToken);
          currentToken = result.accessToken;
          const dbPlans = await getPlansFromFirestore(result.user.uid);
          setSavedPlans(dbPlans);
          const dbScans = await getScansFromFirestore(result.user.uid);
          setScansHistory(dbScans);
        } else {
          throw new Error("Google authentication is required to pull real-time Google Calendar streams.");
        }
      }

      const res = await fetch("/api/google/calendar", {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (!res.ok) {
        // If expired or unauthorized, try to renew once
        const result = await googleSignIn();
        if (result) {
          setUser(result.user);
          setToken(result.accessToken);
          currentToken = result.accessToken;
          const retryRes = await fetch("/api/google/calendar", {
            headers: { Authorization: `Bearer ${currentToken}` },
          });
          if (!retryRes.ok) {
            throw new Error("Failed to load Google Calendar. Check your Google Workspace authorization.");
          }
          const retryData = await retryRes.json();
          setGuardianInput(retryData.formattedText);
          if (autoAnalyze) {
            await triggerDirectAnalyze(retryData.formattedText);
          }
          return;
        }
        throw new Error("Failed to load Google Calendar. Check your Google Workspace authorization.");
      }
      const data = await res.json();
      setGuardianInput(data.formattedText);
      if (autoAnalyze) {
        await triggerDirectAnalyze(data.formattedText);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load Calendar schedule.");
    } finally {
      setCalendarLoading(false);
    }
  };

  // Speak synthesized voice text
  const handleSimulateCall = (scriptText: string) => {
    if ("speechSynthesis" in window) {
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(scriptText);
      utterance.rate = 1.1; // speedy, high intensity!
      utterance.pitch = 1.0;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Browser Speech Synthesis is not supported. Use text view.");
    }
  };

  // Submit and analyze proactive background streams
  const handleGuardianAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!guardianInput.trim()) return;

    setGuardianLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/guardian-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamInput: guardianInput,
          clientTime: currentTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to analyze background stream.");
      }

      const data = await response.json();
      setGuardianResult(data);

      // Save scan to Firestore if user is authenticated
      if (user) {
        await saveScanToFirestore(user.uid, data, guardianInput);
        const dbScans = await getScansFromFirestore(user.uid);
        setScansHistory(dbScans);
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse Guardian Engine analysis.");
    } finally {
      setGuardianLoading(false);
    }
  };

  // Initialize Auth state observer on mount
  useEffect(() => {
    // On mobile, Google sign-in uses a page redirect. Capture the token from that
    // redirect result as soon as the app mounts (before the auth state fires).
    checkRedirectResult().then((redirectData) => {
      if (redirectData) {
        setUser(redirectData.user);
        setToken(redirectData.accessToken);
        setShowLanding(false);
      }
    }).catch(() => { /* silently ignore if no redirect pending */ });

    const unsubscribe = initAuth(
      async (authUser, accessToken) => {
        setUser(authUser);
        // Only overwrite the token from initAuth if we don't already have one
        // (the redirect result may have set a fresher token above)
        setToken(prev => prev || accessToken);
        setAuthLoading(false);
        try {
          const dbPlans = await getPlansFromFirestore(authUser.uid);
          setSavedPlans(dbPlans);
          const dbScans = await getScansFromFirestore(authUser.uid);
          setScansHistory(dbScans);
        } catch (e) {
          console.error("Failed to load user Firestore database:", e);
        }
      },
      () => {
        setUser(null);
        setToken(null);
        setAuthLoading(false);
        const saved = localStorage.getItem("last_minute_life_saver_plans");
        if (saved) {
          try {
            setSavedPlans(JSON.parse(saved));
          } catch (e) {
            console.error("Failed to parse saved plans", e);
          }
        }
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(prev => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitor network online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Rotate loading steps
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      let idx = 0;
      interval = setInterval(() => {
        idx = (idx + 1) % STRESS_PHRASES.length;
        setLoadingPhrase(STRESS_PHRASES[idx]);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Focus command bar with shortcut (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        commandInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Save plans helper
  const savePlansToStorage = async (updatedPlans: TaskPlan[], planToSave?: TaskPlan) => {
    setSavedPlans(updatedPlans);
    if (user) {
      if (planToSave) {
        await savePlanToFirestore(user.uid, planToSave);
      } else if (currentPlan) {
        await savePlanToFirestore(user.uid, currentPlan);
      }
    } else {
      localStorage.setItem("last_minute_life_saver_plans", JSON.stringify(updatedPlans));
    }
  };

  // Submit and synthesize savior timeline
  const handleAnalyzeTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!taskInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskInput,
          dueInfo: dueInfo || "Urgent priority",
          clientTime: currentTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to analyze task.");
      }

      const plan: TaskPlan = await response.json();
      
      // Initialize completed state and flags
      plan.actionableSteps = plan.actionableSteps.map(step => ({
        ...step,
        completed: false,
        agentResult: undefined,
        executing: false
      }));

      setCurrentPlan(plan);

      // Save to savedPlans history if unique
      const exists = savedPlans.some(p => p.taskName === plan.taskName);
      if (!exists) {
        const updated = [plan, ...savedPlans];
        setSavedPlans(updated);
        if (user) {
          await savePlanToFirestore(user.uid, plan);
        } else {
          localStorage.setItem("last_minute_life_saver_plans", JSON.stringify(updated));
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse crisis response.");
    } finally {
      setLoading(false);
    }
  };

  // Execute Agentic helper actions
  const handleExecuteAgentStep = async (stepOrder: number) => {
    if (!currentPlan) return;

    const updatedSteps = currentPlan.actionableSteps.map(step => 
      step.stepOrder === stepOrder ? { ...step, executing: true } : step
    );
    setCurrentPlan({ ...currentPlan, actionableSteps: updatedSteps });

    const step = currentPlan.actionableSteps.find(s => s.stepOrder === stepOrder);
    if (!step) return;

    try {
      const response = await fetch("/api/execute-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentExecutionType: step.agentExecutionType,
          agentContext: step.agentContext,
          stepDescription: step.description,
          taskName: currentPlan.taskName,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to execute step.");
      }

      const data = await response.json();
      
      const finalSteps = currentPlan.actionableSteps.map(s => 
        s.stepOrder === stepOrder ? { ...s, executing: false, agentResult: data.output } : s
      );
      
      const updatedPlan = { ...currentPlan, actionableSteps: finalSteps };
      setCurrentPlan(updatedPlan);

      const updatedHistory = savedPlans.map(p => 
        p.taskName === currentPlan.taskName ? updatedPlan : p
      );
      setSavedPlans(updatedHistory);
      if (user) {
        await savePlanToFirestore(user.uid, updatedPlan);
      } else {
        localStorage.setItem("last_minute_life_saver_plans", JSON.stringify(updatedHistory));
      }
    } catch (err: any) {
      const finalSteps = currentPlan.actionableSteps.map(s => 
        s.stepOrder === stepOrder ? { ...s, executing: false, agentResult: `Execution error: ${err.message}` } : s
      );
      setCurrentPlan({ ...currentPlan, actionableSteps: finalSteps });
    }
  };

  const handleToggleStepComplete = async (stepOrder: number) => {
    if (!currentPlan) return;

    const updatedSteps = currentPlan.actionableSteps.map(step => 
      step.stepOrder === stepOrder ? { ...step, completed: !step.completed } : step
    );

    const updatedPlan = { ...currentPlan, actionableSteps: updatedSteps };
    setCurrentPlan(updatedPlan);

    const updatedHistory = savedPlans.map(p => 
      p.taskName === currentPlan.taskName ? updatedPlan : p
    );
    setSavedPlans(updatedHistory);
    if (user) {
      await savePlanToFirestore(user.uid, updatedPlan);
    } else {
      localStorage.setItem("last_minute_life_saver_plans", JSON.stringify(updatedHistory));
    }
  };

  const applyTemplate = (template: QuickTemplate) => {
    setTaskInput(template.rawInput);
    setDueInfo(template.dueInfo);
    commandInputRef.current?.focus();
  };

  const handleDeletePlan = async (taskName: string) => {
    const updated = savedPlans.filter(p => p.taskName !== taskName);
    setSavedPlans(updated);
    if (user) {
      const planId = taskName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      await deletePlanFromFirestore(user.uid, planId);
    } else {
      localStorage.setItem("last_minute_life_saver_plans", JSON.stringify(updated));
    }
    if (currentPlan?.taskName === taskName) {
      setCurrentPlan(null);
    }
  };

  const handleSelectPlan = (plan: TaskPlan) => {
    setCurrentPlan(plan);
    setTaskInput("");
    setDueInfo("");
  };

  const handleStartNewPlan = () => {
    setCurrentPlan(null);
    setTaskInput("");
    setDueInfo("");
  };

  // Get first incomplete action step to display in Hero Core Focus Card
  const getHeroActiveStep = () => {
    if (!currentPlan) return null;
    return currentPlan.actionableSteps.find(s => !s.completed) || currentPlan.actionableSteps[currentPlan.actionableSteps.length - 1];
  };

  const getCompletionPercentage = () => {
    if (!currentPlan) return 0;
    const completed = currentPlan.actionableSteps.filter(s => s.completed).length;
    return Math.round((completed / currentPlan.actionableSteps.length) * 100);
  };

  // Generate a dynamic "Meet Cleo" style roasted roast comment or motivational line
  const getCleoSpeechText = () => {
    if (!currentPlan) {
      return "OH LOOK, ANOTHER LAST-MINUTE CRITICAL EMERGENCY! Look, you have deadlines crashing down and you've spent the morning doing absolutely nothing. Type your panic below or select a preset, and let's get you sorted before the total disaster hits.";
    }

    const percentage = getCompletionPercentage();
    if (percentage === 100) {
      return "WOW, YOU ACTUALLY SURVIVED! Everything is checked off, emails are drafted, calendar is blocked. Go close your laptop and touch some real grass, you legend.";
    }

    if (percentage > 50) {
      return `OKAY, WE ARE FINALLY COOKING! You cleared ${percentage}% of the timeline. But don't you dare get comfortable. Dave is watching and that clock isn't stopping!`;
    }

    if (percentage > 0) {
      return `INITIATED! You've started, but you're only ${percentage}% done. No distractions, no social media. Execute the next step immediately!`;
    }

    // 0% completion with a plan
    if (currentPlan.panicModeTrigger) {
      return `CRITICAL ALARM! I've calculated a total disaster window for "${currentPlan.taskName}". You've done absolutely nothing so far. Put the coffee on and click the "DO IT FOR ME" buttons below.`;
    }

    return `ALRIGHT, I built you a complete bulletproof defense strategy for "${currentPlan.taskName}". It's ${currentPlan.estimatedTotalMinutes} minutes of raw focus. No excuses. Let's start right now.`;
  };

  const activeStep = getHeroActiveStep();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFFEEF] flex flex-col items-center justify-center font-mono p-6">
        <div className="w-full max-w-sm bg-white neo-border p-6 neo-shadow text-center space-y-4">
          <span className="text-[11px] font-mono font-black uppercase text-black animate-pulse block">
            INITIALIZING SECURE CREDENTIALS ENCLAVE...
          </span>
          <div className="h-2 w-full bg-zinc-100 neo-border-sm overflow-hidden relative">
            <div className="h-full bg-black absolute inset-y-0 left-0 w-1/3 animate-[infinite-scroll_1.5s_linear_infinite]" style={{
              animation: "shimmer 1.5s infinite linear"
            }} />
          </div>
          <p className="text-[9px] font-mono text-zinc-500 font-bold uppercase">
            ESTABLISHING TLS CONNECTION • SECURITY SCHEMAS ARMED
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showLanding) {
      return (
        <LandingScreen 
          onGetStarted={() => setShowLanding(false)} 
          onSignInClick={() => setShowLanding(false)} 
        />
      );
    }

    return (
      <AuthScreen 
        onAuthSuccess={async (authUser, accessToken) => {
          setUser(authUser);
          setToken(accessToken);
          setAuthLoading(true);
          try {
            const dbPlans = await getPlansFromFirestore(authUser.uid);
            setSavedPlans(dbPlans);
            const dbScans = await getScansFromFirestore(authUser.uid);
            setScansHistory(dbScans);
          } catch (e) {
            console.error("Failed to load user data:", e);
          } finally {
            setAuthLoading(false);
          }
        }}
        onBackToLanding={() => setShowLanding(true)}
      />
    );
  }

  return (
    <div id="app-root" className="min-h-screen bg-[#F8F9FA] text-black font-sans flex flex-col pb-36 selection:bg-[#FF4A8D] selection:text-white">
      
      {/* Playful Top Header */}
      <header id="app-header" className="bg-white neo-border border-t-0 border-l-0 border-r-0 px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white neo-border p-1 neo-shadow rotate-[-2deg] transition-all hover:rotate-[0deg] overflow-hidden flex items-center justify-center">
              <img src={cleobotLogo} alt="Cleobot Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-display font-black text-3xl md:text-4.5xl tracking-tight uppercase leading-none text-black">
                CLEOBOT
              </h1>
              <p className="text-xs font-display font-black text-[#FF4A8D] mt-1 uppercase">
                THE LAST-MINUTE LIFE SAVER
              </p>
            </div>
          </div>

          {/* Online/Offline Status & User Profile/Auth block */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 bg-[#FFFEEF] neo-border p-2.5 neo-shadow font-mono text-xs">
              <span className={`w-3.5 h-3.5 rounded-full ${isOnline ? 'bg-[#10B981] animate-pulse' : 'bg-[#EF4444]'} border-2 border-black`} />
              <span className="text-black font-black uppercase text-[10px]">
                {isOnline ? "ONLINE" : "OFFLINE"}
              </span>
            </div>

            <div className="flex items-center gap-3 bg-white neo-border p-2 neo-shadow font-mono text-xs min-h-[46px]">
              {authLoading ? (
                <span className="text-[10px] font-black uppercase text-zinc-500 animate-pulse px-2">INITIALIZING SECURE HISTORY SYNC...</span>
              ) : user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#FFFEEF] neo-border-sm px-2.5 py-1">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || "User"} className="w-4 h-4 rounded-full border border-black" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-3.5 h-3.5 text-black" />
                    )}
                    <span className="text-black font-extrabold uppercase text-[10px] max-w-[200px] truncate">
                      HEY {user.displayName ? user.displayName : user.email?.split('@')[0]}!
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-[#EF4444] hover:bg-red-600 text-white p-1.5 neo-border-sm transition-all cursor-pointer"
                    title="Disconnect Google Sync"
                  >
                    <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 bg-[#FFBB00] hover:bg-amber-400 text-black font-black uppercase px-3 py-1.5 neo-border-sm neo-shadow-sm transition-all text-[10px] cursor-pointer"
                >
                  <GoogleLogoIcon className="w-3.5 h-3.5" />
                  <span>SYNC HISTORY DATABASE</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Greeting Banner for Authenticated User */}
      {user && (
        <div className="max-w-7xl w-full mx-auto px-4 pt-6 space-y-4">
          <div className="bg-[#FFFEEF] neo-border p-4 neo-shadow-sm flex items-center justify-between">
            <span className="text-xs font-mono font-black text-black">
              HEY {user.displayName ? user.displayName.toUpperCase() : user.email?.split('@')[0].toUpperCase()}! WELCOME BACK TO THE TACTICAL WORKSPACE.
            </span>
            <span className="text-[10px] font-mono font-bold bg-black text-white px-2 py-0.5 neo-border-sm uppercase">
              ACTIVE SESSION
            </span>
          </div>

          {/* Quick Shortcuts Panel */}
          <div className="bg-white neo-border p-4 neo-shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase text-zinc-500">QUICK SHORTCUTS:</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setActiveMainTab("planner");
                  handleStartNewPlan();
                  setTimeout(() => commandInputRef.current?.focus(), 100);
                }}
                className="bg-[#FF4A8D] hover:bg-rose-600 text-white px-3.5 py-2 text-[10px] font-display font-black border-2 border-black neo-shadow-sm transition-all cursor-pointer uppercase flex items-center gap-1.5 hover:-translate-x-[1px] hover:-translate-y-[1px]"
              >
                <Zap className="w-3.5 h-3.5 text-white" />
                <span>Create New Plan</span>
              </button>
              <button
                onClick={() => {
                  setActiveMainTab("guardian");
                  setSelectedMode("A");
                  setGuardianInput(GUARDIAN_PRESETS[0].input);
                  setTimeout(() => document.getElementById("main-tab-switcher")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                }}
                className="bg-[#FFBB00] hover:bg-amber-400 text-black px-3.5 py-2 text-[10px] font-display font-black border-2 border-black neo-shadow-sm transition-all cursor-pointer uppercase flex items-center gap-2 hover:-translate-x-[1px] hover:-translate-y-[1px]"
              >
                <div className="w-5.5 h-5.5 bg-white rounded-full neo-border-sm flex items-center justify-center p-0.5">
                  <GmailLogoIcon className="w-3.5 h-3.5" />
                </div>
                <span>Scan Email Commitments</span>
              </button>
              <button
                onClick={() => {
                  setActiveMainTab("guardian");
                  setSelectedMode("B");
                  setGuardianInput(GUARDIAN_PRESETS[1].input);
                  setTimeout(() => document.getElementById("main-tab-switcher")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                }}
                className="bg-[#10B981] hover:bg-emerald-600 text-black px-3.5 py-2 text-[10px] font-display font-black border-2 border-black neo-shadow-sm transition-all cursor-pointer uppercase flex items-center gap-2 hover:-translate-x-[1px] hover:-translate-y-[1px]"
              >
                <div className="w-5.5 h-5.5 bg-white rounded-full neo-border-sm flex items-center justify-center p-0.5">
                  <GoogleCalendarLogoIcon className="w-3.5 h-3.5" />
                </div>
                <span>Buffer Calendar Blocks</span>
              </button>
              <button
                onClick={() => {
                  setActiveMainTab("guardian");
                  setSelectedMode("C");
                  setGuardianInput(GUARDIAN_PRESETS[2].input);
                  setTimeout(() => document.getElementById("main-tab-switcher")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                }}
                className="bg-[#EF4444] hover:bg-red-600 text-white px-3.5 py-2 text-[10px] font-display font-black border-2 border-black neo-shadow-sm transition-all cursor-pointer uppercase flex items-center gap-1.5 hover:-translate-x-[1px] hover:-translate-y-[1px]"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-white" />
                <span>Simulate Call Siren</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <main id="app-workspace" className="max-w-7xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* Left hand side: Playful Sidebar (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          


          <HistorySidebar 
            plans={savedPlans} 
            selectedPlan={currentPlan}
            onSelectPlan={handleSelectPlan}
            onDeletePlan={handleDeletePlan}
          />
        </div>

        {/* Right hand side: Conversational space and Task list (8 columns) */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. THE MEET CLEO CONVERSATIONAL WORKSPACE */}
          <section id="cleo-chat-workspace" className="bg-[#FFFEEF] neo-border p-6 neo-shadow-lg relative overflow-hidden">
            
            {/* Playful Stickers in background */}
            <div className="absolute right-4 top-4 rotate-[12deg] bg-[#FF4A8D] text-black text-[10px] font-mono font-black px-2.5 py-1 neo-border-sm uppercase select-none pointer-events-none">
              CLEO CONCIERGE
            </div>

            <div className="flex items-start gap-4">
              
              {/* Illustrative Cleo Avatar sticker */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-14 h-14 bg-white rounded-full neo-border flex items-center justify-center relative neo-shadow overflow-hidden p-1">
                  <img src={cleobotLogo} alt="Cleobot Logo" className="w-full h-full object-contain" />
                  <span className="absolute -bottom-1 -right-1 bg-[#10B981] w-4.5 h-4.5 rounded-full neo-border-sm flex items-center justify-center text-[8px] text-black font-bold">
                    ✓
                  </span>
                </div>
                <span className="text-[9px] font-mono font-black mt-2 bg-black text-white px-1.5 py-0.5 neo-border-sm uppercase tracking-tighter">
                  CLEOBOT
                </span>
              </div>

              {/* Cleo Prominent Speech Bubble */}
              <div className="flex-1 min-w-0">
                <div className="relative bg-white p-5 neo-border neo-shadow text-black rounded-none">
                  
                  {/* Arrow bubble decorator */}
                  <div className="absolute left-[-11px] top-4 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-black" />
                  <div className="absolute left-[-8px] top-4 w-0 h-0 border-y-[7px] border-y-transparent border-r-[7px] border-r-white" />

                  <h3 className="text-xs font-mono font-black text-[#FF4A8D] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#FF4A8D]" />
                    AI MENTOR & PROCRASTINATION DISRUPTOR
                  </h3>
                  
                  <p className="font-display font-black text-sm md:text-base text-black tracking-tight leading-relaxed">
                    "{getCleoSpeechText()}"
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* 2. TAB SWITCHER */}
          <div id="main-tab-switcher" className="flex gap-4 border-b-2 border-black pb-4 mb-4">
            <button
              onClick={() => setActiveMainTab("planner")}
              className={`px-5 py-2.5 font-display font-black text-xs uppercase tracking-wider neo-border transition-all cursor-pointer flex items-center gap-2 ${
                activeMainTab === "planner"
                  ? "bg-[#FF4A8D] text-black neo-shadow-sm translate-x-[-1px] translate-y-[-1px]"
                  : "bg-white text-zinc-600 hover:text-black hover:bg-[#FFFEEF]"
              }`}
            >
              <Zap className="w-4 h-4 text-black stroke-[2.5]" />
              <span>Crisis Game Planner</span>
            </button>
            <button
              onClick={() => setActiveMainTab("guardian")}
              className={`px-5 py-2.5 font-display font-black text-xs uppercase tracking-wider neo-border transition-all cursor-pointer flex items-center gap-2 ${
                activeMainTab === "guardian"
                  ? "bg-[#7C3AED] text-white neo-shadow-sm translate-x-[-1px] translate-y-[-1px]"
                  : "bg-white text-zinc-600 hover:text-black hover:bg-[#FFFEEF]"
              }`}
            >
              <Shield className="w-4 h-4 stroke-[2.5]" />
              <span>Proactive Guardian Engine</span>
            </button>
          </div>

          {/* 3. MAIN ACTIVE DESK CONTENT */}
          <AnimatePresence mode="wait">
            {activeMainTab === "guardian" ? (
              /* Autonomous Guardian Engine Screen */
              <motion.div
                key="guardian-engine-screen"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white neo-border p-6.5 neo-shadow space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-6 h-6 text-[#7C3AED] stroke-[2.5]" />
                    <h3 className="font-display font-black text-sm uppercase tracking-wide">
                      AUTONOMOUS GUARDIAN ENGINE
                    </h3>
                  </div>

                  <p className="text-zinc-600 text-xs md:text-sm leading-relaxed">
                    The Guardian Engine operates proactively on background data streams (like unread emails, calendar loads, or critical parameters) to discover hidden commitments, plan defensive focus intervals, or configure emergency communications. Select your active mode below to initiate a diagnostic scan.
                  </p>
                </div>

                {/* Mode Selector Bento Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMode("A");
                      setGuardianInput(GUARDIAN_PRESETS[0].input);
                    }}
                    className={`text-left border-2 border-black p-4 transition-all neo-shadow cursor-pointer ${
                      selectedMode === "A"
                        ? "bg-[#FFFEEF] ring-2 ring-black -translate-x-[2px] -translate-y-[2px] shadow-[4px_4px_0px_0px_#7C3AED]"
                        : "bg-[#F8F9FA] hover:bg-[#FFFEEF]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-display font-black text-xs text-[#7C3AED] uppercase">
                        Mode A: Harvest
                      </h4>
                      <span className="text-[8px] bg-[#7C3AED] text-white px-1.5 py-0.5 font-mono font-black">EMAILS</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 leading-normal">
                      Scan unread inbox notifications for hidden commitments, subscription dues, or billing failures.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMode("B");
                      setGuardianInput(GUARDIAN_PRESETS[1].input);
                    }}
                    className={`text-left border-2 border-black p-4 transition-all neo-shadow cursor-pointer ${
                      selectedMode === "B"
                        ? "bg-[#FFFEEF] ring-2 ring-black -translate-x-[2px] -translate-y-[2px] shadow-[4px_4px_0px_0px_#10B981]"
                        : "bg-[#F8F9FA] hover:bg-[#FFFEEF]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-display font-black text-xs text-[#10B981] uppercase">
                        Mode B: Block & Buffer
                      </h4>
                      <span className="text-[8px] bg-[#10B981] text-black px-1.5 py-0.5 font-mono font-black">CALENDAR</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 leading-normal">
                      Examine upcoming calendar items and automatically map focus blocks before newly discovered deadlines.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMode("C");
                      setGuardianInput(GUARDIAN_PRESETS[2].input);
                    }}
                    className={`text-left border-2 border-black p-4 transition-all neo-shadow cursor-pointer ${
                      selectedMode === "C"
                        ? "bg-[#FFFEEF] ring-2 ring-black -translate-x-[2px] -translate-y-[2px] shadow-[4px_4px_0px_0px_#EF4444]"
                        : "bg-[#F8F9FA] hover:bg-[#FFFEEF]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-display font-black text-xs text-[#EF4444] uppercase">
                        Mode C: Escalate
                      </h4>
                      <span className="text-[8px] bg-[#EF4444] text-white px-1.5 py-0.5 font-mono font-black">PANIC</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 leading-normal">
                      Designate automatic emergency notifications and automated intrusion script calls when failure is imminent.
                    </p>
                  </button>
                </div>

                {/* Input Feed Panel */}
                <div className="border-2 border-black p-5 bg-[#FFFEEF] neo-shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black pb-2 gap-2">
                    <span className="text-xs font-mono font-black text-black flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#7C3AED] stroke-[2.5] animate-pulse" />
                      {selectedMode === "A" && "MODE A: UNREAD GMAIL FEEDS"}
                      {selectedMode === "B" && "MODE B: DEFENSIVE CALENDAR BUFFER SCHEDULER"}
                      {selectedMode === "C" && "MODE C: CRISIS CONTINGENCY & ALARMS"}
                    </span>

                    {/* Integrated Control Panel */}
                    <div className="flex flex-wrap gap-2.5">
                      {selectedMode === "A" && (
                        <button
                          type="button"
                          onClick={async () => {
                            await handleLoadGmail(true);
                          }}
                          disabled={gmailLoading}
                          className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white border border-black text-[10px] font-mono font-black px-3 py-1.5 uppercase cursor-pointer disabled:opacity-50 neo-shadow-sm transition-all hover:-translate-x-[1px] hover:-translate-y-[1px]"
                        >
                          <div className="w-5.5 h-5.5 bg-white rounded-full neo-border-sm flex items-center justify-center p-0.5 flex-shrink-0">
                            <GmailLogoIcon className="w-3 h-3" />
                          </div>
                          <span>{gmailLoading ? "PULLING REAL INBOX..." : "PULL & ANALYZE MY LIVE GMAIL"}</span>
                        </button>
                      )}

                      {selectedMode === "B" && (
                        <button
                          type="button"
                          onClick={async () => {
                            await handleLoadCalendar(true);
                          }}
                          disabled={calendarLoading}
                          className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-black border border-black text-[10px] font-mono font-black px-3 py-1.5 uppercase cursor-pointer disabled:opacity-50 neo-shadow-sm transition-all hover:-translate-x-[1px] hover:-translate-y-[1px]"
                        >
                          <div className="w-5.5 h-5.5 bg-white rounded-full neo-border-sm flex items-center justify-center p-0.5 flex-shrink-0">
                            <GoogleCalendarLogoIcon className="w-3 h-3" />
                          </div>
                          <span>{calendarLoading ? "PULLING REAL SCHEDULE..." : "PULL & ANALYZE MY LIVE CALENDAR"}</span>
                        </button>
                      )}

                      {selectedMode === "C" && (
                        <>
                          {currentPlan ? (
                            <button
                              type="button"
                              onClick={() => {
                                const activeIncompletes = currentPlan.actionableSteps
                                  .filter(s => !s.completed)
                                  .map(s => `- Step ${s.stepOrder}: ${s.description} (Needs agent: ${s.requiresAgentExecution ? 'Yes' : 'No'})`)
                                  .join("\n");
                                const customPanicText = `CRITICAL STATUS CHECK:
Target Deadline: ${currentPlan.taskName} (Target Duration: ${currentPlan.estimatedTotalMinutes} mins).
Current Simulated Time: ${currentTime.toLocaleTimeString()} (Imminent Deadline Alert!).
Unfinished Checkpoints:
${activeIncompletes || "- All steps marked complete -"}

Evaluate system state and generate a protective escalation backup call or delay-notice template immediately.`;
                                setGuardianInput(customPanicText);
                              }}
                              className="bg-white hover:bg-zinc-50 border border-black text-[10px] font-mono font-black px-3 py-1.5 uppercase cursor-pointer"
                            >
                              LOAD CURRENT PLAN PANIC STATE
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setGuardianInput(GUARDIAN_PRESETS[2].input)}
                            className="bg-white hover:bg-[#FFFEEF] border border-black text-[10px] font-mono font-bold px-3 py-1.5 uppercase cursor-pointer"
                          >
                            LOAD SAMPLE CRISIS STATUS
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {token ? (
                    <div className="bg-emerald-50 border border-emerald-500 p-2.5 neo-border-sm text-[10px] font-mono font-bold text-emerald-800 uppercase flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#10B981] flex-shrink-0 animate-pulse" />
                      <span>LIVE GOOGLE WORKSPACE OAUTH SYNC ACTIVE • GMAIL AND CALENDAR READY FOR DIRECT AGENT ANALYSIS</span>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-500 p-2.5 neo-border-sm text-[10px] font-mono font-bold text-amber-800 uppercase flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#FFBB00] flex-shrink-0 animate-bounce" />
                      <span>GOOGLE SYNC NOT FULLY BOUND • PRESS PULL & ANALYZE TO SECURELY SYNC AND DISCOVER ACTIVE FEEDS</span>
                    </div>
                  )}

                  <textarea
                    rows={8}
                    value={guardianInput}
                    onChange={(e) => setGuardianInput(e.target.value)}
                    placeholder={
                      selectedMode === "A"
                        ? "Paste unread email messages or click Pull Unread Emails to scan commitments..."
                        : selectedMode === "B"
                        ? "Paste calendar schedules and deadline items to compute defense focus times..."
                        : "Paste impending disaster parameters or load the active plan status to construct buffer templates..."
                    }
                    className="w-full bg-white border-2 border-black p-3 font-mono text-xs text-black focus:outline-none focus:ring-0 focus:border-[#7C3AED]"
                  />

                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-t border-black/10 pt-3">
                    <div className="bg-[#FFFEEF] border-2 border-black p-2.5 font-mono text-[9px] text-black uppercase font-bold flex items-center gap-1.5 flex-1 neo-shadow-sm">
                      <Sparkles className="w-4 h-4 text-[#FFBB00] flex-shrink-0 animate-pulse" />
                      <span>
                        {selectedMode === "A" && "TIP: Mode A scans live inbox snippets to harvest financial and contract deadlines."}
                        {selectedMode === "B" && "TIP: Mode B computes calendar intervals and reserves focus buffers."}
                        {selectedMode === "C" && "TIP: Mode C builds excuses and delay scripts when failure is imminent."}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={guardianLoading || !guardianInput.trim()}
                      onClick={() => handleGuardianAnalyze()}
                      className="flex items-center gap-1.5 px-5 py-3 text-xs font-black text-white bg-[#7C3AED] hover:bg-[#6D28D9] neo-border-sm neo-shadow disabled:opacity-40 cursor-pointer uppercase transition-all active:translate-x-[2px] active:translate-y-[2px]"
                    >
                      {guardianLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>ANALYZING MODE {selectedMode}...</span>
                        </>
                      ) : (
                        <>
                          <Activity className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>ACTIVATE MODE {selectedMode} SCAN</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Results Renderer */}
                {guardianResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 pt-4 border-t-2 border-black"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-black text-lg text-black uppercase">
                        GUARDIAN SHIELD SCAN RESPONSE
                      </h4>
                      <span className="text-[10px] bg-[#10B981] text-black font-mono font-black px-2 py-0.5 neo-border-sm uppercase">
                        PROACTIVE THREAT SHIELDED
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      
                      {/* Left Block: Operational Mode, Panic Status, & Escalate Phone script (5 Columns) */}
                      <div className="md:col-span-5 space-y-4">
                        
                        {/* Mode Card */}
                        <div className="border-2 border-black p-4 bg-[#FFFEEF] neo-shadow-sm">
                          <span className="text-[10px] text-zinc-500 font-mono font-black uppercase tracking-wider block">
                            CORE MODE DETECTED
                          </span>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-sm px-3 py-1 font-display font-black border-2 border-black uppercase tracking-wider ${
                              guardianResult.modeDetected === "HARVEST"
                                ? "bg-[#7C3AED] text-white"
                                : guardianResult.modeDetected === "BLOCK_BUFFER"
                                ? "bg-[#10B981] text-black"
                                : "bg-[#EF4444] text-white animate-pulse"
                            }`}>
                              MODE {guardianResult.modeDetected === "HARVEST" ? "A" : guardianResult.modeDetected === "BLOCK_BUFFER" ? "B" : "C"}: {guardianResult.modeDetected}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-600 font-bold uppercase mt-2.5 leading-relaxed">
                            {guardianResult.modeDetected === "HARVEST"
                              ? "Scanned inbox snippets to harvest missed financial and contract deadlines."
                              : guardianResult.modeDetected === "BLOCK_BUFFER"
                              ? "Computed empty calendar intervals and structured focused research buffers."
                              : "Detected imminent project submission failure. Escalating delay template."}
                          </p>
                        </div>

                        {/* Panic Mode Warning Block */}
                        {guardianResult.panicModeTrigger && (
                          <div className="border-2 border-black p-4 bg-[#EF4444] text-white neo-shadow-sm space-y-3">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-white animate-bounce" />
                              <span className="font-display font-black text-xs uppercase tracking-wider">
                                PANIC ALARM ACTIVATED
                              </span>
                            </div>
                            <p className="text-[10px] font-mono leading-relaxed">
                              Upcoming critical deadline is closer than 60 minutes with incomplete checkpoints. Escalating backup communications.
                            </p>
                          </div>
                        )}

                        {/* Escalation Call script card */}
                        {guardianResult.escalationTwiMLScript && (
                          <div className="border-2 border-black p-4 bg-black text-white neo-shadow-sm space-y-3">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                              <span className="text-[9px] font-mono font-bold text-[#FF4A8D] uppercase">
                                INTRUSION CALL SCRIPT
                              </span>
                              <span className="text-[8px] bg-emerald-500 text-black font-mono font-black px-1 neo-border-sm">
                                TWIML READY
                              </span>
                            </div>
                            <div className="bg-zinc-900 p-3 neo-border-sm border-zinc-700 max-h-40 overflow-y-auto">
                              <p className="text-[11px] font-mono text-zinc-300 italic whitespace-pre-wrap leading-relaxed">
                                "{guardianResult.escalationTwiMLScript}"
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSimulateCall(guardianResult.escalationTwiMLScript)}
                              className={`w-full flex items-center justify-center gap-2 text-xs font-black uppercase py-2.5 transition-all neo-border-sm cursor-pointer ${
                                speaking
                                  ? "bg-[#EF4444] text-white animate-pulse"
                                  : "bg-[#FF4A8D] text-black hover:bg-pink-400"
                              }`}
                            >
                              {speaking ? (
                                <>
                                  <VolumeX className="w-4 h-4 text-white stroke-[2.5]" />
                                  <span>STOP SIMULATION</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-4 h-4 text-black stroke-[2.5]" />
                                  <span>SIMULATE INTRUSION CALL</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                      </div>

                      {/* Right Block: Discovered Deadlines & Focus Blocks lists (7 Columns) */}
                      <div className="md:col-span-7 space-y-4">
                        
                        {/* Discovered Deadlines */}
                        <div className="border-2 border-black p-5 bg-white neo-shadow-sm space-y-3">
                          <h5 className="font-display font-black text-xs uppercase text-black border-b-2 border-black pb-1.5 flex items-center gap-2">
                            <FileText className="w-4 h-4 stroke-[2.5]" />
                            DISCOVERED COMMITMENTS & DEADLINES ({guardianResult.discoveredDeadlines.length})
                          </h5>
                          <div className="space-y-3">
                            {guardianResult.discoveredDeadlines.map((d: any, idx: number) => (
                              <div key={idx} className="p-3 bg-[#F8F9FA] border-2 border-black">
                                <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                                  <span className="font-display font-extrabold text-xs text-black">
                                    {d.title}
                                  </span>
                                  <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 border-2 border-black uppercase ${
                                    d.urgencyScore === "Critical"
                                      ? "bg-[#EF4444] text-white"
                                      : d.urgencyScore === "High"
                                      ? "bg-[#FFBB00] text-black"
                                      : "bg-[#10B981] text-black"
                                  }`}>
                                    {d.urgencyScore}
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-600 leading-normal bg-white p-2 border border-black/10 font-mono mb-2">
                                  "{d.sourceContext}"
                                </p>
                                <div className="text-[9px] font-mono font-black text-zinc-500 uppercase">
                                  DUE WINDOW: {d.targetDeadlineTime}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Proposed Focus Blocks */}
                        <div className="border-2 border-black p-5 bg-white neo-shadow-sm space-y-3">
                          <h5 className="font-display font-black text-xs uppercase text-black border-b-2 border-black pb-1.5 flex items-center gap-2">
                            <Clock className="w-4 h-4 stroke-[2.5]" />
                            PROPOSED BUFFER SCHEDULE & FOCUS SLOTS
                          </h5>
                          <div className="space-y-3">
                            {guardianResult.proposedFocusBlocks.map((b: any, idx: number) => (
                              <div key={idx} className="p-3 bg-[#FFFEEF] border-2 border-black">
                                <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2">
                                  <span className="font-display font-extrabold text-xs text-black">
                                    {b.summary}
                                  </span>
                                  <span className="text-[9px] font-mono font-black bg-black text-white px-2 py-0.5 border border-black">
                                    {b.recommendedDurationMinutes} MINS
                                  </span>
                                </div>
                                <p className="text-[10px] font-mono text-zinc-600 bg-white p-2 border border-black/10 leading-normal uppercase">
                                  {b.urgencyAlignment}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                    </div>
                  </motion.div>
                )}

                {/* Past Scans Audit Trail History list */}
                {user && scansHistory.length > 0 && (
                  <div className="pt-6 border-t-2 border-black space-y-4">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5 text-black stroke-[2.5]" />
                      <h4 className="font-display font-extrabold text-xs uppercase text-black">
                        SECURE GUARDIAN SCAN RECORDS HISTORICAL LOGGER ({scansHistory.length})
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-72 overflow-y-auto pr-2">
                      {scansHistory.map((scan) => (
                        <div 
                          key={scan.id} 
                          onClick={() => {
                            setGuardianInput(scan.rawInput || "");
                            setGuardianResult(scan.result);
                          }}
                          className="bg-[#F8F9FA] hover:bg-[#FFFEEF] border border-black p-3.5 transition-all text-left cursor-pointer neo-shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] group"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-1.5 mb-2">
                            <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 border border-black uppercase ${
                              scan.result.modeDetected === "HARVEST"
                                ? "bg-[#7C3AED] text-white"
                                : scan.result.modeDetected === "BLOCK_BUFFER"
                                ? "bg-[#10B981] text-black"
                                : "bg-[#EF4444] text-white"
                            }`}>
                              {scan.result.modeDetected}
                            </span>
                            <span className="text-[8px] font-mono text-zinc-500 font-bold">
                              {scan.scannedAt ? new Date(scan.scannedAt).toLocaleString() : "Recently"}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-zinc-600 font-bold uppercase truncate group-hover:text-black">
                            INPUT FEED: {scan.rawInput}
                          </p>
                          <p className="text-[10px] text-[#7C3AED] font-mono uppercase mt-1">
                            FOUND: {scan.result.discoveredDeadlines?.length || 0} DEADLINES | {scan.result.proposedFocusBlocks?.length || 0} SLOTS
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : !currentPlan ? (
              /* Preset Crisis Showcase (No Active Plan Selected) */
              <motion.div
                key="welcome-showcase"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white neo-border p-6.5 neo-shadow space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Compass className="w-6 h-6 text-black stroke-[2.5]" />
                    <h3 className="font-display font-black text-sm uppercase tracking-wide">
                      SELECT YOUR CRISIS TO START DE-STRESSING:
                    </h3>
                  </div>

                  <p className="text-zinc-600 text-xs md:text-sm leading-relaxed">
                    No plan built yet? Don't break a sweat. Select one of our curated high-stress emergency presets below to experience how the system immediately generates micro-plans and activates the automated agent workflows.
                  </p>
                </div>

                {/* Central Inline Task Creator */}
                <form onSubmit={handleAnalyzeTask} className="bg-[#FFFEEF] neo-border p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-black/10 pb-2">
                    <Zap className="w-4 h-4 text-[#FF4A8D]" />
                    <span className="text-[10px] font-mono font-black text-black uppercase">
                      FAST TASK GAME PLANNER
                    </span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase block">
                      ENTER YOUR PANIC DELIVERABLE:
                    </label>
                    <input
                      type="text"
                      value={taskInput}
                      onChange={(e) => setTaskInput(e.target.value)}
                      placeholder="e.g., AWS database declined cards, lease renewals expiring tomorrow at 5pm..."
                      className="w-full bg-white border-2 border-black p-2.5 font-mono text-xs focus:outline-none focus:ring-0 focus:border-[#FF4A8D] text-black uppercase placeholder-zinc-400 font-extrabold"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-white neo-border-sm px-2.5 py-1.5">
                      <span className="text-[9px] font-mono font-black text-zinc-500 uppercase">DUE:</span>
                      <input
                        type="text"
                        value={dueInfo}
                        onChange={(e) => setDueInfo(e.target.value)}
                        placeholder="ASAP"
                        className="bg-transparent border-none text-xs text-black font-extrabold focus:outline-none focus:ring-0 uppercase w-20 placeholder-zinc-400"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={loading || !taskInput.trim()}
                      className="bg-black hover:bg-zinc-900 text-white font-mono font-black text-xs uppercase px-6 py-2.5 neo-border-sm neo-shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <span>DE-STRESS ME</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.title}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="text-left bg-[#F8F9FA] hover:bg-[#FFFEEF] neo-border-sm p-4 transition-all neo-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000000] group"
                    >
                      <div className="flex justify-between items-center mb-2 flex-wrap gap-1">
                        <span className="font-display font-extrabold text-xs text-black uppercase tracking-tight group-hover:text-[#FF4A8D]">
                          {tpl.title}
                        </span>
                        <span className="text-[9px] text-white bg-black font-mono font-black px-1.5 py-0.5 neo-border-sm uppercase">
                          {tpl.dueInfo}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 font-medium line-clamp-3 leading-relaxed">
                        {tpl.description}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="border-t-2 border-black pt-4 flex flex-col sm:flex-row items-center gap-3 text-black text-xs font-mono justify-between">
                  <span className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4 stroke-[2.5]" />
                    Press <kbd className="bg-black text-white px-2 py-0.5 neo-border-sm font-extrabold font-mono">⌘ K</kbd> anywhere to focus the input bar
                  </span>
                  <span className="font-black bg-[#10B981] px-2 py-0.5 neo-border-sm uppercase text-[10px]">
                    SYSTEM STATUS: READY TO ROAST
                  </span>
                </div>
              </motion.div>
            ) : (
              /* Active Crisis Game Plan Screen */
              <motion.div
                key="active-plan-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                
                {/* 1. THE HIGHEST PRIORITY HEADER FOCUS CARD */}
                <div className="bg-white neo-border p-6 neo-shadow-lg relative overflow-hidden">
                  
                  {/* Decorative corner stripe */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4A8D] translate-x-12 -translate-y-12 rotate-[45deg] pointer-events-none border-b-4 border-black" />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-3 flex-1">
                      
                      <div className="flex justify-between items-center flex-wrap gap-2 mr-6">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-black uppercase bg-[#EF4444] text-white px-2.5 py-0.5 neo-border-sm">
                            {currentPlan.priority} CRISIS WINDOW
                          </span>
                          <span className="font-mono text-[10px] text-black font-black bg-[#FFFEEF] px-2.5 py-0.5 neo-border-sm uppercase">
                            {currentPlan.estimatedTotalMinutes} MINUTE BUDGET
                          </span>
                        </div>
                        <button
                          onClick={handleStartNewPlan}
                          className="bg-[#FFBB00] hover:bg-amber-400 text-black text-[9px] font-mono font-black px-2.5 py-1 neo-border-sm neo-shadow-sm transition-all uppercase cursor-pointer flex items-center gap-1"
                          title="CREATE A NEW PLAN"
                        >
                          <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                          <span>NEW PLAN</span>
                        </button>
                      </div>

                      <h3 className="text-xs font-mono font-black text-zinc-500 uppercase tracking-widest block">
                        ACTIVE PANIC SCENARIO:
                      </h3>
                      <h2 className="font-display font-black text-xl md:text-2xl text-black leading-tight uppercase">
                        {currentPlan.taskName}
                      </h2>

                      {activeStep && (
                        <div className="bg-[#FFFEEF] p-3.5 neo-border-sm mt-1">
                          <p className="text-[9px] font-mono font-black text-[#7C3AED] uppercase tracking-wider mb-1">
                            ACTIVE MICRO-TASK IN FOCUS:
                          </p>
                          <p className="text-xs md:text-sm text-black font-extrabold flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#FF4A8D] animate-ping flex-shrink-0" />
                            {activeStep.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Massive Bold Time Badge countdown center */}
                    <div className="flex flex-col items-center justify-center bg-white neo-border p-5 text-center min-w-[180px] neo-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
                      <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest block mb-1">
                        REMAINING CHRONO:
                      </span>
                      <div className="font-display font-black text-2.5xl text-black tracking-tighter uppercase">
                        {Math.floor(currentPlan.estimatedTotalMinutes / 60)}h {currentPlan.estimatedTotalMinutes % 60}m
                      </div>
                      <span className="text-[9px] bg-[#FF4A8D] text-black font-mono font-extrabold px-1.5 py-0.5 neo-border-sm mt-2 uppercase tracking-tighter animate-pulse">
                        CLOCK RUNNING
                      </span>
                    </div>

                  </div>
                </div>

                {/* Progress & Escalation Tactics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  
                  {/* Completion Bento Badge (4 Cols) */}
                  <div className="bg-white p-5 neo-border neo-shadow md:col-span-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono font-black uppercase tracking-wider block">
                        DEFENSE PROGRESS
                      </span>
                      <div className="mt-3 flex items-end justify-between">
                        <span className="font-display font-black text-3.5xl text-[#10B981]">
                          {getCompletionPercentage()}%
                        </span>
                        <span className="text-[10px] text-black font-mono font-black uppercase">
                          {currentPlan.actionableSteps.filter(s => s.completed).length}/{currentPlan.actionableSteps.length} CLEARED
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 w-full bg-black neo-border-sm h-4 overflow-hidden">
                      <div
                        className="bg-[#10B981] h-full transition-all duration-500 border-r-2 border-black"
                        style={{ width: `${getCompletionPercentage()}%` }}
                      />
                    </div>
                  </div>

                  {/* Escalation Sequence Box (7 Cols) */}
                  <div className="bg-white p-5 neo-border neo-shadow md:col-span-7 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-[#EF4444] font-mono font-black uppercase tracking-wider block flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 stroke-[2.5]" />
                        GHOSTING DEFENSE ALGORITHM
                      </span>
                      <p className="text-xs md:text-sm text-black font-extrabold font-mono mt-3 leading-relaxed italic uppercase">
                        "{currentPlan.escalationStrategy}"
                      </p>
                    </div>
                    <div className="mt-4 flex gap-1.5 flex-wrap">
                      <span className="text-[9px] text-white font-mono bg-black font-black px-2 py-0.5 neo-border-sm uppercase">
                        ESCALATION STANDBY
                      </span>
                      <span className="text-[9px] text-black font-mono bg-[#FFBB00] font-black px-2 py-0.5 neo-border-sm uppercase">
                        MOTIVATION ENGAGED
                      </span>
                    </div>
                  </div>

                </div>

                {/* Panic Mode Alarm Red Bar */}
                {currentPlan.panicModeTrigger && (
                  <div className="bg-[#EF4444] text-white neo-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 text-black neo-border-sm animate-bounce">
                        <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <h4 className="font-display font-black text-sm uppercase tracking-wide">
                          CRITICAL RISK EVENT ACTIVE
                        </h4>
                        <p className="text-xs font-mono font-bold mt-0.5 leading-relaxed max-w-xl">
                          IMMEDIATE DEADLINE INBOUND. ALL SUB-TASKS DEEMED CRITICAL. NO ESCAPE SLACK DETECTED.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleStartNewPlan}
                      className="text-xs font-black text-black bg-white hover:bg-[#FFFEEF] px-3.5 py-2 neo-border-sm neo-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all uppercase"
                    >
                      RESET PLANNER
                    </button>
                  </div>
                )}

                {/* 2. ACTIONS AND TIMELINE STEP LIST */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <h3 className="font-display font-black text-xl text-black uppercase">
                      CRISIS DEFENSE PROTOCOLS
                    </h3>
                    <span className="text-[10px] text-zinc-500 font-mono font-black uppercase tracking-wider">
                      CHRONOLOGICAL CONVERGENCE
                    </span>
                  </div>

                  <div className="space-y-4">
                    {currentPlan.actionableSteps.map((step) => (
                      <StepCard
                        key={step.stepOrder}
                        step={step}
                        taskName={currentPlan.taskName}
                        onToggleComplete={handleToggleStepComplete}
                        onExecuteAgent={handleExecuteAgentStep}
                        onUpdateAgentResult={(stepOrder, result) => {
                          const updated = currentPlan.actionableSteps.map(s => 
                            s.stepOrder === stepOrder ? { ...s, agentResult: result } : s
                          );
                          setCurrentPlan({ ...currentPlan, actionableSteps: updated });
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Reset button at bottom of active timeline */}
                <div className="text-center pt-4">
                  <button
                    onClick={handleStartNewPlan}
                    className="inline-flex items-center gap-2 text-xs font-black text-black bg-white hover:bg-[#FFFEEF] px-4 py-2.5 neo-border neo-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all uppercase"
                  >
                    <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                    ENTER DIFFERENT CRISIS TASK
                  </button>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* 3. THE FLOATING RETRO-POP COMMAND BAR */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
        <form 
          onSubmit={handleAnalyzeTask}
          className="bg-[#FFFEEF] neo-border shadow-lg p-3 md:p-4.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative transition-all focus-within:shadow-[6px_6px_0px_0px_#FF4A8D]"
        >
          {/* Conversational Prompt Symbol */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="bg-[#FF4A8D] p-1.5 neo-border-sm text-black hidden sm:block rotate-[-5deg]">
              <Zap className="w-5 h-5 stroke-[2.5]" />
            </div>
            
            <input
              ref={commandInputRef}
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Type something you're panicking about..."
              className="flex-1 bg-transparent border-none text-black placeholder:text-zinc-500 font-extrabold focus:outline-none focus:ring-0 text-sm md:text-base uppercase"
              disabled={loading}
            />
          </div>

          {/* Speed settings panel and Submit */}
          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between border-t sm:border-t-0 border-black/10 pt-2 sm:pt-0">
            
            <div className="flex items-center gap-1.5 bg-white neo-border-sm px-2.5 py-1">
              <span className="text-[10px] font-mono font-black uppercase text-zinc-500">DUE:</span>
              <input
                type="text"
                value={dueInfo}
                onChange={(e) => setDueInfo(e.target.value)}
                placeholder="ASAP"
                className="w-20 bg-transparent border-none text-xs text-black font-extrabold focus:outline-none focus:ring-0 uppercase placeholder:text-zinc-400"
                disabled={loading}
                title="When is this critical task due?"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !taskInput.trim()}
              className="flex items-center justify-center gap-1 px-4.5 py-2 text-xs font-black text-black bg-[#FF4A8D] hover:bg-pink-400 neo-border-sm neo-shadow disabled:opacity-40 cursor-pointer uppercase transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#000000]"
              title="SYNT CRISIS PLAN NOW"
            >
              <span>DE-STRESS ME</span>
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Quick status instructions widget */}
          <div className="absolute -top-7 right-4 bg-black text-white text-[9px] px-2.5 py-0.5 neo-border-sm font-mono font-extrabold tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
            <span>CONSOLE ONLINE</span>
            <span>•</span>
            <span>PRESS ⌘K</span>
          </div>
        </form>
      </div>

      {/* Neo-brutalist Roaster Sync Loader Screen */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#F8F9FA]/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center font-sans"
          >
            <div className="space-y-6 max-w-md bg-[#FFFEEF] p-8 neo-border neo-shadow-lg">
              <div className="relative inline-block rotate-[-5deg]">
                <div className="bg-[#FFBB00] neo-border p-5 rounded-full neo-shadow-lg">
                  <Sparkles className="w-12 h-12 text-black fill-current animate-spin" />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-display font-black text-2xl uppercase text-black">
                  CONSTRUCTING DEFENSE SCHEME
                </h3>
                <p className="text-xs text-zinc-600 font-mono font-black uppercase tracking-wider animate-pulse border-y-2 border-black py-2 bg-white">
                  {loadingPhrase}
                </p>
              </div>

              {/* Cleo block loader meter */}
              <div className="w-48 bg-black neo-border h-4 overflow-hidden mx-auto">
                <div className="bg-[#FF4A8D] h-full w-2/3 border-r-2 border-black animate-pulse" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Red Brutalist Error Toast */}
      <AnimatePresence>
        {error && (
          <div className="fixed top-6 right-6 z-50 max-w-md bg-white neo-border p-4.5 neo-shadow flex items-start gap-3">
            <div className="p-1.5 bg-[#EF4444] neo-border-sm text-white">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-mono font-black text-black uppercase">
                CRITICAL SYSTEM GLITCH
              </h4>
              <p className="text-xs text-zinc-700 mt-1 leading-relaxed font-bold uppercase">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-3 text-[10px] font-black text-[#EF4444] hover:text-red-700 font-mono uppercase tracking-wider block"
              >
                [ DISMISS ]
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      <footer className="mt-auto py-8 border-t-2 border-black bg-white text-center text-xs font-mono uppercase font-black">
        THE LAST-MINUTE LIFE SAVER &bull; BUILT BY WAYLEN BARRETO
      </footer>
    </div>
  );
}
