import React from "react";
import { TaskPlan } from "../types";
import { 
  Clock, 
  Trash2, 
  Inbox, 
  Shield, 
  Calendar, 
  Mail, 
  Zap,
  Check
} from "lucide-react";
import { motion } from "motion/react";

interface HistorySidebarProps {
  plans: TaskPlan[];
  selectedPlan: TaskPlan | null;
  onSelectPlan: (plan: TaskPlan) => void;
  onDeletePlan: (taskName: string) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  plans,
  selectedPlan,
  onSelectPlan,
  onDeletePlan,
}) => {
  return (
    <div id="history-sidebar" className="bg-[#FFFEEF] neo-border p-5 neo-shadow flex flex-col gap-6 h-full font-sans">
      
      {/* 1. Playful Neo-Brutalist Status Widgets */}
      <div className="space-y-3 pb-5 border-b-2 border-black">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-black stroke-[2.5]" />
          <h3 className="font-display font-extrabold text-black text-xs uppercase tracking-wider">
            SYSTEM STATUS
          </h3>
        </div>
        
        <div className="space-y-2 text-xs">
          {/* Calendar Status */}
          <div className="flex items-center justify-between p-2.5 bg-white neo-border-sm rounded-none neo-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
            <div className="flex items-center gap-2">
              <div className="bg-[#10B981] p-1 neo-border-sm text-black">
                <Calendar className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              </div>
              <span className="text-black font-extrabold tracking-tight">GOOGLE CALENDAR</span>
            </div>
            <div className="flex items-center gap-1 bg-[#10B981] text-black text-[9px] font-mono font-extrabold px-1.5 py-0.5 neo-border-sm uppercase">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
              SYNCED
            </div>
          </div>

          {/* Gmail Scanner */}
          <div className="flex items-center justify-between p-2.5 bg-white neo-border-sm rounded-none neo-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
            <div className="flex items-center gap-2">
              <div className="bg-[#7C3AED] p-1 neo-border-sm text-white">
                <Mail className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              </div>
              <span className="text-black font-extrabold tracking-tight">GMAIL SCANNER</span>
            </div>
            <div className="flex items-center gap-1 bg-[#7C3AED] text-white text-[9px] font-mono font-extrabold px-1.5 py-0.5 neo-border-sm uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              LIVE
            </div>
          </div>

          {/* Escalation Engine */}
          <div className="flex items-center justify-between p-2.5 bg-white neo-border-sm rounded-none neo-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
            <div className="flex items-center gap-2">
              <div className="bg-[#FF4A8D] p-1 neo-border-sm text-black">
                <Zap className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              </div>
              <span className="text-black font-extrabold tracking-tight">ESCALATEBOT</span>
            </div>
            <div className="flex items-center gap-1 bg-[#FF4A8D] text-black text-[9px] font-mono font-extrabold px-1.5 py-0.5 neo-border-sm uppercase">
              ARMED
            </div>
          </div>
        </div>
      </div>

      {/* 2. Saved Plans History Segment */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 pb-1">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-black stroke-[2.5]" />
            <h3 className="font-display font-extrabold text-black text-sm uppercase">SAVED SAVIORS</h3>
          </div>
          <span className="text-xs bg-[#FF006E] text-white neo-border-sm font-mono font-extrabold px-2.5 py-0.5">
            {plans.length}
          </span>
        </div>

        {plans.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-black bg-white neo-border-sm neo-shadow">
            <Inbox className="w-10 h-10 mb-2 stroke-[2.5] text-black" />
            <p className="text-xs font-extrabold tracking-tight uppercase">NO SAVED TIMELINES</p>
            <p className="text-[10px] text-zinc-600 mt-2 leading-relaxed">
              Let's create a crisis-crushing game plan using the command bar below!
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pb-2">
            {plans.map((plan, index) => {
              const isSelected = selectedPlan?.taskName === plan.taskName;
              const completedCount = plan.actionableSteps.filter(s => s.completed).length;
              const totalCount = plan.actionableSteps.length;
              const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <motion.div
                  key={plan.taskName + index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
                  className={`group relative p-3.5 neo-border-sm transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#FF4A8D] text-black neo-shadow-rose translate-x-[-2px] translate-y-[-2px]"
                      : "bg-white text-black neo-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000000]"
                  }`}
                  onClick={() => onSelectPlan(plan)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 font-mono font-extrabold neo-border-sm uppercase ${
                            plan.priority === "Critical"
                              ? "bg-[#EF4444] text-white"
                              : plan.priority === "High"
                              ? "bg-[#FFBB00] text-black"
                              : plan.priority === "Medium"
                              ? "bg-[#7C3AED] text-white"
                              : "bg-[#10B981] text-black"
                          }`}
                        >
                          {plan.priority}
                        </span>
                        {plan.panicModeTrigger && (
                          <span className="text-[9px] bg-[#EF4444] text-white px-1.5 py-0.5 font-mono font-extrabold neo-border-sm uppercase">
                            PANIC
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-extrabold text-xs tracking-tight truncate">
                        {plan.taskName}
                      </h4>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePlan(plan.taskName);
                      }}
                      className="p-1 text-black bg-white neo-border-sm hover:bg-red-500 hover:text-white transition-colors self-start"
                      title="DELETE SAVED SAVIOR"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono font-extrabold">
                    <span className="uppercase">{plan.estimatedTotalMinutes} MINS</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-black neo-border-sm h-2.5 overflow-hidden">
                        <div
                          className="bg-[#10B981] h-full transition-all duration-300 border-r border-black"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span>{percentage}%</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
