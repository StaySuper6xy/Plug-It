import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, Grid, Card, CardContent, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../contexts/AuthContext';

function ShopList() {
  const { user } = useContext(AuthContext);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await api.get('/api/shops');
        setShops(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching shops:', error);
        setError('Failed to load shops');
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          All Shops
        </Typography>
        {user?.role === 'vendor' && (
          <Button
            component={Link}
            to="/create-shop"
            variant="contained"
            sx={{
              backgroundColor: 'black',
              '&:hover': {
                backgroundColor: '#333',
              },
            }}
          >
            Create New Shop
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {shops.map((shop) => (
          <Grid item key={shop._id} xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {shop.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {shop.description}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {shop.isPrivate ? 'Private Shop' : 'Public Shop'}
                </Typography>
                <Button
                  component={Link}
                  to={`/shops/${shop._id}`}
                  variant="outlined"
                  sx={{
                    borderColor: 'black',
                    color: 'black',
                    '&:hover': {
                      borderColor: '#333',
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
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

export default ShopList;