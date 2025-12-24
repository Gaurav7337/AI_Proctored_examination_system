import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  
  const API_BASE_URL = 'http://10.131.60.64:5000/api'; 

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try { setUser(JSON.parse(storedUser)); } 
        catch (e) { localStorage.removeItem('user'); }
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const getHeaders = () => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    return {
        'Content-Type': 'application/json',
        'user-id': storedUser.id ? String(storedUser.id) : ''
    };
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, API_BASE_URL, getHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);