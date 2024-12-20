import React, { useContext, useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Box, Badge } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Home, Store, Settings, Person, ExitToApp, Chat, ShoppingCart } from '@mui/icons-material';
import api from '../utils/api';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    const fetchCartItemCount = async () => {
      if (user) {
        try {
          const response = await api.get('/cart');
          setCartItemCount(response.data.items.length);
        } catch (error) {
          console.error('Error fetching cart:', error);
        }
      }
    };

    fetchCartItemCount();
  }, [user]);

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Plug-It
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="inherit" component={RouterLink} to="/dashboard">
            <Home />
          </IconButton>
          {user && (
            <>
              <IconButton color="inherit" component={RouterLink} to="/chat">
                <Chat />
              </IconButton>
              <IconButton color="inherit" component={RouterLink} to="/profile">
                <Person />
              </IconButton>
              <IconButton color="inherit" component={RouterLink} to="/cart">
                <Badge badgeContent={cartItemCount} color="secondary">
                  <ShoppingCart />
                </Badge>
              </IconButton>
              {user.role === 'vendor' && (
                <>
                  <IconButton 
                    color="inherit" 
                    component={RouterLink} 
                    to="/store-setup"
                    title="Create Shop"
                  >
                    <Store />
                  </IconButton>
                  {user.shops && user.shops.length > 0 && (
                    <IconButton 
                      color="inherit" 
                      component={RouterLink} 
                      to={`/manage-shop/${user.shops[0]._id}`}
                      title="Manage Shop"
                    >
                      <Settings />
                    </IconButton>
                  )}
                </>
              )}
              <Button color="inherit" onClick={logout}>
                <ExitToApp />
              </Button>
            </>
          )}
          {!user && (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;