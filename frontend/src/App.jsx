import React from 'react';
import UserDashboard from './pages/UserDashboard';

export default function App() {
    return (
        <div className="relative min-h-screen text-[#F8FAFC] antialiased">
            <div className="seamas-ambient" aria-hidden="true" />
            <div className="seamas-grid" aria-hidden="true" />
            <div className="relative z-10 w-full h-full">
                <UserDashboard />
            </div>
        </div>
    );
}   