import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Typography, TextField, Button, List, ListItem, ListItemText, Paper, Alert } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import api from '../utils/api';

const Chat = () => {
  const { user } = useContext(AuthContext);
  const { partnerId } = useParams();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchChats();
    if (partnerId) {
      fetchMessages(partnerId);
    }
  }, [partnerId]);

  const fetchChats = async () => {
    try {
      const response = await api.get('/chat');
      setChats(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to fetch chats. Please try again later.');
    }
  };

  const fetchMessages = async (id) => {
    try {
      const response = await api.get(`/chat/${id}`);
      setMessages(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to fetch messages. Please try again later.');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await api.post(`/chat/${partnerId}`, { content: newMessage });
      setNewMessage('');
      fetchMessages(partnerId);
      setError(null);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        Chats
      </Typography>
      {error && <Alert severity="error" style={{ marginBottom: '1rem' }}>{error}</Alert>}
      <div style={{ display: 'flex' }}>
        <Paper style={{ width: '30%', marginRight: '20px', padding: '10px' }}>
          <List>
            {chats.map((chat) => (
              <ListItem
                button
                key={chat.partnerId}
                component={Link}
                to={`/chat/${chat.partnerId}`}
                selected={chat.partnerId === partnerId}
              >
                <ListItemText
                  primary={chat.partnerName}
                  secondary={chat.lastMessage}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
        <Paper style={{ width: '70%', padding: '10px' }}>
          {partnerId ? (
            <>
              <div style={{ height: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                {messages.map((message) => (
                  <div
                    key={message._id}
                    style={{
                      textAlign: message.sender === user.id ? 'right' : 'left',
                      margin: '10px 0',
                    }}
                  >
                    <Typography variant="body2" style={{ background: message.sender === user.id ? '#e6f2ff' : '#f0f0f0', padding: '5px 10px', borderRadius: '10px', display: 'inline-block' }}>
                      {message.content}
                    </Typography>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage}>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <Button type="submit" variant="contained" color="primary" style={{ marginTop: '10px' }}>
                  Send
                </Button>
              </form>
            </>
          ) : (
            <Typography>Select a chat to start messaging</Typography>
          )}
        </Paper>
      </div>
    </Container>
  );
};

export default Chat;
