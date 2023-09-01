import React, { useState, useEffect } from 'react';
import { fetchAllProducts } from '../api/api';

function AllProducts() {
    const [products, setProducts] = useState([]);
  
    useEffect(() => {
      async function fetchData() {
        try {
          const apiProducts = await fetchAllProducts();
          setProducts(apiProducts);
        } catch (error) {
          console.error('Error fetching products:', error);
        }
      }
  
      fetchData();
    }, []);

  return (
    <div className="all-products">
      <h1>All Products</h1>
      <div className="product-list">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <img className="product-image" src={product.image} alt={product.title} />
            <h2 className="product-title">{product.title}</h2>
            <p className="product-price">Price: ${product.price}</p>
            <p className="product-category">Category: {product.category}</p>
            <p className="product-description">{product.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AllProducts;
