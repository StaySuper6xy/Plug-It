import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import api from '../utils/api';

const AddToCartButton = ({ product, shopId }) => {
  const [loading, setLoading] = useState(false);

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
      // You can add a success message or update the UI here
    } catch (error) {
      console.error('Error adding product to cart:', error);
      // You can add an error message here
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
};

export default AddToCartButton;