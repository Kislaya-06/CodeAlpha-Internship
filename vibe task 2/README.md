# Vibe 🔥

Vibe is a lightweight, responsive social media web application built with **Node.js, Express.js** on the backend, and a premium **Vanilla HTML, CSS, and JavaScript** frontend. 

It uses static JSON files as a mock database (`fs` module) to maintain state for users, posts, comments, and follower lists.

## 🚀 Features

- **User Authentication**: Secure JWT-based registration and login flows with `bcryptjs` password hashing.
- **Dynamic Main Feed**:
  - Load all posts dynamically (sorted from newest to oldest) with skeleton shimmer loading indicators.
  - Heartbeat-style pulse animation for post likes.
  - Create posts with short text content and optional picture URLs.
  - Option to delete posts belonging to you.
- **Interactions**:
  - Like & unlike posts.
  - View, create, and delete comments on posts.
  - Share button with clipboard copy alert.
- **User Profiles**:
  - View any user's profile showing customized banner gradients.
  - Profile statistics: post counts, follower counts, and following counts.
  - List of user's posts displayed in a clean 3-column square grid layout (hover to see like count).
  - Profile details editor (update Name, Bio, and Avatar directly on your profile page).
  - Follow/Unfollow toggle.
- **Toast Notifications**: Interactive slide-up notification banners for successes and failures.

---

## 📁 Project Structure

```text
vibe/
├── backend/
│   ├── db/
│   │   ├── users.json          # Mock Users Table (Seeded with 3 users)
│   │   ├── posts.json          # Mock Posts Table (Seeded with 5 posts)
│   │   ├── comments.json       # Mock Comments Table
│   │   ├── followers.json      # Follow relationships
│   │   └── dbHelper.js         # Database I/O utilities
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js             # Auth APIs (/api/register, /api/login)
│   │   ├── posts.js            # Posts & Likes APIs (/api/posts)
│   │   ├── comments.js         # Comments APIs (/api/posts/:id/comments)
│   │   └── users.js            # Profiles & Follows (/api/users)
│   └── server.js               # Entry point
├── frontend/
│   ├── css/
│   │   └── style.css           # Global premium styling sheet
│   ├── js/
│   │   ├── api.js              # Fetch wrappers, toasts, and helpers
│   │   ├── auth.js             # Login/Register UI controllers
│   │   ├── main.js             # Main Feed & Sidebar controllers
│   │   └── profile.js          # Profile page & Modal controllers
│   ├── index.html              # Main Feed Page
│   ├── profile.html            # Profile Page
│   ├── login.html              # Login Page
│   └── register.html           # Register Page
├── .env                        # Configuration variables (PORT, JWT_SECRET)
├── .gitignore
└── package.json
```

---

## ⚙️ Installation & Setup

1. **Clone/Navigate to the workspace**:
   Make sure you are in the `vibe/` directory.

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root of the `vibe` folder (this has been created automatically for you):
   ```ini
   PORT=3000
   JWT_SECRET=vibe_jwt_secret_key_12345
   ```

4. **Run the Application**:
   ```bash
   npm start
   ```
   The application will output:
   `Vibe running on http://localhost:3000`

---

## 🔑 Seeded Demo Users

Use these accounts to sign in and test the application features out-of-the-box:

| Email | Password | Name |
| :--- | :--- | :--- |
| `alice@example.com` | `password123` | Alice Johnson |
| `bob@example.com` | `password123` | Bob Smith |
| `charlie@example.com` | `password123` | Charlie Brown |
