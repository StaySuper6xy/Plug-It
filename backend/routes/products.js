const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/auth');

const fileUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to file uploads
router.use(fileUploadLimiter);

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const shopId = req.params.shopId;
    const uploadPath = path.join(__dirname, '../public/uploads', shopId);
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Implement file type and size restrictions
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  }
});

// Get all products for a shop
router.get('/:shopId/products', async (req, res) => {
  try {
    const products = await Product.find({ shop: req.params.shopId });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// Create a new product
router.post('/:shopId/products', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    if (shop.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized' });
    }

    const { name, description, prices, inventory, inventoryUnit, customInventoryUnit } = req.body;

    const newProduct = new Product({
      name,
      description,
      prices: JSON.parse(prices),
      inventory,
      inventoryUnit,
      customInventoryUnit,
      shop: req.params.shopId,
      images: req.files.map(file => `${file.filename}`)
    });

    const product = await newProduct.save();
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// Update a product
router.put('/:shopId/products/:id', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    if (shop.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized' });
    }

    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { name, description, prices, inventory, inventoryUnit, customInventoryUnit, imagesToKeep } = req.body;

    product.name = name;
    product.description = description;
    product.prices = JSON.parse(prices);
    product.inventory = inventory;
    product.inventoryUnit = inventoryUnit;
    product.customInventoryUnit = customInventoryUnit;

    const imagesToKeepArray = imagesToKeep ? (Array.isArray(imagesToKeep) ? imagesToKeep : [imagesToKeep]) : [];
    const newImages = req.files.map(file => `${file.filename}`);
    
    // Combine existing images to keep with new uploaded images
    product.images = [
      ...imagesToKeepArray,
      ...newImages
    ];

    // Remove old images that are not in imagesToKeepArray
    const uploadPath = path.join(__dirname, '../public/uploads', req.params.shopId);
    const currentImages = await fs.readdir(uploadPath);
    for (const image of currentImages) {
      if (!imagesToKeepArray.includes(image) && !newImages.includes(`${req.params.shopId}/${image}`)) {
        try {
          await fs.unlink(path.join(uploadPath, image));
        } catch (err) {
          console.error('Error deleting image:', err);
        }
      }
    }

    await product.save();
    res.json(product);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// Delete a product
router.delete('/:shopId/products/:id', authenticateToken, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    if (shop.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const uploadPath = path.join(__dirname, '../public/uploads', req.params.shopId);
    for (const image of product.images) {
      try {
        await fs.unlink(path.join(uploadPath, path.basename(image)));
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// Get a single product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// Get a single product by ID (alternative route)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

module.exports = router;
