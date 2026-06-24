const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getComments, saveComments, getUsers } = require('../db/dbHelper');

// Helper to attach user info to a comment
const enrichComment = (comment, users) => {
  const user = users.find(u => u.id === comment.user_id);
  return {
    ...comment,
    name: user ? user.name : '',
    avatar: user ? user.avatar : '',
    author_name: user ? user.name : '',
    author_avatar: user ? user.avatar : ''
  };
};

// @route   GET /api/posts/:id/comments
// @desc    Get comments for a post
router.get('/posts/:id/comments', (req, res) => {
  try {
    const comments = getComments();
    const users = getUsers();
    const postId = parseInt(req.params.id);

    const postComments = comments
      .filter(c => c.post_id === postId)
      .map(c => enrichComment(c, users));

    res.json(postComments);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving comments.' });
  }
});

// @route   POST /api/posts/:id/comments
// @desc    Create a comment on a post
router.post('/posts/:id/comments', auth, (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Comment content is required.' });
  }

  try {
    const comments = getComments();
    const postId = parseInt(req.params.id);
    const nextId = comments.length > 0 ? Math.max(...comments.map(c => c.id)) + 1 : 1;

    const newComment = {
      id: nextId,
      post_id: postId,
      user_id: req.user.id,
      content,
      created_at: new Date().toISOString()
    };

    comments.push(newComment);
    saveComments(comments);

    const users = getUsers();
    res.status(201).json(enrichComment(newComment, users));
  } catch (error) {
    res.status(500).json({ message: 'Server error creating comment.' });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
router.delete('/comments/:id', auth, (req, res) => {
  try {
    const comments = getComments();
    const commentId = parseInt(req.params.id);
    const comment = comments.find(c => c.id === commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    // Check ownership of the comment
    if (comment.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment.' });
    }

    const filteredComments = comments.filter(c => c.id !== commentId);
    saveComments(filteredComments);

    res.json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting comment.' });
  }
});

module.exports = router;
