import React, { useState } from 'react';
import { Button, Typography, Box } from '@mui/material';
import api from '../utils/api';

const ResetSystem: React.FC = () => {
  const [message, setMessage] = useState('');

  const handleReset = async () => {
    try {
      const response = await api.post('/api/reset-all');
      setMessage(response.data.message);
      // Clear local storage
      localStorage.clear();
    } catch (error) {
      console.error('Reset error:', error);
      setMessage('An error occurred during reset');
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Button variant="contained" color="secondary" onClick={handleReset}>
        Reset All Users and Tokens
      </Button>
      {message && (
        <Typography sx={{ mt: 2 }} color="info">
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default ResetSystem;