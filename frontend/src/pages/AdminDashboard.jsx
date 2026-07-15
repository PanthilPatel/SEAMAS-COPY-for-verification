import React, { useState } from 'react';
import AnalyticsPanel from '../components/AnalyticsPanel';

export default function AdminDashboard() {
    // Sample developer state metrics to simulate performance tracking layers
    const [mockLogs] = useState([
        '[ORCHESTRATOR] Central manager tracking initiated...',
        '[SearchTool] Page 1: SearXNG returned 20 raw results, 20 new unique record(s) added',
        '[SearchTool] Page 2: SearXNG returned 20 raw results, 10 new unique record(s) added',
        '--- BUDGET ADVISOR AGENT INITIATED ---',
        '--- OLLAMA PRICE COMPARISON AGENT INITIATED ---',
        'Successfully extracted structured retail offer entries.',
        '--- OLLAMA REVIEW ANALYZER AGENT INITIATED ---',
        'Successfully extracted and structured sentiment vectors.',
        '--- RECOMMENDATION AGENT INITIATED ---',
        '[ORCHESTRATOR] All agent nodes processed successfully.'
    ]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">S</div>
                        <span className="text-md font-bold tracking-tight text-white">SEAMAS <span className="text-indigo-400 font-bold text-xs ml-1 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">Admin Workspace</span></span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">Node Security Level 3 Access</div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-100">Framework Infrastructure Matrix</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Monitor system processing pipelines, agent health parameters, and token transactions.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gateway Port Latency</div>
                        <div className="text-xl font-black text-slate-200 mt-2 font-mono">142ms <span className="text-xs font-normal text-emerald-400 ml-1">Normal</span></div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">FastAPI Endpoint Requests</div>
                        <div className="text-xl font-black text-slate-200 mt-2 font-mono">1,842 <span className="text-xs font-normal text-slate-400 ml-1">24 hrs</span></div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ollama Token Load Status</div>
                        <div className="text-xl font-black text-slate-200 mt-2 font-mono">0.02% <span className="text-xs font-normal text-emerald-400 ml-1">Idle Ready</span></div>
                    </div>
                </div>

                <AnalyticsPanel logs={mockLogs} recordsCount={48} />
            </main>
        </div>
    );
}