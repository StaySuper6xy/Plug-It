import React, { useState, useContext } from 'react';
import { Container, Typography, Button, TextField, Grid, Paper } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import api from '../utils/api';

const UserProfile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [name, setName] = useState(user ? user.name : '');
  const [email, setEmail] = useState(user ? user.email : '');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/users/profile', { name, email });
      updateUser(response.data);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleCreateShop = async () => {
    try {
      const response = await api.post('/shops', { name: 'My First Shop', description: 'Welcome to my shop!' });
      updateUser({ ...user, shops: [...(user.shops || []), response.data._id] });
      alert('Shop created successfully');
    } catch (error) {
      console.error('Error creating shop:', error);
      alert('Failed to create shop');
    }
  };

  if (!user) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} style={{ padding: '2rem', marginTop: '2rem' }}>
        <Typography variant="h4" gutterBottom>
          User Profile
        </Typography>
        <form onSubmit={handleUpdateProfile}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary">
                Update Profile
              </Button>
            </Grid>
          </Grid>
        </form>
        {(!user.shops || user.shops.length === 0) && (
          <Button
            variant="contained"
            color="secondary"
            onClick={handleCreateShop}
            style={{ marginTop: '2rem' }}
          >
            Create Your First Shop
          </Button>
        )}
      </Paper>
    </Container>
  );
};

export default UserProfile;