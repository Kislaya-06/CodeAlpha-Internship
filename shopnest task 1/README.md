# ShopNest 🛒 - Premium E-Commerce Platform

ShopNest is a premium, lightweight, responsive e-commerce web application featuring a Node.js + Express.js backend and a modern HTML/CSS/Vanilla JavaScript frontend. It uses simple JSON files for database operations, implementing a complete shopping experience with token authentication, shopping carts, search, categories, and checkout orders.

---

## 🚀 Features

### Frontend (User Interface)
- **Unified Premium Design**: Built with the **Inter** font family, harmonious custom HSL colors, smooth transitions, and premium shadows.
- **Fixed Navigation Bar**: Includes a dynamic search bar, links to orders, interactive cart badges, and user avatar dropdowns.
- **Dynamic Hero Section**: Beautiful gradient backdrop and floating/overlapping product image collage.
- **Responsive Grid Layout**: Auto-adapting layout for desktop (4 columns), tablet (2 columns), and mobile viewports.
- **Interactive Pages**:
  - **Homepage**: Filter products by category pills, search items with a 400ms debounce, and add to cart with temporary success checkmarks.
  - **Product Detail**: Thumbnail carousel with zoom swap, CSS-based half-star rating, low-stock warnings, and trust badges.
  - **Cart Manager**: Direct quantity modifications (+/-), subtotal/shipping calculations, and order checkout flows.
  - **Orders History**: Invoice overview listing items purchased, dates, and order status indicators.

### Backend (Server & API)
- **Static Assets Serving**: Serves the frontend web pages seamlessly on root requests.
- **JWT Authorization Middleware**: Protects private resources (cart and checkout endpoints) by parsing `Authorization: Bearer <token>` headers.
- **Database Storage**: Simple and efficient read/write operations using standard Node.js `fs` module over JSON files.
- **Seed Products**: Pre-filled with 8 real Unsplash product images across Electronics, Clothing, and Books.

---

## 🛠️ Technology Stack
- **Frontend**: HTML5, Vanilla CSS3, JavaScript (ES6)
- **Backend**: Node.js, Express.js
- **Libraries**:
  - `bcryptjs`: Secure user password hashing
  - `jsonwebtoken`: Authentication session tokens
  - `cors`: Cross-Origin Resource Sharing
  - `dotenv`: Environmental config loading

---

## 📂 Project Structure
```text
shopnest/
├── backend/
│   ├── db/
│   │   ├── carts.json
│   │   ├── orders.json
│   │   ├── products.json
│   │   └── users.json
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   └── products.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── app.js
│   ├── cart.html
│   ├── index.html
│   ├── orders.html
│   ├── product.html
│   └── style.css
├── .env
└── .gitignore
```

---

## 🔧 Installation & Setup

1. **Clone or Navigate to Project folder**:
   ```bash
   cd shopnest
   ```

2. **Install dependencies**:
   ```bash
   cd backend
   ```
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root `shopnest/` directory containing:
   ```env
   PORT=3000
   JWT_SECRET=shopnest_secret_key_12345
   ```

4. **Run the Server**:
   ```bash
   npm run dev
   ```
   The backend will bootstrap and log:
   `ShopNest running on http://localhost:3000`

---

## 🧪 Testing the API
We have provided an automated endpoint verification script to test all REST calls (Register, Login, Cart additions, and Order creation). 

To execute the test suite:
1. Ensure the server is running in the background.
2. Run:
   ```bash
   node test-verify.js
   ```
