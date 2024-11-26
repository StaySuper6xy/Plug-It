import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Button, TextField, Card, CardContent, CardActions, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Tabs, Tab, Box } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import api from '../utils/api';

const ManageShop = () => {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedShop, setEditedShop] = useState({});
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
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
      setShops(response.data);
      if (response.data.length > 0) {
        setSelectedShop(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const handleEditShop = (shop) => {
    setEditedShop(shop);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/shops/${editedShop._id}`, editedShop);
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
      <Dialog open={isEditing} onClose={() => setIsEditing(false)}>
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
