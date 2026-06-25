import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Mail, 
  Calendar as CalendarIcon, 
  ShieldAlert, 
  ArrowRight, 
  Lock, 
  Activity, 
  Terminal, 
  Coffee,
  MessageSquare,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LandingScreenProps {
  onGetStarted: () => void;
  onSignInClick: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ 
  onGetStarted, 
  onSignInClick 
}) => {
  const [cleoMood, setCleoMood] = useState<"sarcastic" | "mitigate" | "peptalk">("sarcastic");
  const [speaking, setSpeaking] = useState(false);
  const [tickerOffset, setTickerOffset] = useState(0);
  const [simulationStep, setSimulationStep] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Auto-advance the dashboard simulator step
  useEffect(() => {
    const timer = setInterval(() => {
      setSimulationStep(prev => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleSirenSound = () => {
    if ("speechSynthesis" in window) {
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        return;
      }

      if (isMuted) return;

      const utterance = new SpeechSynthesisUtterance(
        "CRITICAL DEADLINE EXPIRATION IMMINENT. AGENT INITIATIVE ENGAGED. PREPARE EXPLANATION PROTOCOL COFFEE IS READY."
      );
      utterance.rate = 1.25;
      utterance.pitch = 0.9;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech simulation: 'CRITICAL DEADLINE EXPIRATION IMMINENT!'");
    }
  };

  const getCleoMoodQuote = () => {
    switch (cleoMood) {
      case "sarcastic":
        return {
          quote: "Oh, outstanding. Another completely self-inflicted crisis. Let's all act shocked and pretend we need a super-computer to write a simple email. Type your panic below, procrastination champion.",
          badge: "cynical-agent.exe",
          color: "bg-[#FF4A8D]"
        };
      case "mitigate":
        return {
          quote: "Put the energy drink down. Take one breath. Yes, your database is down, yes, your manager is calling, and yes, your card is declined. I've already mapped the defense strategy. Click the yellow button.",
          badge: "panic-buffer.sys",
          color: "bg-[#FFBB00]"
        };
      case "peptalk":
        return {
          quote: "Dave is typing on Slack. We have exactly 14 minutes before he realizes you didn't even push the code. Let's draft a highly diplomatic server-delay notification right now. Focus. No browser tabs.",
          badge: "survival-motivator",
          color: "bg-[#10B981]"
        };
    }
  };

  const activeMood = getCleoMoodQuote();

  return (
    <div id="landing-root" className="min-h-screen bg-[#F8F9FA] text-black font-sans flex flex-col selection:bg-[#FF4A8D] selection:text-white relative overflow-hidden">
      {/* Dynamic Background Mesh Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000006_1px,transparent_1px),linear-gradient(to_bottom,#00000006_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Premium Header */}
      <header className="bg-white border-b-2 border-black px-6 py-4 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF4A8D] neo-border flex items-center justify-center neo-shadow rotate-[-2deg] transition-all hover:rotate-[0deg]">
              <Zap className="w-5 h-5 text-black stroke-[3]" />
            </div>
            <div>
              <h1 className="font-display font-black text-lg md:text-xl tracking-tight uppercase leading-none">
                THE LAST-MINUTE LIFE SAVER
              </h1>
              <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase mt-0.5 tracking-wider">
                TACTICAL DEFENSE PROTOCOL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-xs font-mono font-bold text-zinc-600 hover:text-black uppercase">
                CAPABILITIES
              </a>
              <a href="#simulator" className="text-xs font-mono font-bold text-zinc-600 hover:text-black uppercase">
                SIMULATOR
              </a>
              <a href="#cleo" className="text-xs font-mono font-bold text-zinc-600 hover:text-black uppercase">
                MEET CLEO
              </a>
            </nav>

            <button
              onClick={onSignInClick}
              className="bg-[#FFBB00] hover:bg-amber-400 text-black px-4 py-2 font-mono font-black text-xs uppercase neo-border-sm neo-shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>SECURE ACCESS</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        {/* Left Side: Text and CTAs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#FFFEEF] neo-border-sm px-3 py-1.5 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="font-black uppercase tracking-wide">SYSTEM DEPLOYED & OPERATIONAL</span>
          </div>

          <h2 className="font-display font-black text-4xl sm:text-5.5xl text-black leading-[1.05] uppercase tracking-tight">
            DEADLINES CRASHING DOWN? <br className="hidden sm:inline" />
            MEET YOUR <span className="text-[#FF4A8D] underline decoration-4 decoration-black">LAST-MINUTE SAVIOR</span>.
          </h2>

          <p className="text-sm sm:text-base text-zinc-700 font-medium leading-relaxed max-w-2xl">
            A high-performance tactical interface built to de-stress your mind, schedule defense buffers on your calendar, auto-scan Gmail alerts for hidden payment contracts, and execute agent automations to draft excuse templates when failure is not an option.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={onGetStarted}
              className="bg-[#FF4A8D] hover:bg-rose-600 text-white font-mono font-black text-sm uppercase px-8 py-4 neo-border neo-shadow-rose neo-button-hover flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ARM DEFENSE SYSTEM NOW</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>

            <button
              onClick={handleSirenSound}
              className={`bg-white hover:bg-zinc-50 text-black font-mono font-black text-sm uppercase px-6 py-4 neo-border neo-shadow neo-button-hover flex items-center justify-center gap-2 cursor-pointer ${
                speaking ? "border-[#EF4444] bg-[#FFECEC]" : ""
              }`}
            >
              {speaking ? <VolumeX className="w-4 h-4 text-red-500 animate-spin" /> : <Volume2 className="w-4 h-4" />}
              <span>{speaking ? "SILENCE EMERGENCY SIREN" : "TEST EMERGENCY SIREN"}</span>
            </button>
          </div>

          {/* Micro-Features Row */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-black/10">
            <div className="space-y-1">
              <span className="font-display font-extrabold text-2xl text-black">100%</span>
              <p className="text-[10px] font-mono uppercase text-zinc-500 font-bold">Secure Sandboxing</p>
            </div>
            <div className="space-y-1">
              <span className="font-display font-extrabold text-2xl text-black">&lt; 3s</span>
              <p className="text-[10px] font-mono uppercase text-zinc-500 font-bold">Crisis Gameplan Setup</p>
            </div>
            <div className="space-y-1">
              <span className="font-display font-extrabold text-2xl text-black">99.8%</span>
              <p className="text-[10px] font-mono uppercase text-zinc-500 font-bold">Sanity Preservation</p>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Crisis Timeline Preview */}
        <div id="simulator" className="lg:col-span-5 w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white neo-border p-5 sm:p-6 neo-shadow-lg space-y-4"
          >
            {/* Window bar */}
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-red-500 border border-black rounded-full" />
                <span className="w-3.5 h-3.5 bg-yellow-500 border border-black rounded-full" />
                <span className="w-3.5 h-3.5 bg-green-500 border border-black rounded-full" />
              </div>
              <span className="text-[9px] font-mono font-black bg-black text-white px-2 py-0.5 neo-border-sm uppercase">
                SIMULATOR::CORE-ENG-3
              </span>
            </div>

            {/* Input Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-zinc-500">CHAOTIC PANIC INPUT</span>
                <span className="text-[9px] font-mono bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded uppercase">SIMULATED</span>
              </div>
              <div className="bg-[#FFFEEF] neo-border-sm p-3 font-mono text-[11px] leading-relaxed text-black/90 relative">
                "AWS billing rejected card ending in 4352, they say servers shut down tomorrow! Also lease renewal due at 5pm and best man speech toast needed by 10pm..."
              </div>
            </div>

            {/* Pipeline progress bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="font-black text-black">MITIGATION FLOW STATUS</span>
                <span className="text-zinc-600 font-bold uppercase">
                  {simulationStep === 0 && "INGESTING PANIC CONTEXT..."}
                  {simulationStep === 1 && "CALCULATING DELAY VECTORS..."}
                  {simulationStep === 2 && "INJECTING CALENDAR BUFFERS..."}
                  {simulationStep === 3 && "READY FOR AGENT AUTONOMY!"}
                </span>
              </div>
              <div className="h-3 w-full bg-zinc-100 neo-border-sm overflow-hidden relative">
                <motion.div 
                  className="h-full bg-black"
                  animate={{ 
                    width: simulationStep === 0 ? "25%" : simulationStep === 1 ? "50%" : simulationStep === 2 ? "75%" : "100%" 
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Generated Actions list */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-mono font-black uppercase text-zinc-600 block">GENERATED CRISIS GAMEPLAN</span>
              <div className="space-y-2">
                {/* Step 1 */}
                <div className={`p-2.5 neo-border-sm transition-all flex items-start gap-2.5 text-xs font-mono uppercase ${simulationStep >= 1 ? 'bg-zinc-50 border-black' : 'opacity-40'}`}>
                  <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${simulationStep >= 1 ? 'text-[#10B981]' : 'text-zinc-400'}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-black">1. AWS PAYMENT RESCUE DRAFT</span>
                      <span className="text-[9px] bg-red-100 text-red-700 px-1 border border-red-200">CRITICAL</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-normal font-bold lowercase">auto-drafted billing extension request</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`p-2.5 neo-border-sm transition-all flex items-start gap-2.5 text-xs font-mono uppercase ${simulationStep >= 2 ? 'bg-zinc-50 border-black' : 'opacity-40'}`}>
                  <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${simulationStep >= 2 ? 'text-[#10B981]' : 'text-zinc-400'}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-black">2. SCHEDULE LEASE DEFENSE SLOT</span>
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-1 border border-blue-200">BUFFER</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-normal font-bold lowercase">block 4:00pm - 5:00pm for lease execution</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`p-2.5 neo-border-sm transition-all flex items-start gap-2.5 text-xs font-mono uppercase ${simulationStep >= 3 ? 'bg-zinc-50 border-black' : 'opacity-40'}`}>
                  <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${simulationStep >= 3 ? 'text-[#10B981]' : 'text-zinc-400'}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-black">3. BEST MAN SPEECH SYNOPSIS</span>
                      <span className="text-[9px] bg-yellow-100 text-amber-700 px-1 border border-amber-200">RESEARCH</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-normal font-bold lowercase">gemini outlines 3 engaging custom toasts</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onGetStarted}
              className="w-full bg-[#FF4A8D] hover:bg-rose-600 text-white font-mono font-black text-xs uppercase py-2.5 neo-border neo-shadow-sm flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <span>RUN REAL AGENTS NOW</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Core Features Grid Section */}
      <section id="features" className="py-20 px-6 bg-white border-y-2 border-black">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-mono font-black text-[#FF4A8D] uppercase tracking-widest bg-rose-50 border border-rose-200 px-3 py-1">
              ARMAMENT CATALOG
            </span>
            <h3 className="font-display font-black text-3xl sm:text-4.5xl uppercase leading-none text-black">
              BUILT FOR HIGH-STRESS SURVIVAL
            </h3>
            <p className="text-zinc-600 text-xs sm:text-sm font-medium">
              We analyzed thousands of late-night panic cycles to design tools that operate exactly how your stressed brain needs them to.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#FFFEEF] neo-border p-6 neo-shadow flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-none bg-[#FFBB00] flex items-center justify-center neo-border-sm">
                  <Zap className="w-5 h-5 text-black stroke-[2.5]" />
                </div>
                <h4 className="font-display font-black text-lg uppercase tracking-tight text-black">
                  CRISIS GAME PLANNER
                </h4>
                <p className="text-xs text-zinc-700 font-semibold leading-relaxed">
                  Converts highly panicked, unstructured task prompts into logical, prioritized step-by-step game plans. Uses advanced LLMs to identify hidden bottlenecks.
                </p>
              </div>
              <div className="border-t border-black/10 pt-4 mt-6 flex justify-between items-center font-mono text-[9px] text-zinc-500 font-bold uppercase">
                <span>COMPLEX PLANNER</span>
                <span className="bg-black text-white px-1.5 py-0.5 rounded text-[8px]">ACTIVE</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#FFFEEF] neo-border p-6 neo-shadow flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-none bg-[#FF4A8D] flex items-center justify-center neo-border-sm">
                  <Mail className="w-5 h-5 text-black stroke-[2.5]" />
                </div>
                <h4 className="font-display font-black text-lg uppercase tracking-tight text-black">
                  GMAIL AUTO-HARVEST
                </h4>
                <p className="text-xs text-zinc-700 font-semibold leading-relaxed">
                  Scans your unread emails for implicit payment obligations, deadline notifications, and contract expirations. Converts warnings into tasks before your access shuts down.
                </p>
              </div>
              <div className="border-t border-black/10 pt-4 mt-6 flex justify-between items-center font-mono text-[9px] text-zinc-500 font-bold uppercase">
                <span>GCLOUD AUTH PROXY</span>
                <span className="bg-black text-white px-1.5 py-0.5 rounded text-[8px]">MODE A</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#FFFEEF] neo-border p-6 neo-shadow flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-none bg-[#10B981] flex items-center justify-center neo-border-sm">
                  <CalendarIcon className="w-5 h-5 text-black stroke-[2.5]" />
                </div>
                <h4 className="font-display font-black text-lg uppercase tracking-tight text-black">
                  CALENDAR BUFFER
                </h4>
                <p className="text-xs text-zinc-700 font-semibold leading-relaxed">
                  Pulls live calendar timelines, analyzes current meeting loads, and maps automated block periods around deliverables to give you uninterrupted space to focus.
                </p>
              </div>
              <div className="border-t border-black/10 pt-4 mt-6 flex justify-between items-center font-mono text-[9px] text-zinc-500 font-bold uppercase">
                <span>DEFENSE BLOCKS</span>
                <span className="bg-black text-white px-1.5 py-0.5 rounded text-[8px]">MODE B</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#FFFEEF] neo-border p-6 neo-shadow flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-none bg-[#EF4444] flex items-center justify-center neo-border-sm">
                  <ShieldAlert className="w-5 h-5 text-black stroke-[2.5]" />
                </div>
                <h4 className="font-display font-black text-lg uppercase tracking-tight text-black">
                  EMERGENCY ESCALATOR
                </h4>
                <p className="text-xs text-zinc-700 font-semibold leading-relaxed">
                  When a deadline is under 60 minutes away, triggers Mode C. Synthesizes high-priority excuses, delay-notice emails, and voice script briefs with TTS call simulators.
                </p>
              </div>
              <div className="border-t border-black/10 pt-4 mt-6 flex justify-between items-center font-mono text-[9px] text-zinc-500 font-bold uppercase">
                <span>FAIL-SAFE SYSTEM</span>
                <span className="bg-black text-white px-1.5 py-0.5 rounded text-[8px]">MODE C</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Step-by-Step */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full space-y-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <span className="text-xs font-mono font-black text-zinc-500 uppercase tracking-widest">TIMELINE MAP</span>
            <h3 className="font-display font-black text-3xl sm:text-4.5xl uppercase leading-none text-black">
              HOW TO SAVE YOUR REPUTATION IN 3 STEPS
            </h3>
          </div>
          <button
            onClick={onGetStarted}
            className="bg-black text-white font-mono font-black text-xs uppercase px-5 py-3 neo-border neo-shadow hover:bg-zinc-900 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>GET INITIATED NOW</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-12 left-20 right-20 h-0.5 bg-black/10 z-0" />

          {/* Step 1 */}
          <div className="space-y-4 relative z-10">
            <div className="w-16 h-16 rounded-full bg-[#FF4A8D] text-black font-display font-black text-2xl flex items-center justify-center neo-border neo-shadow">
              1
            </div>
            <h4 className="font-display font-black text-lg uppercase tracking-tight text-black pt-2">
              AUTHORIZE ENVIRONMENT
            </h4>
            <p className="text-xs text-zinc-700 font-semibold leading-relaxed">
              Create a secure profile or authenticate via Google Sync. This isolates your plans inside Cloud Firestore so only your active session has decrypt capabilities.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-4 relative z-10">
            <div className="w-16 h-16 rounded-full bg-[#FFBB00] text-black font-display font-black text-2xl flex items-center justify-center neo-border neo-shadow">
              2
            </div>
            <h4 className="font-display font-black text-lg uppercase tracking-tight text-black pt-2">
              PASTE OR PULL THE STRESS
            </h4>
            <p className="text-xs text-zinc-700 font-semibold leading-relaxed">
              Type your unorganized project state into the crisis box, or pull real-time commitments instantly by triggering Google Workspace API hooks to import active issues.
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-4 relative z-10">
            <div className="w-16 h-16 rounded-full bg-[#10B981] text-black font-display font-black text-2xl flex items-center justify-center neo-border neo-shadow">
              3
            </div>
            <h4 className="font-display font-black text-lg uppercase tracking-tight text-black pt-2">
              RUN AGENTIC DELEGATIONS
            </h4>
            <p className="text-xs text-zinc-700 font-semibold leading-relaxed">
              Let the system build task cards and click "Do it for me". The AI agent goes out, gathers research summaries, blocks time, and outputs formatted templates.
            </p>
          </div>
        </div>
      </section>

      {/* Meet Cleo: Sarcastic Dialog Engine */}
      <section id="cleo" className="py-16 px-6 bg-[#FFFEEF] border-t-2 border-black">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Avatar side */}
          <div className="md:col-span-4 flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 bg-black rounded-none neo-border flex items-center justify-center neo-shadow rotate-[-4deg] relative">
              <span className="text-white font-mono font-black text-3xl select-none">C</span>
              {/* blinking indicator */}
              <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-[#10B981] border border-black animate-ping" />
              <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-[#10B981] border border-black" />
            </div>
            <div>
              <h4 className="font-display font-black text-xl text-black leading-none">CLEOBOT v1.4</h4>
              <span className="font-mono text-[9px] text-zinc-500 font-extrabold uppercase mt-1 block">CYNICAL CRISIS COMPANION</span>
            </div>
          </div>

          {/* Dialog bubble side */}
          <div className="md:col-span-8 space-y-4">
            {/* Tone selector */}
            <div className="flex gap-2 bg-zinc-200/60 p-1 rounded neo-border-sm max-w-sm">
              <button 
                onClick={() => setCleoMood("sarcastic")}
                className={`flex-1 py-1.5 text-[9px] font-mono font-black uppercase text-center rounded transition-all cursor-pointer ${cleoMood === "sarcastic" ? "bg-black text-white" : "text-zinc-600 hover:text-black"}`}
              >
                Sarcastic Mode
              </button>
              <button 
                onClick={() => setCleoMood("mitigate")}
                className={`flex-1 py-1.5 text-[9px] font-mono font-black uppercase text-center rounded transition-all cursor-pointer ${cleoMood === "mitigate" ? "bg-black text-white" : "text-zinc-600 hover:text-black"}`}
              >
                Defense Mode
              </button>
              <button 
                onClick={() => setCleoMood("peptalk")}
                className={`flex-1 py-1.5 text-[9px] font-mono font-black uppercase text-center rounded transition-all cursor-pointer ${cleoMood === "peptalk" ? "bg-black text-white" : "text-zinc-600 hover:text-black"}`}
              >
                Pep-Talk Mode
              </button>
            </div>

            {/* Bubble */}
            <div className="bg-white neo-border p-5 relative neo-shadow space-y-3 min-h-[140px] flex flex-col justify-between">
              {/* Top details */}
              <div className="flex justify-between items-center font-mono text-[9px]">
                <span className={`px-2 py-0.5 border border-black uppercase font-black text-black ${activeMood.color}`}>
                  {activeMood.badge}
                </span>
                <span className="text-zinc-400 font-bold">STATE: LOADED</span>
              </div>

              {/* Text quote */}
              <p className="font-mono text-xs sm:text-sm text-black leading-relaxed italic uppercase font-bold py-2">
                "{activeMood.quote}"
              </p>

              {/* Action row */}
              <div className="flex justify-between items-center pt-2 border-t border-black/5">
                <span className="font-mono text-[8px] text-zinc-400 font-bold uppercase">PROMPT FEEDBACK SYSTEM READY</span>
                <button
                  onClick={onGetStarted}
                  className="font-mono text-[9px] font-black uppercase text-black hover:underline flex items-center gap-1"
                >
                  <span>ARM CONSOLE</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Cloud Isolation Banner */}
      <section className="py-12 px-6 border-t-2 border-black bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h4 className="font-display font-black text-lg text-black uppercase leading-none flex items-center gap-2">
              <Lock className="w-4.5 h-4.5 text-[#FFBB00]" />
              SECURE WORKSPACE & ZERO TRACE SANDBOXING
            </h4>
            <p className="text-xs text-zinc-600 font-semibold max-w-3xl">
              We prioritize data preservation. Your Google Workspace authorizations operate on serverless token proxies. No emails, calendars, or custom tasks are saved to local disks unless explicitly synced to your private Firebase Firestore vault.
            </p>
          </div>
          <div className="flex gap-4">
            <span className="text-[10px] font-mono font-black border border-black bg-zinc-100 text-zinc-700 px-3 py-1 rounded">
              TLS 1.3 ARMED
            </span>
            <span className="text-[10px] font-mono font-black border border-black bg-zinc-100 text-zinc-700 px-3 py-1 rounded">
              AES-256 VAULT
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-8 px-6 border-t-2 border-black relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="font-display font-black text-sm uppercase tracking-wide">
              THE LAST-MINUTE LIFE SAVER (CLEOBOT)
            </span>
          </div>
          <div className="font-mono text-[10px] font-black uppercase text-zinc-400">
            BUILT BY WAYLEN BARRETO
          </div>
        </div>
      </footer>
    </div>
  );
};
