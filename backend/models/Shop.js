const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
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
               typeof v[1] === 'number';
      },
      message: props => `${props.value} is not a valid location coordinate!`
    }
  }
});

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
    type: PointSchema,
    required: true,
    index: '2dsphere'
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
      required: function() { 
        return this.fulfillmentOptions && (this.fulfillmentOptions.delivery || this.fulfillmentOptions.meetup);
      }
    },
    coordinates: {
      type: [[[Number]]],
      required: function() { 
        return this.availabilityArea && this.availabilityArea.type === 'Polygon';
      },
      validate: {
        validator: function(v) {
          return Array.isArray(v) && v.length > 0 && 
                 v[0].every(coord => Array.isArray(coord) && coord.length === 2 &&
                 typeof coord[0] === 'number' && typeof coord[1] === 'number');
        },
        message: props => `${props.value} is not a valid polygon coordinate array!`
      }
    },
    center: {
      type: {
        type: String,
        enum: ['Point'],
        required: function() { 
          return this.availabilityArea && this.availabilityArea.type === 'Circle';
        }
      },
      coordinates: {
        type: [Number],
        required: function() { 
          return this.availabilityArea && this.availabilityArea.type === 'Circle';
        },
        validate: {
          validator: function(v) {
            return Array.isArray(v) && v.length === 2 &&
                   typeof v[0] === 'number' && typeof v[1] === 'number';
          },
          message: props => `${props.value} is not a valid point coordinate!`
        }
      }
    },
    radius: {
      type: Number,
      required: function() { 
        return this.availabilityArea && this.availabilityArea.type === 'Circle';
      },
      min: 0
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

ShopSchema.index({ 'availabilityArea.coordinates': '2dsphere' });

module.exports = mongoose.model('Shop', ShopSchema);