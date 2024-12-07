const mongoose = require('mongoose');

const PriceSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  }
});

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  prices: [PriceSchema],
  inventory: {
    type: Number,
    required: true
  },
  inventoryUnit: {
    type: String,
    required: true,
    default: 'item'
  },
  customInventoryUnit: {
    type: String
  },
  images: [{
    type: String
  }],
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', ProductSchema);
