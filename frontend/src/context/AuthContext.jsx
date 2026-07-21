import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setUser({
                id: 'usr_dev_99',
                email: 'admin@example.com',
                role: 'admin'
            });
            setLoading(false);
        }, 500);
    }, []);

    const login = async (email, password) => {
        setUser({ id: 'usr_dev_99', email, role: 'admin' });
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