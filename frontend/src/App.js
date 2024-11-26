import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import UserProfile from './pages/UserProfile';
import StoreSetup from './pages/StoreSetup';
import ManageShop from './pages/ManageShop';
import ShopPage from './pages/ShopPage';
import ManageProducts from './pages/ManageProducts';
import Chat from './pages/Chat';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/store-setup" element={<StoreSetup />} />
            <Route path="/manage-shop" element={<ManageShop />} />
            <Route path="/shop/:id" element={<ShopPage />} />
            <Route path="/manage-products/:shopId" element={<ManageProducts />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:partnerId" element={<Chat />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
