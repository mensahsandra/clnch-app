export type OpportunityStatus =
  | 'saved'
  | 'in_progress'
  | 'applied'
  | 'shortlisted'
  | 'rejected'
  | 'awarded'
  | 'filed';

export type OpportunityCategory =
  | 'fellowship'
  | 'grant'
  | 'accelerator'
  | 'job'
  | 'conference'
  | 'internship'
  | 'events';

export type UrgencyLevel = 'High' | 'Medium' | 'Low';

export type MonitorStatus = 'idle' | 'watching' | 'changed';

export interface Opportunity {
  id: string;
  title: string;
  org: string;
  category: OpportunityCategory;
  status: OpportunityStatus;
  urgency: UrgencyLevel;
  daysLeft: number;
  deadline?: string;
  link?: string;
  requirements?: string[];
  location?: string;
  contact?: string;
  description?: string;
  monitorStatus?: MonitorStatus;
  monitorGoal?: string;
  monitorId?: string;
  lastCheckedAt?: string;
  changeSummary?: string;
}

export interface ApplicationSession {
  id: string;
  user_id?: string;
  opportunity_id?: string;
  opportunity_title: string;
  opportunity_org: string;
  opportunity_link?: string;
  status: 'active' | 'filed' | 'archived';
  last_message_preview?: string;
  last_active_at: string;
  created_at: string;
}

export interface ApplicationAnswer {
  id: string;
  session_id: string;
  user_id?: string;
  field_name?: string;
  raw_answer?: string;
  refined_answer?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface DiscoverItem {
  id: string;
  source: 'Eventbrite' | 'OpDesk' | 'LinkedIn' | 'Conference' | 'CLNCH';
  category: OpportunityCategory;
  title: string;
  org: string;
  date?: string;
  location: string;
  daysLeft: number;
  link?: string;
  tags?: string[];
  isRemote?: boolean;
  region?: 'Ghana' | 'West Africa' | 'Global' | 'Remote';
  sector?: string;
  monitorStatus?: MonitorStatus;
  monitorGoal?: string;
  monitorId?: string;
  lastCheckedAt?: string;
  changeSummary?: string;
}

export interface WebMonitor {
  id: string;
  name: string;
  url: string;
  goal: string;
  category: OpportunityCategory;
  schedule: string;
  monitorId?: string;
  status: MonitorStatus;
  lastCheckedAt?: string;
  changeSummary?: string;
  email?: string;
}

export interface ScrapeResult {
  title: string;
  org: string;
  category: OpportunityCategory;
  requirements: string[];
  deadline?: string;
  description?: string;
  location?: string;
  link: string;
}

export type NavPage = 'home' | 'discover' | 'applied' | 'pending' | 'history' | 'chats' | 'settings';
