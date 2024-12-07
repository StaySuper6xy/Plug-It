import React, { useState } from 'react';
import { TextField, Button, IconButton, Grid, MenuItem } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const predefinedUnits = [
  { value: 'item', label: 'Item' },
  { value: 'gram', label: 'Gram' },
  { value: 'ounce', label: 'Ounce' },
  { value: 'quarter_pound', label: 'Quarter Pound' },
  { value: 'half_pound', label: 'Half Pound' },
  { value: 'custom', label: 'Custom' },
];

const ProductPricing = ({ prices, setPrices }) => {
  const [newPrice, setNewPrice] = useState({ quantity: '', unit: 'item', customUnit: '', price: '' });

  const handleAddPrice = () => {
    if (newPrice.quantity && (newPrice.unit !== 'custom' ? newPrice.unit : newPrice.customUnit) && newPrice.price) {
      setPrices([...prices, {
        ...newPrice,
        quantity: Number(newPrice.quantity),
        price: Number(newPrice.price),
        unit: newPrice.unit === 'custom' ? newPrice.customUnit : newPrice.unit
      }]);
      setNewPrice({ quantity: '', unit: 'item', customUnit: '', price: '' });
    }
  };

  const handleRemovePrice = (index) => {
    setPrices(prices.filter((_, i) => i !== index));
  };

  const handleNewPriceChange = (e) => {
    setNewPrice({ ...newPrice, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={2}>
          <TextField
            fullWidth
            label="Quantity"
            name="quantity"
            type="number"
            value={newPrice.quantity}
            onChange={handleNewPriceChange}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            fullWidth
            select
            label="Unit"
            name="unit"
            value={newPrice.unit}
            onChange={handleNewPriceChange}
          >
            {predefinedUnits.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        {newPrice.unit === 'custom' && (
          <Grid item xs={2}>
            <TextField
              fullWidth
              label="Custom Unit"
              name="customUnit"
              value={newPrice.customUnit}
              onChange={handleNewPriceChange}
            />
          </Grid>
        )}
        <Grid item xs={2}>
          <TextField
            fullWidth
            label="Price"
            name="price"
            type="number"
            value={newPrice.price}
            onChange={handleNewPriceChange}
          />
        </Grid>
        <Grid item xs={3}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddPrice}
          >
            Add Price
          </Button>
        </Grid>
      </Grid>
      {prices.map((price, index) => (
        <Grid container spacing={2} alignItems="center" key={index} sx={{ mt: 2 }}>
          <Grid item xs={2}>
            <TextField
              fullWidth
              label="Quantity"
              value={price.quantity}
              disabled
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Unit"
              value={price.unit}
              disabled
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              fullWidth
              label="Price"
              value={price.price}
              disabled
            />
          </Grid>
          <Grid item xs={2}>
            <IconButton onClick={() => handleRemovePrice(index)} color="error">
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
      ))}
    </div>
  );
};

export default ProductPricing;
