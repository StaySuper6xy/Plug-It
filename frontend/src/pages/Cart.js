import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Typography, 
  Snackbar, Alert,
  Stepper, Step, StepLabel, Paper
} from '@mui/material';
import api from '../utils/api';
import { decryptAvailabilityArea } from '../utils/encryption';
import CartContents from './CartContents';
import FulfillmentOptions from './FulfillmentOptions';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [location, setLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [availabilityArea, setAvailabilityArea] = useState(null);
  const [fulfillmentOption, setFulfillmentOption] = useState('');
  const [shopDetails, setShopDetails] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  const fetchCart = useCallback(async () => {
    try {
      const response = await api.get('/cart');
      console.log('Fetched cart:', response.data);
      setCart(response.data);
      if (response.data.shop) {
        await fetchShopDetails(response.data.shop);
      } else {
        console.error('No shop information in cart data');
        setError('Unable to load shop information. Please try again.');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to fetch cart. Please try again.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const fetchShopDetails = async (shopId) => {
    try {
      const response = await api.get(`/shops/${shopId}`);
      const shop = response.data.shop;
      console.log('Fetched shop details:', shop);
      setShopDetails(shop);

      if (shop.encryptedAvailabilityArea) {
        const key = localStorage.getItem(`shop_${shopId}_key`);
        if (key) {
          const decryptedArea = decryptAvailabilityArea(shop.encryptedAvailabilityArea, key);
          console.log('Decrypted availability area:', decryptedArea);
          setAvailabilityArea(decryptedArea);
          if (decryptedArea.type === 'Circle') {
            setMapCenter(decryptedArea.center);
          } else if (decryptedArea.type === 'Polygon') {
            setMapCenter(decryptedArea.coordinates[0][0]);
          }
        } else {
          console.error('No encryption key found for shop');
        }
      } else {
        console.warn('No encrypted availability area for shop');
      }

      if (shop.fulfillmentOptions) {
        console.log('Shop fulfillment options:', shop.fulfillmentOptions);
        const availableOptions = Object.entries(shop.fulfillmentOptions)
          .filter(([_, value]) => value)
          .map(([key]) => key);
        console.log('Available fulfillment options:', availableOptions);
        if (availableOptions.length > 0) {
          setFulfillmentOption(availableOptions[0]);
        } else {
          console.warn('No active fulfillment options for this shop');
        }
      } else {
        console.error('No fulfillment options found for shop');
      }
    } catch (err) {
      console.error('Error fetching shop details:', err);
      setError('Failed to fetch shop details. Please try again.');
    }
  };

  const updateItemQuantity = async (productId, newQuantity) => {
    try {
      await api.put(`/cart/update/${productId}`, { quantity: newQuantity });
      await fetchCart();
      setSnackbar({ open: true, message: 'Cart updated successfully', severity: 'success' });
    } catch (err) {
      console.error('Error updating item quantity:', err);
      setError('Failed to update item quantity. Please try again.');
      setSnackbar({ open: true, message: 'Failed to update cart', severity: 'error' });
    }
  };

  const removeItem = async (productId) => {
    try {
      await api.delete(`/cart/remove/${productId}`);
      await fetchCart();
      setSnackbar({ open: true, message: 'Item removed from cart', severity: 'success' });
    } catch (err) {
      console.error('Error removing item:', err);
      setError('Failed to remove item. Please try again.');
      setSnackbar({ open: true, message: 'Failed to remove item', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          
          if (isWithinAvailabilityArea(newLocation)) {
            setLocation(newLocation);
            setSnackbar({ open: true, message: 'Location updated successfully', severity: 'success' });
          } else {
            setSnackbar({ open: true, message: 'Location is outside the shop\'s availability area', severity: 'warning' });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'Failed to get location';
          if (error.code === 1) {
            errorMessage = 'Location access denied. Please enable location services and try again.';
          } else if (error.code === 2) {
            errorMessage = 'Unable to determine your location. Please try again or use another method.';
          } else if (error.code === 3) {
            errorMessage = 'Location request timed out. Please try again.';
          }
          setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setSnackbar({ open: true, message: 'Geolocation is not supported by your browser', severity: 'error' });
    }
  };

  const isWithinAvailabilityArea = (location) => {
    if (!availabilityArea) return true;

    if (availabilityArea.type === 'Circle') {
      const distance = calculateDistance(location, availabilityArea.center);
      return distance <= availabilityArea.radius;
    } else if (availabilityArea.type === 'Polygon') {
      return isPointInPolygon(location, availabilityArea.coordinates[0]);
    }

    return false;
  };

  const isPointInPolygon = (point, polygon) => {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][1], yi = polygon[i][0];
      const xj = polygon[j][1], yj = polygon[j][0];
      
      const intersect = ((yi > point.lat) !== (yj > point.lat))
          && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
      if (intersect) isInside = !isInside;
    }
    return isInside;
  };

  const calculateDistance = (point1, point2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2[0] * Math.PI / 180;
    const Δφ = (point2[0] - point1.lat) * Math.PI / 180;
    const Δλ = (point2[1] - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };


  if (loading) {
    return <Typography>Loading cart...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!cart || cart.items.length === 0) {
    return <Typography>Your cart is empty.</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Your Cart
      </Typography>
      <Stepper activeStep={activeStep} alternativeLabel>
        <Step>
          <StepLabel>Cart Contents</StepLabel>
        </Step>
        <Step>
          <StepLabel>Fulfillment Options</StepLabel>
        </Step>
      </Stepper>
      <Paper elevation={3} sx={{ mt: 3, p: 3 }}>
        {activeStep === 0 ? (
          <CartContents
            cart={cart}
            updateItemQuantity={updateItemQuantity}
            removeItem={removeItem}
            onNext={() => setActiveStep(1)}
          />
        ) : (
          <FulfillmentOptions
            shopDetails={shopDetails}
            fulfillmentOption={fulfillmentOption}
            setFulfillmentOption={setFulfillmentOption}
            location={location}
            setLocation={setLocation}
            availabilityArea={availabilityArea}
            mapCenter={mapCenter}
            handleGetLocation={handleGetLocation}
            isWithinAvailabilityArea={isWithinAvailabilityArea}
            onBack={() => setActiveStep(0)}
            onCheckout={() => {/* Implement checkout logic */}}
          />
        )}
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Cart;
