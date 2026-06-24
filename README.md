# 🚀 Web Development Projects — CodeAlpha Internship

This repository contains two full-stack web development projects built with **HTML, CSS, JavaScript** on the frontend and **Node.js + Express.js** on the backend.

---

## 📁 Repository Structure

```
├── shopnest/        → E-commerce Store
└── vibe/            → Social Media Platform
```

---

## 🛒 Project 1 — ShopNest

A fully functional e-commerce web application with product listings, shopping cart, and order management.

### Features
- User Registration & Login
- Product listing with category filter & search
- Product detail page
- Shopping cart with quantity controls
- Order placement & order history

### How to Run

```bash
cd shopnest
npm install
cp .env.example .env
node backend/server.js
```

Open **http://localhost:3000** in your browser.

---

## 🔥 Project 2 — Vibe

A mini social media platform where users can post, comment, like, and follow each other.

### Features
- User Registration & Login
- Create, view & delete posts (with images)
- Like / Unlike posts
- Comments on posts
- User profiles
- Follow / Unfollow users

### How to Run

```bash
cd vibe
npm install
cp .env.example .env
node backend/server.js
```

Open **http://localhost:3000** in your browser.

---

## ⚙️ Environment Variables

Both projects need a `.env` file. Create it from `.env.example`:

```env
PORT=3000
JWT_SECRET=your_secret_key_here
```

> Built as part of CodeAlpha Web Development Internship
