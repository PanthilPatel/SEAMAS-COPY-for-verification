import React from 'react';

export default function AnalyticsPanel({ logs = [], recordsCount = 0 }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-xl space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-md font-bold tracking-tight text-slate-200">System Telemetry & Node Logs</h2>
                <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-mono border border-indigo-500/20 px-2.5 py-0.5 rounded-md uppercase font-bold tracking-wider">
                    Live Operational State
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
                    <div className="text-xs text-slate-500 font-semibold mb-0.5">Deduplicated Web Ingests</div>
                    <div className="text-2xl font-black text-slate-100 font-mono">{recordsCount}</div>
                </div>
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
                    <div className="text-xs text-slate-500 font-semibold mb-0.5">Active Agent Cluster Status</div>
                    <div className="text-sm font-bold text-emerald-400 flex items-center mt-1">
                        <span className="h-2 w-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                        All Workers Acknowledged
                    </div>
                </div>
            </div>

            <div>
                <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Orchestration Graph Execution Steps</div>
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {logs.length === 0 ? (
                        <div className="text-slate-600 italic py-2 text-center">No structural process telemetry stream captured yet.</div>
                    ) : (
                        logs.map((log, index) => (
                            <div key={index} className="flex items-start py-0.5 border-b border-slate-900 last:border-0">
                                <span className="text-indigo-500 mr-2 shrink-0 select-none">[{index + 1}]</span>
                                <span className="break-all">{log}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}