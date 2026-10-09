import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import { supabase } from './lib/supabase';

class RouteErrorBoundary extends React.Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('A route failed to render:', error, info.componentStack);
    }

    render() {
        if (this.state.error) {
            return (
                <main role="alert" className="min-h-screen flex items-center justify-center bg-[#070d19] p-6 text-white">
                    <section className="max-w-md rounded-2xl border border-white/10 bg-[#0f1422] p-7 text-center">
                        <h1 className="text-xl font-bold">This page could not be displayed</h1>
                        <p className="mt-3 text-sm text-neutral-300">A page module or component failed while loading. Reload to retry the page.</p>
                        <button onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-cyan-600 px-5 py-3 font-semibold hover:bg-cyan-500">Reload page</button>
                    </section>
                </main>
            );
        }
        return this.props.children;
    }
}

const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function PageLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#070d19]">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" aria-label="Loading page" />
        </div>
    );
}

const PrivateRoute = ({ children }) => {
    let session = null;
    try {
        session = JSON.parse(localStorage.getItem('seamas_user_session') || 'null');
    } catch {
        localStorage.removeItem('seamas_user_session');
    }
    if (!session?.isLoggedIn && !session?.isGuest) {
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
    if (location.pathname !== '/dashboard' && location.pathname !== '/profile' && location.pathname !== '/admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <Suspense fallback={<PageLoading />}>
            {location.pathname === '/admin' ? <AdminDashboard />
                : location.pathname === '/profile' ? <ProfilePage />
                    : <UserDashboard />}
        </Suspense>
    );
};

export default function App() {
    const [isAuthLoading, setIsAuthLoading] = React.useState(true);

    useEffect(() => {
        // Initial session check
        const syncSession = (session) => {
            if (session) {
                const profileName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
                const existing = localStorage.getItem('seamas_user_session');
                let parsedExisting = {};
                try { parsedExisting = existing ? JSON.parse(existing) : {}; } catch { /* ignore stale local data */ }
                localStorage.setItem('seamas_user_session', JSON.stringify({
                    id: session.user.id,
                    name: profileName,
                    email: session.user.email,
                    isLoggedIn: true,
                    tier: parsedExisting.id === session.user.id ? parsedExisting.tier || 'Free' : 'Free',
                    credits: parsedExisting.id === session.user.id ? parsedExisting.credits ?? 0 : 0
                }));
            }
        };
        supabase.auth.getSession()
            .then(({ data: { session } }) => syncSession(session))
            .catch((error) => console.error('Session restore failed:', error))
            .finally(() => setIsAuthLoading(false));

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                const profileName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
                const existing = localStorage.getItem('seamas_user_session');
                let parsedExisting = {};
                try { parsedExisting = existing ? JSON.parse(existing) : {}; } catch { /* ignore stale local data */ }
                localStorage.setItem('seamas_user_session', JSON.stringify({
                    id: session.user.id,
                    name: profileName,
                    email: session.user.email,
                    isLoggedIn: true,
                    tier: parsedExisting.id === session.user.id ? parsedExisting.tier || 'Free' : 'Free',
                    credits: parsedExisting.id === session.user.id ? parsedExisting.credits ?? 0 : 0
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
                    <RouteErrorBoundary>
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
                    </RouteErrorBoundary>
                </div>
            </div>
        </Router>
    );
}
