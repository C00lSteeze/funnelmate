
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  WIZARD = 'WIZARD',
  CHAT = 'CHAT',
  TOOLS = 'TOOLS'
}

export interface FunnelProject {
  id: string;
  name: string;
  type: 'STRATEGY' | 'COPY' | 'ANALYSIS' | 'CAMPAIGN_WA' | 'CAMPAIGN_EMAIL' | 'CHAT_SESSION';
  niche?: string;
  productName?: string;
  targetAudience?: string;
  content: string; // Main content (markdown)
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ToolResponse {
  type: 'text' | 'analysis';
  content: string;
}

export interface AutomationRule {
  id: string;
  keyword: string;
  response: string;
  matchType: 'contains' | 'exact';
  isEnabled: boolean;
}