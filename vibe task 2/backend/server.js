const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from vibe/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Wire all routes under the requested base paths
app.use('/api', require('./routes/auth'));       // /api/register, /api/login
app.use('/api/posts', require('./routes/posts')); // /api/posts, /api/posts/:id, /api/posts/:id/like
app.use('/api', require('./routes/comments'));   // /api/posts/:id/comments, /api/comments/:id
app.use('/api', require('./routes/users'));      // /api/users/:id, /api/users/:id/follow, /api/users/:id/posts

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Vibe API!' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Vibe running on http://localhost:${PORT}`);
});
