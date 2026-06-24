const API_BASE = '/api';

// API Call Wrapper
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    
    // Auto logout on 401
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      showToast('Session expired. Please login again.', 'error');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
      throw new Error('Unauthorized');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  } catch (error) {
    console.error(`API Error: ${method} ${endpoint}`, error);
    throw error;
  }
}

// Relative Time Formatter
function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Toast Notifications System
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? '✓' : '✗';
  toast.innerHTML = `
    <span class="toast-icon" style="font-weight: bold; color: ${type === 'success' ? '#10b981' : '#ef4444'}">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger show animation
  setTimeout(() => toast.classList.add('show'), 50);

  // Auto remove after 3s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Avatar Fallback Render Helper
function getAvatarHTML(avatarUrl, name, sizeClass = 'avatar-small') {
  if (avatarUrl) {
    return `<img src="${avatarUrl}" class="${sizeClass}" alt="${name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';">`;
  }
  const firstLetter = name ? name.charAt(0) : '?';
  // Generate a distinct color based on name string
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
  const color = colors[Math.abs(hash) % colors.length];

  return `
    <div class="avatar-fallback ${sizeClass}" style="background-color: ${color}; display: inline-flex; justify-content: center; align-items: center; border-radius: 50%;">
      ${firstLetter}
    </div>
  `;
}

// Global Navbar Setup
function renderNavbar() {
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const navActions = document.getElementById('nav-actions');
  if (!navActions) return;

  if (user) {
    navActions.innerHTML = `
      <div class="nav-user" onclick="window.location.href='profile.html?id=${user.id}'">
        ${getAvatarHTML(user.avatar, user.name, 'avatar-nav')}
        <span class="username-nav">${user.name}</span>
      </div>
      <button class="btn btn-text" id="logout-btn">Logout</button>
    `;
    document.getElementById('logout-btn').addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      showToast('Logged out successfully.');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
    });
  } else {
    navActions.innerHTML = `
      <button class="btn btn-text" onclick="window.location.href='login.html'">Login</button>
      <button class="btn btn-primary" onclick="window.location.href='register.html'">Sign Up</button>
    `;
  }
}

// Run basic page setups when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});
