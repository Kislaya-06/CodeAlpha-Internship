const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getPosts, savePosts, getUsers, getComments } = require('../db/dbHelper');

// Helper to attach user info and count stats to post
const enrichPost = (post, users, comments) => {
  const user = users.find(u => u.id === post.user_id);
  const postComments = comments.filter(c => c.post_id === post.id);
  
  return {
    ...post,
    name: user ? user.name : '',
    avatar: user ? user.avatar : '',
    author_name: user ? user.name : '',
    author_avatar: user ? user.avatar : '',
    comment_count: postComments.length,
    like_count: post.likes ? post.likes.length : 0
  };
};

// @route   GET /api/posts
// @desc    Get all posts (sorted by newest)
router.get('/', (req, res) => {
  try {
    const posts = getPosts();
    const users = getUsers();
    const comments = getComments();

    const enriched = posts
      .map(post => enrichPost(post, users, comments))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving posts.' });
  }
});

// @route   GET /api/posts/:id
// @desc    Get post by ID
router.get('/:id', (req, res) => {
  try {
    const posts = getPosts();
    const post = posts.find(p => p.id === parseInt(req.params.id));
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }
    const users = getUsers();
    const comments = getComments();

    res.json(enrichPost(post, users, comments));
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving post.' });
  }
});

// @route   POST /api/posts
// @desc    Create a post
router.post('/', auth, (req, res) => {
  const { content, image } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Content is required.' });
  }

  try {
    const posts = getPosts();
    const nextId = posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1;

    const newPost = {
      id: nextId,
      user_id: req.user.id,
      content,
      image: image || `https://picsum.photos/600/400?random=${nextId}`,
      likes: [],
      created_at: new Date().toISOString()
    };

    posts.push(newPost);
    savePosts(posts);

    const users = getUsers();
    const comments = getComments();
    res.status(201).json(enrichPost(newPost, users, comments));
  } catch (error) {
    res.status(500).json({ message: 'Server error creating post.' });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like or unlike a post, return the updated likes array
router.post('/:id/like', auth, (req, res) => {
  try {
    const posts = getPosts();
    const postIndex = posts.findIndex(p => p.id === parseInt(req.params.id));

    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const post = posts[postIndex];
    const userId = req.user.id;

    if (post.likes.includes(userId)) {
      // Unlike
      post.likes = post.likes.filter(id => id !== userId);
    } else {
      // Like
      post.likes.push(userId);
    }

    savePosts(posts);
    res.json(post.likes);
  } catch (error) {
    res.status(500).json({ message: 'Server error liking/unliking post.' });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
router.delete('/:id', auth, (req, res) => {
  try {
    const posts = getPosts();
    const post = posts.find(p => p.id === parseInt(req.params.id));

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Check ownership
    if (post.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this post.' });
    }

    const filteredPosts = posts.filter(p => p.id !== parseInt(req.params.id));
    savePosts(filteredPosts);

    // Also delete comments associated with this post
    const comments = getComments();
    const remainingComments = comments.filter(c => c.post_id !== parseInt(req.params.id));
    saveComments(remainingComments);

    res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting post.' });
  }
});

module.exports = router;
