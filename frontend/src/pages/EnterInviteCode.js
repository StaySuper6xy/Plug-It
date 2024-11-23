import React, { useState } from 'react'
import { Container, Typography, TextField, Button, Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function EnterInviteCode() {
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/invitations/redeem', { code: inviteCode }, {
        headers: { 'x-auth-token': token }
      })
      navigate('/dashboard')
    } catch (error) {
      setError('Invalid invite code. Please try again.')
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Enter Invite Code
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="inviteCode"
            label="Invite Code"
            name="inviteCode"
            autoFocus
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Submit
          </Button>
        </Box>
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Box>
    </Container>
  )
}

export default EnterInviteCode