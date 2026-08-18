import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import UserDashboard from './pages/UserDashboard';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import { supabase } from './lib/supabase';

const PrivateRoute = ({ children }) => {
    const session = localStorage.getItem('seamas_user_session');
    if (!session) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

const PublicRoute = ({ children }) => {
    return children;
};

const ProtectedLayout = () => {
    const location = useLocation();
    
    // Redirect unknown authenticated routes to dashboard
    if (location.pathname !== '/dashboard' && location.pathname !== '/profile') {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="w-full h-full">
            <div style={{ display: location.pathname === '/profile' ? 'none' : 'block', width: '100%', height: '100%' }}>
                <UserDashboard />
            </div>
            {location.pathname === '/profile' && <ProfilePage />}
        </div>
    );
};

export default function App() {
    const [isAuthLoading, setIsAuthLoading] = React.useState(true);

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                const profileName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
                const existing = localStorage.getItem('seamas_user_session');
                const parsedExisting = existing ? JSON.parse(existing) : {};
                localStorage.setItem('seamas_user_session', JSON.stringify({
                    id: session.user.id,
                    name: profileName,
                    email: session.user.email,
                    isLoggedIn: true,
                    tier: parsedExisting.tier || 'Free',
                    credits: parsedExisting.credits ?? 50
                }));
            }
            setIsAuthLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                const profileName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
                const existing = localStorage.getItem('seamas_user_session');
                const parsedExisting = existing ? JSON.parse(existing) : {};
                localStorage.setItem('seamas_user_session', JSON.stringify({
                    id: session.user.id,
                    name: profileName,
                    email: session.user.email,
                    isLoggedIn: true,
                    tier: parsedExisting.tier || 'Free',
                    credits: parsedExisting.credits ?? 50
                }));
            } else if (event === 'SIGNED_OUT') {
                localStorage.removeItem('seamas_user_session');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#070d19]">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <Router>
            <div className="relative min-h-screen text-[#F8FAFC] antialiased">
                <div className="seamas-ambient" aria-hidden="true" />
                <div className="seamas-grid" aria-hidden="true" />
                <div className="relative z-10 w-full h-full">
                    <Routes>
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <AuthPage defaultIsLogin={true} />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/signup"
                            element={
                                <PublicRoute>
                                    <AuthPage defaultIsLogin={false} />
                                </PublicRoute>
                            }
                        />
                        <Route 
                            path="/*" 
                            element={
                                <PrivateRoute>
                                    <ProtectedLayout />
                                </PrivateRoute>
                            } 
                        />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}