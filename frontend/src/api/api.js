const BASE_URL = 'http://localhost:5555';

// --- Products ---
// Fetches all products.
export async function fetchAllProducts() {
  const res = await fetch(`${BASE_URL}/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return await res.json();
}

// Adds one product.
export async function addProduct(product) {
  const res = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(product)
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to add product');
  }

  return data;
}

// Deletes one product.
export async function deleteProduct(id) {
  const res = await fetch(`${BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete product');
  }

  return data;
}

// Uploads a CSV or TSV product file.
export async function uploadCsvProducts(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/products/upload-csv`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'CSV upload failed');
  }

  return data;
}

// Fetches product manager analytics.
export async function fetchProductAnalytics() {
  const res = await fetch(`${BASE_URL}/analytics/products`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch analytics');
  }

  return data;
}

// --- Auth ---
// Registers a new user.
export async function registerUser(data) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
}

// Logs in an existing user.
export async function loginUser(data) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
}

// Fetches the current logged-in user from SQL.
export async function fetchCurrentUser() {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to refresh user');
  }

  return data.user;
}

// Updates the current user's profile.
export async function updateCurrentUserProfile(profile) {
  const res = await fetch(`${BASE_URL}/auth/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(profile),
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to update profile');
  }

  return data.user;
}

// Updates the current user's account details.
export async function updateCurrentUserAccount(account) {
  const res = await fetch(`${BASE_URL}/auth/account`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(account),
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to update account');
  }

  return data;
}

// --- Likes ---
// Fetches a user's liked products.
export async function fetchUserLikes(userId) {
  const res = await fetch(`${BASE_URL}/likes/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user likes');
  return await res.json();
}

// Saves a product like.
export async function likeProduct(userId, productId) {
  const res = await fetch(`${BASE_URL}/likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, productId }),
  });
  return await res.json();
}

// Removes a product like.
export async function unlikeProduct(userId, productId) {
  const res = await fetch(`${BASE_URL}/likes`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, productId }),
  });
  return await res.json();
}
