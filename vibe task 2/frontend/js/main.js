document.addEventListener('DOMContentLoaded', () => {
  const currentToken = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const currentUser = userJson ? JSON.parse(userJson) : null;

  // Initialize UI components
  renderLeftSidebar();
  loadFeed();
  loadPeopleToFollow();
  setupCreatePost();

  // 1. Render Left Sidebar
  async function renderLeftSidebar() {
    const leftSidebar = document.getElementById('sidebar-left-container');
    if (!leftSidebar) return;

    if (currentUser) {
      try {
        // Fetch fresh stats from user profile endpoint
        const profile = await apiCall(`/users/${currentUser.id}`);
        leftSidebar.innerHTML = `
          <div class="card user-card">
            ${getAvatarHTML(profile.avatar, profile.name, 'avatar-profile-card')}
            <h2 class="profile-card-name">${profile.name}</h2>
            <p class="profile-card-bio">${profile.bio || 'No bio yet.'}</p>
            <div class="stats-row">
              <div class="stat-item">
                <span class="stat-num">${profile.post_count}</span>
                <span class="stat-label">Posts</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">${profile.follower_count}</span>
                <span class="stat-label">Followers</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">${profile.following_count}</span>
                <span class="stat-label">Following</span>
              </div>
            </div>
            <button class="btn btn-outline" style="width: 100%;" onclick="window.location.href='profile.html?id=${profile.id}'">View Profile</button>
          </div>
        `;
      } catch (err) {
        console.error('Failed to load profile stats in left sidebar:', err);
      }
    } else {
      leftSidebar.innerHTML = `
        <div class="card user-card">
          <div class="avatar-fallback avatar-profile-card" style="background-color: var(--primary-light); color: var(--primary);">?</div>
          <h2 class="profile-card-name">Welcome to Vibe</h2>
          <p class="profile-card-bio">Log in or create an account to start sharing your vibes!</p>
          <button class="btn btn-primary" style="width: 100%;" onclick="window.location.href='register.html'">Join Vibe</button>
        </div>
      `;
    }
  }

  // 2. Setup Create Post Box
  function setupCreatePost() {
    const createPostContainer = document.getElementById('create-post-container');
    if (!createPostContainer) return;

    if (!currentUser) {
      createPostContainer.style.display = 'none';
      return;
    }

    createPostContainer.innerHTML = `
      <div class="card create-post-box">
        <div class="create-post-input-container">
          ${getAvatarHTML(currentUser.avatar, currentUser.name, 'avatar-small')}
          <textarea id="post-content-input" class="post-textarea" placeholder="What's on your mind?"></textarea>
        </div>
        <div id="image-url-container" class="image-url-input-container">
          <input type="text" id="post-image-input" class="image-url-input" placeholder="Enter image URL (e.g. https://picsum.photos/600/400)">
        </div>
        <div class="post-box-footer">
          <button class="btn btn-secondary btn-text" id="toggle-photo-btn">📷 Photo</button>
          <button class="btn btn-primary" id="submit-post-btn">Post</button>
        </div>
      </div>
    `;

    // Photo Input Toggle
    const togglePhotoBtn = document.getElementById('toggle-photo-btn');
    const imageUrlContainer = document.getElementById('image-url-container');
    togglePhotoBtn.addEventListener('click', () => {
      const isVisible = imageUrlContainer.style.display === 'block';
      imageUrlContainer.style.display = isVisible ? 'none' : 'block';
    });

    // Textarea Auto-expand
    const textarea = document.getElementById('post-content-input');
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });

    // Submit Post
    const submitPostBtn = document.getElementById('submit-post-btn');
    submitPostBtn.addEventListener('click', async () => {
      const content = textarea.value.trim();
      const image = document.getElementById('post-image-input').value.trim();

      if (!content) {
        showToast('Post content cannot be empty.', 'error');
        return;
      }

      try {
        await apiCall('/posts', 'POST', { content, image });
        showToast('Vibe shared successfully!');
        textarea.value = '';
        textarea.style.height = 'auto';
        document.getElementById('post-image-input').value = '';
        imageUrlContainer.style.display = 'none';
        
        // Reload feed and sidebar stats
        loadFeed();
        renderLeftSidebar();
      } catch (err) {
        showToast(err.message || 'Failed to create post', 'error');
      }
    });
  }

  // 3. Load Center Feed
  async function loadFeed() {
    const feedContainer = document.getElementById('feed-container');
    if (!feedContainer) return;

    // Show shimmer loading skeletons
    feedContainer.innerHTML = Array(3).fill(0).map(() => `
      <div class="card post-card" style="min-height: 200px;">
        <div class="post-header">
          <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
            <div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%;"></div>
            <div style="display: flex; flex-direction: column; gap: 6px; width: 150px;">
              <div class="skeleton" style="height: 12px; border-radius: 4px;"></div>
              <div class="skeleton" style="height: 8px; width: 80px; border-radius: 4px;"></div>
            </div>
          </div>
        </div>
        <div class="skeleton" style="height: 12px; width: 90%; margin-bottom: 8px; border-radius: 4px;"></div>
        <div class="skeleton" style="height: 12px; width: 70%; margin-bottom: 20px; border-radius: 4px;"></div>
        <div class="skeleton" style="height: 150px; width: 100%; border-radius: 8px;"></div>
      </div>
    `).join('');

    try {
      const posts = await apiCall('/posts');
      if (posts.length === 0) {
        feedContainer.innerHTML = `
          <div class="card" style="text-align: center; padding: 40px; color: var(--gray);">
            <h3>No vibes posted yet. Be the first to share one!</h3>
          </div>
        `;
        return;
      }

      feedContainer.innerHTML = '';
      posts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'card post-card';
        postCard.id = `post-card-${post.id}`;

        const isOwnPost = currentUser && post.user_id === currentUser.id;
        const isLiked = currentUser && post.likes.includes(currentUser.id);

        postCard.innerHTML = `
          <div class="post-header">
            <div class="post-author-info" onclick="window.location.href='profile.html?id=${post.user_id}'">
              ${getAvatarHTML(post.avatar, post.name, 'avatar-small')}
              <div>
                <div class="post-author-name">${post.name}</div>
                <div class="post-time">${formatTime(post.created_at)}</div>
              </div>
            </div>
            ${isOwnPost ? `
              <div class="post-menu-container">
                <button class="post-menu-btn" onclick="togglePostDropdown(${post.id})">•••</button>
                <div class="post-dropdown" id="dropdown-${post.id}">
                  <button onclick="deletePost(${post.id})">Delete Post</button>
                </div>
              </div>
            ` : ''}
          </div>
          
          <div class="post-content">${post.content}</div>
          
          ${post.image ? `
            <div class="post-image-container" style="background-color: #f3f4f6;">
              <img src="${post.image}" class="post-image" alt="Post content" onload="this.style.backgroundColor='transparent'">
            </div>
          ` : ''}
          
          <div class="post-actions">
            <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLikePost(${post.id}, this)">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              Likes (<span class="like-count">${post.like_count}</span>)
            </button>
            <button class="action-btn" onclick="toggleCommentsSection(${post.id})">
              💬 Comments (<span class="comment-count">${post.comment_count}</span>)
            </button>
            <button class="action-btn" onclick="showToast('Link copied to clipboard!')">
              🔗 Share
            </button>
          </div>
          
          <div class="comments-section" id="comments-section-${post.id}">
            <div class="comments-list" id="comments-list-${post.id}"></div>
            ${currentUser ? `
              <div class="comment-input-container">
                <input type="text" placeholder="Write a comment..." class="comment-input" id="comment-input-${post.id}" onkeypress="handleCommentSubmit(event, ${post.id})">
                <button class="btn btn-primary btn-text" onclick="submitComment(${post.id})" style="padding: 4px 12px; color: var(--primary);">Send</button>
              </div>
            ` : '<p style="font-size: 12px; color: var(--gray); text-align: center; margin-top: 8px;">Please log in to add comments.</p>'}
          </div>
        `;

        feedContainer.appendChild(postCard);
      });
    } catch (err) {
      feedContainer.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px; color: #ef4444;">
          <h3>Failed to load feed.</h3>
        </div>
      `;
    }
  }

  // 4. Toggle Like post
  window.toggleLikePost = async function(postId, btn) {
    if (!currentUser) {
      showToast('Please login to like posts.', 'error');
      return;
    }

    // Toggle styling optimistically
    const isLiked = btn.classList.contains('liked');
    const likeCountSpan = btn.querySelector('.like-count');
    let currentCount = parseInt(likeCountSpan.textContent);

    if (isLiked) {
      btn.classList.remove('liked');
      likeCountSpan.textContent = currentCount - 1;
    } else {
      btn.classList.add('liked');
      likeCountSpan.textContent = currentCount + 1;
    }

    try {
      const updatedLikes = await apiCall(`/posts/${postId}/like`, 'POST');
      likeCountSpan.textContent = updatedLikes.length;
      if (updatedLikes.includes(currentUser.id)) {
        btn.classList.add('liked');
      } else {
        btn.classList.remove('liked');
      }
    } catch (err) {
      // Revert styling on error
      if (isLiked) {
        btn.classList.add('liked');
        likeCountSpan.textContent = currentCount;
      } else {
        btn.classList.remove('liked');
        likeCountSpan.textContent = currentCount;
      }
      showToast('Failed to update like status.', 'error');
    }
  };

  // 5. Toggle Comments section
  window.toggleCommentsSection = function(postId) {
    const commentsSec = document.getElementById(`comments-section-${postId}`);
    const isVisible = commentsSec.style.display === 'block';

    if (isVisible) {
      commentsSec.style.display = 'none';
    } else {
      commentsSec.style.display = 'block';
      loadComments(postId);
    }
  };

  // 6. Load Comments
  async function loadComments(postId) {
    const commentsList = document.getElementById(`comments-list-${postId}`);
    commentsList.innerHTML = `<div style="text-align: center; padding: 10px;"><span class="skeleton" style="display:inline-block; width: 60%; height: 10px; border-radius: 4px;"></span></div>`;

    try {
      const comments = await apiCall(`/posts/${postId}/comments`);
      commentsList.innerHTML = '';
      if (comments.length === 0) {
        commentsList.innerHTML = `<p style="font-size: 12px; color: var(--gray); text-align: center; padding: 10px 0;">No comments yet.</p>`;
        return;
      }

      comments.forEach(comment => {
        const commentItem = document.createElement('div');
        commentItem.className = 'comment-item';
        const isOwnComment = currentUser && comment.user_id === currentUser.id;

        commentItem.innerHTML = `
          ${getAvatarHTML(comment.avatar, comment.name, 'avatar-small')}
          <div class="comment-content-box">
            <div class="comment-author-name" onclick="window.location.href='profile.html?id=${comment.user_id}'">${comment.name}</div>
            <div class="comment-text">${comment.content}</div>
          </div>
          ${isOwnComment ? `
            <button class="comment-delete-btn" onclick="deleteComment(${comment.id}, ${postId})">✕</button>
          ` : ''}
        `;
        commentsList.appendChild(commentItem);
      });
    } catch (err) {
      commentsList.innerHTML = `<p style="font-size: 12px; color: #ef4444; text-align: center; padding: 10px 0;">Failed to load comments.</p>`;
    }
  }

  // 7. Submit Comment
  window.handleCommentSubmit = function(event, postId) {
    if (event.key === 'Enter') {
      submitComment(postId);
    }
  };

  window.submitComment = async function(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();

    if (!content) return;

    try {
      await apiCall(`/posts/${postId}/comments`, 'POST', { content });
      input.value = '';
      loadComments(postId);
      
      // Update comment count on post actions row
      const postCard = document.getElementById(`post-card-${postId}`);
      const commentCountSpan = postCard.querySelector('.comment-count');
      if (commentCountSpan) {
        commentCountSpan.textContent = parseInt(commentCountSpan.textContent) + 1;
      }
    } catch (err) {
      showToast('Failed to add comment.', 'error');
    }
  };

  // 8. Delete Comment
  window.deleteComment = async function(commentId, postId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await apiCall(`/comments/${commentId}`, 'DELETE');
      showToast('Comment deleted.');
      loadComments(postId);

      // Decrement comment count on post actions row
      const postCard = document.getElementById(`post-card-${postId}`);
      const commentCountSpan = postCard.querySelector('.comment-count');
      if (commentCountSpan) {
        commentCountSpan.textContent = Math.max(0, parseInt(commentCountSpan.textContent) - 1);
      }
    } catch (err) {
      showToast('Failed to delete comment.', 'error');
    }
  };

  // 9. Three-dot menu dropdown toggle
  window.togglePostDropdown = function(postId) {
    const dropdown = document.getElementById(`dropdown-${postId}`);
    const isVisible = dropdown.style.display === 'block';
    
    // Close other dropdowns
    document.querySelectorAll('.post-dropdown').forEach(d => d.style.display = 'none');
    
    if (!isVisible) {
      dropdown.style.display = 'block';
    }
  };

  // Close dropdown on clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('post-menu-btn')) {
      document.querySelectorAll('.post-dropdown').forEach(d => d.style.display = 'none');
    }
  });

  // 10. Delete Post
  window.deletePost = async function(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await apiCall(`/posts/${postId}`, 'DELETE');
      showToast('Post deleted successfully.');
      loadFeed();
      renderLeftSidebar();
    } catch (err) {
      showToast(err.message || 'Failed to delete post.', 'error');
    }
  };

  // 11. Load People To Follow Sidebar
  async function loadPeopleToFollow() {
    const followList = document.getElementById('people-to-follow-list');
    if (!followList) return;

    try {
      let users = await apiCall('/users');
      
      // Filter out logged-in user if exists
      if (currentUser) {
        users = users.filter(u => u.id !== currentUser.id);
      }

      // Draw up to 4 users randomly
      const shuffled = users.sort(() => 0.5 - Math.random()).slice(0, 4);

      followList.innerHTML = '';
      
      if (shuffled.length === 0) {
        followList.innerHTML = `<p style="font-size: 12px; color: var(--gray); text-align: center; padding: 10px 0;">No other users found.</p>`;
        return;
      }

      // Check current user following status for each recommended user
      let currentFollowing = [];
      if (currentUser) {
        const selfProfile = await apiCall(`/users/${currentUser.id}`);
        currentFollowing = selfProfile.following || [];
      }

      shuffled.forEach(user => {
        const isFollowing = currentFollowing.includes(user.id);
        const followItem = document.createElement('div');
        followItem.className = 'follow-item';

        followItem.innerHTML = `
          <div class="follow-user-info" onclick="window.location.href='profile.html?id=${user.id}'">
            ${getAvatarHTML(user.avatar, user.name, 'avatar-small')}
            <span class="follow-user-name">${user.name}</span>
          </div>
          ${currentUser ? `
            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 12px;" onclick="toggleFollowUser(${user.id}, this)">
              ${isFollowing ? 'Following' : 'Follow'}
            </button>
          ` : `<button class="btn btn-outline" style="padding: 6px 12px; font-size: 12px;" onclick="window.location.href='login.html'">Follow</button>`}
        `;
        followList.appendChild(followItem);
      });
    } catch (err) {
      followList.innerHTML = `<p style="font-size: 12px; color: #ef4444;">Failed to load recommended users.</p>`;
    }
  }

  // 12. Toggle Follow recommended user
  window.toggleFollowUser = async function(userId, btn) {
    try {
      const result = await apiCall(`/users/${userId}/follow`, 'POST');
      showToast(result.message);
      
      if (result.following) {
        btn.textContent = 'Following';
        btn.style.backgroundColor = 'var(--primary)';
        btn.style.color = 'var(--white)';
      } else {
        btn.textContent = 'Follow';
        btn.style.backgroundColor = 'transparent';
        btn.style.color = 'var(--primary)';
      }
      
      // Update sidebar count
      renderLeftSidebar();
    } catch (err) {
      showToast('Action failed.', 'error');
    }
  };
});
