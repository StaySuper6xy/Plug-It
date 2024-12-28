import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Typography, List, ListItem, ListItemText, 
  ListItemSecondaryAction, IconButton, Button, TextField, 
  Box, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Radio, RadioGroup, FormControlLabel
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Remove as RemoveIcon, MyLocation as MyLocationIcon } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Circle, Polygon, useMapEvents } from 'react-leaflet';
import api from '../utils/api';
import { decryptAvailabilityArea } from '../utils/encryption';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [location, setLocation] = useState(null);
  const [locationDialog, setLocationDialog] = useState(false);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [availabilityArea, setAvailabilityArea] = useState(null);
  const [fulfillmentOption, setFulfillmentOption] = useState('');
  const [shopDetails, setShopDetails] = useState(null);

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
      const shop = response.data;
      console.log('Fetched shop details:', shop);
      setShopDetails(shop);

      if (shop.encryptedAvailabilityArea) {
        const key = localStorage.getItem(`shop_${shopId}_key`);
        if (key) {
          const decryptedArea = decryptAvailabilityArea(shop.encryptedAvailabilityArea, key);
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
    setLocationDialog(true);
  };

  const handleConfirmLocation = () => {
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
          setSnackbar({ open: true, message: 'Failed to get location', severity: 'error' });
        }
      );
    } else {
      setSnackbar({ open: true, message: 'Geolocation is not supported by your browser', severity: 'error' });
    }
    setLocationDialog(false);
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const newLocation = e.latlng;
        if (isWithinAvailabilityArea(newLocation)) {
          setLocation(newLocation);
        } else {
          setSnackbar({ open: true, message: 'Selected location is outside the shop\'s availability area', severity: 'warning' });
        }
      },
    });

    return location ? <Marker position={location} /> : null;
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

  const isPointInPolygon = (point, polygon) => {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      
      const intersect = ((yi > point.lat) !== (yj > point.lat))
          && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
      if (intersect) isInside = !isInside;
    }
    return isInside;
  };

  const handleFulfillmentOptionChange = (event) => {
    setFulfillmentOption(event.target.value);
    setLocation(null);
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
      <List>
        {cart.items.map((item) => (
          <ListItem key={item.product._id}>
            <ListItemText
              primary={item.product.name}
              secondary={`Price: $${item.price.toFixed(2)}`}
            />
            <Box display="flex" alignItems="center" mr={2}>
              <IconButton onClick={() => updateItemQuantity(item.product._id, item.quantity - 1)} disabled={item.quantity <= 1}>
                <RemoveIcon />
              </IconButton>
              <TextField
                value={item.quantity}
                onChange={(e) => updateItemQuantity(item.product._id, parseInt(e.target.value) || 1)}
                type="number"
                inputProps={{ min: 1 }}
                style={{ width: 50, margin: '0 8px' }}
              />
              <IconButton onClick={() => updateItemQuantity(item.product._id, item.quantity + 1)}>
                <AddIcon />
              </IconButton>
            </Box>
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="delete" onClick={() => removeItem(item.product._id)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Typography variant="h6" gutterBottom>
        Total: ${cart.totalAmount.toFixed(2)}
      </Typography>
      
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>Fulfillment Options</Typography>
        {shopDetails && shopDetails.fulfillmentOptions ? (
          <RadioGroup value={fulfillmentOption} onChange={handleFulfillmentOptionChange}>
            {Object.entries(shopDetails.fulfillmentOptions).map(([option, isAvailable]) => 
              isAvailable && (
                <FormControlLabel 
                  key={option} 
                  value={option} 
                  control={<Radio />} 
                  label={option.charAt(0).toUpperCase() + option.slice(1)} 
                />
              )
            )}
          </RadioGroup>
        ) : (
          <Typography color="error">No fulfillment options available</Typography>
        )}
      </Box>

      {(fulfillmentOption === 'delivery' || fulfillmentOption === 'meetup') && (
        <Box mt={2}>
          <Button
            variant="outlined"
            startIcon={<MyLocationIcon />}
            onClick={handleGetLocation}
          >
            Use Current Location
          </Button>
          <Box mt={2} height={300}>
            <MapContainer 
              center={mapCenter} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker />
              {availabilityArea && availabilityArea.type === 'Circle' && (
                <Circle 
                  center={availabilityArea.center} 
                  radius={availabilityArea.radius} 
                  pathOptions={{ color: 'blue' }}
                />
              )}
              {availabilityArea && availabilityArea.type === 'Polygon' && (
                <Polygon 
                  positions={availabilityArea.coordinates[0]} 
                  pathOptions={{ color: 'blue' }}
                />
              )}
            </MapContainer>
          </Box>
          {location && (
            <Typography variant="body1" mt={2}>
              Selected Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </Typography>
          )}
        </Box>
      )}
      
      <Button
        variant="contained"
        color="primary"
        fullWidth
        style={{ marginTop: 16 }}
        onClick={() => {/* Implement checkout logic */}}
        disabled={!fulfillmentOption || ((fulfillmentOption === 'delivery' || fulfillmentOption === 'meetup') && !location)}
      >
        Proceed to Checkout
      </Button>
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Dialog
        open={locationDialog}
        onClose={() => setLocationDialog(false)}
      >
        <DialogTitle>Use Current Location</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will access your device's location. Do you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLocationDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmLocation} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Cart;