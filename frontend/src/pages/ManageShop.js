import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Button, TextField, Card, CardContent, CardActions, 
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, 
  Tabs, Tab, Box, FormControl, InputLabel, Select, MenuItem, FormGroup, FormControlLabel, Checkbox,
  Paper
} from '@mui/material';
import { MapContainer, TileLayer, Circle, Polygon, FeatureGroup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import { AuthContext } from '../contexts/AuthContext';
import api from '../utils/api';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Circle as LCircle, Polygon as LPolygon } from 'leaflet';
import { isValidCoordinates, isValidPolygon } from '../utils/validation';

const ManageShop = () => {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedShop, setEditedShop] = useState({});
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [availabilityAreaType, setAvailabilityAreaType] = useState('Circle');
  const [availabilityRadius, setAvailabilityRadius] = useState(1000); // 1km default
  const [availabilityPolygon, setAvailabilityPolygon] = useState([]);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [fulfillmentOptions, setFulfillmentOptions] = useState({
    pickup: false,
    delivery: false,
    meetup: false
  });
  const [motd, setMotd] = useState('');
  const [status, setStatus] = useState('closed');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const mapRef = useRef();

  useEffect(() => {
    if (user) {
      fetchShops();
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchShops = async () => {
    try {
      console.log('Fetching shops...');
      const response = await api.get('/shops');
      console.log('Shops fetched:', response.data);
      setShops(response.data);
      if (response.data.length > 0) {
        setSelectedShop(response.data[0]);
        setMapCenter(response.data[0].location.coordinates.reverse());
        setStatus(response.data[0].status || 'closed');
        setFulfillmentOptions(response.data[0].fulfillmentOptions || {
          pickup: false,
          delivery: false,
          meetup: false
        });
        setMotd(response.data[0].motd || '');
        if (response.data[0].availabilityArea) {
          setAvailabilityAreaType(response.data[0].availabilityArea.type);
          if (response.data[0].availabilityArea.type === 'Circle') {
            setAvailabilityRadius(response.data[0].availabilityArea.radius);
            setMapCenter(response.data[0].availabilityArea.center);
          } else if (response.data[0].availabilityArea.type === 'Polygon') {
            setAvailabilityPolygon(response.data[0].availabilityArea.coordinates[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const handleEditShop = (shop) => {
    setEditedShop(shop);
    setIsEditing(true);
    setAvailabilityAreaType(shop.availabilityArea?.type || 'Circle');
    setAvailabilityRadius(shop.availabilityArea?.radius || 1000);
    setAvailabilityPolygon(shop.availabilityArea?.coordinates?.[0] || []);
    setMapCenter(shop.location.coordinates.reverse());
    setMotd(shop.motd || '');
    setStatus(shop.status || 'closed');
  };

  const handleSaveEdit = async () => {
    try {
      let availabilityArea;
      if (availabilityAreaType === 'Circle') {
        const center = mapCenter.map(coord => parseFloat(coord));
        const radius = parseFloat(availabilityRadius);
        if (!isValidCoordinates(center) || isNaN(radius) || radius <= 0) {
          throw new Error('Invalid circle format for availability area');
        }
        availabilityArea = {
          type: 'Circle',
          center: center,
          radius: radius
        };
      } else if (availabilityAreaType === 'Polygon') {
        let coordinates = availabilityPolygon.map(coord => coord.map(parseFloat));
        if (!isValidPolygon([coordinates])) {
          throw new Error('Invalid polygon format for availability area');
        }
        availabilityArea = {
          type: 'Polygon',
          coordinates: [coordinates]
        };
      }

      const location = mapCenter.map(coord => parseFloat(coord));
      if (!isValidCoordinates(location)) {
        throw new Error('Invalid shop location coordinates');
      }

      const updatedShop = {
        ...editedShop,
        fulfillmentOptions,
        availabilityArea,
        motd,
        status,
        location: {
          type: 'Point',
          coordinates: location
        }
      };
      
      // Remove any legacy fields
      delete updatedShop.deliveryArea;
      
      console.log('Saving edited shop:', JSON.stringify(updatedShop, null, 2));
      const response = await api.put(`/shops/${updatedShop._id}`, updatedShop);
      console.log('Shop edit response:', response.data);
      setIsEditing(false);
      fetchShops();
    } catch (error) {
      console.error('Error updating shop:', error);
      if (error.response && error.response.data && error.response.data.error) {
        alert(`Failed to update shop: ${error.response.data.error}`);
      } else {
        alert(`Failed to update shop: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleCreateInvitation = async (shopId) => {
    try {
      const response = await api.post(`/shops/${shopId}/invitations`);
      setInvitationCode(response.data.code);
      setIsCreatingInvitation(true);
    } catch (error) {
      console.error('Error creating invitation:', error);
    }
  };

  const handleDeleteShop = async () => {
    try {
      await api.delete(`/shops/${selectedShop._id}`);
      setIsDeleteDialogOpen(false);
      fetchShops();
    } catch (error) {
      console.error('Error deleting shop:', error);
    }
  };

  const handleManageProducts = (shopId) => {
    navigate(`/manage-products/${shopId}`);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSelectedShop(shops[newValue]);
    setMapCenter(shops[newValue].location.coordinates.reverse());
    setFulfillmentOptions(shops[newValue].fulfillmentOptions);
    setStatus(shops[newValue].status);
    setMotd(shops[newValue].motd);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      console.log('Updating shop status:', newStatus);
      const response = await api.put(`/shops/${selectedShop._id}`, { 
        status: newStatus,
        name: selectedShop.name,
        description: selectedShop.description,
        availabilityArea: selectedShop.availabilityArea || { type: 'Circle', radius: 1000, center: selectedShop.location.coordinates }
      });
      console.log('Shop status update response:', response.data);
      setStatus(newStatus);
      setSelectedShop(prevShop => ({ ...prevShop, status: newStatus }));
    } catch (error) {
      console.error('Error updating shop status:', error);
    }
  };

  const handleFulfillmentOptionChange = async (option) => {
    try {
      const newOptions = { ...fulfillmentOptions, [option]: !fulfillmentOptions[option] };
      console.log('Updating fulfillment options:', newOptions);
      const response = await api.put(`/shops/${selectedShop._id}`, { 
        fulfillmentOptions: newOptions,
        name: selectedShop.name,
        description: selectedShop.description,
        availabilityArea: selectedShop.availabilityArea || { type: 'Circle', radius: 1000, center: selectedShop.location.coordinates }
      });
      console.log('Fulfillment options update response:', response.data);
      setFulfillmentOptions(newOptions);
      setSelectedShop({ ...selectedShop, fulfillmentOptions: newOptions });
      fetchShops();
    } catch (error) {
      console.error('Error updating fulfillment options:', error);
    }
  };

  const handleAvailabilityAreaTypeChange = (event) => {
    setAvailabilityAreaType(event.target.value);
  };

  const handleMapCreated = (e) => {
    const { layerType, layer } = e;
    if (layerType === 'circle') {
      setAvailabilityAreaType('Circle');
      setAvailabilityRadius(layer.getRadius());
      setMapCenter([layer.getLatLng().lat, layer.getLatLng().lng]);
    } else if (layerType === 'polygon') {
      setAvailabilityAreaType('Polygon');
      setAvailabilityPolygon(layer.getLatLngs()[0].map(latLng => [latLng.lng, latLng.lat]));
    }
  };

  const handleMapEdited = (e) => {
    const { layers } = e;
    layers.eachLayer((layer) => {
      if (layer instanceof LCircle) {
        setAvailabilityRadius(layer.getRadius());
        setMapCenter([layer.getLatLng().lat, layer.getLatLng().lng]);
      } else if (layer instanceof LPolygon) {
        setAvailabilityPolygon(layer.getLatLngs()[0].map(latLng => [latLng.lng, latLng.lat]));
      }
    });
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Manage Your Shops
      </Typography>
      {shops.length > 0 ? (
        <>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="shop tabs">
            {shops.map((shop, index) => (
              <Tab label={shop.name} key={shop._id} />
            ))}
          </Tabs>
          <Box mt={3}>
            {selectedShop && (
              <Card>
                <CardContent>
                  <Typography variant="h5">{selectedShop.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedShop.description}
                  </Typography>
                  <Typography variant="body2">
                    Address: {selectedShop.address || 'No physical address'}
                  </Typography>
                  <Typography variant="body2">
                    Type: {selectedShop.isPublic ? 'Public' : 'Private'}
                  </Typography>
                  <Typography variant="body2">
                    Status: {selectedShop.status}
                  </Typography>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="shop-status-label">Shop Status</InputLabel>
                    <Select
                      labelId="shop-status-label"
                      value={status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                    >
                      <MenuItem value="open">Open</MenuItem>
                      <MenuItem value="closed">Closed</MenuItem>
                      <MenuItem value="busy">Busy</MenuItem>
                    </Select>
                  </FormControl>
                  {status === 'open' && (
                    <FormControl component="fieldset" margin="normal">
                      <Typography variant="subtitle1">Fulfillment Options</Typography>
                      <FormGroup>
                        <FormControlLabel
                          control={<Checkbox checked={fulfillmentOptions.pickup} onChange={() => handleFulfillmentOptionChange('pickup')} name="pickup" />}
                          label="Pickup"
                        />
                        <FormControlLabel
                          control={<Checkbox checked={fulfillmentOptions.delivery} onChange={() => handleFulfillmentOptionChange('delivery')} name="delivery" />}
                          label="Delivery"
                        />
                        <FormControlLabel
                          control={<Checkbox checked={fulfillmentOptions.meetup} onChange={() => handleFulfillmentOptionChange('meetup')} name="meetup" />}
                          label="Meet-up"
                        />
                      </FormGroup>
                    </FormControl>
                  )}
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleEditShop(selectedShop)}>Edit</Button>
                  <Button size="small" onClick={() => handleCreateInvitation(selectedShop._id)}>Create Invitation</Button>
                  <Button size="small" onClick={() => handleManageProducts(selectedShop._id)}>Manage Products</Button>
                  <Button size="small" color="error" onClick={() => setIsDeleteDialogOpen(true)}>Delete</Button>
                </CardActions>
              </Card>
            )}
          </Box>
        </>
      ) : (
        <Typography variant="body1">You don't have any shops yet. Create one to get started!</Typography>
      )}

      {/* Edit Shop Dialog */}
      <Dialog open={isEditing} onClose={() => setIsEditing(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Shop</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={editedShop.name || ''}
            onChange={(e) => setEditedShop({ ...editedShop, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={editedShop.description || ''}
            onChange={(e) => setEditedShop({ ...editedShop, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Address"
            fullWidth
            value={editedShop.address || ''}
            onChange={(e) => setEditedShop({ ...editedShop, address: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Message of the Day"
            fullWidth
            value={motd}
            onChange={(e) => setMotd(e.target.value)}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Shop Status</InputLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
              <MenuItem value="busy">Busy</MenuItem>
            </Select>
          </FormControl>
          <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>Availability Area</Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Availability Area Type</InputLabel>
              <Select
                value={availabilityAreaType}
                onChange={handleAvailabilityAreaTypeChange}
              >
                <MenuItem value="Circle">Circle</MenuItem>
                <MenuItem value="Polygon">Polygon</MenuItem>
              </Select>
            </FormControl>

            {availabilityAreaType === 'Circle' && (
              <TextField
                margin="dense"
                label="Availability Radius (meters)"
                fullWidth
                type="number"
                value={availabilityRadius}
                onChange={(e) => setAvailabilityRadius(Number(e.target.value))}
              />
            )}

            <Box mt={2} height={400}>
              <MapContainer 
                center={mapCenter} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <FeatureGroup>
                  <EditControl
                    position="topright"
                    onCreated={handleMapCreated}
                    onEdited={handleMapEdited}
                    draw={{
                      rectangle: false,
                      marker: false,
                      circlemarker: false,
                      polyline: false,
                      circle: availabilityAreaType === 'Circle',
                      polygon: availabilityAreaType === 'Polygon',
                    }}
                  />
                  {availabilityAreaType === 'Circle' && (
                    <Circle center={mapCenter} radius={availabilityRadius} />
                  )}
                  {availabilityAreaType === 'Polygon' && availabilityPolygon.length > 0 && (
                    <Polygon positions={availabilityPolygon} />
                  )}
                </FeatureGroup>
              </MapContainer>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Create Invitation Dialog */}
      <Dialog open={isCreatingInvitation} onClose={() => setIsCreatingInvitation(false)}>
        <DialogTitle>Invitation Code</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Here's your invitation code:
          </DialogContentText>
          <Typography variant="h6">{invitationCode}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreatingInvitation(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Shop Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Delete Shop?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this shop? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteShop} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageShop;