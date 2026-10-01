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

  const filtered = logs.filter((l) => {
    const q = (searchQuery || '').toLowerCase();
    return (
      (l?.actionType || '').toLowerCase().includes(q) ||
      (l?.entityType || '').toLowerCase().includes(q) ||
      (l?.entityId || '').toLowerCase().includes(q) ||
      (l?.actorId || '').toLowerCase().includes(q)
    );
  });

  const uniqueActors = new Set(logs.map((l) => l.actorId)).size;
  const securityEvents = logs.filter((l) => 
    (l.actionType || '').includes('STATUS') || 
    (l.actionType || '').includes('OVERRIDE') || 
    (l.actionType || '').includes('VERIFY') ||
    (l.actionType || '').includes('SETTING')
  ).length;

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Immutable Audit Trail</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {filtered.length} Entries
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Cryptographic trail of administrative policy updates, shop status changes, and payout releases
            </p>
          </div>
        </div>

        <button
          onClick={loadLogs}
          disabled={isLoading}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition self-start sm:self-auto"
          title="Refresh Logs"
        >
          <RefreshCw className={`w-4 h-4 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 3 Compact KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Recorded Logs</p>
            <h3 className="text-lg font-black text-white mt-0.5">{logs.length}</h3>
            <p className="text-[10px] text-slate-500">Immutable ledger</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <History className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Active Actors / Admins</p>
            <h3 className="text-lg font-black text-sky-400 mt-0.5">{uniqueActors}</h3>
            <p className="text-[10px] text-sky-400/70">Verified identities</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Status Overrides</p>
            <h3 className="text-lg font-black text-amber-400 mt-0.5">{securityEvents}</h3>
            <p className="text-[10px] text-amber-400/70">Critical modifications</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
        <div className="relative max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter logs by Action Type, Entity ID or Actor ID..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 pl-8 text-xs text-white placeholder-slate-500 outline-none transition"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Audit Log Stream */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-900/60 border border-slate-800 rounded-xl">
          <Clock className="w-5 h-5 mx-auto mb-2 text-indigo-400 animate-spin" />
          Querying audit trail...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
          No audit log entries found.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((log) => (
            <div
              key={log.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-3.5 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-2.5 text-xs font-mono hover:border-slate-700 transition"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[9px] font-black uppercase">
                    {log.actionType}
                  </span>
                  <span className="text-slate-300 font-bold font-sans text-xs">
                    {log.entityType}: <span className="text-white font-mono">{log.entityId}</span>
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center gap-2 font-sans flex-wrap">
                  <span className="flex items-center gap-1 text-slate-300">
                    <User className="w-3 h-3 text-slate-500" />
                    Actor: <span className="font-semibold text-slate-200">{log.actorId}</span>
                  </span>
                  <span>•</span>
                  <span className="text-slate-400">
                    {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {log.details && (
                  <div className="mt-1 text-[10px] text-slate-300 font-mono bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 overflow-x-auto max-w-full">
                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                  </div>
                )}
              </div>

              <div className="text-[9px] text-slate-500 shrink-0 font-mono self-start md:self-auto bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800/40">
                LOG #{log.id}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
