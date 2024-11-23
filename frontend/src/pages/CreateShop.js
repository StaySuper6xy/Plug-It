import React, { useState, useContext } from 'react';
import { Container, Typography, TextField, Button, Box, Switch, FormControlLabel } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const CreateShop = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    isPublic: true,
  });
  const { user, updateUserRole } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: name === 'isPublic' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/shops', formData);
      console.log('Shop created:', response.data);
      
      if (user.role !== 'seller') {
        // Update user role to seller
        await api.put('/api/users/become-seller');
        updateUserRole('seller');
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating shop:', error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create a New Shop
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Shop Name"
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
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.isPublic}
                onChange={handleChange}
                name="isPublic"
              />
            }
            label="Public Shop"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Create Shop
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default CreateShop;
