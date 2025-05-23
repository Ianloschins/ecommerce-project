import React, { useState, useEffect } from "react";
import {
  fetchAllProducts,
  addProduct,
  deleteProduct,
} from "../api/api";
import { FaUpload, FaTrash } from "react-icons/fa";

export default function UserPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "",
    description: "",
    image: "",
  });
  const [categories, setCategories] = useState([]);

  // Fetch products and categories
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchAllProducts();
        setProducts(data);
        const uniqueCategories = [...new Set(data.map(p => p.category))];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };
    loadProducts();
  }, []);

  // Handle form field change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add new product
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const newProduct = await addProduct(form);
      setProducts([...products, newProduct]);

      // Update categories if new one is added
      if (!categories.includes(newProduct.category)) {
        setCategories([...categories, newProduct.category]);
      }

      setForm({
        title: "",
        price: "",
        category: "",
        description: "",
        image: "",
      });
    } catch (err) {
      console.error("Add failed:", err);
    }
  };

  // Delete a product
  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Bulk upload from JSON
  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result);
        for (const product of parsed) {
          const added = await addProduct(product);
          setProducts(prev => [...prev, added]);
        }
      } catch (err) {
        console.error("Bulk upload error:", err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="form-container">
      <h2>User Product Manager</h2>

      {/* Bulk Upload */}
      <div className="bulk-upload-top">
        <label className="bulk-upload-btn">
          <FaUpload />
          Bulk Upload
          <input type="file" accept=".json" onChange={handleBulkUpload} />
        </label>
      </div>

      {/* Add Product Form */}
      <form onSubmit={handleAdd}>
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
        />
        <input
          name="price"
          placeholder="Price"
          type="number"
          value={form.price}
          onChange={handleChange}
          required
        />
        <input
          name="category"
          list="category-options"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
          required
        />
        <datalist id="category-options">
          {categories.map((cat, i) => (
            <option key={i} value={cat} />
          ))}
        </datalist>
        <input
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          required
        />
        <input
          name="image"
          placeholder="Image URL"
          value={form.image}
          onChange={handleChange}
          required
        />
        <button type="submit">Add Product</button>
      </form>

      {/* Product List */}
      <ul style={{ marginTop: "2rem", padding: 0 }}>
        {products.map((p) => (
          <li
            key={p.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
              padding: "10px",
              borderBottom: "1px solid #ccc",
            }}
          >
            <div>
              <strong>{p.title}</strong> - ${p.price} - {p.category}
            </div>
            <button
              onClick={() => handleDelete(p.id)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "red",
              }}
            >
              <FaTrash />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
