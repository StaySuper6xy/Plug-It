import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Snackbar, Alert } from '@mui/material';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../utils/api';
import ShopList from './ShopList';
import ShopDetails from './ShopDetails';
import { isValidPolygon, isValidCircle } from '../../utils/validation';
import { generateKey, encryptAvailabilityArea, decryptAvailabilityArea } from '../../utils/encryption';

const ManageShop = () => {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchShops();
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchShops = async () => {
    try {
      const response = await api.get('/shops');
      const decryptedShops = await Promise.all(response.data.map(async (shop) => {
        if (shop.encryptedAvailabilityArea) {
          const storedKey = localStorage.getItem(`shop_${shop._id}_key`);
          if (storedKey) {
            try {
              const decryptedArea = decryptAvailabilityArea(shop.encryptedAvailabilityArea, storedKey);
              if (decryptedArea) {
                return { ...shop, availabilityArea: decryptedArea };
              }
            } catch (error) {
              console.error('Error decrypting availability area:', error);
            }
          }
        }
        return shop;
      }));
      setShops(decryptedShops);
      if (decryptedShops.length > 0) {
        setSelectedShop(decryptedShops[0]);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      setSnackbar({ open: true, message: 'Error fetching shops. Please try again.', severity: 'error' });
    }
  };

  const handleShopSelect = (shop) => {
    setSelectedShop(shop);
  };

  const handleShopUpdate = async (updatedShop) => {
    try {
      let availabilityArea = updatedShop.availabilityArea;
      if (availabilityArea.type === 'Circle') {
        const center = availabilityArea.center.map(coord => parseFloat(coord));
        const radius = parseFloat(availabilityArea.radius);
        
        if (!isValidCircle(center, radius)) {
          throw new Error('Invalid circle format for availability area');
        }
        
        availabilityArea = {
          type: 'Circle',
          center: center,
          radius: radius
        };
      } else if (availabilityArea.type === 'Polygon') {
        let coordinates = availabilityArea.coordinates[0].map(coord => coord.map(parseFloat));
        if (!isValidPolygon(coordinates)) {
          throw new Error('Invalid polygon format for availability area');
        }
        availabilityArea = {
          type: 'Polygon',
          coordinates: [coordinates]
        };
      }

      const key = localStorage.getItem(`shop_${updatedShop._id}_key`) || generateKey();
      const encryptedAvailabilityArea = encryptAvailabilityArea(availabilityArea, key);

      const shopToUpdate = {
        ...updatedShop,
        encryptedAvailabilityArea,
        location: {
          type: 'Point',
          coordinates: updatedShop.location.coordinates.map(coord => parseFloat(coord))
        }
      };

      delete shopToUpdate.availabilityArea;

      console.log('Sending updated shop data:', JSON.stringify(shopToUpdate, null, 2));

      await api.put(`/shops/${shopToUpdate._id}`, shopToUpdate);
      setSnackbar({ open: true, message: 'Shop updated successfully', severity: 'success' });
      await fetchShops();
    } catch (error) {
      console.error('Error updating shop:', error);
      setSnackbar({ open: true, message: `Failed to update shop: ${error.message || 'Unknown error'}`, severity: 'error' });
    }
  };

  const handleShopDelete = async (shopId) => {
    try {
      await api.delete(`/shops/${shopId}`);
      setSnackbar({ open: true, message: 'Shop deleted successfully', severity: 'success' });
      await fetchShops();
    } catch (error) {
      console.error('Error deleting shop:', error);
      setSnackbar({ open: true, message: 'Failed to delete shop', severity: 'error' });
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Manage Your Shops
      </Typography>
      <ShopList shops={shops} selectedShop={selectedShop} onSelectShop={handleShopSelect} />
      {selectedShop && (
        <ShopDetails
          shop={selectedShop}
          onUpdate={handleShopUpdate}
          onDelete={handleShopDelete}
        />
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ManageShop;