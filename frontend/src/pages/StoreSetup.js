import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Stepper, Step, StepLabel, Box } from '@mui/material';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const steps = ['Basic Information', 'Location', 'Visibility'];

export default function StoreSetup() {
  const [activeStep, setActiveStep] = useState(0);
  const [storeData, setStoreData] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    isPublic: true
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setStoreData({ ...storeData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/shops', storeData);
      console.log('Store created:', response.data);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating store:', error);
      setError('Failed to create store. Please try again.');
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField
              fullWidth
              label="Store Name"
              name="name"
              value={storeData.name}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={storeData.description}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={4}
            />
          </>
        );
      case 1:
        return (
          <>
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={storeData.address}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Latitude"
              name="latitude"
              value={storeData.latitude}
              onChange={handleChange}
              margin="normal"
              type="number"
            />
            <TextField
              fullWidth
              label="Longitude"
              name="longitude"
              value={storeData.longitude}
              onChange={handleChange}
              margin="normal"
              type="number"
            />
          </>
        );
      case 2:
        return (
          <TextField
            select
            fullWidth
            label="Visibility"
            name="isPublic"
            value={storeData.isPublic}
            onChange={handleChange}
            margin="normal"
            SelectProps={{
              native: true,
            }}
          >
            <option value={true}>Public</option>
            <option value={false}>Private</option>
          </TextField>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" component="h1" gutterBottom>
        Set Up Your Store
      </Typography>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <form onSubmit={handleSubmit}>
        {getStepContent(activeStep)}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
          >
            {activeStep === steps.length - 1 ? 'Create Store' : 'Next'}
          </Button>
        </Box>
      </form>
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Container>
  );
}
