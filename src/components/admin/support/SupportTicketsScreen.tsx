/**
 * Support & Dispute Resolution Screen
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import { SupportTicket } from '../../../types/admin.ts';
import {
  HelpCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  User,
  Store,
  Phone,
  X,
  Edit2,
} from 'lucide-react';

export const SupportTicketsScreen: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Resolution Modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState('RESOLVED');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getSupportTickets({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setTickets(data);
    } catch (err) {
      console.error('Failed to load support tickets', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  const handleOpenResolve = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setResolutionStatus(ticket.status === 'OPEN' ? 'IN_PROGRESS' : 'RESOLVED');
    setAdminNotes(ticket.adminNotes || '');
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setIsSubmitting(true);
    try {
      await adminApi.updateSupportTicket(selectedTicket.id, resolutionStatus, adminNotes);
      await loadTickets();
      setSelectedTicket(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = tickets.filter(
    (t) =>
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.orderId && t.orderId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.userPhone.includes(searchQuery)
  );

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <span>Support & Dispute Mediation</span>
          </h2>
          <p className="text-xs text-slate-400">
            Handle customer delivery disputes, merchant queries, and quality complaints.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-bold"
          >
            <option value="ALL">All Tickets</option>
            <option value="OPEN">Open Only</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tickets by Subject, User Name, Phone or Order ID..."
          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 outline-none transition"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold">Loading support tickets...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
          No support dispute tickets found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black font-mono text-slate-400">{ticket.id}</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${getPriorityBadge(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority} PRIORITY
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : ticket.status === 'IN_PROGRESS'
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>

                <h3 className="text-sm font-black text-white mb-1">{ticket.subject}</h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60 mb-3">
                  "{ticket.description}"
                </p>

                {/* User & Order Meta */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-3">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">Raised By</div>
                    <div className="font-bold text-white flex items-center gap-1 mt-0.5">
                      {ticket.userRole === 'SELLER' ? (
                        <Store className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-teal-400" />
                      )}
                      <span>{ticket.userName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{ticket.userPhone}</span>
                    </div>
                  </div>

                  {ticket.orderId && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Linked Order</div>
                      <div className="font-mono font-bold text-indigo-300 mt-0.5">{ticket.orderId}</div>
                    </div>
                  )}
                </div>

                {/* Admin notes */}
                {ticket.adminNotes && (
                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 mb-3">
                    <span className="font-bold text-indigo-300">Admin Resolution: </span>
                    <span>{ticket.adminNotes}</span>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  onClick={() => handleOpenResolve(ticket)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Update Status & Resolution Notes</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>Ticket Resolution Protocol</span>
              </h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTicket} className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-white text-sm">{selectedTicket.subject}</div>
                <div className="text-slate-400 text-xs mt-0.5">
                  Raised by: {selectedTicket.userName} ({selectedTicket.userRole})
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1.5">Update Ticket Status</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold outline-none focus:border-indigo-500"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1.5">
                  Administrative Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Details of action taken, merchant warning, customer refund or clarification..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow-lg shadow-indigo-600/30"
                >
                  {isSubmitting ? 'Saving...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
