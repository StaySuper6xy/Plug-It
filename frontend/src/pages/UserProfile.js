import React, { useState, useContext } from 'react';
import { Container, Typography, Button, TextField, Grid, Paper } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const { user, updateUser, updateUserRole } = useContext(AuthContext);
  const [name, setName] = useState(user ? user.username : '');
  const [email, setEmail] = useState(user ? user.email : '');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateUser({ username: name, email });
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };

  const handleBecomeVendor = async () => {
    try {
      await updateUserRole('vendor');
      alert('You are now a vendor!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error becoming a vendor:', error);
      setError('Failed to become a vendor');
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
        {user.role !== 'vendor' && (
          <Button
            variant="contained"
            color="secondary"
            onClick={handleBecomeVendor}
            style={{ marginTop: '2rem' }}
          >
            Become a Vendor
          </Button>
        )}
        {error && (
          <Typography color="error" style={{ marginTop: '1rem' }}>
            {error}
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default UserProfile;


