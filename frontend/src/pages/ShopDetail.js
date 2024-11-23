import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Grid, Card, CardContent, CardMedia } from '@mui/material';
import api from '../utils/api';

export default function ShopDetail() {
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const { id } = useParams();

  useEffect(() => {
    const fetchShopAndProducts = async () => {
      try {
        const shopResponse = await api.get(`/api/shops/${id}`);
        setShop(shopResponse.data);

        const productsResponse = await api.get(`/api/shops/${id}/products`);
        setProducts(productsResponse.data);
      } catch (error) {
        console.error('Error fetching shop details and products:', error);
        setError('Failed to fetch shop details and products. Please try again.');
      }
    };

    fetchShopAndProducts();
  }, [id]);

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!shop) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>{shop.name}</Typography>
      <Typography variant="body1" paragraph>{shop.description}</Typography>
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Products</Typography>
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product._id}>
            <Card>
              {product.image && (
                <CardMedia
                  component="img"
                  height="140"
                  image={`http://localhost:5000/${product.image}`}
                  alt={product.name}
                />
              )}
              <CardContent>
                <Typography variant="h6">{product.name}</Typography>
                <Typography variant="body2" color="text.secondary">{product.description}</Typography>
                <Typography variant="h6" sx={{ mt: 2 }}>${product.price}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}