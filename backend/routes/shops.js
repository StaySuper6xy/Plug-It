const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const gjv = require('geojson-validation');
const { isValidCoordinates, isValidPolygon, isValidCircle } = require('../utils/validation');
const { generateKeyPair, encryptMessage, decryptMessage } = require('../utils/encryption');

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

// Get all shops (replace the existing route that uses 'auth')
router.get('/', authenticateToken, async (req, res) => {
  try {
    const shops = await Shop.find({ owner: req.user.id });
    res.json(shops);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create a new shop
router.post('/', authenticateToken, async (req, res) => {
  const { 
    name, 
    description, 
    address, 
    location,
    isPublic,
    fulfillmentOptions
  } = req.body;

  try {
    // Generate key pair for the shop
    const { publicKey, privateKey } = generateKeyPair();

    const newShop = new Shop({
      name,
      description,
      address,
      location: location || { type: 'Point', coordinates: [0, 0] },
      isPublic,
      fulfillmentOptions: fulfillmentOptions || { pickup: true, delivery: false, meetup: false },
      owner: req.user.id,
      publicKey,
      //encryptedShopKey: encryptMessage(privateKey, publicKey) // Encrypt private key with public key
    });

    const shop = await newShop.save();
    
    // Send back the shop data and the unencrypted private key
    res.json({
      success: true,
      shop,
      privateKey // Note: In a production environment, you'd want to handle this more securely
    });
  } catch (err) {
    console.error('Error creating shop:', err);
    res.status(500).json({ success: false, message: 'Failed to create shop' });
  }
});

// Get shop by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    console.log('Sending shop data:', shop);

    res.json({
      success: true,
      shop: {
        ...shop.toObject(),
        publicKey: shop.publicKey // Ensure we're sending the public key
      }
    });
  } catch (err) {
    console.error('Error fetching shop details:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch shop details' });
  }
});

// Update shop
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { encryptedAvailabilityArea, fulfillmentOptions, ...otherFields } = req.body;
    
    console.log('Updating shop with data:', { encryptedAvailabilityArea, fulfillmentOptions, ...otherFields });

    let shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    if (shop.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Update fields
    Object.assign(shop, otherFields);
    
    if (encryptedAvailabilityArea) {
      shop.encryptedAvailabilityArea = encryptedAvailabilityArea;
    }

    if (fulfillmentOptions) {
      shop.fulfillmentOptions = fulfillmentOptions;
    }

    const updatedShop = await shop.save();
    console.log('Updated shop:', updatedShop);
    res.json(updatedShop);
  } catch (err) {
    console.error('Error updating shop:', err);
    res.status(400).json({ message: 'Update failed', error: err.message });
  }
});

// Delete shop
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    if (shop.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Shop.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Shop removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create a new product
router.post('/:shopId/products', authenticateToken, upload.array('images', 5), async (req, res) => {
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
      images: req.files ? req.files.map(file => `${file.filename}`) : [],
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
router.put('/:shopId/products/:productId', authenticateToken, upload.array('images'), async (req, res) => {
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
    
    if (prices) {
      product.prices = JSON.parse(prices);
    }

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
router.delete('/:shopId/products/:productId', authenticateToken, async (req, res) => {
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

// Get products for a shop
router.get('/:shopId/products', authenticateToken, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    // If the shop is private and the user is not the owner, deny access
    if (!shop.isPublic && shop.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const products = await Product.find({ shop: req.params.shopId });
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    if (shop.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Shop.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Shop removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update shop status
router.put('/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;

  try {
    let shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

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
