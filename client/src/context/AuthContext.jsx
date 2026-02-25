import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is logged in on mount
    useEffect(() => {
        const checkAuth = async () => {
            // Check for token in URL (Google OAuth redirect)
            const params = new URLSearchParams(window.location.search);
            const urlToken = params.get('token');

            if (urlToken) {
                localStorage.setItem('voxaToken', urlToken);
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            const token = localStorage.getItem('voxaToken');
            if (token) {
                try {
                    const { data } = await authAPI.getMe();
                    setUser(data);
                } catch (err) {
                    localStorage.removeItem('voxaToken');
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const signup = async (name, email, password) => {
        try {
            setError(null);
            const { data } = await authAPI.signup({ name, email, password });
            localStorage.setItem('voxaToken', data.token);
            setUser(data);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Signup failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const { data } = await authAPI.login({ email, password });
            localStorage.setItem('voxaToken', data.token);
            setUser(data);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    const logout = () => {
        localStorage.removeItem('voxaToken');
        setUser(null);
    };

    const value = {
        user,
        loading,
        error,
        signup,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
