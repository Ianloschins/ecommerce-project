import { useState, useEffect } from 'react';
import { fetchAllProducts } from '../api/api.js';
import '../styles/main.css';

function AllProducts() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [category, setCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 12;

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchAllProducts();
        setProducts(data);
        setFiltered(data);
      } catch (error) {
        console.error(error);
      }
    }
    loadProducts();
  }, []);

  useEffect(() => {
    if (category === 'All') {
      setFiltered(products);
    } else {
      setFiltered(products.filter(p => p.category === category));
    }
    setCurrentPage(1); // Reset to page 1 when filter changes
  }, [category, products]);

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="all-products">
      <h1>All Products</h1>

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="filter-dropdown"
      >
        {categories.map((cat, idx) => (
          <option key={idx} value={cat}>{cat}</option>
        ))}
      </select>

      <div className="product-list">
        {paginated.map(product => (
          <div key={product.id} className="product-card">
            <img className="product-image" src={product.image} alt={product.title} />
            <h2 className="product-title">{product.title}</h2>
            <p className="product-price">Price: ${product.price}</p>
            <p className="product-category">Category: {product.category}</p>
            <p className="product-description">{product.description}</p>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button onClick={handlePrev} disabled={currentPage === 1}>← Prev</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={handleNext} disabled={currentPage === totalPages}>Next →</button>
      </div>
    </div>
  );
}

export default AllProducts;
