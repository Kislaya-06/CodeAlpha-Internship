document.addEventListener('DOMContentLoaded', () => {
  const currentToken = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const currentUser = userJson ? JSON.parse(userJson) : null;

  // Get target user ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const targetUserId = parseInt(urlParams.get('id'));

  if (!targetUserId) {
    showToast('User ID is missing.', 'error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
    return;
  }

  // UI elements
  const avatarEl = document.getElementById('profile-avatar');
  const nameEl = document.getElementById('profile-name');
  const bioEl = document.getElementById('profile-bio');
  const postCountEl = document.getElementById('profile-post-count');
  const followerCountEl = document.getElementById('profile-follower-count');
  const followingCountEl = document.getElementById('profile-following-count');
  const actionBtnContainer = document.getElementById('profile-action-container');
  const postsGrid = document.getElementById('posts-grid');

  // Load profile on start
  loadProfile();

  async function loadProfile() {
    try {
      const profile = await apiCall(`/users/${targetUserId}`);
      
      // Update UI elements
      avatarEl.innerHTML = getAvatarHTML(profile.avatar, profile.name, 'profile-avatar-large');
      nameEl.textContent = profile.name;
      bioEl.textContent = profile.bio || 'No bio yet.';
      postCountEl.textContent = profile.post_count;
      followerCountEl.textContent = profile.follower_count;
      followingCountEl.textContent = profile.following_count;

      // Handle Follow/Unfollow/Edit Action Button
      setupActionButton(profile);

      // Load Profile Posts Grid
      loadProfilePosts();
    } catch (err) {
      showToast('Failed to load profile.', 'error');
    }
  }

  // 1. Setup Action Button
  function setupActionButton(profile) {
    if (!currentUser) {
      actionBtnContainer.innerHTML = `
        <button class="btn btn-primary" onclick="window.location.href='login.html'">Follow</button>
      `;
      return;
    }

    const isOwnProfile = currentUser.id === targetUserId;

    if (isOwnProfile) {
      actionBtnContainer.innerHTML = `
        <button class="btn btn-outline" onclick="openEditProfileModal()">Edit Profile</button>
      `;
    } else {
      // Determine if currently following
      const isFollowing = profile.followers && profile.followers.includes(currentUser.id);
      
      actionBtnContainer.innerHTML = `
        <button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}" id="profile-follow-btn">
          ${isFollowing ? 'Following' : 'Follow'}
        </button>
      `;

      document.getElementById('profile-follow-btn').addEventListener('click', async () => {
        try {
          const result = await apiCall(`/users/${targetUserId}/follow`, 'POST');
          showToast(result.message);
          // Reload profile statistics
          loadProfile();
        } catch (err) {
          showToast('Failed to perform follow action.', 'error');
        }
      });
    }
  }

  // 2. Load User Posts Grid
  async function loadProfilePosts() {
    postsGrid.innerHTML = Array(3).fill(0).map(() => `
      <div class="skeleton" style="aspect-ratio: 1; border-radius: var(--radius-sm);"></div>
    `).join('');

    try {
      const posts = await apiCall(`/users/${targetUserId}/posts`);
      postsGrid.innerHTML = '';

      if (posts.length === 0) {
        postsGrid.innerHTML = `
          <div style="grid-column: span 3; text-align: center; padding: 40px; color: var(--gray);">
            <h3>No vibes posted yet.</h3>
          </div>
        `;
        return;
      }

      posts.forEach(post => {
        const postItem = document.createElement('div');
        postItem.className = 'grid-post-item';
        postItem.addEventListener('click', () => openPostModal(post.id));

        postItem.innerHTML = `
          <img src="${post.image || 'https://picsum.photos/600/400'}" class="grid-post-image" alt="Post content" loading="lazy">
          <div class="grid-post-overlay">
            ❤️ ${post.like_count}
          </div>
        `;

        postsGrid.appendChild(postItem);
      });
    } catch (err) {
      postsGrid.innerHTML = `
        <div style="grid-column: span 3; text-align: center; padding: 40px; color: #ef4444;">
          <h3>Failed to load posts.</h3>
        </div>
      `;
    }
  }

  // 3. Edit Profile Modal
  window.openEditProfileModal = function() {
    const modal = document.getElementById('post-detail-modal');
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 450px;">
        <button class="modal-close" onclick="closeModal()">✕</button>
        <h2 style="font-weight: 800; margin-bottom: 20px;">Edit Profile</h2>
        <form id="edit-profile-form">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="edit-name" class="form-control" value="${currentUser.name}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Bio</label>
            <textarea id="edit-bio" class="form-control" rows="3">${currentUser.bio || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Avatar Image URL</label>
            <input type="text" id="edit-avatar" class="form-control" value="${currentUser.avatar || ''}">
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Save Changes</button>
        </form>
      </div>
    `;

    document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-name').value.trim();
      const bio = document.getElementById('edit-bio').value.trim();
      const avatar = document.getElementById('edit-avatar').value.trim();

      try {
        const updated = await apiCall('/profile', 'PUT', { name, bio, avatar });
        localStorage.setItem('user', JSON.stringify(updated));
        showToast('Profile updated successfully!');
        closeModal();
        
        // Refresh navbar & profile header
        renderNavbar();
        loadProfile();
      } catch (err) {
        showToast('Failed to update profile.', 'error');
      }
    });
  };

  // 4. Open Post Detail Modal
  window.openPostModal = async function(postId) {
    const modal = document.getElementById('post-detail-modal');
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <button class="modal-close" onclick="closeModal()">✕</button>
        <div style="text-align: center; padding: 20px;">
          <span class="skeleton" style="display:inline-block; width: 80%; height: 12px; border-radius: 4px; margin-bottom: 8px;"></span>
          <span class="skeleton" style="display:inline-block; width: 60%; height: 12px; border-radius: 4px;"></span>
        </div>
      </div>
    `;

    try {
      const post = await apiCall(`/posts/${postId}`);
      const isLiked = currentUser && post.likes.includes(currentUser.id);
      
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
          <button class="modal-close" onclick="closeModal()">✕</button>
          
          <div class="post-header">
            <div class="post-author-info">
              ${getAvatarHTML(post.avatar, post.name, 'avatar-small')}
              <div>
                <div class="post-author-name">${post.name}</div>
                <div class="post-time">${formatTime(post.created_at)}</div>
              </div>
            </div>
          </div>
          
          <div class="post-content" style="font-size: 16px;">${post.content}</div>
          
          ${post.image ? `
            <div class="post-image-container" style="background-color: #f3f4f6;">
              <img src="${post.image}" class="post-image" alt="Post content">
            </div>
          ` : ''}
          
          <div class="post-actions" style="margin-bottom: 16px;">
            <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="toggleModalLike(${post.id}, this)">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              Likes (<span id="modal-like-count">${post.like_count}</span>)
            </button>
          </div>
          
          <div style="border-top: 1px solid var(--border-color); padding-top: 16px;">
            <h4 style="font-weight: 700; margin-bottom: 12px;">Comments</h4>
            <div class="comments-list" id="modal-comments-list" style="max-height: 250px; overflow-y: auto;"></div>
            ${currentUser ? `
              <div class="comment-input-container" style="margin-top: 12px;">
                <input type="text" placeholder="Write a comment..." class="comment-input" id="modal-comment-input" onkeypress="handleModalCommentSubmit(event, ${post.id})">
                <button class="btn btn-primary btn-text" onclick="submitModalComment(${post.id})" style="padding: 4px 12px; color: var(--primary);">Send</button>
              </div>
            ` : '<p style="font-size: 12px; color: var(--gray); text-align: center; margin-top: 8px;">Please log in to add comments.</p>'}
          </div>
        </div>
      `;

      loadModalComments(post.id);
    } catch (err) {
      modal.innerHTML = `
        <div class="modal-content">
          <button class="modal-close" onclick="closeModal()">✕</button>
          <p style="text-align: center; color: #ef4444; padding: 20px;">Failed to load post details.</p>
        </div>
      `;
    }
  };

  window.closeModal = function() {
    const modal = document.getElementById('post-detail-modal');
    modal.style.display = 'none';
    modal.innerHTML = '';
  };

  // Close modal when clicking outside content
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('post-detail-modal');
    if (e.target === modal) {
      closeModal();
    }
  });

  // Modal Like Helper
  window.toggleModalLike = async function(postId, btn) {
    if (!currentUser) {
      showToast('Please login to like posts.', 'error');
      return;
    }

    const isLiked = btn.classList.contains('liked');
    const likeCountSpan = document.getElementById('modal-like-count');
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
      // Reload profile grid likes count
      loadProfilePosts();
    } catch (err) {
      // Revert styling on error
      if (isLiked) {
        btn.classList.add('liked');
        likeCountSpan.textContent = currentCount;
      } else {
        btn.classList.remove('liked');
        likeCountSpan.textContent = currentCount;
      }
    }
  };

  // Modal Comments Loading
  async function loadModalComments(postId) {
    const commentsList = document.getElementById('modal-comments-list');
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
            <button class="comment-delete-btn" onclick="deleteModalComment(${comment.id}, ${postId})">✕</button>
          ` : ''}
        `;
        commentsList.appendChild(commentItem);
      });
    } catch (err) {
      commentsList.innerHTML = `<p style="font-size: 12px; color: #ef4444; text-align: center; padding: 10px 0;">Failed to load comments.</p>`;
    }
  }

  // Modal Comment Submission
  window.handleModalCommentSubmit = function(event, postId) {
    if (event.key === 'Enter') {
      submitModalComment(postId);
    }
  };

  window.submitModalComment = async function(postId) {
    const input = document.getElementById('modal-comment-input');
    const content = input.value.trim();

    if (!content) return;

    try {
      await apiCall(`/posts/${postId}/comments`, 'POST', { content });
      input.value = '';
      loadModalComments(postId);
    } catch (err) {
      showToast('Failed to add comment.', 'error');
    }
  };

  window.deleteModalComment = async function(commentId, postId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await apiCall(`/comments/${commentId}`, 'DELETE');
      showToast('Comment deleted.');
      loadModalComments(postId);
    } catch (err) {
      showToast('Failed to delete comment.', 'error');
    }
  };
});
