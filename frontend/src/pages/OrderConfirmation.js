import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Typography, Paper, CircularProgress, Button, Box } from '@mui/material';
import api from '../utils/api';

const OrderConfirmation = () => {
  const [orderStatus, setOrderStatus] = useState('pending');
  const [orderDetails, setOrderDetails] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;

  useEffect(() => {
    if (!orderId) {
      navigate('/cart');
      return;
    }

    const checkOrderStatus = async () => {
      try {
        const response = await api.get(`/orders/${orderId}/status`);
        setOrderStatus(response.data.status);
        setOrderDetails(response.data.orderDetails);
      } catch (error) {
        console.error('Error fetching order status:', error);
      }
    };

    const intervalId = setInterval(checkOrderStatus, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [orderId, navigate]);

  if (!orderId) {
    return null;
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ mt: 3, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Order Confirmation
        </Typography>
        <Typography variant="body1" paragraph>
          Your order has been sent to the vendor. Please wait for their response.
        </Typography>
        <Typography variant="h6" gutterBottom>
          Order Status: {orderStatus}
        </Typography>
        {orderStatus === 'pending' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {orderStatus === 'accepted' && (
          <>
            <Typography variant="body1" paragraph>
              Great news! Your order has been accepted by the vendor.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate(`/chat/${orderDetails.chatId}`)}
            >
              Start Chatting with Vendor
            </Button>
          </>
        )}
        {orderStatus === 'rejected' && (
          <>
            <Typography variant="body1" paragraph>
              Unfortunately, your order has been rejected by the vendor.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/cart')}
            >
              Return to Cart
            </Button>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default OrderConfirmation;
