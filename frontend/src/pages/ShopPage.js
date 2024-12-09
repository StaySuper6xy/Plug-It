import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Button, CircularProgress } from '@mui/material';
import api from '../utils/api';

export default function ShopPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShopAndProducts = async () => {
      if (!shopId) {
        setError('Shop ID is missing');
        setLoading(false);
        return;
      }

      try {
        const [shopResponse, productsResponse] = await Promise.all([
          api.get(`/shops/${shopId}`),
          api.get(`/shops/${shopId}/products`)
        ]);

        setShop(shopResponse.data);
        setProducts(productsResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching shop and products:', error);
        setError('Failed to load shop data');
        setLoading(false);
      }
    };

    fetchShopAndProducts();
  }, [shopId]);

  const getLowestPrice = (prices) => {
    if (!prices || prices.length === 0) return 'N/A';
    const lowestPrice = Math.min(...prices.map(p => p.price));
    return `$${lowestPrice.toFixed(2)}`;
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography variant="h5" color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (!shop) {
    return (
      <Container>
        <Typography variant="h5" gutterBottom>
          Shop not found
        </Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h2" gutterBottom>
        {shop.name}
      </Typography>
      <Typography variant="body1" paragraph>
        {shop.description}
      </Typography>
      <Grid container spacing={4}>
        {products.map((product) => (
          <Grid item key={product._id} xs={12} sm={6} md={4}>
            <Card>
              <CardMedia
                component="img"
                height="140"
                image={product.images && product.images.length > 0 ? product.images[0] : '/placeholder.svg'}
                alt={product.name}
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {product.description}
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                  From: {getLowestPrice(product.prices)}
                </Typography>
                <Button variant="contained" color="primary" sx={{ mt: 2 }}>
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}