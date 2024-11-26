import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Grid, Card, CardContent, CardActions } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import api from '../utils/api';

const ShopPage = () => {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchShopAndProducts = useCallback(async () => {
    try {
      const shopResponse = await api.get(`/shops/${id}`);
      setShop(shopResponse.data);

      const productsResponse = await api.get(`/shops/${id}/products`);
      setProducts(productsResponse.data);
    } catch (error) {
      console.error('Error fetching shop and products:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchShopAndProducts();
  }, [id, fetchShopAndProducts]);

  const handleChatWithSeller = () => {
    if (user) {
      navigate(`/chat/${shop.owner}`);
    } else {
      navigate('/login');
    }
  };

  if (!shop) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        {shop.name}
      </Typography>
      <Typography variant="body1" paragraph>
        {shop.description}
      </Typography>
      <Button variant="contained" color="primary" onClick={handleChatWithSeller}>
        Chat with Seller
      </Button>
      <Typography variant="h5" gutterBottom style={{ marginTop: '2rem' }}>
        Products
      </Typography>
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{product.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {product.description}
                </Typography>
                <Typography variant="h6" color="primary">
                  ${product.price.toFixed(2)}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small">Add to Cart</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ShopPage;
