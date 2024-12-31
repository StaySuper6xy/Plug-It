import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Typography } from '@mui/material';
import api from '../../utils/api';

const InvitationDialog = ({ open, onClose, shopId }) => {
  const [invitationCode, setInvitationCode] = useState('');

  const handleCreateInvitation = async () => {
    try {
      const response = await api.post(`/shops/${shopId}/invitations`);
      setInvitationCode(response.data.code);
    } catch (error) {
      console.error('Error creating invitation:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Invitation Code</DialogTitle>
      <DialogContent>
        {invitationCode ? (
          <>
            <DialogContentText>
              Here's your invitation code:
            </DialogContentText>
            <Typography variant="h6">{invitationCode}</Typography>
          </>
        ) : (
          <Button onClick={handleCreateInvitation}>Generate Invitation Code</Button>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvitationDialog;