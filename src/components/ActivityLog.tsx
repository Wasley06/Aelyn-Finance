import React from 'react';
import { ActivityLog } from '../types';
import { motion } from 'motion/react';
import { History, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../hooks/useFinance';

export default function ActivityLogComponent({ logs }: { logs: ActivityLog[] }) {
  const { profile } = useAuth();
  const { deleteLog } = useFinance();
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="aelyn-panel-soft rounded-[28px] flex-grow flex flex-col overflow-hidden min-h-[500px] border border-white/10">
      <div className="px-8 py-7 border-b border-white/10 shrink-0 flex justify-between items-center">
        <h3 className="font-semibold text-white text-sm tracking-tight flex items-center gap-3">
          <History size={18} className="text-sky" /> Activity Log
        </h3>
        {isAdmin && (
          <span className="text-[11px] font-medium bg-white/5 text-slate-200 px-3 py-1.5 rounded-xl border border-white/10">
            Admin
          </span>
        )}
      </div>
      
      <div className="flex-grow p-8 overflow-y-auto space-y-6">
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[28px] flex items-center justify-center mx-auto mb-6">
              <History size={32} className="text-slate-600" />
            </div>
            <p className="text-[12px] text-slate-500 font-medium">No activity yet.</p>
          </div>
        ) : (
          logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-6 items-start group relative pb-6 border-b border-white/10 last:border-0"
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center transition-all",
                log.action.includes('Created') ? "bg-success/10 border border-success/20 text-success" :
                log.action.includes('Deleted') ? "bg-danger/10 border border-danger/20 text-danger" : "bg-white/5 border border-white/10 text-sky"
              )}>
                 {log.action.includes('Created') ? <ArrowRight size={16} /> : <History size={16} />}
              </div>
              
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-slate-200 tracking-tight">
                      <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest mr-2">{log.userName}</span>
                      {log.action}
                    </p>
                    {isAdmin && (
                      <button 
                         onClick={() => deleteLog(log.id)}
                        className="p-2 text-slate-500 hover:text-danger hover:bg-danger/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Purge Record"
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock size={12} />
                    <span className="text-[10px] font-bold font-mono tracking-tighter">
                      {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                    </span>
                  </div>
                </div>
                
                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                  {log.targetCollection} [{log.targetId.slice(0, 8)}]
                </p>

                {log.before && log.after && (
                  <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10 hidden sm:block overflow-hidden">
                    <div className="flex items-center gap-4 text-[10px] font-mono leading-none tracking-tight">
                      <span className="text-slate-500 truncate opacity-70">{JSON.stringify(log.before)}</span>
                      <ArrowRight size={12} className="text-sky shrink-0" />
                      <span className="text-slate-200 truncate font-semibold">{JSON.stringify(log.after)}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      <div className="p-5 bg-white/5 border-t border-white/10 text-center sticky bottom-0">
        <p className="text-[11px] font-medium text-slate-600">End of stream</p>
      </div>
    </div>
  );
}
