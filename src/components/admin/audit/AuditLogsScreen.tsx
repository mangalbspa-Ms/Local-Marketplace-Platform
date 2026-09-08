/**
 * Audit Trail Logs Governance Screen
 * 
 * Immutable log of all administrative actions, settings changes, and status overrides.
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import { AuditTransactionRecord } from '../../../types/financial.ts';
import {
  History,
  Search,
  ShieldAlert,
  User,
  Clock,
  Code,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const AuditLogsScreen: React.FC = () => {
  const [logs, setLogs] = useState<AuditTransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getAuditLogs(150);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.actorId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <span>Immutable Administrative Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400">
            Cryptographic and timestamped trail of platform policy changes, shop status toggles, and payout releases.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition self-start sm:self-auto"
          title="Refresh Logs"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter logs by Action Type, Entity ID or Actor ID..."
          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 outline-none transition"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
      </div>

      {/* Audit Log Stream */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold">Querying audit trail...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
          No audit log entries found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => (
            <div
              key={log.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase">
                    {log.actionType}
                  </span>
                  <span className="text-slate-300 font-bold font-sans">
                    {log.entityType}: <span className="text-white font-mono">{log.entityId}</span>
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-2 font-sans pt-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Actor: {log.actorId}</span>
                  <span>•</span>
                  <span className="text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                {log.details && (
                  <div className="mt-1 text-[11px] text-slate-300 font-mono bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 overflow-x-auto max-w-2xl">
                    {JSON.stringify(log.details)}
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-500 self-end md:self-center font-mono">
                LOG ID: {log.id}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
