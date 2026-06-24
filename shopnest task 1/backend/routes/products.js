const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const productsFilePath = path.join(__dirname, '../db/products.json');

const readProducts = () => {
  try {
    const data = fs.readFileSync(productsFilePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    return [];
  }
};

// @route   GET api/products
// @desc    Get all products (with optional category and search filters)
// @access  Public
router.get('/', (req, res) => {
  try {
    let products = readProducts();
    const { category, search } = req.query;

    if (category) {
      products = products.filter(
        (product) => product.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(
        (product) =>
          (product.name && product.name.toLowerCase().includes(searchLower)) ||
          (product.description && product.description.toLowerCase().includes(searchLower))
      );
    }

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error retrieving products' });
  }
});

// @route   GET api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', (req, res) => {
  try {
    const products = readProducts();
    const product = products.find((p) => p.id === parseInt(req.params.id));

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error retrieving product' });
  }
});

module.exports = router;
