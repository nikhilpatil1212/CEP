import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuthToken, 
  setAuthToken, 
  removeAuthToken, 
  authLogin, 
  authRegister, 
  authResetPassword,
  authMe 
} from '../services/api';

const AUTH_SESSION_VERSION = 'v2_reset_all_logins';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Invalidate previous logins and restore valid authenticated session on initial mount
  useEffect(() => {
    async function restoreSession() {
      // Check session version to clear all previous logins
      if (localStorage.getItem('cc_auth_ver') !== AUTH_SESSION_VERSION) {
        removeAuthToken();
        localStorage.setItem('cc_auth_ver', AUTH_SESSION_VERSION);
        setIsLoading(false);
        return;
      }

      const storedToken = getAuthToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authMe(storedToken);
        if (currentUser) {
          setUser(currentUser);
          setToken(storedToken);
        } else {
          removeAuthToken();
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Could not restore auth session:', err);
        removeAuthToken();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  /**
   * Log in existing user
   */
  const login = async (email, password) => {
    const data = await authLogin({ email, password });
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  /**
   * Register new user
   */
  const register = async (name, email, password, confirmPassword, college, role) => {
    const data = await authRegister({ name, email, password, confirmPassword, college, role });
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  /**
   * Reset user password
   */
  const resetPassword = async (email, newPassword, confirmNewPassword) => {
    return await authResetPassword({ email, newPassword, confirmNewPassword });
  };

  /**
   * Log out user
   */
  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    resetPassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
