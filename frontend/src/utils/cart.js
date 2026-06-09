export const CART_UPDATED_EVENT = "cart-updated";

const CART_STORAGE_KEY = "shoppingCart";

function getStoredItems() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredItems(items) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

function normalizeQuantity(quantity) {
  const parsed = Number(quantity);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function toCartItem(product, quantity = 1) {
  return {
    productId: product.id,
    title: product.title,
    price: Number(product.price),
    category: product.category,
    image: product.image,
    quantity: normalizeQuantity(quantity),
  };
}

export function getCartItems() {
  return getStoredItems()
    .map((item) => ({
      ...item,
      productId: Number(item.productId),
      price: Number(item.price),
      quantity: normalizeQuantity(item.quantity),
    }))
    .filter((item) => item.productId && item.title && Number.isFinite(item.price));
}

export function getCartItemCount() {
  return getCartItems().reduce((total, item) => total + item.quantity, 0);
}

export function addCartItem(product, quantity = 1) {
  const items = getCartItems();
  const existing = items.find((item) => item.productId === product.id);

  if (existing) {
    existing.quantity += normalizeQuantity(quantity);
  } else {
    items.push(toCartItem(product, quantity));
  }

  saveStoredItems(items);
  return items;
}

export function updateCartItemQuantity(productId, quantity) {
  const normalizedQuantity = normalizeQuantity(quantity);
  const items = getCartItems().map((item) =>
    item.productId === productId ? { ...item, quantity: normalizedQuantity } : item
  );

  saveStoredItems(items);
  return items;
}

export function removeCartItem(productId) {
  const items = getCartItems().filter((item) => item.productId !== productId);
  saveStoredItems(items);
  return items;
}

export function clearCart() {
  saveStoredItems([]);
}
