function ProductSkeleton() {
  return (
    <div className="card skeleton-card">
      <div className="card-image-wrap skeleton-box" />
      <div className="card-body">
        <div className="skeleton-line skeleton-line-title" />
        <div className="skeleton-line skeleton-line-tag" />
        <div className="skeleton-line skeleton-line-text" />
        <div className="card-footer">
          <div className="skeleton-line skeleton-line-price" />
          <div className="skeleton-line skeleton-line-btn" />
        </div>
      </div>
    </div>
  );
}

export default ProductSkeleton;