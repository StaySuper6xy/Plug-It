const Cart = require('../models/Cart');
const Shop = require('../models/Shop');
const Product = require('../models/Product');

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity, shopId, price } = req.body;
    const userId = req.user.id;

    let cart = await Cart.findOne({ user: userId });
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const availableFulfillmentOptions = Object.entries(shop.fulfillmentOptions)
      .filter(([_, value]) => value)
      .map(([key, _]) => key);

    if (availableFulfillmentOptions.length === 0) {
      return res.status(400).json({ message: 'No fulfillment options available for this shop' });
    }

    if (!cart) {
      cart = new Cart({
        user: userId,
        shop: shopId,
        items: [],
        totalAmount: 0,
        fulfillmentOption: availableFulfillmentOptions[0] // Set to first available option
      });
    }

    const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (existingItemIndex > -1) {
      // If the item exists, update its quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // If it's a new item, add it to the cart
      cart.items.push({
        product: productId,
        quantity: quantity,
        price: price
      });
    }

    // Recalculate total amount
    cart.totalAmount = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

    await cart.save();

    res.status(200).json({ cart, availableFulfillmentOptions });
  } catch (error) {
    console.error('Error in addToCart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

