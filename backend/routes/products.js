const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const fileUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to file uploads
router.use(fileUploadLimiter);

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const shopId = req.params.shopId;
    const uploadPath = path.join(__dirname, '../public/uploads', shopId);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
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
    // Allow only specific file types
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
    res.status(500).send('Server Error');
  }
});

// Create a new product
router.post('/:shopId/products', auth, upload.array('images', 5), async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    if (shop.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
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
      images: req.files.map(file => `${req.params.shopId}/${file.filename}`)
    });

    const product = await newProduct.save();
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Update a product
router.put('/:shopId/products/:id', auth, upload.array('images', 5), async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    if (shop.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    const { name, description, prices, inventory, inventoryUnit, customInventoryUnit, imagesToKeep } = req.body;

    product.name = name;
    product.description = description;
    product.prices = JSON.parse(prices);
    product.inventory = inventory;
    product.inventoryUnit = inventoryUnit;
    product.customInventoryUnit = customInventoryUnit;

    const imagesToKeepArray = imagesToKeep ? (Array.isArray(imagesToKeep) ? imagesToKeep : [imagesToKeep]) : [];
    const newImages = req.files.map(file => `${req.params.shopId}/${file.filename}`);
    
    // Combine existing images to keep with new uploaded images
    product.images = [
      ...imagesToKeepArray,
      ...newImages
    ];

    // Remove old images that are not in imagesToKeepArray
    const uploadPath = path.join(__dirname, '../public/uploads', req.params.shopId);
    const currentImages = fs.readdirSync(uploadPath);
    currentImages.forEach(image => {
      if (!imagesToKeepArray.includes(image) && !newImages.includes(`${req.params.shopId}/${image}`)) {
        fs.unlink(path.join(uploadPath, image), (err) => {
          if (err) console.error('Error deleting image:', err);
        });
      }
    });

    await product.save();
    res.json(product);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Delete a product
router.delete('/:shopId/products/:id', auth, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    if (shop.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    const uploadPath = path.join(__dirname, '../public/uploads', req.params.shopId);
    product.images.forEach(image => {
      fs.unlink(path.join(uploadPath, path.basename(image)), (err) => {
        if (err) console.error('Error deleting image:', err);
      });
    });

    await product.remove();
    res.json({ msg: 'Product removed' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
