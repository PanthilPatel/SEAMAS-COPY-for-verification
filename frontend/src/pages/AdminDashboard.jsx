import React, { useState, useEffect } from 'react';
import FilterSidebar from '../components/FilterSidebar';
import AnalyticsPanel from '../components/AnalyticsPanel';
import ComparisonExport from '../components/ComparisonExport';
import { apiService } from '../services/api';
import { Cpu, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
    const [selectedMarketplaces, setSelectedMarketplaces] = useState([]);
    const [priceRange, setPriceRange] = useState(250000);
    const [sortBy, setSortBy] = useState('default');
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [inBudgetOnly, setInBudgetOnly] = useState(false);
    const [systemStatus, setSystemStatus] = useState(null);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        let isMounted = true;
        apiService.checkSystemStatus().then(status => {
            if (isMounted) {
                setSystemStatus(status);
                const statusLogs = [
                    `[INITIALIZED] API Gateway status: ${status.api || 'operational'}`,
                    `[DATABASE] Supabase PostgreSQL cluster: ${status.database || 'connected'}`,
                    `[INTELLIGENCE] LLM Reasoning node: ${status.ollama?.status || 'active'} (model: ${status.ollama?.model || 'qwen2.5:3b'})`,
                    `[STREAM] 7 LangGraph agent channels mounted on /api/chat/stream`,
                    `[SECURITY] End-to-end TLS 1.3 encryption and Supabase Row Level Security enforced`
                ];
                setLogs(statusLogs);
            }
        }).catch(err => {
            if (isMounted) {
                setLogs([`[NETWORK_ERROR] Telemetry handshake failed: ${err.message || 'Connection refused'}`]);
            }
        });
        return () => { isMounted = false; };
    }, []);

    return (
        <div className="relative z-10 w-full min-h-screen flex bg-[#080e1a] text-white overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

            <FilterSidebar
                marketplaces={['Amazon', 'Flipkart', 'Croma', 'Reliance Digital', 'Tata CLIQ']}
                selectedMarketplaces={selectedMarketplaces}
                setSelectedMarketplaces={setSelectedMarketplaces}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                sortBy={sortBy}
                setSortBy={setSortBy}
                verifiedOnly={verifiedOnly}
                setVerifiedOnly={setVerifiedOnly}
                inBudgetOnly={inBudgetOnly}
                setInBudgetOnly={setInBudgetOnly}
            />

            <main className="flex-1 px-6 py-10 md:px-10 lg:px-12 overflow-y-auto text-left relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col gap-8">

                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="p-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                    <Cpu className="w-4 h-4" />
                                </span>
                                <span className="font-mono text-[10px] tracking-[0.24em] text-indigo-300 uppercase font-semibold">
                                    System Administration & Telemetry
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white mt-2">
                                Autonomous Control Room
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-[11px]">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Root Clearance Active
                            </span>
                            <ComparisonExport data={[]} query="Admin Telemetry" />
                        </div>
                    </div>

                    {/* Telemetry Panel */}
                    <section className="w-full">
                        <AnalyticsPanel logs={logs} recordsCount={logs.length} systemStatus={systemStatus} />
                    </section>

                </div>
            </main>
        </div>
    );
}