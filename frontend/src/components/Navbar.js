import React, { useContext } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Box } from '@mui/material';
import { Link as RouterLink, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Home, Store, ShoppingCart, Person, ExitToApp, Chat } from '@mui/icons-material';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

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
              <IconButton color="inherit" component={RouterLink} to="/store-setup">
                <Store />
              </IconButton>
              <IconButton color="inherit" component={RouterLink} to="/manage-shop">
                <ShoppingCart />
              </IconButton>
              <IconButton color="inherit" component={RouterLink} to="/chat">
                <Chat />
              </IconButton>
              <IconButton color="inherit" component={RouterLink} to="/profile">
                <Person />
              </IconButton>
              <Button color="inherit" onClick={logout}>
                <ExitToApp />
              </Button>
            </>
          )}
          {!user && (
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button color="inherit" component={Link} to="/register">
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
