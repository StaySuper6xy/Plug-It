import React, { useEffect, useContext, useState, useCallback } from 'react';
import { Typography, Container, Box, CircularProgress, Button, Card, CardContent, Grid } from '@mui/material';
import { Store, Public, Lock } from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const UserDashboard = () => {
  const { user, loading, logout } = useContext(AuthContext);
  const [shops, setShops] = useState([]);
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
  const [filter, setFilter] = useState('all');
  const [selectedShop, setSelectedShop] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [fetchingShops, setFetchingShops] = useState(true);
  const navigate = useNavigate();

  const fetchShops = useCallback(async () => {
    try {
      console.log('Token in localStorage:', localStorage.getItem('token'));
      const response = await api.get('/shops');
      console.log('Fetched shops:', response.data);
      setShops(response.data);
      if (response.data.length > 0) {
        setMapCenter([response.data[0].latitude || 51.505, response.data[0].longitude || -0.09]);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      console.log('Error response:', error.response);
      if (error.response && error.response.status === 401) {
        logout();
        navigate('/login');
      } else {
        setFetchError('Unable to fetch shops. Please try again later.');
      }
    } finally {
      setFetchingShops(false);
    }
  }, [logout, navigate]);

    useEffect(() => {
    if (user) {
      fetchShops();
    }
  }, [user, fetchShops]);


const filteredShops = shops.filter(shop => {
    if (filter === 'all') return true;
    return shop.isPublic === (filter === 'public');
  });

  const handleShopClick = (shop) => {
    setSelectedShop(shop);
    setMapCenter([shop.latitude || 51.505, shop.longitude || -0.09]);
  };

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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
        Welcome, {user.username}!
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ height: '400px', width: '100%' }}>
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              {filteredShops.map((shop) => (
                shop.latitude && shop.longitude && (
                  <Marker 
                    key={shop._id} 
                    position={[shop.latitude, shop.longitude]}
                    eventHandlers={{
                      click: () => handleShopClick(shop),
                    }}
                  >
                    <Popup>{shop.name}</Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </Box>
        </CardContent>
      </Card>
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
                      <Typography variant="subtitle1">{shop.name}</Typography>
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
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default UserDashboard;

