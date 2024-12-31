import React from 'react';
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';

const CartContents = ({ cart, updateItemQuantity, removeItem, onNext }) => {
  if (!cart || cart.items.length === 0) {
    return <Typography>Your cart is empty.</Typography>;
  }

  return (
    <>
      <List>
        {cart.items.map((item) => (
          <ListItem key={item.product._id}>
            <ListItemText
              primary={item.product.name}
              secondary={`Price: $${item.price.toFixed(2)}`}
            />
            <Box display="flex" alignItems="center" mr={2}>
              <IconButton onClick={() => updateItemQuantity(item.product._id, item.quantity - 1)} disabled={item.quantity <= 1}>
                <RemoveIcon />
              </IconButton>
              <TextField
                value={item.quantity}
                onChange={(e) => updateItemQuantity(item.product._id, parseInt(e.target.value) || 1)}
                type="number"
                inputProps={{ min: 1 }}
                style={{ width: 50, margin: '0 8px' }}
              />
              <IconButton onClick={() => updateItemQuantity(item.product._id, item.quantity + 1)}>
                <AddIcon />
              </IconButton>
            </Box>
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="delete" onClick={() => removeItem(item.product._id)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Typography variant="h6" gutterBottom>
        Total: ${cart.totalAmount.toFixed(2)}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={onNext}
        style={{ marginTop: 16 }}
      >
        Continue to Fulfillment Options
      </Button>
    </>
  );
};

export default CartContents;

