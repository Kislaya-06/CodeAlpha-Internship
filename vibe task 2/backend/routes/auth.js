const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getUsers, saveUsers } = require('../db/dbHelper');

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password, bio } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    const users = getUsers();
    
    // Check if user already exists
    const userExists = users.some(user => user.email.toLowerCase() === email.toLowerCase());
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user id
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    
    // Assign a random avatar image index (1 to 70)
    const randomImgIdx = Math.floor(Math.random() * 70) + 1;
    const avatar = `https://i.pravatar.cc/150?img=${randomImgIdx}`;

    const newUser = {
      id: newId,
      name,
      email,
      password: hashedPassword,
      bio: bio || '',
      avatar
    };

    users.push(newUser);
    saveUsers(users);

    // Generate JWT
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET || 'vibe_jwt_secret_key_12345', {
      expiresIn: '7d'
    });

    const userResponse = { ...newUser };
    delete userResponse.password;

    res.status(201).json({
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'vibe_jwt_secret_key_12345', {
      expiresIn: '7d'
    });

    const userResponse = { ...user };
    delete userResponse.password;

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;
