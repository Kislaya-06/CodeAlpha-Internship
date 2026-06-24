const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', require('./routes/auth')); // for /api/register and /api/login
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Start Server
app.listen(PORT, () => {
  console.log(`ShopNest running on http://localhost:${PORT}`);
});
