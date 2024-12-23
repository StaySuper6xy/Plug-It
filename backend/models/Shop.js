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
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(v) {
          return v.length === 2 && 
                 typeof v[0] === 'number' && 
                 typeof v[1] === 'number' &&
                 v[0] >= -180 && v[0] <= 180 &&
                 v[1] >= -90 && v[1] <= 90;
        },
        message: props => `${props.value} is not a valid location coordinate!`
      }
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
      required: function() { return this.availabilityArea && this.availabilityArea.type === 'Polygon'; },
      validate: {
        validator: function(v) {
          return v && v.length > 0 && v[0].length >= 4 && v[0][0][0] === v[0][v[0].length-1][0] && v[0][0][1] === v[0][v[0].length-1][1];
        },
        message: props => `${props.value} is not a valid polygon`
      }
    },
    center: {
      type: [Number], // For Circle
      required: function() { return this.availabilityArea && this.availabilityArea.type === 'Circle'; },
      validate: {
        validator: function(v) {
          return v && v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
        },
        message: props => `${props.value} is not a valid center coordinate`
      }
    },
    radius: {
      type: Number, // For Circle, in meters
      required: function() { return this.availabilityArea && this.availabilityArea.type === 'Circle'; },
      min: [0, 'Radius must be positive']
    }
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
ShopSchema.index({ 'availabilityArea.center': '2dsphere' });

module.exports = mongoose.model('Shop', ShopSchema);