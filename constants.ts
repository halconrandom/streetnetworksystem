import { Ticket, TicketStatus, UserRole, User } from './types';

const USERS: Record<string, User> = {
  user: {
    id: '39281928392182',
    username: 'dark_slayer_99',
    role: UserRole.USER,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  },
  admin: {
    id: '10293810293812',
    username: 'Mod_Alex',
    role: UserRole.ADMIN,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  },
  system: {
    id: '00000000000000',
    username: 'Ticket Bot',
    role: UserRole.SYSTEM,
    avatarUrl: '',
  }
};

// Base time for relative calc
const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

export const MOCK_TICKET: Ticket = {
  id: 'ticket-1829',
  subject: 'Appeal Ban Request',
  category: 'ban-appeals',
  status: TicketStatus.CLOSED,
  openedBy: USERS.user,
  claimedBy: USERS.admin,
  closedBy: USERS.admin,
  createdAt: hoursAgo(48),
  closedAt: hoursAgo(2),
  resolution: 'User provided evidence of account compromise. Ban lifted. 2FA enabled as requirement.',
  messages: [
    {
      id: 'm1',
      user: USERS.user,
      content: "Hi, I was banned from the server yesterday but I think my account was hacked. I couldn't log in for 3 days.",
      timestamp: hoursAgo(48),
      type: 'chat'
    },
    {
      id: 'm2',
      user: USERS.system,
      content: 'Ticket created in #ban-appeals by dark_slayer_99.',
      timestamp: hoursAgo(48),
      type: 'system'
    },
    {
      id: 'm3',
      user: USERS.admin,
      content: "Hello @dark_slayer_99, thanks for opening a ticket. \n\nCan you please provide any screenshot or email evidence from Discord support showing the compromise?",
      timestamp: hoursAgo(40),
      type: 'chat'
    },
    {
      id: 'm4',
      user: USERS.user,
      content: "Yes, here is the email from Discord Trust & Safety confirming the reset: \n\nhttps://example.com/screenshot_evidence.png",
      timestamp: hoursAgo(25),
      type: 'chat'
    },
    {
      id: 'm5',
      user: USERS.admin,
      content: "Thanks. I've reviewed the evidence and it checks out. I will lift the ban now.",
      timestamp: hoursAgo(24),
      type: 'chat'
    },
    {
      id: 'm6',
      user: USERS.admin,
      content: "Please ensure you enable 2FA on your account to prevent this in the future.",
      timestamp: hoursAgo(24),
      type: 'chat'
    },
    {
      id: 'm7',
      user: USERS.user,
      content: "I have enabled it. Thank you Alex!",
      timestamp: hoursAgo(2),
      type: 'chat'
    },
    {
      id: 'm8',
      user: USERS.system,
      content: 'Ticket marked as Closed by Mod_Alex.',
      timestamp: hoursAgo(2),
      type: 'log'
    }
  ]
};