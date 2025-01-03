import React, { useEffect, useContext, useState, useCallback } from 'react';
import { Typography, Container, Box, CircularProgress, Button, Card, CardContent, Grid } from '@mui/material';
import { Store, Public, Lock } from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import api from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';

const UserDashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const [shops, setShops] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedShop, setSelectedShop] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [fetchingShops, setFetchingShops] = useState(true);
  const navigate = useNavigate();

  const fetchShops = useCallback(async () => {
    try {
      const response = await api.get('/shops');
      console.log('Fetched shops:', response.data);
      setShops(response.data);
    } catch (error) {
      console.error('Error fetching shops:', error);
      setFetchError('Unable to fetch shops. Please try again later.');
    } finally {
      setFetchingShops(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchShops();
    }
  }, [user, fetchShops]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  const filteredShops = shops.filter(shop => {
    if (filter === 'all') return true;
    return shop.isPublic === (filter === 'public');
  });

  const handleShopClick = (shop) => {
    setSelectedShop(shop);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
        Welcome, {user.username}!
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Button 
          onClick={() => setFilter('all')} 
          variant={filter === 'all' ? 'contained' : 'outlined'}
          startIcon={<Store />}
          sx={{ mr: 1 }}
        >
          All
        </Button>
        <Button 
          onClick={() => setFilter('public')} 
          variant={filter === 'public' ? 'contained' : 'outlined'}
          startIcon={<Public />}
          sx={{ mr: 1 }}
        >
          Public
        </Button>
        <Button 
          onClick={() => setFilter('private')} 
          variant={filter === 'private' ? 'contained' : 'outlined'}
          startIcon={<Lock />}
        >
          Private
        </Button>
      </Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Shops
          </Typography>
          {fetchingShops ? (
            <CircularProgress />
          ) : fetchError ? (
            <Typography color="error">{fetchError}</Typography>
          ) : filteredShops.length > 0 ? (
            <Grid container spacing={2}>
              {filteredShops.map((shop) => (
                <Grid item xs={12} sm={6} md={4} key={shop._id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer', 
                      bgcolor: selectedShop?._id === shop._id ? 'action.selected' : 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handleShopClick(shop)}
                  >
                    <CardContent>
                      <Typography variant="subtitle1">
                        {shop.name}
                      </Typography>
                      <Typography variant="body2">{shop.address || 'No physical address'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {shop.isPublic ? 'Public' : 'Private'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography>No shops available at the moment.</Typography>
          )}
        </CardContent>
      </Card>
      {selectedShop && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>{selectedShop.name}</Typography>
            <Typography variant="body1">{selectedShop.description}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Address: {selectedShop.address || 'No physical address'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Type: {selectedShop.isPublic ? 'Public' : 'Private'}
            </Typography>
            <Button 
              component={Link} 
              to={`/shop/${selectedShop._id}`} 
              variant="contained" 
              color="primary" 
              sx={{ mt: 2, mr: 2 }}
            >
              View Shop
            </Button>
            <Button 
              component={Link} 
              to={`/manage-shop/${selectedShop._id}`} 
              variant="contained" 
              color="secondary" 
              sx={{ mt: 2 }}
            >
              Manage Shop
            </Button>
          </CardContent>
        </Card>
      )}
      {shops.length === 0 && user.role === 'vendor' && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body1">
            You don't have any shops yet. Would you like to create one?
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/store-setup"
            sx={{ mt: 2 }}
          >
            Create Your First Shop
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default UserDashboard;


