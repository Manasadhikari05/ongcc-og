import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, LoginCredentials, AuthResponse, User } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use environment variable for API URL, fallback to '/api' for local development
  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
  
  console.log('🔗 Auth API Base URL:', API_BASE_URL);

  useEffect(() => {
    // Check for stored auth data on app load
    const storedToken = localStorage.getItem('ongc-auth-token');
    const storedUser = localStorage.getItem('ongc-auth-user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        
        // Verify token is still valid
        verifyToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        logout();
      }
    }
    
    setIsLoading(false);
  }, []);

  const verifyToken = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    }
  };

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      
      console.log('🔐 [AuthContext] Making login request to:', `${API_BASE_URL}/auth/login`);
      console.log('🔐 [AuthContext] Request body:', credentials);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
      
      console.log('🔐 [AuthContext] Response status:', response.status);
      console.log('🔐 [AuthContext] Response ok:', response.ok);
      
      const data: AuthResponse = await response.json();
      console.log('🔐 [AuthContext] Response data:', data);
      
      if (data.success && data.token && data.user) {
        console.log('✅ [AuthContext] Login successful, setting user and token');
        setToken(data.token);
        setUser(data.user);
        
        // Store in localStorage
        localStorage.setItem('ongc-auth-token', data.token);
        localStorage.setItem('ongc-auth-user', JSON.stringify(data.user));
        
        console.log('✅ [AuthContext] User and token stored in localStorage');
      } else {
        console.log('❌ [AuthContext] Login failed - missing success, token, or user');
        console.log('❌ [AuthContext] success:', data.success);
        console.log('❌ [AuthContext] token:', !!data.token);
        console.log('❌ [AuthContext] user:', !!data.user);
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ongc-auth-token');
    localStorage.removeItem('ongc-auth-user');
    localStorage.removeItem('ongc-applicants'); // Clear applicant data on logout
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};