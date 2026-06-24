// Global State
const state = {
  token: localStorage.getItem('shopnest_token') || null,
  user: JSON.parse(localStorage.getItem('shopnest_user')) || null,
  cartCount: 0
};

// Toast Notifications Helper
function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Common Header / Navbar Render
function renderNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const isLoggedIn = !!state.token;
  const avatarLetter = isLoggedIn && state.user && state.user.name ? state.user.name.charAt(0).toUpperCase() : 'U';

  navbar.innerHTML = `
    <div class="nav-left">
      <a href="/" class="logo">ShopNest 🛒</a>
    </div>
    <div class="nav-center">
      <span class="search-icon">🔍</span>
      <input type="text" id="nav-search" class="search-input" placeholder="Search products..." value="${new URLSearchParams(window.location.search).get('search') || ''}">
    </div>
    <div class="nav-right">
      <a href="/orders.html" class="nav-link">Orders</a>
      <a href="/cart.html" class="cart-btn">
        🛒
        <span class="cart-badge" id="cart-badge" style="display: ${state.cartCount > 0 ? 'flex' : 'none'}">${state.cartCount}</span>
      </a>
      ${isLoggedIn ? `
        <div class="user-menu">
          <button class="avatar" id="avatar-btn">${avatarLetter}</button>
          <div class="dropdown-menu" id="user-dropdown">
            <button class="dropdown-item" onclick="logout()">Logout</button>
          </div>
        </div>
      ` : `
        <div class="auth-btns">
          <button class="btn btn-text" onclick="showAuthModal('login')">Login</button>
          <button class="btn btn-primary" onclick="showAuthModal('signup')">Sign Up</button>
        </div>
      `}
    </div>
  `;

  // Register Search listener
  const searchInput = document.getElementById('nav-search');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = e.target.value.trim();
        // If we are on homepage, trigger local filter. Otherwise redirect to index.html with query parameter
        if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
          if (window.filterProducts) {
            window.filterProducts(query);
          }
        } else {
          window.location.href = `/?search=${encodeURIComponent(query)}`;
        }
      }, 400);
    });
  }

  // Register Avatar Dropdown
  const avatarBtn = document.getElementById('avatar-btn');
  if (avatarBtn) {
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('user-dropdown').classList.toggle('show');
    });
  }
}

// Close Dropdowns on outside click
window.addEventListener('click', () => {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) dropdown.classList.remove('show');
});

// Authentication Modal Functions
function showAuthModal(type) {
  // Check if backdrop already exists
  let modalBackdrop = document.getElementById('auth-modal-backdrop');
  if (!modalBackdrop) {
    modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'auth-modal-backdrop';
    modalBackdrop.className = 'modal-backdrop';
    document.body.appendChild(modalBackdrop);
  }

  const isLogin = type === 'login';
  modalBackdrop.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <span class="modal-close" onclick="hideAuthModal()">&times;</span>
      <h2 class="modal-title">${isLogin ? 'Login to ShopNest' : 'Create Account'}</h2>
      <form id="auth-form" onsubmit="handleAuthSubmit(event, '${type}')">
        ${!isLogin ? `
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="auth-name" class="form-control" placeholder="John Doe" required>
          </div>
        ` : ''}
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" id="auth-email" class="form-control" placeholder="john@example.com" required>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="auth-password" class="form-control" placeholder="••••••••" required>
        </div>
        <button type="submit" class="auth-submit-btn">${isLogin ? 'Log In' : 'Sign Up'}</button>
      </form>
      <div class="modal-footer">
        ${isLogin ? `
          Don't have an account? <a href="#" onclick="showAuthModal('signup')">Sign Up</a>
        ` : `
          Already have an account? <a href="#" onclick="showAuthModal('login')">Log In</a>
        `}
      </div>
    </div>
  `;

  modalBackdrop.classList.add('show');
}

function hideAuthModal() {
  const modalBackdrop = document.getElementById('auth-modal-backdrop');
  if (modalBackdrop) modalBackdrop.classList.remove('show');
}

async function handleAuthSubmit(event, type) {
  event.preventDefault();
  const isLogin = type === 'login';

  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const name = !isLogin ? document.getElementById('auth-name').value.trim() : '';

  const endpoint = isLogin ? '/api/login' : '/api/register';
  const payload = isLogin ? { email, password } : { name, email, password };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    localStorage.setItem('shopnest_token', data.token);
    localStorage.setItem('shopnest_user', JSON.stringify(data.user));
    state.token = data.token;
    state.user = data.user;

    showToast(isLogin ? `Welcome back, ${data.user.name}!` : 'Account registered successfully!');
    hideAuthModal();
    renderNavbar();
    await fetchCartCount();
    
    // Refresh page details if relevant
    if (window.onUserAuthenticated) {
      window.onUserAuthenticated();
    }
  } catch (err) {
    showToast(err.message);
  }
}

function logout() {
  localStorage.removeItem('shopnest_token');
  localStorage.removeItem('shopnest_user');
  state.token = null;
  state.user = null;
  state.cartCount = 0;
  showToast('Logged out successfully.');
  renderNavbar();
  
  // Refresh page details if relevant
  if (window.onUserAuthenticated) {
    window.onUserAuthenticated();
  }
}

// Fetch Cart Count
async function fetchCartCount() {
  if (!state.token) {
    state.cartCount = 0;
    updateBadge();
    return;
  }

  try {
    const res = await fetch('/api/cart', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    if (res.ok) {
      const cartItems = await res.json();
      state.cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
      updateBadge();
    }
  } catch (err) {
    console.error('Failed to fetch cart count', err);
  }
}

function updateBadge() {
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.innerText = state.cartCount;
    badge.style.display = state.cartCount > 0 ? 'flex' : 'none';
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar();
  await fetchCartCount();
});
