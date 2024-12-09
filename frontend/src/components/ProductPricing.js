import React, { useState } from 'react';
import { TextField, Button, IconButton, Grid, MenuItem } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';

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
  const [editingIndex, setEditingIndex] = useState(-1);

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

  const handleEditPrice = (index) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (index) => {
    const updatedPrices = [...prices];
    updatedPrices[index] = {
      ...updatedPrices[index],
      quantity: Number(updatedPrices[index].quantity),
      price: Number(updatedPrices[index].price),
      unit: updatedPrices[index].unit === 'custom' ? updatedPrices[index].customUnit : updatedPrices[index].unit
    };
    setPrices(updatedPrices);
    setEditingIndex(-1);
  };

  const handleCancelEdit = () => {
    setEditingIndex(-1);
  };

  const handlePriceChange = (index, field, value) => {
    const updatedPrices = [...prices];
    updatedPrices[index] = { ...updatedPrices[index], [field]: value };
    setPrices(updatedPrices);
  };

  const handleNewPriceChange = (e) => {
    setNewPrice({ ...newPrice, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
              type="number"
              value={price.quantity}
              onChange={(e) => handlePriceChange(index, 'quantity', e.target.value)}
              disabled={editingIndex !== index}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              select
              label="Unit"
              value={predefinedUnits.some(u => u.value === price.unit) ? price.unit : 'custom'}
              onChange={(e) => handlePriceChange(index, 'unit', e.target.value)}
              disabled={editingIndex !== index}
            >
              {predefinedUnits.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {(price.unit === 'custom' || !predefinedUnits.some(u => u.value === price.unit)) && (
            <Grid item xs={2}>
              <TextField
                fullWidth
                label="Custom Unit"
                value={predefinedUnits.some(u => u.value === price.unit) ? '' : price.unit}
                onChange={(e) => handlePriceChange(index, 'customUnit', e.target.value)}
                disabled={editingIndex !== index}
              />
            </Grid>
          )}
          <Grid item xs={2}>
            <TextField
              fullWidth
              label="Price"
              type="number"
              value={price.price}
              onChange={(e) => handlePriceChange(index, 'price', e.target.value)}
              disabled={editingIndex !== index}
            />
          </Grid>
          <Grid item xs={3}>
            {editingIndex === index ? (
              <>
                <IconButton onClick={() => handleSaveEdit(index)} color="primary">
                  <SaveIcon />
                </IconButton>
                <IconButton onClick={handleCancelEdit} color="secondary">
                  <CancelIcon />
                </IconButton>
              </>
            ) : (
              <>
                <IconButton onClick={() => handleEditPrice(index)} color="primary">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleRemovePrice(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              </>
            )}
          </Grid>
        </Grid>
      ))}
    </div>
  );
};

export default ProductPricing;