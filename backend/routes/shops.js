const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../uploads');
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
      images: req.files.map(file => `uploads/${file.filename}`), // Remove leading slash
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
router.put('/:shopId/products/:productId', auth, upload.array('images', 5), async (req, res) => {
  console.log('Updating product');
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

    let product = await Product.findById(req.params.productId);
    if (!product) {
      console.log('Product not found');
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Existing product images:', product.images);
    console.log('New files received:', req.files);

    // Handle image removals
    const imagesToKeep = JSON.parse(req.body.imagesToKeep || '[]');
    console.log('Images to keep:', imagesToKeep);

    const imagesToRemove = product.images.filter(img => !imagesToKeep.includes(img));
    console.log('Images to remove:', imagesToRemove);

    for (const imageToRemove of imagesToRemove) {
      const fullPath = path.join(__dirname, '../..', imageToRemove);
      try {
        await fs.unlink(fullPath);
        console.log(`Successfully deleted: ${fullPath}`);
      } catch (err) {
        console.error(`Error deleting image: ${fullPath}`, err);
      }
    }

    product.name = req.body.name;
    product.description = req.body.description;
    product.prices = JSON.parse(req.body.prices);
    product.inventory = req.body.inventory;
    product.inventoryUnit = req.body.inventoryUnit;
    product.customInventoryUnit = req.body.customInventoryUnit;

    product.images = [
      ...imagesToKeep,
      ...req.files.map(file => `uploads/${file.filename}`) // Remove leading slash
    ];

    console.log('Updated product data:', product);
    product = await product.save();
    console.log('Product updated successfully:', product);
    res.json(product);
  } catch (err) {
    console.error('Error updating product:', err.message);
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

module.exports = router;
