const BASE_URL = 'http://localhost:5555';

// --- Products ---
export async function fetchAllProducts() {
  const res = await fetch(`${BASE_URL}/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return await res.json();
}

export async function addProduct(product) {
  const res = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  return await res.json();
}

export async function deleteProduct(id) {
  const res = await fetch(`${BASE_URL}/products/${id}`, {
    method: 'DELETE'
  });
  return await res.json();
}

// --- Auth ---
export async function registerUser(data) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function loginUser(data) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
}

// --- Likes ---
export async function fetchUserLikes(userId) {
  const res = await fetch(`${BASE_URL}/likes/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user likes');
  return await res.json();
}

export async function likeProduct(userId, productId) {
  const res = await fetch(`${BASE_URL}/likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, productId }),
  });
  return await res.json();
}

export async function unlikeProduct(userId, productId) {
  const res = await fetch(`${BASE_URL}/likes`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, productId }),
  });
  return await res.json();
}
