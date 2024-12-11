import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserData = async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          await fetchUserData();
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        localStorage.removeItem('token');
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      await fetchUserData();
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login');
  };

  const register = async (username, email, password) => {
    try {
      const response = await api.post('/users', { username, email, password });
      localStorage.setItem('token', response.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      await fetchUserData();
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const updateUser = async () => {
    try {
      await fetchUserData();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const createShop = async (shopData) => {
    try {
      const response = await api.post('/shops', shopData);
      await fetchUserData();
      return response.data;
    } catch (error) {
      console.error('Error creating shop:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateUser, createShop, loading }}>
      {children}
    </AuthContext.Provider>
  );
};