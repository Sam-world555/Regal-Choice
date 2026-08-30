import { Link } from "react-router-dom";

function ProductCarousel({ title, products, loading }) {
  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <div className="carousel-section">
      <h2 className="carousel-title">{title}</h2>

      <div className="carousel-row">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="carousel-card skeleton-card">
                <div className="carousel-image-wrap skeleton-box" />
                <div className="carousel-card-body">
                  <div className="skeleton-line skeleton-line-title" />
                  <div className="skeleton-line skeleton-line-price" />
                </div>
              </div>
            ))
          : products.map((product) => (
              <Link
                to={`/product/${product._id}`}
                key={product._id}
                className="carousel-card"
              >
                <div className="carousel-image-wrap">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="carousel-image"
                      loading="lazy"
                    />
                  )}
                </div>

                <div className="carousel-card-body">
                  <h3 className="carousel-product-name">{product.name}</h3>
                  <p className="carousel-product-price">₹{product.price}</p>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}

export default ProductCarousel;