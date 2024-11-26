const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Get all shops
router.get('/', auth, async (req, res) => {
  console.log('GET /shops route hit');
  try {
    const shops = await Shop.find({ owner: req.user.id });
    res.json(shops);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create a new shop
router.post('/', auth, async (req, res) => {
  const { name, description, address, latitude, longitude, isPublic } = req.body;

  try {
    const newShop = new Shop({
      name,
      description,
      address,
      latitude,
      longitude,
      isPublic,
      owner: req.user.id
    });

    const shop = await newShop.save();
    res.json(shop);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get shop by ID
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }
    res.json(shop);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Shop not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Update shop
router.put('/:id', auth, async (req, res) => {
  const { name, description, address, latitude, longitude, isPublic } = req.body;

  try {
    let shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    // Check user
    if (shop.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    shop.name = name;
    shop.description = description;
    shop.address = address;
    shop.latitude = latitude;
    shop.longitude = longitude;
    shop.isPublic = isPublic;

    await shop.save();
    res.json(shop);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete shop
router.delete('/:id', auth, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    // Check user
    if (shop.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await shop.remove();
    res.json({ msg: 'Shop removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Shop not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Get products for a shop
router.get('/:id/products', async (req, res) => {
  try {
    const products = await Product.find({ shop: req.params.id });
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all products for a shop
router.get('/:shopId/products', auth, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }
    const products = await Product.find({ shop: req.params.shopId });
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a new product to a shop
router.post('/:shopId/products', auth, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }
    const { name, description, price, inventory } = req.body;
    const newProduct = new Product({
      name,
      description,
      price,
      inventory,
      shop: req.params.shopId
    });
    const product = await newProduct.save();
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a product
router.put('/:shopId/products/:productId', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    if (product.shop.toString() !== req.params.shopId) {
      return res.status(400).json({ msg: 'Product does not belong to this shop' });
    }
    const { name, description, price, inventory } = req.body;
    product.name = name;
    product.description = description;
    product.price = price;
    product.inventory = inventory;
    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a product
router.delete('/:shopId/products/:productId', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    if (product.shop.toString() !== req.params.shopId) {
      return res.status(400).json({ msg: 'Product does not belong to this shop' });
    }
    await product.remove();
    res.json({ msg: 'Product removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
