import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, List, ListItem, ListItemText, 
  ListItemSecondaryAction, IconButton, Button, TextField, 
  FormControl, InputLabel, Select, MenuItem, Box, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Remove as RemoveIcon, MyLocation as MyLocationIcon } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import api from '../utils/api';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [location, setLocation] = useState(null);
  const [locationDialog, setLocationDialog] = useState(false);
  const [mapCenter] = useState([0, 0]);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get('/cart');
      console.log('Fetched cart:', response.data);
      setCart(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to fetch cart. Please try again.');
      setLoading(false);
    }
  };

  const updateItemQuantity = async (productId, newQuantity) => {
    try {
      console.log(`Updating quantity for product ${productId} to ${newQuantity}`);
      await api.put(`/cart/update/${productId}`, { quantity: newQuantity });
      await fetchCart();
      setSnackbar({ open: true, message: 'Cart updated successfully' });
    } catch (err) {
      console.error('Error updating item quantity:', err);
      setError('Failed to update item quantity. Please try again.');
      setSnackbar({ open: true, message: 'Failed to update cart' });
    }
  };

  const removeItem = async (productId) => {
    try {
      console.log(`Removing product ${productId} from cart`);
      await api.delete(`/cart/remove/${productId}`);
      await fetchCart();
      setSnackbar({ open: true, message: 'Item removed from cart' });
    } catch (err) {
      console.error('Error removing item:', err);
      setError('Failed to remove item. Please try again.');
      setSnackbar({ open: true, message: 'Failed to remove item' });
    }
  };

  const updateFulfillmentOption = async (option) => {
    try {
      console.log(`Updating fulfillment option to ${option}`);
      await api.put('/cart/fulfillment', { fulfillmentOption: option });
      await fetchCart();
      setSnackbar({ open: true, message: 'Fulfillment option updated' });
    } catch (err) {
      console.error('Error updating fulfillment option:', err);
      setError('Failed to update fulfillment option. Please try again.');
      setSnackbar({ open: true, message: 'Failed to update fulfillment option' });
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
          setLocation({ lat: latitude, lng: longitude });
          setSnackbar({ open: true, message: 'Location updated successfully' });
        },
        (error) => {
          console.error('Error getting location:', error);
          setSnackbar({ open: true, message: 'Failed to get location' });
        }
      );
    } else {
      setSnackbar({ open: true, message: 'Geolocation is not supported by your browser' });
    }
    setLocationDialog(false);
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setLocation(e.latlng);
      },
    });

    return location ? <Marker position={location} /> : null;
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
      {loading ? (
        <Typography>Loading cart...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : !cart || cart.items.length === 0 ? (
        <Typography>Your cart is empty.</Typography>
      ) : (
        <>
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
          <FormControl fullWidth margin="normal">
            <InputLabel id="fulfillment-option-label">Fulfillment Option</InputLabel>
            <Select
              labelId="fulfillment-option-label"
              value={cart.fulfillmentOption || ''}
              onChange={(e) => updateFulfillmentOption(e.target.value)}
            >
              <MenuItem value="pickup">Pickup</MenuItem>
              <MenuItem value="meetup">Meetup</MenuItem>
              <MenuItem value="delivery">Delivery</MenuItem>
            </Select>
          </FormControl>
          {(cart.fulfillmentOption === 'meetup' || cart.fulfillmentOption === 'delivery') && (
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
          >
            Proceed to Checkout
          </Button>
          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={handleCloseSnackbar}
            message={snackbar.message}
          />
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
        </>
      )}
    </Container>
  );
};

export default Cart;