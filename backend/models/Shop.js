const mongoose = require('mongoose');

const ShopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  address: {
    type: String,
    default: ''
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isOpen: {
    type: Boolean,
    default: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  fulfillmentOptions: {
    pickup: { type: Boolean, default: true },
    delivery: { type: Boolean, default: false },
    meetup: { type: Boolean, default: false }
  },
  availabilityArea: {
    type: {
      type: String,
      enum: ['Polygon', 'Circle'],
      required: function() { return this.fulfillmentOptions.delivery || this.fulfillmentOptions.meetup; }
    },
    coordinates: {
      type: [[[Number]]], // For Polygon
      required: function() { return this.availabilityArea && this.availabilityArea.type === 'Polygon'; }
    },
    center: {
      type: [Number], // For Circle
      required: function() { return this.availabilityArea && this.availabilityArea.type === 'Circle'; }
    },
    radius: {
      type: Number, // For Circle, in meters
      required: function() { return this.availabilityArea && this.availabilityArea.type === 'Circle'; }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  estimatedResponseTime: {
    type: Number,
    default: 30
  },
  motd: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'busy'],
    default: 'closed'
  }
}, { timestamps: true });

ShopSchema.index({ location: '2dsphere' });
ShopSchema.index({ 'availabilityArea.coordinates': '2dsphere' });

module.exports = mongoose.model('Shop', ShopSchema);