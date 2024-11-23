import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Container, Typography, Card, CardContent, CardMedia, Button, Box } from '@mui/material'
import axios from 'axios'

function ProductDetail() {
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')
  const { id } = useParams()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`/api/products/${id}`, {
          headers: { 'x-auth-token': token }
        })
        setProduct(response.data)
      } catch (error) {
        setError('Failed to fetch product details')
      }
    }
    fetchProduct()
  }, [id])

  if (error) {
    return <Typography color="error">{error}</Typography>
  }

  if (!product) {
    return <Typography>Loading...</Typography>
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardMedia
            component="img"
            height="300"
            image={product.image || 'https://via.placeholder.com/300'}
            alt={product.name}
          />
          <CardContent>
            <Typography gutterBottom variant="h4" component="div">
              {product.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {product.description}
            </Typography>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Price: ${product.price}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Category: {product.category}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              In Stock: {product.stock}
            </Typography>
            <Button variant="contained" color="primary" sx={{ mt: 2 }}>
              Add to Cart
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

export default ProductDetail