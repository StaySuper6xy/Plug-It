const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { decryptMessage } = require('../utils/encryption');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { encryptedOrder } = req.body;
    const buyerId = req.user.id;

    const newOrder = new Order({
      buyerId,
      encryptedData: encryptedOrder,
      status: 'pending'
    });

    const savedOrder = await newOrder.save();

    // Notify the vendor (implement this part later)
    // This could be done through WebSockets, push notifications, or email

    res.json({ success: true, orderId: savedOrder._id });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

router.get('/:orderId/status', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the user is authorized to view this order
    if (order.buyerId.toString() !== req.user.id) {
      const shop = await Shop.findById(order.shopId);
      if (!shop || shop.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to view this order' });
      }
    }

    let orderDetails = null;
    if (order.status === 'accepted') {
      // Implement chat creation logic here if needed
      orderDetails = { /* Add relevant details */ };
    }

    res.json({ status: order.status, orderDetails });
  } catch (error) {
    console.error('Error fetching order status:', error);
    res.status(500).json({ message: 'Failed to fetch order status' });
  }
});

// New route for vendors to view and decrypt orders
router.get('/shop/:shopId', authenticateToken, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop || shop.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view these orders' });
    }

    const orders = await Order.find({ shopId: req.params.shopId });

    // Decrypt orders (in a real-world scenario, you'd want to do this more securely)
    const decryptedOrders = orders.map(order => {
      try {
        const decryptedData = decryptMessage(order.encryptedData, shop.privateKey);
        return {
          ...order.toObject(),
          decryptedData: JSON.parse(decryptedData)
        };
      } catch (error) {
        console.error('Error decrypting order:', error);
        return order;
      }
    });

    res.json(decryptedOrders);
  } catch (error) {
    console.error('Error fetching shop orders:', error);
    res.status(500).json({ message: 'Failed to fetch shop orders' });
  }
});

module.exports = router;
