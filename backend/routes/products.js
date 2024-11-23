const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

const Product = require('../models/Product');
const Shop = require('../models/Shop');

// @route   POST api/products
// @desc    Create a product
// @access  Private
router.post('/', [auth, [
  check('name', 'Name is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('price', 'Price is required and must be a number').isNumeric(),
  check('shop', 'Shop is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, price, shop } = req.body;

    // Check if the shop exists and belongs to the user
    const shopDoc = await Shop.findOne({ _id: shop, owner: req.user.id });
    if (!shopDoc) {
      return res.status(404).json({ msg: 'Shop not found or you do not have permission' });
    }

    const newProduct = new Product({
      name,
      description,
      price,
      shop
    });

    const product = await newProduct.save();

    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().populate('shop', ['name', 'address']);
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('shop', ['name', 'address']);
    
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { name, description, price } = req.body;

  // Build product object
  const productFields = {};
  if (name) productFields.name = name;
  if (description) productFields.description = description;
  if (price) productFields.price = price;

  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Make sure user owns the shop that the product belongs to
    const shop = await Shop.findById(product.shop);
    if (shop.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: productFields },
      { new: true }
    );

    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Make sure user owns the shop that the product belongs to
    const shop = await Shop.findById(product.shop);
    if (shop.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await product.remove();

    res.json({ msg: 'Product removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
