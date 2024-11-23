import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Paper, Grid, TextField, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import api from '../utils/api';

function ManageInvitations() {
  const [invitations, setInvitations] = useState([]);
  const [shops, setShops] = useState([]);
  const [newInvitation, setNewInvitation] = useState({ email: '', shop: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvitations();
    fetchShops();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await api.get('/api/invitations');
      setInvitations(response.data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setError('Failed to load your invitations. Please try again.');
    }
  };

  const fetchShops = async () => {
    try {
      const response  = await api.get('/api/shops');
      setShops(response.data);
    } catch (error) {
      console.error('Error fetching shops:', error);
      setError('Failed to load your shops. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInvitation({ ...newInvitation, [name]: value });
  };

  const handleCreateInvitation = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/invitations', newInvitation);
      setNewInvitation({ email: '', shop: '' });
      fetchInvitations();
    } catch (error) {
      console.error('Error creating invitation:', error);
      setError('Failed to create invitation. Please try again.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Manage Invitations</Typography>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Create New Invitation</Typography>
        <form onSubmit={handleCreateInvitation}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={newInvitation.email}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Shop</InputLabel>
                <Select
                  name="shop"
                  value={newInvitation.shop}
                  onChange={handleInputChange}
                  required
                >
                  {shops.map((shop) => (
                    <MenuItem key={shop._id} value={shop._id}>{shop.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary">
                Create Invitation
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <Grid container spacing={3}>
        {invitations.map((invitation) => (
          <Grid item xs={12} sm={6} md={4} key={invitation._id}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="body1">Email: {invitation.email}</Typography>
              <Typography variant="body2">Shop: {shops.find(shop => shop._id === invitation.shop)?.name || 'Unknown'}</Typography>
              <Typography variant="body2">Status: {invitation.status}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default ManageInvitations;