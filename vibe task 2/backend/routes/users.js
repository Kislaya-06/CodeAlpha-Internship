const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getUsers, saveUsers, getFollowers, saveFollowers, getPosts } = require('../db/dbHelper');

// @route   GET /api/users/:id
// @desc    Get user profile (no password) with stats
router.get('/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const users = getUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const { password, ...userWithoutPassword } = user;

    // Get posts count
    const posts = getPosts();
    const userPostsCount = posts.filter(p => p.user_id === userId).length;

    // Get followers and following counts
    const followersList = getFollowers();
    const followerCount = followersList.filter(f => f.following_id === userId).length;
    const followingCount = followersList.filter(f => f.follower_id === userId).length;

    res.json({
      ...userWithoutPassword,
      post_count: userPostsCount,
      follower_count: followerCount,
      following_count: followingCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving user profile.' });
  }
});

// @route   POST /api/users/:id/follow
// @desc    Follow or unfollow a user
router.post('/users/:id/follow', auth, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'You cannot follow yourself.' });
    }

    // Verify user exists
    const users = getUsers();
    const userExists = users.some(u => u.id === targetUserId);
    if (!userExists) {
      return res.status(404).json({ message: 'User to follow not found.' });
    }

    const followersList = getFollowers();
    const alreadyFollowingIndex = followersList.findIndex(
      f => f.follower_id === currentUserId && f.following_id === targetUserId
    );

    let following = false;
    if (alreadyFollowingIndex > -1) {
      // Unfollow
      followersList.splice(alreadyFollowingIndex, 1);
    } else {
      // Follow
      followersList.push({ follower_id: currentUserId, following_id: targetUserId });
      following = true;
    }

    saveFollowers(followersList);

    res.json({
      message: following ? 'Successfully followed user.' : 'Successfully unfollowed user.',
      following
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error performing follow action.' });
  }
});

// @route   GET /api/users/:id/posts
// @desc    Get all posts by a specific user
router.get('/users/:id/posts', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const posts = getPosts();
    const userPosts = posts
      .filter(p => p.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Enrich with author details
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    const author_name = user ? user.name : '';
    const author_avatar = user ? user.avatar : '';
    
    const { getComments } = require('../db/dbHelper');
    const comments = getComments();

    const enrichedPosts = userPosts.map(post => {
      const postComments = comments.filter(c => c.post_id === post.id);
      return {
        ...post,
        name: author_name,
        avatar: author_avatar,
        author_name,
        author_avatar,
        comment_count: postComments.length,
        like_count: post.likes ? post.likes.length : 0
      };
    });

    res.json(enrichedPosts);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving user posts.' });
  }
});

module.exports = router;
