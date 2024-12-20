import React, { useState } from 'react';
import { Button, CircularProgress, Snackbar } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import api from '../utils/api';

const AddToCartButton = ({ product, shopId }) => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      const response = await api.post('/cart/add', {
        productId: product._id,
        quantity: 1,
        shopId: shopId,
        price: product.price
      });
      console.log('Product added to cart:', response.data);
      setSnackbar({ open: true, message: 'Product added to cart successfully!' });
      // You can add additional logic here to update the cart state in your app
    } catch (error) {
      console.error('Error adding product to cart:', error);
      setSnackbar({ open: true, message: 'Failed to add product to cart. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        size="large"
        fullWidth
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ShoppingCartIcon />}
        onClick={handleAddToCart}
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? 'Adding...' : 'Add to Cart'}
      </Button>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </>
  );
};

export default AddToCartButton;