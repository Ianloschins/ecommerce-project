import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/main.css";
import heroImage from "../styles/img/view-spectacular-nature-landscape.jpg";
import mensImage from "../styles/img/full-shot-man-posing-outdoors.jpg";
import womensImage from "../styles/img/black-woman-trench-coat-dancing-sunlight.jpg";
import shoesImage from "../styles/img/fixing-sneakers.jpg";

// Renders the homepage hero, collections, and rotating product feature.
function Home() {
  // Defines the collection cards shown under the hero.
  const collections = [
    {
      name: "Mens Collection",
      img: mensImage,
      link: "/products/mens",
    },
    {
      name: "Womens Collection",
      img: womensImage,
      link: "/products/womens",
    },
    {
      name: "Shoes Collection",
      img: shoesImage,
      link: "/products/shoes",
    },
  ];

  // Stores products and animation state for the rotating feature.
  const [products, setProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeStage, setFadeStage] = useState("in");

  // Loads products for the homepage feature.
  useEffect(() => {
    // Fetches products from the backend.
    async function fetchProducts() {
      try {
        const res = await fetch("http://localhost:5555/products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    }
    fetchProducts();
  }, []);

  // Rotates the featured product with a fade transition.
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeStage("out");

      setTimeout(() => {
        setCurrentIndex((prev) =>
          products.length > 0 ? (prev + 1) % products.length : 0
        );
        setFadeStage("in");
      }, 2000);
    }, 10000);

    return () => clearInterval(interval);
  }, [products]);

  // Selects the product currently shown in the rotating feature.
  const rotatingProduct = products[currentIndex];

  return (
    <div className="fw-light text-secondary">
      {/* Shows the main homepage hero. */}
      <section
        className="background-cover bg-dark pb-5 position-relative pt-5 text-white"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container pb-5 pt-5">
          <div className="row pb-5 pt-5">
            <div className="col-lg-7 pb-5 pt-5">
              <p className="fw-normal h4 text-uppercase">New Collection</p>
              <h1 className="display-3 fw-bold mb-3">
                Every Product, A Perfect Blend of Quality and Style
              </h1>
              <p className="lead mb-4">
                Our ability to feel, act and communicate is indistinguishable
                from magic.
              </p>
              <Link
                to="/AllProducts"
                className="btn btn-light pb-2 ps-4 pe-4 pt-2"
              >
                Shop Collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="pb-5 pt-5">
        <section>
          <div className="container">
            {/* Shows category collection cards. */}
            <div className="row justify-content-center">
              {collections.map((section, i) => (
                <div key={i} className="col-lg-4 col-md-6 py-3">
                  <div className="collection-card position-relative text-dark h-100">
                    <img
                      src={section.img}
                      className="collection-img img-fluid w-100"
                      alt={section.name}
                    />
                    <div className="position-absolute bottom-0 start-0 end-0 ps-4 pe-4 pb-4 bg-white bg-opacity-75">
                      <h2 className="h5 mb-2">{section.name}</h2>
                      <Link
                        to={section.link}
                        className="link-secondary small text-decoration-none"
                      >
                        View Collection
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shows the rotating featured product. */}
            {rotatingProduct && (
              <div
                className="position-relative mt-5"
                style={{
                  minHeight: "400px",
                  overflow: "hidden",
                }}
              >
                <div className="row align-items-center position-absolute top-0 start-0 w-100 h-100 m-0 rotating-product">
                  <div className="col-lg-6 pb-5 pb-lg-0 pt-5 pt-lg-0">
                    <div className="ps-4 pe-4">
                      <h3
                        className={`fw-bold h1 mb-4 fade-effect ${
                          fadeStage === "in" ? "fade-in" : "fade-out"
                        }`}
                      >
                        {rotatingProduct.title}
                      </h3>
                      <Link
                        to="/AllProducts"
                        className="btn btn-dark pb-2 ps-4 pe-4 pt-2"
                        style={{
                          animation: `${
                            fadeStage === "in" ? "fadeIn" : "fadeOut"
                          } 2s ease-in forwards`,
                        }}
                      >
                        Shop Now
                      </Link>
                    </div>
                  </div>
                  <div className="col-lg-6 px-0">
                    <img
                      src={rotatingProduct.image}
                      className={`d-block img-fluid w-100 fade-effect ${
                        fadeStage === "in" ? "fade-in" : "fade-out"
                      }`}
                      alt={rotatingProduct.title}
                      style={{
                        maxHeight: "360px",
                        objectFit: "cover",
                        backgroundColor: "transparent",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Shows the popular products section heading. */}
          <div
            className="align-items-center row"
            style={{ marginTop: "50px" }}
          >
            <div className="col">
              <hr className="mb-0 mt-0" />
            </div>
            <div className="col-auto">
              <h2 className="fw-normal lead mb-0 text-dark">
                Popular this Week
              </h2>
            </div>
            <div className="col">
              <hr className="mb-0 mt-0" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
