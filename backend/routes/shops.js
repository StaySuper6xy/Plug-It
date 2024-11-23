const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Get all shops
router.get('/', auth, async (req, res) => {
  console.log('GET /shops route hit'); // Add this line
  try {
    const shops = await Shop.find({ user: req.user.id });
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
router.get('/:id', auth, async (req, res) => {
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
router.get('/:id/products', auth, async (req, res) => {
  try {
    const products = await Product.find({ shop: req.params.id });
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
