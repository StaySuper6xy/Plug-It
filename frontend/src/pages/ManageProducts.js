import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Grid, MenuItem, ImageList, ImageListItem, ImageListItemBar } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import api from '../utils/api';
import ProductPricing from '../components/ProductPricing';

const inventoryUnits = [
  { value: 'item', label: 'Item' },
  { value: 'gram', label: 'Gram' },
  { value: 'ounce', label: 'Ounce' },
  { value: 'pound', label: 'Pound' },
  { value: 'custom', label: 'Custom' },
];

export default function ManageProducts() {
  const { shopId } = useParams();
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    prices: [],
    inventory: '',
    inventoryUnit: 'item',
    customInventoryUnit: '',
    images: []
  });

  const fetchProducts = useCallback(async () => {
    try {
      console.log('Fetching products for shop:', shopId);
      const response = await api.get(`/shops/${shopId}/products`);
      console.log('Fetched products:', response.data);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, [shopId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpen = (product = null) => {
    if (product) {
      console.log('Editing product:', product);
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description,
        prices: product.prices,
        inventory: product.inventory.toString(),
        inventoryUnit: product.inventoryUnit || 'item',
        customInventoryUnit: product.customInventoryUnit || '',
        images: product.images || []
      });
    } else {
      console.log('Adding new product');
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        prices: [],
        inventory: '',
        inventoryUnit: 'item',
        customInventoryUnit: '',
        images: []
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
  };

  const handleChange = (e) => {
    setProductForm({
      ...productForm,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    console.log('Uploaded files:', files);
    setProductForm(prevForm => ({
      ...prevForm,
      images: [...prevForm.images, ...files]
    }));
  };

  const handleRemoveImage = (indexToRemove) => {
    console.log('Removing image at index:', indexToRemove);
    setProductForm(prevForm => ({
      ...prevForm,
      images: prevForm.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(productForm).forEach(key => {
        if (key === 'prices') {
          formData.append(key, JSON.stringify(productForm[key]));
        } else if (key === 'images') {
          productForm[key].forEach((image, index) => {
            if (image instanceof File) {
              formData.append(`images`, image);
            } else {
              // Only append the filename for existing images
              formData.append(`imagesToKeep`, image.split('/').pop());
            }
          });
        } else {
          formData.append(key, productForm[key]);
        }
      });

      console.log('Submitting product form:', Object.fromEntries(formData));

      let response;
      if (editingProduct) {
        console.log('Updating product:', editingProduct._id);
        response = await api.put(`/shops/${shopId}/products/${editingProduct._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        console.log('Creating new product');
        response = await api.post(`/shops/${shopId}/products`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      console.log('API response:', response.data);
      
      setProducts(prevProducts => {
        if (editingProduct) {
          return prevProducts.map(p => p._id === response.data._id ? response.data : p);
        } else {
          return [...prevProducts, response.data];
        }
      });

      handleClose();
    } catch (error) {
      console.error('Error saving product:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        console.log('Deleting product:', productId);
        await api.delete(`/shops/${shopId}/products/${productId}`);
        setProducts(prevProducts => prevProducts.filter(p => p._id !== productId));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const pluralize = (count, singular, plural) => {
    return count === 1 ? singular : plural;
  };

  const getImageUrl = (image) => {
    if (image instanceof File) {
      return URL.createObjectURL(image);
    } else {
      // Ensure we're using the correct path to the uploads folder
      return `${process.env.REACT_APP_UPLOADS_URL}/${image}`;
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        Manage Products
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => handleOpen()}
        sx={{ mb: 2 }}
      >
        Add New Product
      </Button>
      {products.length === 0 ? (
        <Typography>No products yet. Add some to get started!</Typography>
      ) : (
        <List>
          {products.map((product) => (
            <ListItem key={product._id}>
              <ListItemText
                primary={product.name}
                secondary={`Inventory: ${product.inventory} ${pluralize(product.inventory, product.inventoryUnit, product.inventoryUnit + 's')}`}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="edit" onClick={() => handleOpen(product)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(product._id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                name="name"
                label="Product Name"
                type="text"
                fullWidth
                value={productForm.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                name="description"
                label="Description"
                type="text"
                fullWidth
                multiline
                rows={4}
                value={productForm.description}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                name="inventory"
                label="Inventory"
                type="number"
                fullWidth
                value={productForm.inventory}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                margin="dense"
                name="inventoryUnit"
                label="Inventory Unit"
                fullWidth
                value={productForm.inventoryUnit}
                onChange={handleChange}
              >
                {inventoryUnits.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {productForm.inventoryUnit === 'custom' && (
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  name="customInventoryUnit"
                  label="Custom Inventory Unit"
                  type="text"
                  fullWidth
                  value={productForm.customInventoryUnit}
                  onChange={handleChange}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Pricing
              </Typography>
              <ProductPricing
                prices={productForm.prices}
                setPrices={(newPrices) => setProductForm({ ...productForm, prices: newPrices })}
              />
            </Grid>
            <Grid item xs={12}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="raised-button-file"
                multiple
                type="file"
                onChange={handleImageUpload}
              />
              <label htmlFor="raised-button-file">
                <Button variant="contained" component="span" startIcon={<CloudUploadIcon />}>
                  Upload Images
                </Button>
              </label>
              {productForm.images.length > 0 && (
                <ImageList sx={{ width: '100%', height: 450 }} cols={3} rowHeight={164}>
                  {productForm.images.map((image, index) => (
                    <ImageListItem key={index}>
                      <img
                        src={getImageUrl(image)}
                        alt={`Product ${index + 1}`}
                        loading="lazy"
                      />
                      <ImageListItemBar
                        position="top"
                        actionIcon={
                          <IconButton
                            sx={{ color: 'white' }}
                            onClick={() => handleRemoveImage(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                        actionPosition="right"
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            {editingProduct ? 'Save Changes' : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}


