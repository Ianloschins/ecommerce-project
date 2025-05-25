import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAllProducts, fetchUserLikes, likeProduct, unlikeProduct } from '../api/api.js';
import '../styles/main.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function AllProducts({ category: routeCategory }) {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [likes, setLikes] = useState([]);
  const [category, setCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 12;
  const params = useParams();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAllProducts();
        setProducts(data);
        setFiltered(data);

        if (user) {
          const liked = await fetchUserLikes(user.id);
          setLikes(liked.map(item => item.productId));
        }
      } catch (error) {
        console.error(error);
      }
    }
    load();
  }, [user]);

  useEffect(() => {
    const activeCategory = routeCategory || params.category || category;

    if (activeCategory === 'All') {
      setFiltered(products);
    } else {
      setFiltered(
        products.filter(p =>
          p.category?.toLowerCase() === activeCategory.toLowerCase()
        )
      );
    }
    setCurrentPage(1);
  }, [category, products, routeCategory, params.category]);

  const toggleLike = async (productId) => {
    if (!user) return alert("Please log in to like products.");
    const isLiked = likes.includes(productId);
    try {
      if (isLiked) {
        await unlikeProduct(user.id, productId);
        setLikes(likes.filter(id => id !== productId));
      } else {
        await likeProduct(user.id, productId);
        setLikes([...likes, productId]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  return (
    <div className="container py-5">
      <h1 className="text-center fw-bold text-dark mb-5" style={{ fontSize: '2.5rem' }}>
        {params.category ? `${params.category} Collection` : 'Featured Products'}
      </h1>

      {!routeCategory && !params.category && (
        <div className="text-end mb-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-select w-auto d-inline"
            style={{ marginBottom: '5px', width: '200px' }}
          >
            {['All', ...new Set(products.map(p => p.category))].map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}

      <div className="row g-4"
        style={{
          marginBottom: '100px',
          backgroundColor: '#f8f9fa',
          paddingTop: '5px',
          paddingBottom: '25px',
          borderRadius: '20px'
        }}
      >
        {paginated.map(product => (
          <div key={product.id} className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <img
                src={product.image}
                className="card-img-top"
                alt={product.title}
                style={{ height: '250px', objectFit: 'contain' }}
              />
              <div className="card-body">
                <h5 className="card-title fw-semibold text-dark">{product.title}</h5>
                <p className="text-muted mb-1">Category: {product.category}</p>
                <p className="fw-bold text-danger mb-1">${product.price}</p>
                <p className="text-secondary small">{product.description}</p>
                {user && (
                  <button
                    className={`btn btn-sm ${likes.includes(product.id) ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={() => toggleLike(product.id)}
                  >
                    {likes.includes(product.id) ? '❤️ Liked' : '♡ Like'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex justify-content-center align-items-center mt-5 gap-3">
        <button className="btn btn-outline-secondary" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          ← Prev
        </button>
        <span className="fw-medium">Page {currentPage} of {totalPages}</span>
        <button className="btn btn-outline-secondary" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
          Next →
        </button>
      </div>
    </div>
  );
}

export default AllProducts;
