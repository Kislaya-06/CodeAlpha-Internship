const http = require('http');

const request = (method, path, body, token) => {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data || '{}')
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

async function test() {
  console.log("--- Starting API Tests ---");

  // 1. Get products
  console.log("\n1. Testing GET /api/products...");
  const productsRes = await request('GET', '/api/products');
  console.log(`Status: ${productsRes.statusCode}`);
  console.log(`Products returned: ${productsRes.body.length}`);

  // Test search query parameter
  console.log("\n1b. Testing GET /api/products?search=wireless...");
  const searchRes = await request('GET', '/api/products?search=wireless');
  console.log(`Status: ${searchRes.statusCode}`);
  console.log(`Products returned matching 'wireless': ${searchRes.body.length} (Expected: 1)`);
  if (searchRes.body.length > 0) {
    console.log(`Match: ${searchRes.body[0].name}`);
  }

  // 2. Register user
  console.log("\n2. Testing POST /api/register...");
  const email = `john_${Date.now()}@example.com`; // Unique email for each test run
  const regBody = {
    name: "John Doe",
    email: email,
    password: "securepassword"
  };
  const regRes = await request('POST', '/api/register', regBody);
  console.log(`Status: ${regRes.statusCode}`);
  console.log("Response user object:", regRes.body.user);

  const token = regRes.body.token;

  // 3. Login user
  console.log("\n3. Testing POST /api/login...");
  const loginRes = await request('POST', '/api/login', {
    email: email,
    password: "securepassword"
  });
  console.log(`Status: ${loginRes.statusCode}`);
  console.log("Token received:", !!loginRes.body.token);

  // 4. Get cart (empty initially)
  console.log("\n4. Testing GET /api/cart...");
  const cartRes = await request('GET', '/api/cart', null, token);
  console.log(`Status: ${cartRes.statusCode}`);
  console.log("Cart items returned:", cartRes.body);

  // 5. Add product to cart
  console.log("\n5. Testing POST /api/cart (add product_id 1, quantity 2)...");
  const addToCartRes = await request('POST', '/api/cart', { product_id: 1, quantity: 2 }, token);
  console.log(`Status: ${addToCartRes.statusCode}`);
  console.log("Cart update response:", addToCartRes.body);

  // Get populated cart
  console.log("\n5b. Testing GET /api/cart (after adding item)...");
  const populatedCartRes = await request('GET', '/api/cart', null, token);
  console.log(`Status: ${populatedCartRes.statusCode}`);
  console.log("Populated cart response:", JSON.stringify(populatedCartRes.body, null, 2));

  // 6. Checkout / Place order
  console.log("\n6. Testing POST /api/orders (Checkout)...");
  const orderRes = await request('POST', '/api/orders', null, token);
  console.log(`Status: ${orderRes.statusCode}`);
  console.log("Order placed response:", orderRes.body);

  // 7. Get orders list
  console.log("\n7. Testing GET /api/orders...");
  const getOrdersRes = await request('GET', '/api/orders', null, token);
  console.log(`Status: ${getOrdersRes.statusCode}`);
  console.log(`Orders found: ${getOrdersRes.body.length}`);
  if (getOrdersRes.body.length > 0) {
    console.log("Order 1 total_amount:", getOrdersRes.body[0].total_amount);
  }

  console.log("\n--- Tests Completed ---");
}

test().catch(console.error);
