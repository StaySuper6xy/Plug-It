import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Home = () => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h2" gutterBottom>
          Welcome to Plug-It
        </Typography>
        <Typography variant="h5" align="center" color="text.secondary" paragraph>
          Discover and connect with local shops in your area.
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button variant="contained" color="primary" component={RouterLink} to="/login" sx={{ mr: 2 }}>
            Login
          </Button>
          <Button variant="outlined" color="primary" component={RouterLink} to="/register">
            Register
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Home;
