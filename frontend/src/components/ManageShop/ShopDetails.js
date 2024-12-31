import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, CardContent, CardActions, Typography, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import AvailabilityAreaMap from './AvailabilityAreaMap';
import InvitationDialog from './InvitationDialog';
import DeleteShopDialog from './DeleteShopDialog';

const ShopDetails = ({ shop, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedShop, setEditedShop] = useState(shop);
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleEditShop = () => {
    setIsEditing(true);
    setEditedShop(shop);
  };

  const handleSaveEdit = () => {
    onUpdate(editedShop);
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedShop({ ...editedShop, [name]: value });
  };

  const handleFulfillmentOptionChange = (option) => {
    setEditedShop({
      ...editedShop,
      fulfillmentOptions: {
        ...editedShop.fulfillmentOptions,
        [option]: !editedShop.fulfillmentOptions[option]
      }
    });
  };

  const handleCreateInvitation = () => {
    setIsCreatingInvitation(true);
  };

  const handleManageProducts = () => {
    navigate(`/manage-products/${shop._id}`);
  };

  const handleDeleteShop = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteShop = () => {
    onDelete(shop._id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <Card>
      <CardContent>
        {isEditing ? (
          <>
            <TextField
              fullWidth
              margin="normal"
              label="Name"
              name="name"
              value={editedShop.name}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Description"
              name="description"
              multiline
              rows={4}
              value={editedShop.description}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Address"
              name="address"
              value={editedShop.address}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Message of the Day"
              name="motd"
              value={editedShop.motd}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Shop Status</InputLabel>
              <Select
                name="status"
                value={editedShop.status}
                onChange={handleInputChange}
              >
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="busy">Busy</MenuItem>
              </Select>
            </FormControl>
            {editedShop.status === 'open' && (
              <FormControl component="fieldset" margin="normal">
                <Typography variant="subtitle1">Fulfillment Options</Typography>
                <FormGroup>
                  <FormControlLabel
                    control={<Checkbox checked={editedShop.fulfillmentOptions.pickup} onChange={() => handleFulfillmentOptionChange('pickup')} name="pickup" />}
                    label="Pickup"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={editedShop.fulfillmentOptions.delivery} onChange={() => handleFulfillmentOptionChange('delivery')} name="delivery" />}
                    label="Delivery"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={editedShop.fulfillmentOptions.meetup} onChange={() => handleFulfillmentOptionChange('meetup')} name="meetup" />}
                    label="Meet-up"
                  />
                </FormGroup>
              </FormControl>
            )}
            <AvailabilityAreaMap
              shop={editedShop}
              onUpdate={(updatedArea) => {
                setEditedShop(prev => ({
                  ...prev,
                  availabilityArea: updatedArea
                }));
              }}
            />
          </>
        ) : (
          <>
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
            <Typography variant="body2">
              Status: {shop.status}
            </Typography>
          </>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        {isEditing ? (
          <>
            <Button size="small" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button size="small" onClick={handleSaveEdit}>Save</Button>
          </>
        ) : (
          <>
            <Button size="small" onClick={handleEditShop}>Edit</Button>
            <Button size="small" onClick={handleCreateInvitation}>Create Invitation</Button>
            <Button size="small" onClick={handleManageProducts}>Manage Products</Button>
            <Button size="small" color="error" onClick={handleDeleteShop}>Delete</Button>
          </>
        )}
      </CardActions>
      <InvitationDialog
        open={isCreatingInvitation}
        onClose={() => setIsCreatingInvitation(false)}
        shopId={shop._id}
      />
      <DeleteShopDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteShop}
      />
    </Card>
  );
};

export default ShopDetails;