import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  clearCart,
  getCartItems,
  removeCartItem,
  updateCartItemQuantity,
} from "../utils/cart";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function Cart() {
  const [items, setItems] = useState(getCartItems);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [user] = useState(() => JSON.parse(localStorage.getItem("user")));

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );

  const handleQuantityChange = (productId, quantity) => {
    setCheckoutMessage("");
    setItems(updateCartItemQuantity(productId, quantity));
  };

  const handleRemove = (productId) => {
    setCheckoutMessage("");
    setItems(removeCartItem(productId));
  };

  const handleCheckout = () => {
    clearCart();
    setItems([]);
    setCheckoutMessage(
      user
        ? "Checkout started for your account. Your cart has been cleared."
        : "Guest checkout started. Your cart has been cleared."
    );
  };

  if (items.length === 0) {
    return (
      <main className="container py-5">
        <div className="cart-shell">
          <h1 className="h2 fw-bold text-dark">Your Cart</h1>
          {checkoutMessage ? (
            <p className="success">{checkoutMessage}</p>
          ) : (
            <p className="text-muted">Your cart is empty.</p>
          )}
          <Link className="btn btn-dark" to="/AllProducts">
            Shop Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-5">
      <div className="cart-shell">
        <h1 className="h2 fw-bold text-dark">Your Cart</h1>

        <div className="cart-layout">
          <section className="cart-items" aria-label="Cart items">
            {items.map((item) => (
              <article className="cart-item" key={item.productId}>
                <img src={item.image} alt={item.title} />
                <div className="cart-item-body">
                  <h2>{item.title}</h2>
                  <p>{item.category}</p>
                  <strong>{formatCurrency(item.price)}</strong>
                </div>
                <div className="cart-item-actions">
                  <label>
                    Qty
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) =>
                        handleQuantityChange(item.productId, event.target.value)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleRemove(item.productId)}
                    aria-label={`Remove ${item.title}`}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </article>
            ))}
          </section>

          <aside className="cart-summary" aria-label="Order summary">
            <div>
              <span>Items</span>
              <strong>{items.reduce((total, item) => total + item.quantity, 0)}</strong>
            </div>
            <div>
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <button type="button" className="btn btn-dark w-100" onClick={handleCheckout}>
              {user ? "Checkout" : "Checkout as Guest"}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
