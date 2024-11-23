import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Button, TextField, Grid, Card, CardContent, CardActions, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
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
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'seller') {
      fetchShops();
    } else {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchShops = async () => {
    try {
      const response = await api.get('/api/shops');
      setShops(response.data);
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const handleEditShop = (shop) => {
    setSelectedShop(shop);
    setEditedShop(shop);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/api/shops/${selectedShop._id}`, editedShop);
      setIsEditing(false);
      fetchShops();
    } catch (error) {
      console.error('Error updating shop:', error);
    }
  };

  const handleCreateInvitation = async (shopId) => {
    try {
      const response = await api.post(`/api/shops/${shopId}/invitations`);
      setInvitationCode(response.data.code);
      setIsCreatingInvitation(true);
    } catch (error) {
      console.error('Error creating invitation:', error);
    }
  };

  const handleDeleteShop = async () => {
    try {
      await api.delete(`/api/shops/${selectedShop._id}`);
      setIsDeleteDialogOpen(false);
      fetchShops();
    } catch (error) {
      console.error('Error deleting shop:', error);
    }
  };

  const handleManageProducts = (shopId) => {
    navigate(`/manage-products/${shopId}`);
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        Manage Your Shops
      </Typography>
      <Grid container spacing={3}>
        {shops.map((shop) => (
          <Grid item xs={12} key={shop._id}>
            <Card>
              <CardContent>
                <Typography variant="h5">{shop.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {shop.description}
                </Typography>
                <Typography variant="body2">
                  Address: {shop.address || 'No physical address'}
                </Typography>
                <Typography variant="body2">
                  Type: {shop.isPublic ? 'Public' : 'Private'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => handleEditShop(shop)}>Edit</Button>
                <Button size="small" onClick={() => handleCreateInvitation(shop._id)}>Create Invitation</Button>
                <Button size="small" onClick={() => handleManageProducts(shop._id)}>Manage Products</Button>
                <Button size="small" color="error" onClick={() => {
                  setSelectedShop(shop);
                  setIsDeleteDialogOpen(true);
                }}>Delete</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

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
