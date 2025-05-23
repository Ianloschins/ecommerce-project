const BASE_URL = 'http://localhost:5555';

export async function fetchAllProducts() {
  const res = await fetch(`${BASE_URL}/products`);
  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }
  return await res.json();
}

export async function registerUser(data) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function loginUser(data) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function addProduct(product) {
  const res = await fetch('http://localhost:5555/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  return await res.json();
}

export async function deleteProduct(id) {
  const res = await fetch(`http://localhost:5555/products/${id}`, {
    method: 'DELETE'
  });
  return await res.json();
}
