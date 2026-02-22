import React, { useState } from 'react';
import { Ticket } from '../types';
import { 
  Folder, 
  User, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Shield,
  CheckCircle,
  Hash,
  Calendar,
  Activity
} from './Icons';
import { StatusBadge, CopyButton, RoleBadge } from './UI';
import { formatFullDateTime, formatRelativeTime } from '../utils/time';

interface TicketMetadataProps {
  ticket: Ticket;
}

export const TicketMetadata: React.FC<TicketMetadataProps> = ({ ticket }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const details = [
    { label: 'Full Name', value: ticket.fullName },
    { label: 'Contact Preference', value: ticket.contactPreference },
    { label: 'Active Project', value: ticket.activeProjectName },
    { label: 'Support Needed', value: ticket.supportNeeded },
    { label: 'Bug Reported', value: ticket.bugReported },
    { label: 'Inquiry', value: ticket.inquiryDescription },
    { label: 'Project Description', value: ticket.projectDescription },
    { label: 'Project Budget', value: ticket.projectBudget },
    { label: 'Resolution', value: ticket.resolution },
    { label: 'Transcript Code', value: ticket.transcriptCode },
    { label: 'Thread ID', value: ticket.threadId },
    { label: 'Database ID', value: ticket.databaseId },
  ].filter((item) => item.value);

  return (
    <div className="bg-terminal-panel border border-terminal-border rounded-lg mb-6 shadow-xl overflow-hidden group">
      {/* Decorative Top Line */}
      <div className="h-1 w-full bg-gradient-to-r from-terminal-accent/50 via-terminal-panel to-terminal-panel"></div>
      
      <div className="p-6">
        {/* Header Section: Subject, Status, ID */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div className="flex-1">
             <div className="flex items-center gap-3 mb-2">
                <StatusBadge status={ticket.status} />
                <span className="text-xs font-mono text-terminal-muted flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">
                    ID: <span className="text-white">{ticket.id}</span>
                    <CopyButton text={ticket.id} />
                </span>
             </div>
             <h2 className="text-2xl font-bold text-white flex items-center gap-2">
               {ticket.subject}
             </h2>
             <p className="text-sm text-terminal-muted mt-1 flex items-center gap-2">
                <Folder size={14} />
                Category: <span className="text-white font-mono bg-white/5 px-1.5 rounded text-xs">#{ticket.category}</span>
             </p>
          </div>
          
          {/* Timeline Summary (Quick Scan) */}
          <div className="flex items-center gap-4 text-[13px] text-terminal-muted bg-black/20 p-3 rounded-lg border border-terminal-border">
              <div className="text-right">
                  <p className="flex items-center justify-end gap-1.5 mb-1 text-xs">
                      <Clock size={12} /> Created
                  </p>
                  <span className="text-white font-mono text-sm" title={formatFullDateTime(ticket.createdAt)}>
                      {formatRelativeTime(ticket.createdAt)}
                  </span>
              </div>
              {ticket.closedAt && (
                  <>
                    <div className="w-[1px] h-8 bg-terminal-border"></div>
                    <div className="text-right">
                        <p className="flex items-center justify-end gap-1.5 mb-1 text-xs">
                            <CheckCircle size={12} className="text-terminal-accent" /> Closed
                        </p>
                        <span className="text-white font-mono text-sm" title={formatFullDateTime(ticket.closedAt)}>
                            {formatRelativeTime(ticket.closedAt)}
                        </span>
                    </div>
                  </>
              )}
          </div>
        </div>

        {/* Detailed Grid: Participants */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-terminal-border pt-6">
            
            {/* Opener */}
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <User size={16} className="text-terminal-muted" />
                </div>
                <div>
                    <p className="text-xs text-terminal-muted uppercase tracking-wider font-bold mb-0.5">Opened By</p>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{ticket.openedBy.username}</span>
                        <RoleBadge role={ticket.openedBy.role} />
                    </div>
                    <div className="text-xs text-terminal-muted font-mono mt-0.5 opacity-50">{ticket.openedBy.id}</div>
                </div>
            </div>

            {/* Claimed */}
            {ticket.claimedBy && (
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Shield size={16} className="text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-terminal-muted uppercase tracking-wider font-bold mb-0.5">Claimed By</p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{ticket.claimedBy.username}</span>
                            <RoleBadge role={ticket.claimedBy.role} />
                        </div>
                        <div className="text-xs text-terminal-muted font-mono mt-0.5 opacity-50">{ticket.claimedBy.id}</div>
                    </div>
                </div>
            )}

            {/* Closed By */}
            {ticket.closedBy && (
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-terminal-accent/10 flex items-center justify-center border border-terminal-accent/20">
                        <CheckCircle size={16} className="text-terminal-accent" />
                    </div>
                    <div>
                        <p className="text-xs text-terminal-muted uppercase tracking-wider font-bold mb-0.5">Closed By</p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{ticket.closedBy.username}</span>
                            <RoleBadge role={ticket.closedBy.role} />
                        </div>
                        <div className="text-xs text-terminal-muted font-mono mt-0.5 opacity-50">{ticket.closedBy.id}</div>
                    </div>
                </div>
            )}
        </div>

        {details.length > 0 && (
            <div className="border-t border-terminal-border mt-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {details.map((item) => (
                        <div key={item.label} className="flex flex-col gap-1">
                            <div className="text-xs text-terminal-muted uppercase tracking-wider font-bold">
                                {item.label}
                            </div>
                            <div className="text-sm text-white break-words">{item.value}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
