import React from 'react';
import FilterSidebar from '../components/FilterSidebar';
import AnalyticsPanel from '../components/AnalyticsPanel';
import ComparisonExport from '../components/ComparisonExport';

export default function AdminDashboard() {
    return (
        <div className="relative z-10 w-full min-h-screen flex">
            <FilterSidebar />

            <main className="flex-1 px-6 py-12 md:px-10 lg:px-12 overflow-y-auto">
                <div className="max-w-7xl mx-auto flex flex-col gap-10">

                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
                        <div>
                            <span className="font-mono text-[10px] tracking-[0.24em] text-indigo-400 uppercase">System Administration</span>
                            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-white mt-1">Telemetry Dashboard</h1>
                        </div>
                        <ComparisonExport />
                    </div>

                    <section className="w-full">
                        <AnalyticsPanel />
                    </section>

                </div>
            </main>
        </div>
    );
}