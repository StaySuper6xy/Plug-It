import React, { useState, useContext } from 'react';
import { Container, Typography, TextField, Button, Box, Paper, Switch, FormControlLabel } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import api from '../utils/api';

const StoreSetup = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    isPublic: true,
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/shops', formData);
      alert('Store created successfully');
      setFormData({
        name: '',
        description: '',
        address: '',
        latitude: '',
        longitude: '',
        isPublic: true,
      });
    } catch (error) {
      console.error('Error creating store:', error);
      alert('Failed to create store');
    }
  };

  if (!user) {
    return <Typography>Please log in to set up a store.</Typography>;
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Set Up Your Store
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Store Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
            required
          />
          <TextField
            fullWidth
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Latitude"
            name="latitude"
            type="number"
            value={formData.latitude}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Longitude"
            name="longitude"
            type="number"
            value={formData.longitude}
            onChange={handleChange}
            margin="normal"
            required
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.isPublic}
                onChange={handleChange}
                name="isPublic"
                color="primary"
              />
            }
            label="Public Store"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
          >
            Create Store
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default StoreSetup;
