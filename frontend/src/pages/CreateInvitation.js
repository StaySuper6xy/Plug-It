import React, { useState } from 'react'
import { Container, Typography, TextField, Button, Box } from '@mui/material'
import axios from 'axios'

function CreateInvitation() {
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')

  const handleCreateInvitation = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('/api/invitations', {}, {
        headers: { 'x-auth-token': token }
      })
      setInviteCode(response.data.code)
    } catch (error) {
      setError('Failed to create invitation. Please try again.')
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create Invitation
        </Typography>
        <Button variant="contained" color="primary" onClick={handleCreateInvitation} sx={{ mt: 2 }}>
          Generate Invite Code
        </Button>
        {inviteCode && (
          <TextField
            margin="normal"
            fullWidth
            value={inviteCode}
            label="Invite Code"
            variant="outlined"
            InputProps={{
              readOnly: true,
            }}
          />
        )}
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Box>
    </Container>
  )
}

export default CreateInvitation