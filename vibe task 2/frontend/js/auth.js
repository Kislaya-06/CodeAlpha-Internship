document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const errorDiv = document.getElementById('error-message');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (errorDiv) errorDiv.style.display = 'none';

      try {
        const data = await apiCall('/login', 'POST', { email, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showToast('Welcome back to Vibe!');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } catch (err) {
        if (errorDiv) {
          errorDiv.textContent = err.message || 'Invalid credentials';
          errorDiv.style.display = 'block';
        }
        showToast(err.message || 'Login failed', 'error');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const bio = document.getElementById('bio').value.trim();

      if (errorDiv) errorDiv.style.display = 'none';

      try {
        const data = await apiCall('/register', 'POST', { name, email, password, bio });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showToast('Account created successfully!');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } catch (err) {
        if (errorDiv) {
          errorDiv.textContent = err.message || 'Registration failed';
          errorDiv.style.display = 'block';
        }
        showToast(err.message || 'Registration failed', 'error');
      }
    });
  }
});
