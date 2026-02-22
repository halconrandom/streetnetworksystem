export enum TicketStatus {
  OPEN = 'Open',
  CLAIMED = 'Claimed',
  CLOSED = 'Closed'
}

export enum UserRole {
  USER = 'User',
  STAFF = 'Staff',
  ADMIN = 'Admin',
  SYSTEM = 'System'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  avatarUrl: string;
}

export interface Message {
  id: string;
  user: User;
  content: string;
  timestamp: string; // ISO string
  type: 'chat' | 'system' | 'log';
  isEdited?: boolean;
}

export interface Note {
  id: string;
  noteNumber: number;
  authorId: string;
  content: string;
  createdAt: string; // ISO string
}

export interface Ticket {
  id: string;
  databaseId?: string;
  category: string;
  status: TicketStatus;
  subject: string;
  openedBy: User;
  claimedBy?: User;
  closedBy?: User;
  createdAt: string; // ISO string
  closedAt?: string; // ISO string
  resolution?: string;
  fullName?: string;
  contactPreference?: string;
  activeProjectName?: string;
  supportNeeded?: string;
  bugReported?: string;
  inquiryDescription?: string;
  projectDescription?: string;
  projectBudget?: string;
  transcriptCode?: string;
  threadId?: string;
  messages: Message[];
  notes?: Note[];
}
