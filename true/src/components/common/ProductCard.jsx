// src/components/Common/ProductCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { currencyParser } from '../../utils/currencyparser';
import { imageHelper } from '../../utils/imageHelper';

const ProductCard = ({ 
  product, 
  onView, 
  onAddToCart, 
  onBuyNow,
  showSellerInfo = false,
  showStatus = false,
  isInCart = false
}) => {
  const {
    id,
    name,
    description,
    price,
    image,
    category,
    stock,
    sellerName,
    rating,
    createdAt,
    status = 'available'
  } = product;

  // Format price using your utility
  const formattedPrice = currencyParser(price);
  
  // Get image URL using helper
  const imageUrl = imageHelper(image || '/placeholder.png');
  
  // Truncate description if too long
  const truncateDescription = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Handle stock status
  const getStockStatus = () => {
    if (stock === 0) return { text: 'Out of Stock', class: 'out-of-stock' };
    if (stock <= 5) return { text: `Only ${stock} left`, class: 'low-stock' };
    return { text: 'In Stock', class: 'in-stock' };
  };

  const stockInfo = getStockStatus();

  return (
    <div className={`product-card ${stock === 0 ? 'disabled' : ''}`}>
      {/* Product Image */}
      <div className="product-image-container">
        <img 
          src={imageUrl} 
          alt={name} 
          className="product-image"
          onError={(e) => {
            e.target.src = '/placeholder.png';
          }}
        />
        {stock === 0 && (
          <div className="out-of-stock-overlay">Out of Stock</div>
        )}
        {category && (
          <span className="product-category">{category}</span>
        )}
      </div>

      {/* Product Info */}
      <div className="product-info">
        <h3 className="product-title">{name}</h3>
        
        {description && (
          <p className="product-description">
            {truncateDescription(description)}
          </p>
        )}

        {/* Price Section */}
        <div className="product-price-section">
          <span className="product-price">{formattedPrice}</span>
          {stock > 0 && (
            <span className={`stock-status ${stockInfo.class}`}>
              {stockInfo.text}
            </span>
          )}
        </div>

        {/* Rating (if available) */}
        {rating !== undefined && (
          <div className="product-rating">
            <span className="stars">{"★".repeat(Math.floor(rating))}</span>
            <span className="rating-text">({rating.toFixed(1)})</span>
          </div>
        )}

        {/* Seller Info (optional) */}
        {showSellerInfo && sellerName && (
          <div className="seller-info">
            <span className="seller-label">Seller: </span>
            <span className="seller-name">{sellerName}</span>
          </div>
        )}

        {/* Status (for seller view) */}
        {showStatus && (
          <div className={`product-status ${status}`}>
            Status: {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        )}

        {/* Action Buttons */}
        <div className="product-actions">
          {onView && (
            <button 
              className="btn-view"
              onClick={() => onView(product)}
            >
              View Details
            </button>
          )}
          
          {onAddToCart && stock > 0 && (
            <button 
              className={`btn-add-to-cart ${isInCart ? 'in-cart' : ''}`}
              onClick={() => onAddToCart(product)}
              disabled={stock === 0}
            >
              {isInCart ? '✓ In Cart' : 'Add to Cart'}
            </button>
          )}
          
          {onBuyNow && stock > 0 && (
            <button 
              className="btn-buy-now"
              onClick={() => onBuyNow(product)}
              disabled={stock === 0}
            >
              Buy Now
            </button>
          )}
        </div>

        {/* Additional Info */}
        <div className="product-meta">
          {createdAt && (
            <span className="product-date">
              Added: {new Date(createdAt).toLocaleDateString()}
            </span>
          )}
          {stock > 0 && (
            <span className="product-id">ID: {id}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// PropTypes for better development experience
ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    price: PropTypes.number.isRequired,
    image: PropTypes.string,
    category: PropTypes.string,
    stock: PropTypes.number,
    sellerName: PropTypes.string,
    rating: PropTypes.number,
    createdAt: PropTypes.string,
    status: PropTypes.string
  }).isRequired,
  onView: PropTypes.func,
  onAddToCart: PropTypes.func,
  onBuyNow: PropTypes.func,
  showSellerInfo: PropTypes.bool,
  showStatus: PropTypes.bool,
  isInCart: PropTypes.bool
};

// Default props
ProductCard.defaultProps = {
  onView: null,
  onAddToCart: null,
  onBuyNow: null,
  showSellerInfo: false,
  showStatus: false,
  isInCart: false
};

export default ProductCard;