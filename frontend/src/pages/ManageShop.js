import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Button, TextField, Card, CardContent, CardActions, 
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, 
  Tabs, Tab, Box, FormControl, InputLabel, Select, MenuItem, FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import { MapContainer, TileLayer, Circle, Polygon, FeatureGroup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import { AuthContext } from '../contexts/AuthContext';
import api from '../utils/api';
import 'leaflet/dist/leaflet.css';
import { Circle as LCircle, Polygon as LPolygon } from 'leaflet';

const ManageShop = () => {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedShop, setEditedShop] = useState({});
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [deliveryAreaType, setDeliveryAreaType] = useState('Circle');
  const [deliveryRadius, setDeliveryRadius] = useState(1000); // 1km default
  const [deliveryPolygon, setDeliveryPolygon] = useState([]);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  //const [isOpen, setIsOpen] = useState(false);
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
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const handleEditShop = (shop) => {
    setEditedShop(shop);
    setIsEditing(true);
    setDeliveryAreaType(shop.deliveryArea?.type || 'Circle');
    setDeliveryRadius(shop.deliveryArea?.radius || 1000);
    setDeliveryPolygon(shop.deliveryArea?.coordinates?.[0] || []);
    setMapCenter(shop.location.coordinates.reverse());
    setMotd(shop.motd || '');
    setStatus(shop.status || 'closed');
  };

  const handleSaveEdit = async () => {
    try {
      const updatedShop = {
        ...editedShop,
        deliveryArea: {
          type: deliveryAreaType,
          ...(deliveryAreaType === 'Circle' 
            ? { center: mapCenter, radius: deliveryRadius } 
            : { coordinates: [deliveryPolygon] })
        },
        motd,
        status
      };
      console.log('Saving edited shop:', updatedShop);
      const response = await api.put(`/shops/${updatedShop._id}`, updatedShop);
      console.log('Shop edit response:', response.data);
      setIsEditing(false);
      fetchShops();
    } catch (error) {
      console.error('Error updating shop:', error);
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
        deliveryArea: selectedShop.deliveryArea || { type: 'Circle', radius: 1000, center: selectedShop.location.coordinates }
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
        deliveryArea: selectedShop.deliveryArea || { type: 'Circle', radius: 1000, center: selectedShop.location.coordinates }
      });
      console.log('Fulfillment options update response:', response.data);
      setFulfillmentOptions(newOptions);
      setSelectedShop({ ...selectedShop, fulfillmentOptions: newOptions });
      fetchShops();
    } catch (error) {
      console.error('Error updating fulfillment options:', error);
    }
  };

  const handleDeliveryAreaTypeChange = (event) => {
    setDeliveryAreaType(event.target.value);
  };

  const handleMapCreated = (e) => {
    const { layerType, layer } = e;
    if (layerType === 'circle') {
      setDeliveryAreaType('Circle');
      setDeliveryRadius(layer.getRadius());
      setMapCenter([layer.getLatLng().lat, layer.getLatLng().lng]);
    } else if (layerType === 'polygon') {
      setDeliveryAreaType('Polygon');
      setDeliveryPolygon(layer.getLatLngs()[0].map(latLng => [latLng.lat, latLng.lng]));
    }
  };

  const handleMapEdited = (e) => {
    const { layers } = e;
    layers.eachLayer((layer) => {
      if (layer instanceof LCircle) {
        setDeliveryRadius(layer.getRadius());
        setMapCenter([layer.getLatLng().lat, layer.getLatLng().lng]);
      } else if (layer instanceof LPolygon) {
        setDeliveryPolygon(layer.getLatLngs()[0].map(latLng => [latLng.lat, latLng.lng]));
      }
    });
  };

  return (
    <Container maxWidth="md">
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
          <FormControl fullWidth margin="normal">
            <InputLabel>Delivery Area Type</InputLabel>
            <Select
              value={deliveryAreaType}
              onChange={handleDeliveryAreaTypeChange}
            >
              <MenuItem value="Circle">Circle</MenuItem>
              <MenuItem value="Polygon">Polygon</MenuItem>
            </Select>
          </FormControl>

          {deliveryAreaType === 'Circle' && (
            <TextField
              margin="dense"
              label="Delivery Radius (meters)"
              fullWidth
              type="number"
              value={deliveryRadius}
              onChange={(e) => setDeliveryRadius(Number(e.target.value))}
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
                    circle: deliveryAreaType === 'Circle',
                    polygon: deliveryAreaType === 'Polygon',
                  }}
                />
                {deliveryAreaType === 'Circle' && (
                  <Circle center={mapCenter} radius={deliveryRadius} />
                )}
                {deliveryAreaType === 'Polygon' && deliveryPolygon.length > 0 && (
                  <Polygon positions={deliveryPolygon} />
                )}
              </FeatureGroup>
            </MapContainer>
          </Box>
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