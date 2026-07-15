import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulated mock authentication for development setup
        // For production, connect this hook to your active Supabase Client SDK instance
        setTimeout(() => {
            setUser({
                id: 'usr_dev_99',
                email: 'panthil@example.com',
                role: 'user' // Toggle between 'user' and 'admin' to verify path privileges
            });
            setLoading(false);
        }, 500);
    }, []);

    const login = async (email, password) => {
        // Add real authorization adapter execution here
        setUser({ id: 'usr_dev_99', email, role: 'user' });
    };

    const logout = async () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);