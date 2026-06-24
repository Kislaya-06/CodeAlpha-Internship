const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const usersFilePath = path.join(__dirname, '../db/users.json');
const cartsFilePath = path.join(__dirname, '../db/carts.json');

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

// @route   POST api/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    const users = readData(usersFilePath);

    const existingUser = users.find((user) => user.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: users.length > 0 ? users[users.length - 1].id + 1 : 1,
      name,
      email,
      password: hashedPassword,
    };

    users.push(newUser);
    writeData(usersFilePath, users);

    // Initialize cart for user
    const carts = readData(cartsFilePath);
    const newCart = {
      user_id: newUser.id,
      items: []
    };
    carts.push(newCart);
    writeData(cartsFilePath, carts);

    const token = jwt.sign(
      { id: newUser.id },
      process.env.JWT_SECRET || 'shopnest_secret_key_12345',
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// @route   POST api/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    const users = readData(usersFilePath);

    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'shopnest_secret_key_12345',
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
