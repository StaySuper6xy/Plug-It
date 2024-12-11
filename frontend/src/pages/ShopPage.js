import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Button,
  Box
} from '@mui/material';
import api from '../utils/api';

export default function ShopPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopAndProducts = async () => {
      try {
        const [shopResponse, productsResponse] = await Promise.all([
          api.get(`/shops/${shopId}`),
          api.get(`/shops/${shopId}/products`)
        ]);
        setShop(shopResponse.data);
        setProducts(productsResponse.data);
      } catch (error) {
        console.error('Error fetching shop and products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShopAndProducts();
  }, [shopId]);

  const getLowestPrice = (prices) => {
    if (!prices || prices.length === 0) return null;
    const lowestPrice = Math.min(...prices.map(p => p.price));
    return lowestPrice.toFixed(2);
  };

  const handleViewDetails = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading || !shop) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      pt: 4,
      pb: 8
    }}>
      <Container maxWidth="lg">
        <Typography variant="h2" gutterBottom sx={{ 
          fontSize: { xs: '2.5rem', md: '3.75rem' },
          fontWeight: 500,
          color: 'text.primary',
          mb: 2
        }}>
          {shop.name}
        </Typography>
        
        <Typography variant="body1" sx={{ 
          color: 'text.secondary',
          mb: 6
        }}>
          {shop.description}
        </Typography>

        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={3} key={product._id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)'
                }
              }}>
                <CardMedia
                  component="img"
                  sx={{
                    height: 240,
                    objectFit: 'cover',
                  }}
                  image={product.images && product.images.length > 0 
                    ? `${process.env.REACT_APP_UPLOADS_URL}/${product.images[0]}` 
                    : '/placeholder.svg'}
                  alt={product.name}
                />
                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  <Typography gutterBottom variant="h6" component="h2" sx={{
                    fontSize: '1.1rem',
                    fontWeight: 500,
                    mb: 1
                  }}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {product.description}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    color: 'text.primary'
                  }}>
                    From: ${getLowestPrice(product.prices)}
                  </Typography>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    sx={{ 
                      mt: 2,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      }
                    }}
                    onClick={() => handleViewDetails(product._id)}
                  >
                    VIEW DETAILS
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}