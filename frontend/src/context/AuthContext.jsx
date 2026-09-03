import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('trustid_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('trustid_token'));
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      const { access_token, user: userData } = response.data;
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('trustid_token', access_token);
      localStorage.setItem('trustid_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Authentication failed. Please verify credentials.';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const registerWithOtp = async (name, email, password, otp) => {
    setLoading(true);
    try {
      const response = await authAPI.verifyRegister({ name, email, password, otp });
      const { access_token, user: userData } = response.data;
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('trustid_token', access_token);
      localStorage.setItem('trustid_user', JSON.stringify(userData));
      localStorage.setItem('trustid_remembered_email', email);
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please check the OTP.';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('trustid_token');
    localStorage.removeItem('trustid_user');
  };

  // Exactly two demo login helpers
  const loginAsAdmin = () => login('demo.admin@example.com', 'Demo@123');
  const loginAsUser = () => login('demo.user@example.com', 'Demo@123');

  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  const isUser = (user?.role || '').toLowerCase() === 'user';
  const canCreate = true;

  // Background session verification on mount
  useEffect(() => {
    if (token) {
      authAPI.getProfile().then(res => {
        if (res.data) {
          setUser(res.data);
          localStorage.setItem('trustid_user', JSON.stringify(res.data));
        }
      }).catch(() => {
        // Token expired or invalid
        logout();
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      registerWithOtp,
      loginAsAdmin,
      loginAsUser,
      isAdmin,
      isUser,
      canCreate
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
