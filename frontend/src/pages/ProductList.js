import React, { useState, useEffect } from 'react'
import { Container, Typography, Grid, Card, CardContent, CardMedia, Button, Box } from '@mui/material'
import { Link } from 'react-router-dom'
import axios from 'axios'

function ProductList() {
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/api/products', {
          headers: { 'x-auth-token': token }
        })
        setProducts(response.data)
      } catch (error) {
        setError('Failed to fetch products')
      }
    }
    fetchProducts()
  }, [])

  if (error) {
    return <Typography color="error">{error}</Typography>
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Products
        </Typography>
        <Grid container spacing={4}>
          {products.map((product) => (
            <Grid item key={product._id} xs={12} sm={6} md={4}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={product.image || 'https://via.placeholder.com/200'}
                  alt={product.name}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${product.price}
                  </Typography>
                  <Button
                    component={Link}
                    to={`/products/${product._id}`}
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  )
}

export default ProductList