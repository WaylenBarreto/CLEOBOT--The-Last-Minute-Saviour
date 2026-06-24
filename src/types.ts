export interface ActionableStep {
  stepOrder: number;
  description: string;
  estimatedMinutes: number;
  requiresAgentExecution: boolean;
  agentExecutionType: "email_draft" | "web_search" | "calendar_block" | "none";
  agentContext: string;
  completed?: boolean;
  agentResult?: string;
  executing?: boolean;
}

export interface TaskPlan {
  taskName: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  estimatedTotalMinutes: number;
  panicModeTrigger: boolean;
  actionableSteps: ActionableStep[];
  escalationStrategy: string;
}

export interface QuickTemplate {
  title: string;
  description: string;
  rawInput: string;
  dueInfo: string;
}
