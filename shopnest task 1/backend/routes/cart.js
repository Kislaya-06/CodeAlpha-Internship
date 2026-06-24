const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');

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

// @route   GET api/cart
// @desc    Get user's cart items with full product details
// @access  Private
router.get('/', auth, (req, res) => {
  try {
    const carts = readData(cartsFilePath);
    const products = readData(productsFilePath);
    const userId = req.user.id;

    let userCart = carts.find((c) => c.user_id === userId);
    if (!userCart) {
      userCart = { user_id: userId, items: [] };
      carts.push(userCart);
      writeData(cartsFilePath, carts);
    }

    // Join products details
    const populatedItems = userCart.items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        product: product || null
      };
    });

    res.json(populatedItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error retrieving cart' });
  }
});

// @route   POST api/cart
// @desc    Add item or add to existing quantity in cart
// @access  Private
router.post('/', auth, (req, res) => {
  const { product_id, productId, quantity } = req.body;
  const targetProductId = product_id !== undefined ? product_id : productId;

  if (targetProductId === undefined || quantity === undefined || quantity <= 0) {
    return res.status(400).json({ error: 'Please provide valid product_id and quantity' });
  }

  try {
    const products = readData(productsFilePath);
    const product = products.find((p) => p.id === parseInt(targetProductId));

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const carts = readData(cartsFilePath);
    const userId = req.user.id;

    let userCart = carts.find((c) => c.user_id === userId);
    if (!userCart) {
      userCart = { user_id: userId, items: [] };
      carts.push(userCart);
    }

    const itemIndex = userCart.items.findIndex((item) => item.product_id === parseInt(targetProductId));
    const currentQuantityInCart = itemIndex > -1 ? userCart.items[itemIndex].quantity : 0;
    const newTotalQuantity = currentQuantityInCart + parseInt(quantity);

    if (product.stock < newTotalQuantity) {
      return res.status(400).json({
        error: `Insufficient stock. Only ${product.stock} items left. You already have ${currentQuantityInCart} in your cart.`
      });
    }

    if (itemIndex > -1) {
      // Add to existing quantity
      userCart.items[itemIndex].quantity = newTotalQuantity;
    } else {
      // Add new item
      userCart.items.push({ product_id: parseInt(targetProductId), quantity: parseInt(quantity) });
    }

    writeData(cartsFilePath, carts);
    res.json(userCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating cart' });
  }
});

// @route   DELETE api/cart/:product_id
// @desc    Remove product from user's cart
// @access  Private
router.delete('/:product_id', auth, (req, res) => {
  const targetProductId = parseInt(req.params.product_id);

  try {
    const carts = readData(cartsFilePath);
    const userId = req.user.id;

    const userCart = carts.find((c) => c.user_id === userId);
    if (!userCart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    userCart.items = userCart.items.filter((item) => item.product_id !== targetProductId);
    writeData(cartsFilePath, carts);

    res.json(userCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error removing item from cart' });
  }
});

module.exports = router;
