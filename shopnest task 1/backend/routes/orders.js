const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');

const ordersFilePath = path.join(__dirname, '../db/orders.json');
const cartsFilePath = path.join(__dirname, '../db/carts.json');
const productsFilePath = path.join(__dirname, '../db/products.json');

const readData = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    return [];
  }
};

const writeData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

// @route   POST api/orders
// @desc    Place a new order
// @access  Private
router.post('/', auth, (req, res) => {
  try {
    const userId = req.user.id;
    const carts = readData(cartsFilePath);
    const products = readData(productsFilePath);
    const orders = readData(ordersFilePath);

    const userCart = carts.find((c) => c.user_id === userId);
    if (!userCart || userCart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Add products to cart first.' });
    }

    // Validate stock and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of userCart.items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        return res.status(404).json({ error: `Product with ID ${item.product_id} not found.` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for product "${product.name}". Only ${product.stock} items left.`
        });
      }

      // Deduct stock
      product.stock -= item.quantity;
      totalAmount += product.price * item.quantity;

      orderItems.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.image,
        category: product.category,
        quantity: item.quantity
      });
    }

    // Create order
    const newOrder = {
      id: orders.length > 0 ? orders[orders.length - 1].id + 1 : 1,
      user_id: userId,
      items: orderItems,
      total_amount: parseFloat(totalAmount.toFixed(2)),
      status: 'placed',
      date: new Date().toISOString()
    };

    // Save updated products and new order
    writeData(productsFilePath, products);
    orders.push(newOrder);
    writeData(ordersFilePath, orders);

    // Clear user's cart
    userCart.items = [];
    writeData(cartsFilePath, carts);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error placing order' });
  }
});

// @route   GET api/orders
// @desc    Get user's order history
// @access  Private
router.get('/', auth, (req, res) => {
  try {
    const orders = readData(ordersFilePath);
    const userId = req.user.id;

    const userOrders = orders.filter((o) => o.user_id === userId);
    res.json(userOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error retrieving orders' });
  }
});

module.exports = router;
