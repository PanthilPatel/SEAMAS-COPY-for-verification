import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserDashboard from './pages/UserDashboard';
import AuthPage from './pages/AuthPage';

const PrivateRoute = ({ children }) => {
    const session = localStorage.getItem('seamas_user_session');
    if (!session) {
        return <Navigate to="/" replace />;
    }
    return children;
};

const PublicRoute = ({ children }) => {
    const session = localStorage.getItem('seamas_user_session');
    if (session) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

export default function App() {
    return (
        <Router>
            <div className="relative min-h-screen text-[#F8FAFC] antialiased">
                <div className="seamas-ambient" aria-hidden="true" />
                <div className="seamas-grid" aria-hidden="true" />
                <div className="relative z-10 w-full h-full">
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <PublicRoute>
                                    <AuthPage />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <PrivateRoute>
                                    <UserDashboard />
                                </PrivateRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}   