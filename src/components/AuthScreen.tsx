import React, { useState } from "react";
import { 
  signUpWithEmail, 
  loginWithEmail, 
  googleSignIn 
} from "../lib/firebase";
import { 
  Shield, 
  Lock, 
  Mail, 
  User as UserIcon, 
  AlertCircle, 
  LogIn, 
  UserPlus, 
  Database,
  ArrowRight
} from "lucide-react";
import { motion } from "motion/react";

interface AuthScreenProps {
  onAuthSuccess: (user: any, token: string | null) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      setError("Please fill in all required fields.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const user = await signUpWithEmail(email, password, name);
        onAuthSuccess(user, null);
      } else {
        const user = await loginWithEmail(email, password);
        onAuthSuccess(user, null);
      }
    } catch (err: any) {
      console.error(err);
      let friendlyMessage = err.message || "Authentication failed.";
      if (err.code === "auth/email-already-in-use") {
        friendlyMessage = "This email is already registered. Try logging in!";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        friendlyMessage = "Incorrect email or password. Please verify your credentials.";
      } else if (err.code === "auth/weak-password") {
        friendlyMessage = "Password must be at least 6 characters long.";
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthSuccess(result.user, result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to authenticate with Google OAuth.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-portal-container" className="min-h-screen bg-[#FFFEEF] flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Dynamic Background Mesh Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-white neo-border p-6 sm:p-8 neo-shadow relative z-10 space-y-6"
      >
        {/* Header Decors */}
        <div className="flex justify-between items-center border-b-2 border-black pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-[#FF4A8D] flex items-center justify-center neo-border-sm text-black">
              <Shield className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-display font-black text-sm tracking-tight uppercase text-black">
                LAST-MINUTE SAVIOR
              </h2>
              <p className="text-[9px] font-mono font-bold uppercase text-zinc-500">
                CRISIS AGENT GATEWAY
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-black bg-black text-white px-2 py-0.5 neo-border-sm uppercase">
            SECURE PORTAL
          </span>
        </div>

        {/* Informational Prompt */}
        <div className="bg-[#FFFEEF] neo-border-sm p-3 font-mono text-[10px] leading-relaxed text-black/80">
          <p className="font-black text-black uppercase mb-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-black" />
            ENCRYPTED ENVIRONMENT
          </p>
          Please authorize with your credentials. Accounts are securely isolated to protect active emergency mitigation timelines.
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 neo-border-sm p-1 bg-zinc-100">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
            }}
            className={`py-2 text-[10px] font-mono font-black uppercase transition-all cursor-pointer ${
              !isSignUp 
                ? "bg-black text-white neo-border-sm" 
                : "text-zinc-500 hover:text-black"
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
            }}
            className={`py-2 text-[10px] font-mono font-black uppercase transition-all cursor-pointer ${
              isSignUp 
                ? "bg-black text-white neo-border-sm" 
                : "text-zinc-500 hover:text-black"
            }`}
          >
            SIGN UP
          </button>
        </div>

        {/* Feedback Alert banner */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FFECEC] border-2 border-[#EF4444] p-3 text-xs font-mono text-black flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-[#EF4444] stroke-[2.5] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-[#EF4444] uppercase block text-[10px] mb-0.5">AUTHORIZATION ERROR</span>
              <p className="text-[10px] font-bold leading-normal uppercase">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-black uppercase text-black flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" />
                <span>FULL NAME</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Agent Waylen Barreto"
                className="w-full bg-white neo-border p-2.5 font-mono text-xs focus:outline-none focus:ring-0 placeholder-zinc-400 text-black uppercase"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-black uppercase text-black flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>EMAIL ADDRESS</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@crisis-savior.com"
              className="w-full bg-white neo-border p-2.5 font-mono text-xs focus:outline-none focus:ring-0 placeholder-zinc-400 text-black uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-black uppercase text-black flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>PASSWORD PASSWORD</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-white neo-border p-2.5 font-mono text-xs focus:outline-none focus:ring-0 placeholder-zinc-400 text-black"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 font-mono font-black text-xs uppercase neo-border neo-shadow hover:bg-zinc-900 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSignUp ? (
              <>
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>{loading ? "CREATING AGENT..." : "CREATE AGENT ACCOUNT"}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>{loading ? "SIGNING IN..." : "SECURE LOGIN"}</span>
              </>
            )}
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        <div className="relative flex items-center justify-center py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/10"></div>
          </div>
          <span className="relative px-3 bg-white text-[9px] font-mono font-bold uppercase text-zinc-400">
            OR PREFER SECURE FEDERATION
          </span>
        </div>

        {/* Federated Login (Google OAuth) */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-[#FFBB00] hover:bg-amber-400 text-black py-3 font-mono font-black text-xs uppercase neo-border neo-shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Database className="w-4 h-4 stroke-[2.5]" />
          <span>{loading ? "CONNECTING..." : "SIGN IN WITH GOOGLE SYNC"}</span>
        </button>

        {/* Footer */}
        <div className="text-center font-mono text-[8px] text-zinc-400 font-bold uppercase pt-2 border-t border-black/5">
          PROTECTED BY FIREBASE SECURITY SCHEMAS & TLS 1.3
        </div>
      </motion.div>
    </div>
  );
};
