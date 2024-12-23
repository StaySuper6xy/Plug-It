const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const gjv = require('geojson-validation');
const { isValidCoordinates, isValidPolygon, isValidCircle } = require('../utils/validation');

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads');
    fs.mkdir(dir, { recursive: true })
      .then(() => {
        console.log(`Upload directory created/verified: ${dir}`);
        cb(null, dir);
      })
      .catch(err => {
        console.error(`Error creating upload directory: ${err}`);
        cb(err);
      });
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    console.log(`Generated filename for upload: ${uniqueFilename}`);
    cb(null, uniqueFilename);
  }
});

const upload = multer({ storage: storage });

// Get all shops
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching shops for user:', req.user.id);
    const shops = await Shop.find({ owner: req.user.id });
    console.log('Shops fetched:', shops);
    res.json(shops);
  } catch (err) {
    console.error('Error fetching shops:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// Create a new shop
router.post('/', auth, async (req, res) => {
  const { 
    name, 
    description, 
    address, 
    location,
    isPublic,
    fulfillmentOptions
  } = req.body;

  try {
    const newShop = new Shop({
      name,
      description,
      address,
      location: location || { type: 'Point', coordinates: [0, 0] },
      isPublic,
      fulfillmentOptions: fulfillmentOptions || { pickup: true, delivery: false, meetup: false },
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
  const { 
    name, 
    description, 
    address, 
    location,
    isPublic,
    isOpen,
    fulfillmentOptions,
    availabilityArea,
    estimatedResponseTime,
    motd,
    status
  } = req.body;

  try {
    let shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    if (shop.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Update fields
    if (name) shop.name = name;
    if (description) shop.description = description;
    if (address) shop.address = address;
    
    if (location && location.type === 'Point' && Array.isArray(location.coordinates)) {
      if (!isValidCoordinates(location.coordinates)) {
        return res.status(400).json({ message: 'Invalid location format' });
      }
      shop.location = {
        type: 'Point',
        coordinates: [
          parseFloat(location.coordinates[0]),
          parseFloat(location.coordinates[1])
        ]
      };
    }
    
    if (isPublic !== undefined) shop.isPublic = isPublic;
    if (isOpen !== undefined) shop.isOpen = isOpen;
    if (fulfillmentOptions) shop.fulfillmentOptions = fulfillmentOptions;
    
    if (availabilityArea) {
      if (availabilityArea.type === 'Circle') {
        if (!isValidCircle(availabilityArea.center, availabilityArea.radius)) {
          return res.status(400).json({ message: 'Invalid circle format' });
        }
        shop.availabilityArea = {
          type: 'Circle',
          center: [parseFloat(availabilityArea.center[0]), parseFloat(availabilityArea.center[1])],
          radius: parseFloat(availabilityArea.radius)
        };
      } else if (availabilityArea.type === 'Polygon') {
        if (!isValidPolygon(availabilityArea.coordinates)) {
          return res.status(400).json({ message: 'Invalid polygon format' });
        }
        shop.availabilityArea = {
          type: 'Polygon',
          coordinates: availabilityArea.coordinates
        };
      } else {
        return res.status(400).json({ message: 'Invalid availabilityArea type' });
      }
    } else {
      shop.availabilityArea = undefined;
    }
    
    if (estimatedResponseTime) shop.estimatedResponseTime = estimatedResponseTime;
    if (motd !== undefined) shop.motd = motd;
    if (status) shop.status = status;

    // Remove legacy fields
    shop.deliveryArea = undefined;

    const updatedShop = await shop.save();
    res.json(updatedShop);
  } catch (err) {
    console.error('Error updating shop:', err);
    res.status(400).json({ message: 'Update failed', error: err.message });
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

// Create a new product
router.post('/:shopId/products', auth, upload.array('images', 5), async (req, res) => {
  console.log('Creating new product');
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) {
      console.log('Shop not found');
      return res.status(404).json({ message: 'Shop not found' });
    }

    if (shop.owner.toString() !== req.user.id) {
      console.log('User not authorized');
      return res.status(403).json({ message: 'User not authorized' });
    }

    console.log('Files received:', req.files);
    const newProduct = new Product({
      name: req.body.name,
      description: req.body.description,
      prices: JSON.parse(req.body.prices),
      inventory: req.body.inventory,
      inventoryUnit: req.body.inventoryUnit,
      customInventoryUnit: req.body.customInventoryUnit,
      images: req.files ? req.files.map(file => `${file.filename}`) : [], // Handle case when no files are uploaded
      shop: req.params.shopId
    });

    console.log('New product data:', newProduct);
    const product = await newProduct.save();
    console.log('Product saved successfully');
    res.json(product);
  } catch (err) {
    console.error('Error creating product:', err.message);
    res.status(500).send('Server Error');
  }
});

// Update a product
router.put('/:shopId/products/:productId', auth, upload.array('images'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    if (product.shop.toString() !== req.params.shopId) {
      return res.status(400).json({ msg: 'Product does not belong to this shop' });
    }

    const { name, description, inventory, inventoryUnit, customInventoryUnit, prices } = req.body;
    
    product.name = name;
    product.description = description;
    product.inventory = inventory;
    product.inventoryUnit = inventoryUnit;
    product.customInventoryUnit = customInventoryUnit;
    
    // Parse the prices JSON string
    if (prices) {
      product.prices = JSON.parse(prices);
    }

    // Handle image updates
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      product.images = [...(req.body.imagesToKeep ? req.body.imagesToKeep.split(',') : []), ...newImages];
    } else if (req.body.imagesToKeep) {
      product.images = req.body.imagesToKeep.split(',');
    }

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
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    if (shop.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized' });
    }

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete associated images
    for (const imagePath of product.images) {
      const fullPath = path.join(__dirname, '../..', imagePath);
      try {
        await fs.unlink(fullPath);
        console.log(`Successfully deleted image: ${fullPath}`);
      } catch (err) {
        console.error(`Error deleting image: ${fullPath}`, err);
      }
    }

    await product.remove();
    console.log(`Product ${req.params.productId} removed successfully`);
    res.json({ message: 'Product removed' });
  } catch (err) {
    console.error('Error deleting product:', err.message);
    res.status(500).send('Server Error');
  }
});

// Update shop status
router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body;

  try {
    let shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    // Check user
    if (shop.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    if (!['open', 'closed', 'busy'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }

    shop.status = status;
    await shop.save();
    res.json(shop);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;